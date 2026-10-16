/** Public membership roles available on general public application pages */
export const APPLICATION_ROLES = [
  'volunteer',
  'community-member',
  'ambassador',
  'partnership-interest',
] as const;

/** All application roles recognized by the platform, including invite-only staff */
export const ALL_APPLICATION_ROLES = [
  'volunteer',
  'staff',
  'community-member',
  'ambassador',
  'partnership-interest',
] as const;

export type PublicApplicationRole = (typeof APPLICATION_ROLES)[number];
export type ApplicationRole = (typeof ALL_APPLICATION_ROLES)[number];

/** Legacy pathway values retained for existing records */
export type LegacyPathway = 'investment' | 'get-involved';

/** Role at application time (§5.5) — includes student evergreen onboarding */
export type ApplicationPathway = ApplicationRole | LegacyPathway | 'student';

export const ROLE_LABELS: Record<ApplicationRole, string> = {
  volunteer: 'Volunteer',
  staff: 'Staff',
  'community-member': 'Community Member',
  ambassador: 'Campus Ambassador',
  'partnership-interest': 'Partnership & Enterprise',
};

/**
 * Canonical mapping of all accepted role aliases, query string variants,
 * and pluralizations to their canonical ApplicationRole.
 */
export const ROLE_ALIASES: Record<string, ApplicationRole> = {
  // volunteer
  volunteer: 'volunteer',
  volunteers: 'volunteer',

  // staff
  staff: 'staff',

  // community-member
  'community-member': 'community-member',
  'community-members': 'community-member',
  community: 'community-member',
  member: 'community-member',
  members: 'community-member',
  student: 'community-member',
  'student-network': 'community-member',

  // ambassador
  ambassador: 'ambassador',
  ambassadors: 'ambassador',
  'campus-ambassador': 'ambassador',
  'campus-ambassadors': 'ambassador',
  'campus-ambassadors-2026': 'ambassador',

  // partnership-interest
  'partnership-interest': 'partnership-interest',
  partnership: 'partnership-interest',
  partnerships: 'partnership-interest',
  partner: 'partnership-interest',
  partners: 'partnership-interest',
  enterprise: 'partnership-interest',
  enterprises: 'partnership-interest',
  'partnership-enterprise': 'partnership-interest',
};

/**
 * Normalizes query string role parameters into a canonical ApplicationRole.
 * Rejects any malicious input (e.g. <script>, non-slug characters) and returns
 * null for unknown or unmapped slugs.
 */
export function normalizeRoleSlug(raw?: string | null): ApplicationRole | null {
  if (!raw) return null;
  // Discard any input with tags, quotes, code, or dangerous characters
  if (/[<>"'`\\${}]/.test(raw)) return null;
  const cleaned = raw.toLowerCase().trim().replace(/[_ ]+/g, '-');
  return ROLE_ALIASES[cleaned] ?? null;
}

export const PILLARS = ['agriculture', 'trade-distribution', 'real-estate'] as const;
export type Pillar = (typeof PILLARS)[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  agriculture: 'Agriculture',
  'trade-distribution': 'Trade & Goods Distribution',
  'real-estate': 'Real Estate',
};

export type RegistrationLinkStatus = 'open' | 'closed' | 'auto-closed';

export type RegistrationLink = {
  _id: string;
  name: string;
  slug: string;
  roles: ApplicationRole[];
  isOpen: boolean;
  status: RegistrationLinkStatus;
  expiresAt?: string;
  quota?: number;
  applicationCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  url: string;
};
