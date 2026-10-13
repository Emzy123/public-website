import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { reviewApplicationDecision } from '@/lib/applications/campaigns';
import { z } from 'zod';
import { getClientIp } from '@/lib/security/rate-limit-unified';

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
  try {
    const session = await requireAdmin(request);

    const body = await request.json().catch(() => ({}));
    const parsed = reviewDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid review payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

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
