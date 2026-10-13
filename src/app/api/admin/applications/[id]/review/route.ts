import { NextRequest, NextResponse } from 'next/server';
import { requireChapterLead, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { reviewApplicationDecision } from '@/lib/applications/campaigns';
import { db } from '@/lib/db';
import { applications, chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getClientIp } from '@/lib/security/rate-limit-unified';

import { validateOrigin } from '@/lib/security/origin';

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
    // 1. Fetch the application to identify its target chapter
    const [app] = await db
      .select({ id: applications.id, universityId: applications.universityId })
      .from(applications)
      .where(eq(applications.id, params.id));

    if (!app) {
      return NextResponse.json({ error: 'Application record not found.' }, { status: 404 });
    }

    const [chapter] = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.universityId, app.universityId));

    // 2. Enforce authorization: Global Admin OR Chapter Lead for this specific chapter
    const session = await requireChapterLead(chapter?.id || '', request);

    // 3. Parse and validate decision payload
    const body = await request.json().catch(() => ({}));
    const parsed = reviewDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid review payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 4. Execute review decision state transition & audit log
    const result = await reviewApplicationDecision({
      applicationId: params.id,
      reviewerId: session.userId,
      decision: parsed.data.decision,
      remarks: parsed.data.remarks,
      ipAddress: getClientIp(request),
    });

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
    const message = error instanceof Error ? error.message : 'Review action failed';
    console.error('Application review action error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
