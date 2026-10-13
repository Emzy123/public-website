import Link from 'next/link';
import { listPublishedPosts } from '@/lib/posts/posts';
import { POST_PILLARS, type PostPillar } from '@/lib/db/schema/posts';

export const metadata = {
  title: 'News & Dispatches',
  description:
    'Verified updates, campus enterprise projects, agricultural pilots, and community milestones across SINet chapters.',
};

export const dynamic = 'force-dynamic';

const PILLAR_LABELS: Record<PostPillar, string> = {
  agriculture: '🌱 Agriculture',
  trade_distribution: '📦 Trade & Distribution',
  real_estate: '🏛️ Real Estate',
  community: '🤝 Community',
};

interface NewsPageProps {
  searchParams: {
    pillar?: string;
    q?: string;
    page?: string;
  };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const selectedPillar = (
    searchParams.pillar && (POST_PILLARS as readonly string[]).includes(searchParams.pillar)
      ? searchParams.pillar
      : undefined
  ) as PostPillar | undefined;

  const searchQuery = searchParams.q?.trim() || undefined;
  const page = parseInt(searchParams.page || '1', 10);

  const { posts, total, totalPages } = await listPublishedPosts({
    pillar: selectedPillar,
    search: searchQuery,
    page: Number.isFinite(page) ? page : 1,
    limit: 12,
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Hero Header */}
      <section className="border-b border-slate-200/80 bg-white px-4 py-12 xs:px-5 md:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-blue-600">
                Network Dispatches &amp; Field Updates
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
                SINet Chronicle
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                Verified milestones, student venture case studies, and agricultural field dispatches from
                collegiate chapters across Kogi State and North-Central Nigeria.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/feed.xml"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
              >
                <span>📡</span>
                <span>RSS Feed</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-sm"
              >
                <span>Submit Lead</span>
              </Link>
            </div>
          </div>

          {/* Pillar Filters Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
            <Link
              href="/news"
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                !selectedPillar
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Pillars
            </Link>
            {POST_PILLARS.map((pillar) => (
              <Link
                key={pillar}
                href={`/news?pillar=${pillar}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedPillar === pillar
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {PILLAR_LABELS[pillar]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Feed Content */}
      <section className="mx-auto max-w-6xl px-4 py-10 xs:px-5 md:py-14 lg:px-8">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              📰
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">No updates found</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {searchQuery || selectedPillar
                ? 'No posts matched your current search filters. Try resetting the pillar filter or search keywords.'
                : 'Verified editorial updates will appear here once cleared through peer moderation.'}
            </p>
            <div className="mt-6">
              <Link
                href="/news"
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Clear Filters
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md"
              >
                {post.coverImageUrl ? (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center p-6 text-center">
                    <span className="text-sm font-bold text-blue-200 tracking-wider uppercase">
                      {post.pillar.replace('_', ' ')}
                    </span>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold uppercase tracking-wider text-blue-700">
                      {post.pillar.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 font-medium">
                      ⏱️ {post.readingTimeMinutes} min read
                    </span>
                  </div>

                  <h2 className="mt-3 font-bold text-base leading-snug text-slate-900 hover:text-blue-600 transition line-clamp-2">
                    <Link href={`/news/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="mt-2.5 text-xs text-slate-600 line-clamp-3 leading-relaxed flex-1">
                    {post.summary}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-800">{post.authorName}</p>
                      <p className="text-[10px] text-slate-400">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </p>
                    </div>

                    <Link
                      href={`/news/${post.slug}`}
                      className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <span>Read</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={`/news?page=${page - 1}${selectedPillar ? `&pillar=${selectedPillar}` : ''}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Previous
              </Link>
            )}
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {totalPages} ({total} articles)
            </span>
            {page < totalPages && (
              <Link
                href={`/news?page=${page + 1}${selectedPillar ? `&pillar=${selectedPillar}` : ''}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
