import type { Metadata } from 'next';
import { getCmsContent } from '@/lib/cms';
import type { PageSeoKey } from '@admin/types/content';

export async function buildPageMetadata(page: PageSeoKey, fallback?: { title?: string; description?: string }): Promise<Metadata> {
  const settings = await getCmsContent('site-settings');
  const entry = settings.pageSeo[page];
  const title = entry?.title || fallback?.title || settings.seo.defaultTitle;
  const description = entry?.description || fallback?.description || settings.seo.defaultDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: "SINet — Building Africa's Future Systems" }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}
