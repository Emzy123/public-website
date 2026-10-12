import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CmsMarkdown } from '@/components/cms/CmsMarkdown';
import { getCmsContent, getDefaultContent } from '@/lib/cms';
import type { NewsContent, NewsPost } from '@admin/types/content';

type Props = { params: { slug: string } };

async function loadPost(slug: string): Promise<{ content: NewsContent; post: NewsPost } | null> {
  let content: NewsContent;
  try {
    content = await getCmsContent('news');
  } catch {
    content = getDefaultContent('news');
  }
  const post = content.posts.find((p) => p.published && p.slug === slug);
  if (!post) return null;
  return { content, post };
}

export async function generateMetadata({ params }: Props) {
  const loaded = await loadPost(params.slug);
  if (!loaded) return { title: 'Update' };
  return {
    title: loaded.post.title,
    description: loaded.post.excerpt || loaded.content.hero.subtitle,
  };
}

export default async function NewsPostPage({ params }: Props) {
  const loaded = await loadPost(params.slug);
  if (!loaded) notFound();
  const { post } = loaded;

  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <article className="mx-auto max-w-[800px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <Link href="/news" className="text-xs font-bold uppercase tracking-wider text-[#d9711b]">
          ← All updates
        </Link>
        {post.publishedAt && (
          <p className="mt-8 font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">
            {new Date(post.publishedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
        <h1 className="mt-4 font-editorial text-[clamp(2.25rem,6vw,3.75rem)] leading-[.92] tracking-[-.05em]">
          {post.title}
        </h1>
        {post.excerpt && <p className="mt-6 text-lg leading-8 text-[#554e43]">{post.excerpt}</p>}
        {post.imageUrl && (
          <div className="mt-10 aspect-[16/9] w-full overflow-hidden border border-[#0d1a4a]/15 bg-[#eee6d0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {post.body && (
          <div className="prose-sinet mt-10 text-[#0d1a4a]">
            <CmsMarkdown content={post.body} />
          </div>
        )}
        <div className="mt-14 border-t border-[#0d1a4a]/15 pt-8">
          <Link href="/contact" className="inline-flex bg-[#0d1a4a] px-6 py-3 text-sm font-bold text-white hover:bg-[#d9711b]">
            Contact SINet
          </Link>
        </div>
      </article>
    </div>
  );
}
