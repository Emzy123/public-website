import Link from 'next/link';
import { getCmsContent, getDefaultContent } from '@/lib/cms';
import type { NewsContent, NewsPost } from '@admin/types/content';

export const metadata = {
  title: 'News & Updates',
  description: 'Project milestones, announcements, and updates from SINet across agriculture, trade, and real estate.',
};

function publishedPosts(content: NewsContent): NewsPost[] {
  return [...content.posts]
    .filter((post) => post.published && post.title.trim())
    .sort((a, b) => {
      const byDate = String(b.publishedAt).localeCompare(String(a.publishedAt));
      if (byDate !== 0) return byDate;
      return a.sortOrder - b.sortOrder;
    });
}

export default async function NewsPage() {
  let content: NewsContent;
  try {
    content = await getCmsContent('news');
  } catch {
    content = getDefaultContent('news');
  }

  const posts = publishedPosts(content);

  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">{content.hero.badge}</p>
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">
            {content.hero.title}
          </h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">{content.hero.subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-[800px] border border-[#0d1a4a]/20 bg-white p-10 text-center xs:p-12">
            <p className="font-editorial text-2xl text-[#0d1a4a]">No public posts yet.</p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#7b7263]">
              We will publish updates here as projects across agriculture, trade &amp; distribution, and real estate
              reach clear milestones. For the latest, reach out directly.
            </p>
            <Link href="/contact" className="mt-8 inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white hover:bg-[#d9711b]">
              Contact SINet
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-col border border-[#0d1a4a]/20 bg-white">
                {post.imageUrl ? (
                  <div className="h-52 w-full overflow-hidden bg-[#eee6d0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-6 md:p-8">
                  {post.publishedAt && (
                    <p className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">
                      {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  <h2 className="mt-3 font-editorial text-2xl leading-tight tracking-[-.03em]">{post.title}</h2>
                  {post.excerpt && <p className="mt-4 text-sm leading-6 text-[#5b554a]">{post.excerpt}</p>}
                  <Link
                    href={`/news/${post.slug}`}
                    className="mt-6 inline-flex text-xs font-bold uppercase tracking-wider text-[#d9711b]"
                  >
                    Read update →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
