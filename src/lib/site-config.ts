/**
 * Central site configuration for SINet.
 * Defines canonical domain, contact details, social channels, and feature flags.
 */

export const SITE_NAME = 'SINet';
export const OFFICIAL_LEGAL_NAME = '______';
export const SITE_URL = 'https://www.sinet.africa';

// Single source of truth for the contact email.
// Defaults to domain address hello@sinet.africa; overridable via RESEND_CONTACT_TO_EMAIL.
export const CONTACT_EMAIL =
  process.env.RESEND_CONTACT_TO_EMAIL?.trim() || 'hello@sinet.africa';

export const CONTACT_PHONE = '+234 916 410 7049';
export const CONTACT_PHONE_RAW = 'tel:+2349164107049';
export const CONTACT_WHATSAPP = 'https://wa.me/2349028239706';
export const CONTACT_WHATSAPP_DISPLAY = '0902 823 9706';
export const REGISTERED_ADDRESS = 'Kogi State, Nigeria';

/**
 * Feature flags for sections currently awaiting real verified content.
 * Flip to true once substantive entries/catalog are published.
 */
export const FEATURE_FLAGS = {
  showNews: true,       // Active pilot updates & field notes
  showPartners: false,  // Awaiting real institutional partner roster
  showProducts: false,  // Awaiting verified goods inventory
  /**
   * Controls whether per-chapter member counts and the "Active Members"
   * aggregate stat are shown on the /chapters directory.
   * Set to false until memberCount is incremented by the application-approval
   * workflow. Hardcoded 0 values are misleading.
   * TODO [OWNER APPROVAL]: Verify the "280+ students across 16 universities"
   * claim in About page copy before re-enabling.
   */
  showMemberCounts: false,
} as const;

export type SocialKey = 'x' | 'linkedin' | 'facebook' | 'instagram' | 'whatsapp';

export interface SocialLinkItem {
  key: SocialKey;
  label: string;
  ariaLabel: string;
  href: string;
}

export const SOCIAL_LINKS: readonly SocialLinkItem[] = [
  {
    key: 'x',
    label: 'X',
    ariaLabel: 'Follow SINet on X (formerly Twitter)',
    href: 'https://twitter.com/SINet_Africa',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    ariaLabel: 'Connect with SINet on LinkedIn',
    href: 'https://linkedin.com/company/sinet-africa',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    ariaLabel: 'Follow SINet on Facebook',
    href: 'https://facebook.com/sinet.africa',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    ariaLabel: 'Follow SINet on Instagram',
    href: 'https://instagram.com/sinet.africa',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    ariaLabel: 'Chat with SINet on WhatsApp',
    href: 'https://wa.me/2349028239706',
  },
] as const;

export interface PrimaryNavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

/**
 * Dynamically filtered primary navigation based on feature flags.
 */
export function getPrimaryNav(): PrimaryNavItem[] {
  const nav: PrimaryNavItem[] = [
    { label: 'About', href: '/about' },
    { label: 'What We Do', href: '/sectors' },
  ];

  if (FEATURE_FLAGS.showProducts) {
    nav.push({ label: 'Products', href: '/products' });
  }

  nav.push({ label: 'Gallery', href: '/gallery' });

  if (FEATURE_FLAGS.showNews) {
    nav.push({ label: 'News', href: '/news' });
  }

  if (FEATURE_FLAGS.showPartners) {
    nav.push({ label: 'Partners', href: '/partners' });
  }

  nav.push(
    {
      label: 'Community',
      children: [
        { label: 'Campus Chapters', href: '/chapters' },
        { label: 'Student Network', href: '/student-network' },
        { label: 'Academy', href: '/academy' },
      ],
    },
    { label: 'Contact', href: '/contact' }
  );

  return nav;
}
