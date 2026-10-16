import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getMongoDb } from '@/lib/db/mongodb';
import { campaignApplicationSchema } from '@/lib/schemas/application.schema';
import { memberApplicationSchema } from '@/lib/schemas/member-application.schema';
import { waitlistSchema } from '@/lib/schemas/registration-link.schema';
import { issueCsrfToken } from '@/lib/security/csrf-handler';
import { getClientIp } from '@/lib/security/rate-limit-unified';
import { enforcePublicFormGuards, isHoneypotTriggered } from '@/lib/security/public-form';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { sendApplicationReceivedEmail } from '@/lib/email/application-mail';
import { attachDocumentsToApplication } from '@/lib/applications/document-storage';
import { getRoleDefinition } from '@/lib/applications/role-definitions';
import {
  getCampaignBySlug,
  addCampaignWaitlist,
  submitCampaignApplication,
} from '@/lib/applications/campaigns';
import {
  LINK_WAITLIST_COLLECTION,
  REGISTRATION_LINKS_COLLECTION,
  tryReserveApplicationSlot,
  normalizeDivisionSlug,
} from '@/lib/registration-links';
import { isValidChapterSlug, validateChapterSlug } from '@/lib/chapters/chapters';
import type { ApplicationRole } from '@/lib/types/membership';
import { ROLE_LABELS } from '@/lib/types/membership';

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const blocked = await enforcePublicFormGuards(request, {
    routeKey: 'applications',
    rateLimitPrefix: 'join-applications',
    maxRequests: 10,
    windowSeconds: 15 * 60,
  });
  if (blocked) return blocked;

  try {
    const body = await request.json();

    if (isHoneypotTriggered(body)) {
      return NextResponse.json({ success: true, applicationId: 'ok' }, { status: 201 });
    }

    // 1. Check if campaign exists in PostgreSQL
    const campaignInfo = await getCampaignBySlug(params.slug);

    if (campaignInfo) {
      if (body?.role && body.role !== campaignInfo.campaign.targetRole) {
        return NextResponse.json(
          { error: 'This role is not accepted through this campaign link.' },
          { status: 400 }
        );
      }

      // Handle Waitlist submission for closed/active Postgres campaigns
      if (body?.waitlist === true) {
        const parsed = waitlistSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Please provide a valid email address.', issues: parsed.error.flatten() },
            { status: 400 }
          );
        }

        await addCampaignWaitlist(campaignInfo.campaign.id, parsed.data.email);
        return NextResponse.json({
          success: true,
          message: 'You have been added to the notification waitlist.',
        });
      }

      // Handle Application submission
      const parsed = memberApplicationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'Please review the highlighted application fields.',
            issues: parsed.error.flatten(),
          },
          { status: 400 }
        );
      }

      try {
        const result = await submitCampaignApplication(params.slug, parsed.data);

        // Send submission confirmation email
        sendApplicationReceivedEmail({
          email: parsed.data.email,
          name: parsed.data.fullName,
          role: parsed.data.division.replace('_', ' '),
        }).catch((err) => console.warn('[Apply] Received email failed:', err));

        return NextResponse.json(
          {
            success: true,
            applicationId: result.applicationId,
            campaignName: result.campaignName,
            message: 'Your application has been received and is under review.',
          },
          { status: 201 }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Application submission failed';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // 2. Legacy MongoDB fallback
    if (body?.waitlist === true) {
      const parsed = waitlistSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Please provide a valid email.', issues: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const db = await getMongoDb();
      const link = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
      if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

      const email = parsed.data.email.toLowerCase();
      await db.collection(LINK_WAITLIST_COLLECTION).updateOne(
        { linkId: link._id, email },
        { $set: { email, linkId: link._id, capturedAt: new Date() } },
        { upsert: true }
      );

      return NextResponse.json({ success: true });
    }

    const parsed = campaignApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Please review the highlighted application details.',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
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
      "I confirm that my details are accurate and agree to represent SINet's community values. This registration is subject to review before role assignment is confirmed.";
    const agreementMeta = {
      acceptedAt: submittedAt.toISOString(),
      version: 'community-code-of-conduct-v2',
      textHash: createHash('sha256').update(agreementText).digest('hex'),
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    const rawChapter = data.chapter || (typeof body?.chapter === 'string' ? body.chapter.toLowerCase().trim() : undefined);
    const validChapter = (await validateChapterSlug(rawChapter)) ? rawChapter!.toLowerCase().trim() : null;

    const rawDivision = data.division || (typeof body?.division === 'string' ? body.division.toLowerCase().trim() : undefined);
    const validDivision = normalizeDivisionSlug(rawDivision);

    const application = {
      pathway: role,
      role,
      chapter: validChapter,
      division: validDivision,
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
          ...(validChapter ? { chapter: validChapter } : {}),
          ...(validDivision ? { division: validDivision } : {}),
          updatedAt: submittedAt,
        },
        $setOnInsert: { createdAt: submittedAt, status: 'pending' },
        $addToSet: { pathways: role },
      },
      { upsert: true }
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
    return NextResponse.json(
      { error: 'We could not save your application. Please try again.', ...(details ? { details } : {}) },
      { status: 503 }
    );
  }
}
