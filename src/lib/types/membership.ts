/** Membership roles available on campaign-link applications */
export const APPLICATION_ROLES = [
  'volunteer',
  'staff',
  'community-member',
  'ambassador',
  'partnership-interest',
] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];

/** Legacy pathway values retained for existing records */
export type LegacyPathway = 'investment' | 'get-involved';

/** Role at application time (§5.5) — includes student evergreen onboarding */
export type ApplicationPathway = ApplicationRole | LegacyPathway | 'student';

export const ROLE_LABELS: Record<ApplicationRole, string> = {
  volunteer: 'Volunteer',
  staff: 'Staff',
  'community-member': 'Community Member',
  ambassador: 'Ambassador',
  'partnership-interest': 'Partnership & Investment Interest',
};

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
