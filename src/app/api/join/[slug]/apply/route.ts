import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getMongoDb } from '@/lib/db/mongodb';
import { campaignApplicationSchema } from '@/lib/schemas/application.schema';
import { waitlistSchema } from '@/lib/schemas/registration-link.schema';
import { issueCsrfToken } from '@/lib/security/csrf-handler';
import { getClientIp } from '@/lib/security/rate-limit-unified';
import { enforcePublicFormGuards, isHoneypotTriggered } from '@/lib/security/public-form';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { sendApplicationReceivedEmail } from '@/lib/email/application-mail';
import { attachDocumentsToApplication } from '@/lib/applications/document-storage';
import { getRoleDefinition } from '@/lib/applications/role-definitions';
import {
  LINK_WAITLIST_COLLECTION,
  REGISTRATION_LINKS_COLLECTION,
  tryReserveApplicationSlot,
} from '@/lib/registration-links';
import type { ApplicationRole } from '@/lib/types/membership';
import { ROLE_LABELS } from '@/lib/types/membership';

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const blocked = await enforcePublicFormGuards(request, {
    routeKey: 'applications',
    rateLimitPrefix: 'join-applications',
    maxRequests: 5,
    windowSeconds: 15 * 60,
  });
  if (blocked) return blocked;

  try {
    const body = await request.json();

    if (isHoneypotTriggered(body)) {
      return NextResponse.json({ success: true, applicationId: 'ok' }, { status: 201 });
    }

    if (body?.waitlist === true) {
      const parsed = waitlistSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Please provide a valid email.', issues: parsed.error.flatten() }, { status: 400 });
      }

      const db = await getMongoDb();
      const link = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
      if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

      const email = parsed.data.email.toLowerCase();
      await db.collection(LINK_WAITLIST_COLLECTION).updateOne(
        { linkId: link._id, email },
        { $set: { email, linkId: link._id, capturedAt: new Date() } },
        { upsert: true },
      );

      return NextResponse.json({ success: true });
    }

    const parsed = campaignApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please review the highlighted application details.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const db = await getMongoDb();

    const existing = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
    if (!existing) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    const role = data.role as ApplicationRole;
    if (!existing.roles.includes(role)) {
      return NextResponse.json({ error: 'This role is not accepted through this link.' }, { status: 400 });
    }

    const docIds = Object.values(data.documents).filter((id): id is string => Boolean(id));
    const reserved = await tryReserveApplicationSlot(db, params.slug);
    if (!reserved) {
      return NextResponse.json({ error: 'This application period has closed.' }, { status: 403 });
    }

    const submittedAt = new Date();
    const agreementText =
      'I confirm that my details are accurate and agree to represent SINet\'s community values. This registration is subject to review before role assignment is confirmed.';
    const agreementMeta = {
      acceptedAt: submittedAt.toISOString(),
      version: 'community-code-of-conduct-v2',
      textHash: createHash('sha256').update(agreementText).digest('hex'),
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    const application = {
      pathway: role,
      role,
      status: 'pending',
      data,
      agreementMeta,
      sourceLinkId: reserved._id,
      sourceLinkName: reserved.name,
      sourceLinkSlug: reserved.slug,
      submittedAt,
      updatedAt: submittedAt,
    };

    const insert = await db.collection('applications').insertOne(application);
    const applicationId = String(insert.insertedId);

    const attached = await attachDocumentsToApplication(docIds, params.slug, role, applicationId);
    if (!attached.ok) {
      console.error('Document attach failed after application insert:', attached.error, applicationId);
    }

    await db.collection('members').updateOne(
      { email: data.email.toLowerCase() },
      {
        $set: {
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          pathway: role,
          sourceLink: reserved.name,
          updatedAt: submittedAt,
        },
        $setOnInsert: { createdAt: submittedAt, status: 'pending' },
        $addToSet: { pathways: role },
      },
      { upsert: true },
    );

    sendApplicationReceivedEmail({
      email: data.email,
      name: data.fullName,
      role: ROLE_LABELS[role] || getRoleDefinition(role).label,
    }).catch((err) => console.warn('Application received email failed:', err));

    return NextResponse.json({ success: true, applicationId }, { status: 201 });
  } catch (error) {
    console.error('Campaign application submission error:', error);
    const details = isDevelopmentMode() && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ error: 'We could not save your application. Please try again.', ...(details ? { details } : {}) }, { status: 503 });
  }
}
