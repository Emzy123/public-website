import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';
import ContactClient from './ContactClient';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata() {
  return buildPageMetadata('contact', {
    title: 'Contact Us',
    description: 'Get in touch with the SINet team for inquiries, partnerships, or support.',
  });
}

export default async function ContactPage() {
  const [content, settings] = await Promise.all([
    getCmsContent('contact-page'),
    getCmsContent('site-settings'),
  ]);

  return (
    <ContactClient
      content={content}
      contact={settings.contact}
      social={settings.social}
    />
  );
}
