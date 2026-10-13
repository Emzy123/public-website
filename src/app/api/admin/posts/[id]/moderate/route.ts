import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { moderatePostDecision } from '@/lib/posts/posts';
import { validateOrigin } from '@/lib/security/origin';
import { getClientIp } from '@/lib/security/rate-limit-unified';
import { z } from 'zod';

const decisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const session = await requireRole(
      ['super_admin', 'admin', 'chapter_lead'],
      request
    );

    const body = await request.json().catch(() => ({}));
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid decision payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const updated = await moderatePostDecision({
      postId: params.id,
      decision: parsed.data.decision,
      moderatorEmail: session.email,
      moderatorUserId: session.userId,
      rejectionReason: parsed.data.rejectionReason,
      clientIp,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Post ${parsed.data.decision === 'approve' ? 'approved and published' : 'rejected'}.`,
      post: updated,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 401;
    const message = (err as { message?: string })?.message || 'Unauthorized';
    return NextResponse.json({ error: message }, { status });
  }
}
