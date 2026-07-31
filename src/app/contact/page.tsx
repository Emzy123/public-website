import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';
import ContactClient from './ContactClient';

export async function generateMetadata() {
  return buildPageMetadata('contact', {
    title: 'Contact Us | SINet',
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
