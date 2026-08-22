import { getCmsContent } from '@/lib/cms';
import { GalleryView } from '@/components/gallery/GalleryView';

export async function generateMetadata() {
  const content = await getCmsContent('gallery');
  return {
    title: 'Gallery | SINet',
    description: content.hero.subtitle || 'Real activity across SINet\'s three pillars.',
  };
}

export default async function GalleryPage() {
  const content = await getCmsContent('gallery');
  return <GalleryView content={content} />;
}
