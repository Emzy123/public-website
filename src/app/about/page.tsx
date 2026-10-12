import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';
import AboutClient from './AboutClient';

export async function generateMetadata() {
  return buildPageMetadata('about', {
    title: 'About',
    description:
      'From Student Dreams to Pan-African Movement. Founded in March 2025. Meet the founder, the leadership team, and learn how SINet is building 5 Mega Empires across Africa.',
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
