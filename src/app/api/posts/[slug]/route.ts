import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, updatePost } from '@/lib/posts/posts';
import { requireAuth } from '@/lib/auth/guards';
import { validateOrigin } from '@/lib/security/origin';
import { z } from 'zod';
import { POST_PILLARS, type PostPillar } from '@/lib/db/schema/posts';

const updateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  summary: z.string().max(500).optional(),
  contentHtml: z.string().min(20).optional(),
  pillar: z.enum(POST_PILLARS as unknown as [PostPillar, ...PostPillar[]]).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await getPostBySlug(params.slug);
    if (!post) {
      return NextResponse.json({ error: 'Post not found or not published' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (err) {
    console.error('[API/Posts/Slug] Error fetching post:', err);
    return NextResponse.json({ error: 'Failed to retrieve post' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const session = await requireAuth(request);
    const post = await getPostBySlug(params.slug, { allowUnpublished: true });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isAdmin = session.roles.includes('admin') || session.roles.includes('super_admin');
    const isAuthor =
      (post.authorId && post.authorId === session.userId) ||
      (post.authorEmail && post.authorEmail.toLowerCase() === session.email.toLowerCase());

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Forbidden: You cannot edit this post' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload', issues: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await updatePost({
      postId: post.id,
      title: parsed.data.title,
      summary: parsed.data.summary,
      contentHtml: parsed.data.contentHtml,
      pillar: parsed.data.pillar,
      coverImageUrl: parsed.data.coverImageUrl,
      tags: parsed.data.tags,
      editorUserId: session.userId,
      isEditorAdmin: isAdmin,
    });

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
      post: updated,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const message = (err as { message?: string })?.message || 'Unauthorized';
    return NextResponse.json({ error: message }, { status });
  }
}
