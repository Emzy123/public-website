import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, reportPost } from '@/lib/posts/posts';
import { REPORT_REASONS, type ReportReason } from '@/lib/db/schema/posts';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { validateOrigin } from '@/lib/security/origin';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const reportSchema = z.object({
  reporterEmail: z.string().email(),
  reason: z.enum(REPORT_REASONS as unknown as [ReportReason, ...ReportReason[]]),
  details: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const rateLimitResult = await enforceRateLimit(
    getClientIp(request),
    'post-report',
    5,
    60
  );
  if (!rateLimitResult.ok) {
    return NextResponse.json(
      { error: 'Too many reports submitted. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const post = await getPostBySlug(params.slug);
    if (!post) {
      return NextResponse.json({ error: 'Target post not found' }, { status: 404 });
    }

    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid report data', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const report = await reportPost({
      postId: post.id,
      reporterUserId: session?.userId || null,
      reporterEmail: parsed.data.reporterEmail,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you. Your report has been submitted to the moderation council for review.',
      reportId: report.id,
    });
  } catch (err) {
    console.error('[API/Posts/Report] Report error:', err);
    return NextResponse.json({ error: 'Failed to submit post report' }, { status: 500 });
  }
}
