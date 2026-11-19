import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireRole, requireChapterLead, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { reviewApplicationDecision } from '@/lib/applications/campaigns';
import { getMongoDb } from '@/lib/db/mongodb';
import { db, isPostgresConfigured, sanitizeDatabaseError } from '@/lib/db';
import { applications, chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getClientIp } from '@/lib/security/rate-limit-unified';
import { validateOrigin } from '@/lib/security/origin';
import { writeAuditLog } from '@/lib/audit/log';

import { sendApplicationStatusEmail } from '@/lib/email/application-mail';

const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject'], {
    message: "Decision must be either 'approve' or 'reject'",
  }),
  remarks: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = reviewDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid review payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Require PostgreSQL to be configured and reachable before processing application reviews
    // to prevent unaudited decisions or split-brain membership status during database outages
    if (!isPostgresConfigured()) {
      return NextResponse.json(
        { error: 'database_unavailable' },
        { status: 503 }
      );
    }

    try {
      await db.select({ id: chapters.id }).from(chapters).limit(1);
    } catch (dbPingErr) {
      console.warn('[AdminReview] PostgreSQL check failed, refusing application review:', sanitizeDatabaseError(dbPingErr));
      return NextResponse.json(
        { error: 'database_unavailable' },
        { status: 503 }
      );
    }

    // 1. Check MongoDB applications first (Admin campaign links)
    if (ObjectId.isValid(params.id)) {
      try {
        const mongo = await getMongoDb();
        const mongoApp = await mongo
          .collection('applications')
          .findOne({ _id: new ObjectId(params.id) });

        if (mongoApp) {
          const session = await requireRole(
            ['super_admin', 'admin', 'chapter_lead'],
            request
          );

          const newStatus = parsed.data.decision === 'approve' ? 'approved' : 'rejected';
          const reviewedAt = new Date();

          await mongo.collection('applications').updateOne(
            { _id: mongoApp._id },
            {
              $set: {
                status: newStatus,
                reviewedBy: session.email,
                reviewedAt,
                reviewRemarks: parsed.data.remarks || null,
                updatedAt: reviewedAt,
              },
            }
          );

          await writeAuditLog({
            action: 'application.status_update',
            actor: session.email,
            resource: `application:${mongoApp._id}`,
            metadata: {
              applicationId: String(mongoApp._id),
              decision: parsed.data.decision,
              status: newStatus,
              remarks: parsed.data.remarks || null,
            },
          });

          // If applicant has record in members collection, sync their status
          const appData = (mongoApp.data as Record<string, unknown>) || {};
          const applicantEmail = (appData.email as string) || (mongoApp.email as string);
          const applicantName = (appData.fullName as string) || (mongoApp.fullName as string) || 'Applicant';
          const applicantRole = String(mongoApp.role || mongoApp.pathway || 'Member');

          if (applicantEmail && typeof applicantEmail === 'string') {
            await mongo.collection('members').updateOne(
              { email: applicantEmail.toLowerCase() },
              {
                $set: {
                  status: newStatus === 'approved' ? 'active' : 'rejected',
                  updatedAt: reviewedAt,
                },
              }
            );

            // Send decision notification email
            sendApplicationStatusEmail({
              email: applicantEmail,
              name: applicantName,
              pathway: applicantRole,
              status: newStatus,
              role: applicantRole,
              reviewNote: parsed.data.remarks,
            }).catch((err) => console.warn('[Review] Status email send failed:', err));
          }

          return NextResponse.json({
            success: true,
            decision: parsed.data.decision,
            message: `Application ${parsed.data.decision}d successfully.`,
          });
        }
      } catch (mongoErr) {
        console.warn('[Review] MongoDB lookup check failed:', mongoErr);
      }
    }

    // 2. Fall back to PostgreSQL applications
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);

    if (isUuid && !isPostgresConfigured()) {
      return NextResponse.json(
        { error: 'database_unavailable' },
        { status: 503 }
      );
    }

    let app;
    try {
      const [foundApp] = await db
        .select({ id: applications.id, universityId: applications.universityId })
        .from(applications)
        .where(eq(applications.id, params.id));
      app = foundApp;
    } catch (dbErr) {
      console.warn('[AdminReview] Database query failed:', sanitizeDatabaseError(dbErr));
      if (isUuid) {
        return NextResponse.json(
          { error: 'database_unavailable' },
          { status: 503 }
        );
      }
      throw dbErr;
    }

    if (!app) {
      return NextResponse.json({ error: 'Application record not found.' }, { status: 404 });
    }

    const [chapter] = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.universityId, app.universityId));

    const session = await requireChapterLead(chapter?.id || '', request);

    const result = await reviewApplicationDecision({
      applicationId: params.id,
      reviewerId: session.userId,
      decision: parsed.data.decision,
      remarks: parsed.data.remarks,
      ipAddress: getClientIp(request),
    });

    const newStatus = parsed.data.decision === 'approve' ? 'approved' : 'rejected';
    if (result.application?.email) {
      sendApplicationStatusEmail({
        email: result.application.email,
        name: result.application.fullName,
        pathway: result.application.division,
        status: newStatus,
        role: result.application.division,
        reviewNote: parsed.data.remarks,
      }).catch((err) => console.warn('[Review] Status email send failed:', err));
    }

    return NextResponse.json({
      success: true,
      decision: parsed.data.decision,
      application: result.application,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    if (isUuid) {
      console.error('Application review action error:', sanitizeDatabaseError(error));
      return NextResponse.json(
        { error: 'database_unavailable' },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : 'Review action failed';
    console.error('Application review action error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
