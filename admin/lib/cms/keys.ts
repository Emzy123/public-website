import type { CmsKey } from '@admin/types/content';

export const CMS_COLLECTION = 'cms_content';

export const CMS_KEYS: { key: CmsKey; label: string; description: string; group: string; previewPath: string }[] = [
  { key: 'hero-slides', label: 'Hero Carousel', description: 'Homepage hero slides', group: 'Home', previewPath: '/' },
  { key: 'home', label: 'Home Sections', description: 'Impact, flywheel, testimonials, CTA', group: 'Home', previewPath: '/' },
  { key: 'empires-page', label: 'Empires Page', description: 'Deep-dive empire content', group: 'Pages', previewPath: '/empires' },
  { key: 'about', label: 'About Page', description: 'Founder, team, timeline', group: 'Pages', previewPath: '/about' },
  { key: 'blueprint', label: 'Blueprint Page', description: 'Trade-to-asset model content', group: 'Pages', previewPath: '/blueprint' },
  { key: 'transparency', label: 'Transparency Page', description: 'Commitments and FAQ', group: 'Pages', previewPath: '/transparency' },
  { key: 'impact', label: 'Impact Page', description: 'Student movement and roles', group: 'Pages', previewPath: '/impact' },
  { key: 'investor-journey', label: 'Investor Journey', description: 'Tiers, timeline, compounding', group: 'Pages', previewPath: '/investor-journey' },
  { key: 'returns', label: 'Returns Page', description: 'Track record and metrics', group: 'Pages', previewPath: '/returns' },
  { key: 'academy', label: 'Academy Page', description: 'Curriculum and learning path', group: 'Pages', previewPath: '/academy' },
  { key: 'connect', label: 'Connect Page', description: 'Inquiry form options', group: 'Pages', previewPath: '/connect' },
  { key: 'sectors-page', label: 'Sectors Page', description: 'Investment sectors hero copy', group: 'Pages', previewPath: '/sectors' },
  { key: 'waitlist-page', label: 'Waitlist Page', description: 'Waitlist intro copy', group: 'Pages', previewPath: '/waitlist' },
  { key: 'contact-page', label: 'Contact Page', description: 'Legacy contact page copy', group: 'Pages', previewPath: '/contact' },
  { key: 'site-settings', label: 'Site Settings', description: 'Contact, social, navigation, SEO', group: 'Settings', previewPath: '/' },
];

export function getCmsPreviewPath(key: CmsKey): string {
  return CMS_KEYS.find((k) => k.key === key)?.previewPath ?? '/';
}

export function isCmsKey(value: string): value is CmsKey {
  return CMS_KEYS.some((k) => k.key === value);
}
