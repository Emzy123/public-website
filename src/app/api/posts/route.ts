import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/guards';
import { createPost, listPublishedPosts } from '@/lib/posts/posts';
import { POST_PILLARS, type PostPillar } from '@/lib/db/schema/posts';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { validateOrigin } from '@/lib/security/origin';

const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  summary: z.string().max(500).optional(),
  contentHtml: z.string().min(20, 'Post content must be at least 20 characters'),
  pillar: z.enum(POST_PILLARS as unknown as [PostPillar, ...PostPillar[]]),
  coverImageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pillar = searchParams.get('pillar') as PostPillar | null;
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const validPillar = pillar && (POST_PILLARS as readonly string[]).includes(pillar) ? pillar : undefined;

    const result = await listPublishedPosts({
      pillar: validPillar,
      search,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 10,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[API/Posts] Failed to list posts:', err);
    return NextResponse.json({ error: 'Failed to retrieve posts feed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const rateLimitResult = await enforceRateLimit(
    getClientIp(request),
    'post-create',
    10,
    60
  );
  if (!rateLimitResult.ok) {
    return NextResponse.json(
      { error: 'Too many post submissions. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid post submission payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const newPost = await createPost({
      title: parsed.data.title,
      contentHtml: parsed.data.contentHtml,
      summary: parsed.data.summary,
      pillar: parsed.data.pillar,
      coverImageUrl: parsed.data.coverImageUrl || null,
      tags: parsed.data.tags || [],
      status: 'in_review',
      authorId: session.userId.startsWith('admin-') ? null : session.userId,
      authorName: session.email.split('@')[0],
      authorEmail: session.email,
      authorRole: session.roles.includes('admin') ? 'Admin' : 'Member',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Post submitted successfully. It will be publicly visible upon editorial review.',
        post: {
          id: newPost.id,
          slug: newPost.slug,
          status: newPost.status,
          title: newPost.title,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const message = (err as { message?: string })?.message || 'Authentication required';
    return NextResponse.json({ error: message }, { status });
  }
}
