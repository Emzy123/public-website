import EmpiresClient from './EmpiresClient';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('empires', {
    title: 'The 5 Empires',
    description: "Five sectors, one ecosystem. Food & Processing, Tech & Innovation, Fashion & Creative, Real Estate, Agriculture. Deep-dive into SINet's 5 Mega Empires.",
  });
}

export default async function EmpiresPage() {
  const content = await getCmsContent('empires-page');
  return <EmpiresClient content={content} />;
}
