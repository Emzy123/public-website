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
    openGraph: { title, description },
  };
}
