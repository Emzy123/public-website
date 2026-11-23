import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';
import AboutClient from './AboutClient';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata() {
  return buildPageMetadata('about', {
    title: 'About & Leadership',
    description:
      'From Student Dreams to Pan-African Movement. Meet the leadership team and learn how SINet is building practical enterprises across Agriculture, Trade & Goods Distribution, and Real Estate.',
  });
}

export default async function AboutPage() {
  const [content, settings] = await Promise.all([
    getCmsContent('about'),
    getCmsContent('site-settings'),
  ]);

  return (
    <AboutClient
      content={content}
      whatsappUrl={settings.contact.whatsapp}
      whatsappDisplay={settings.contact.whatsappDisplay}
    />
  );
}
