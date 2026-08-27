import type { CmsKey } from '@admin/types/content';

export const CMS_COLLECTION = 'cms_content';

export type CmsKeyMeta = {
  key: CmsKey;
  label: string;
  description: string;
  group: string;
  previewPath: string;
  /** Archived keys stay in DB but are hidden from the primary admin content list. */
  archived?: boolean;
};

export const CMS_KEYS: CmsKeyMeta[] = [
  {
    key: 'hero-slides',
    label: 'Hero Carousel (archived)',
    description: 'No longer drives the live homepage — InstitutionalHome is hardcoded',
    group: 'Archived',
    previewPath: '/',
    archived: true,
  },
  {
    key: 'home',
    label: 'Home Sections (archived)',
    description: 'No longer drives the live homepage — InstitutionalHome is hardcoded',
    group: 'Archived',
    previewPath: '/',
    archived: true,
  },
  { key: 'empires-page', label: 'Empires Page', description: 'Deep-dive empire content', group: 'Pages', previewPath: '/empires' },
  { key: 'about', label: 'About Page', description: 'Founder, team, timeline', group: 'Pages', previewPath: '/about' },
  { key: 'blueprint', label: 'Blueprint Page', description: 'Trade-to-asset model content', group: 'Pages', previewPath: '/blueprint' },
  { key: 'transparency', label: 'Transparency Page', description: 'Commitments and FAQ', group: 'Pages', previewPath: '/transparency' },
  { key: 'impact', label: 'Impact Page', description: 'Student movement and roles', group: 'Pages', previewPath: '/impact' },
  {
    key: 'investor-journey',
    label: 'Investor Journey (legacy)',
    description: 'Deprecated — public route redirects to /sectors',
    group: 'Legacy',
    previewPath: '/investor-journey',
    archived: true,
  },
  {
    key: 'returns',
    label: 'Returns Page (legacy)',
    description: 'Deprecated — public route redirects to /news',
    group: 'Legacy',
    previewPath: '/returns',
    archived: true,
  },
  { key: 'academy', label: 'Academy Page', description: 'Curriculum and learning path', group: 'Pages', previewPath: '/academy' },
  { key: 'connect', label: 'Connect Page', description: 'Inquiry form options', group: 'Pages', previewPath: '/connect' },
  { key: 'sectors-page', label: 'Sectors Page', description: 'Three pillars hero copy', group: 'Pages', previewPath: '/sectors' },
  { key: 'gallery', label: 'Gallery', description: 'Pillar-tagged photos for the public gallery', group: 'Pages', previewPath: '/gallery' },
  { key: 'waitlist-page', label: 'Waitlist Page', description: 'Waitlist intro copy', group: 'Pages', previewPath: '/waitlist' },
  { key: 'contact-page', label: 'Contact Page', description: 'Contact page copy', group: 'Pages', previewPath: '/contact' },
  { key: 'site-settings', label: 'Site Settings', description: 'Contact, social, logos, SEO', group: 'Settings', previewPath: '/' },
];

export function getActiveCmsKeys(): CmsKeyMeta[] {
  return CMS_KEYS.filter((k) => !k.archived);
}

export function getCmsPreviewPath(key: CmsKey): string {
  return CMS_KEYS.find((k) => k.key === key)?.previewPath ?? '/';
}

export function isCmsKey(value: string): value is CmsKey {
  return CMS_KEYS.some((k) => k.key === value);
}

export function isArchivedCmsKey(key: CmsKey): boolean {
  return Boolean(CMS_KEYS.find((k) => k.key === key)?.archived);
}
