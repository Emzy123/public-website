import { getCmsContent } from '@/lib/cms';
import { GalleryView } from '@/components/gallery/GalleryView';
import { getDefaultContent } from '@admin/lib/cms/defaults';

export async function generateMetadata() {
  try {
    const content = await getCmsContent('gallery');
    return {
      title: 'Gallery | SINet',
      description: content.hero.subtitle || "Real activity across SINet's three pillars.",
    };
  } catch {
    return { title: 'Gallery | SINet' };
  }
}

export default async function GalleryPage() {
  let content;
  try {
    content = await getCmsContent('gallery');
  } catch (error) {
    console.error('Gallery CMS load failed:', error);
    content = getDefaultContent('gallery');
  }
  return <GalleryView content={content} />;
}
