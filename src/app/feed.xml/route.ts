import { NextResponse } from 'next/server';
import { listPublishedPosts } from '@/lib/posts/posts';
import { SITE_URL } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { posts } = await listPublishedPosts({ limit: 50 });

  const itemsXml = posts
    .map((post) => {
      const postUrl = `${SITE_URL}/news/${post.slug}`;
      const pubDate = (post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt)).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.pillar.replace('_', ' '))}</category>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${escapeXml(post.authorName)}</dc:creator>
    </item>`;
    })
    .join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Student Investment Network (SINet) — Updates &amp; Dispatches</title>
    <link>${SITE_URL}/news</link>
    <description>Verified news, project milestones, and student dispatches across Agriculture, Trade &amp; Distribution, Real Estate, and Community Governance.</description>
    <language>en-NG</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
