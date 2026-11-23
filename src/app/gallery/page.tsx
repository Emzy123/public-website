import { getCmsContent } from '@/lib/cms';
import { GalleryView } from '@/components/gallery/GalleryView';
import { getDefaultContent } from '@admin/lib/cms/defaults';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata() {
  try {
    const content = await getCmsContent('gallery');
    return {
      title: 'Gallery',
      description: content.hero.subtitle || "Real activity across SINet's three pillars.",
    };
  } catch {
    return { title: 'Gallery' };
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
