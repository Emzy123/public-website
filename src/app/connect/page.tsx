import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';
import ConnectClient from './ConnectClient';

export async function generateMetadata() {
  return buildPageMetadata('connect', {
    title: 'Connect With SINet',
    description: 'Get in touch with SINet. Investment inquiries, campus ambassador applications, and general questions.',
  });
}

export default async function ConnectPage() {
  const [content, settings] = await Promise.all([
    getCmsContent('connect'),
    getCmsContent('site-settings'),
  ]);

  return (
    <ConnectClient
      content={content}
      contact={settings.contact}
      social={settings.social}
    />
  );
}
