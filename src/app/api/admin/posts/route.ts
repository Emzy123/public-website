import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { listModerationQueue } from '@/lib/posts/posts';
import type { PostStatus, PostPillar } from '@/lib/db/schema/posts';

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(
      ['super_admin', 'admin', 'chapter_lead'],
      request
    );

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get('status') || 'all') as PostStatus | 'all';
    const pillarParam = (searchParams.get('pillar') || undefined) as PostPillar | undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { posts, counts } = await listModerationQueue({
      status: statusParam,
      pillar: pillarParam,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return NextResponse.json({
      success: true,
      posts,
      counts,
      moderator: {
        id: session.userId,
        email: session.email,
      },
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 401;
    const message = (err as { message?: string })?.message || 'Unauthorized';
    return NextResponse.json({ error: message }, { status });
  }
}
