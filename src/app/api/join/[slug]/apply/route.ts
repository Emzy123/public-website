import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { createHash } from 'node:crypto';
import { getMongoDb } from '@/lib/db/mongodb';
import { campaignApplicationSchema } from '@/lib/schemas/application.schema';
import { waitlistSchema } from '@/lib/schemas/registration-link.schema';
import { verifyCsrfToken, issueCsrfToken } from '@/lib/security/csrf-handler';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { validateRouteSecurityConfig } from '@/lib/runtime/securityConfig';
import { sendApplicationReceivedEmail } from '@/lib/email/application-mail';
import {
  LINK_WAITLIST_COLLECTION,
  REGISTRATION_LINKS_COLLECTION,
  isLinkAcceptingApplications,
  maybeAutoCloseLink,
} from '@/lib/registration-links';
import type { ApplicationRole } from '@/lib/types/membership';
import { ROLE_LABELS } from '@/lib/types/membership';

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const configCheck = validateRouteSecurityConfig('applications');
  if (!configCheck.ok) return NextResponse.json({ error: configCheck.message }, { status: configCheck.status });

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;

  const limited = await enforceRateLimit(getClientIp(request), 'join-applications', 5, 15 * 60);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: limited.headers });
  }

  try {
    const body = await request.json();

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
    const link = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    if (link.isOpen) await maybeAutoCloseLink(db, link as typeof link & { _id: ObjectId });
    const refreshed = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
    if (!isLinkAcceptingApplications(refreshed!)) {
      return NextResponse.json({ error: 'This application period has closed.' }, { status: 403 });
    }

    const role = data.role as ApplicationRole;
    if (!refreshed!.roles.includes(role)) {
      return NextResponse.json({ error: 'This role is not accepted through this link.' }, { status: 400 });
    }

    const submittedAt = new Date();
    const agreementText =
      'I confirm that my details are accurate and agree to represent SINet\'s community values. This registration is subject to review before role assignment is confirmed.';
    const agreementMeta = {
      acceptedAt: submittedAt.toISOString(),
      version: 'community-code-of-conduct-v2',
      textHash: createHash('sha256').update(agreementText).digest('hex'),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    const application = {
      pathway: role,
      role,
      status: 'pending',
      data,
      agreementMeta,
      sourceLinkId: refreshed!._id,
      sourceLinkName: refreshed!.name,
      sourceLinkSlug: refreshed!.slug,
      submittedAt,
      updatedAt: submittedAt,
    };

    const insert = await db.collection('applications').insertOne(application);
    await db.collection(REGISTRATION_LINKS_COLLECTION).updateOne(
      { _id: refreshed!._id },
      { $inc: { applicationCount: 1 }, $set: { updatedAt: submittedAt } },
    );

    const updatedLink = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ _id: refreshed!._id });
    if (updatedLink) await maybeAutoCloseLink(db, updatedLink as typeof updatedLink & { _id: ObjectId });

    await db.collection('members').updateOne(
      { email: data.email.toLowerCase() },
      {
        $set: {
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          pathway: role,
          sourceLink: refreshed!.name,
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
      role: ROLE_LABELS[role],
    }).catch((err) => console.warn('Application received email failed:', err));

    return NextResponse.json({ success: true, applicationId: String(insert.insertedId) }, { status: 201 });
  } catch (error) {
    console.error('Campaign application submission error:', error);
    const details = isDevelopmentMode() && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ error: 'We could not save your application. Please try again.', ...(details ? { details } : {}) }, { status: 503 });
  }
}
