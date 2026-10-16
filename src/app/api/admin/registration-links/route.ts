import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSession } from '@admin/lib/auth';
import { getMongoDb } from '@/lib/db/mongodb';
import { csrfProtect } from '@/lib/csrf';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { writeAuditLog } from '@/lib/audit/log';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import {
  createRegistrationLinkSchema,
  updateRegistrationLinkSchema,
  isReservedLinkSlug,
} from '@/lib/schemas/registration-link.schema';
import {
  REGISTRATION_LINKS_COLLECTION,
  generateLinkSlug,
  isLinkAcceptingApplications,
  maybeAutoCloseLink,
  serialiseRegistrationLink,
} from '@/lib/registration-links';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getMongoDb();
    const links = await db.collection(REGISTRATION_LINKS_COLLECTION).find({}).sort({ createdAt: -1 }).toArray();

    for (const link of links) {
      if (isLinkAcceptingApplications(link) === false && link.isOpen) {
        await maybeAutoCloseLink(db, link as typeof link & { _id: ObjectId });
      }
    }

    const refreshed = await db.collection(REGISTRATION_LINKS_COLLECTION).find({}).sort({ createdAt: -1 }).toArray();
    const response = NextResponse.json({ links: refreshed.map((doc) => serialiseRegistrationLink(doc)) });
    await csrfProtect(request, response);
    return response;
  } catch (error) {
    console.error('Registration links list error:', error);
    return NextResponse.json({ error: 'Unable to load registration links' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;
  const limited = await enforceRateLimit(`${session.email}:${getClientIp(request)}`, 'admin-link-create', 10, 60);
  if (!limited.ok) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: limited.headers });

  try {
    const parsed = createRegistrationLinkSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid link configuration', issues: parsed.error.flatten() }, { status: 400 });
    }

    const { name, roles, expiresAt, quota } = parsed.data;
    const now = new Date();
    const db = await getMongoDb();

    let slug = parsed.data.slug || generateLinkSlug();
    if (isReservedLinkSlug(slug)) {
      return NextResponse.json({ error: 'This slug is reserved and cannot be created.' }, { status: 400 });
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug });
      if (!existing) break;
      slug = generateLinkSlug();
      while (isReservedLinkSlug(slug)) {
        slug = generateLinkSlug();
      }
    }

    const doc = {
      name,
      slug,
      roles,
      isOpen: true,
      status: 'open' as const,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      quota: quota ?? undefined,
      applicationCount: 0,
      createdBy: session.email,
      createdAt: now,
      updatedAt: now,
    };

    const insert = await db.collection(REGISTRATION_LINKS_COLLECTION).insertOne(doc);
    await writeAuditLog({
      action: 'registration_link.create',
      actor: session.email,
      resource: `registration_link:${insert.insertedId}`,
      metadata: { name, slug, roles },
    });

    return NextResponse.json({ success: true, link: serialiseRegistrationLink({ ...doc, _id: insert.insertedId }) }, { status: 201 });
  } catch (error) {
    console.error('Registration link create error:', error);
    return NextResponse.json({ error: 'Unable to create registration link' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;

  try {
    const parsed = updateRegistrationLinkSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid update' }, { status: 400 });

    const { id, name, roles, isOpen, expiresAt, quota } = parsed.data;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid link id' }, { status: 400 });

    const db = await getMongoDb();
    const existing = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (roles !== undefined) update.roles = roles;
    if (expiresAt !== undefined) update.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (quota !== undefined) update.quota = quota ?? null;
    if (isOpen !== undefined) {
      update.isOpen = isOpen;
      update.status = isOpen ? 'open' : 'closed';
    }

    await db.collection(REGISTRATION_LINKS_COLLECTION).updateOne({ _id: existing._id }, { $set: update });
    const updated = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ _id: existing._id });

    await writeAuditLog({
      action: 'registration_link.update',
      actor: session.email,
      resource: `registration_link:${id}`,
      metadata: update,
      previousValue: { isOpen: existing.isOpen, status: existing.status },
    });

    return NextResponse.json({ success: true, link: serialiseRegistrationLink(updated!) });
  } catch (error) {
    console.error('Registration link update error:', error);
    return NextResponse.json({ error: 'Unable to update registration link' }, { status: 503 });
  }
}
