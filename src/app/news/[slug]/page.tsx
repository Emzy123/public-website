import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/posts/posts';
import { ReportPostModal } from '@/components/posts/ReportPostModal';
import { SITE_URL } from '@/lib/site-config';
import type { Metadata } from 'next';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return {
      title: 'Update Not Found',
    };
  }

  const publishedIso = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : new Date(post.createdAt).toISOString();

  return {
    title: `${post.title} | SINet`,
    description: post.summary,
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/news/${post.slug}`,
      title: post.title,
      description: post.summary,
      publishedTime: publishedIso,
      authors: [post.authorName],
      tags: post.tags,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function NewsPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const formattedDate = (post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt)).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <article className="mx-auto max-w-4xl px-4 py-10 xs:px-5 md:py-16 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <Link
            href="/news"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>←</span>
            <span>All Updates &amp; Dispatches</span>
          </Link>

          <ReportPostModal slug={post.slug} postTitle={post.title} />
        </div>

        {/* Article Meta Header */}
        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
              {post.pillar.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">⏱️ {post.readingTimeMinutes} min read</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Published {formattedDate}</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900 leading-tight">
            {post.title}
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-2 rounded-r-xl">
            {post.summary}
          </p>

          <div className="mt-6 flex items-center justify-between border-y border-slate-100 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 font-bold text-xs text-white">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{post.authorName}</p>
                <p className="text-[11px] text-slate-500">{post.authorRole}</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              {post.viewCount > 0 ? `👁️ ${post.viewCount} views` : ''}
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImageUrl && (
          <div className="mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Sanitized Article Body */}
        <div
          className="prose prose-slate max-w-none mt-10 text-slate-800 leading-relaxed text-sm sm:text-base [&>p]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-400 [&>blockquote]:pl-4 [&>blockquote]:italic"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 border-t border-slate-200/80 pt-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topics &amp; Tags</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <footer className="mt-12 rounded-2xl bg-white p-6 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Want to contribute field research or project updates?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified campus chapter members can submit student venture reports directly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Contact Editorial Desk
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
