import type { AdvertItem } from '@admin/types/content';
import type { ApplicationRole, RegistrationLink } from '@/lib/types/membership';
import { ROLE_LABELS } from '@/lib/types/membership';

function roleSummary(roles: ApplicationRole[]): string {
  const labels = roles.map((role) => ROLE_LABELS[role] ?? role).filter(Boolean);
  if (labels.length === 0) return 'Open roles across SINet.';
  if (labels.length === 1) return `Now accepting ${labels[0]} applications.`;
  if (labels.length === 2) return `Now accepting ${labels[0]} and ${labels[1]} applications.`;
  return `Now accepting applications for ${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}.`;
}

export function registrationLinkToAdvert(link: RegistrationLink, sortOrder = -100): AdvertItem {
  return {
    id: `reg-link-${link._id}`,
    title: link.name,
    eyebrow: 'Applications open',
    body: roleSummary(link.roles),
    imageUrl: '',
    ctaLabel: 'Apply now',
    ctaHref: `/join/${link.slug}`,
    enabled: true,
    showModal: false,
    startsAt: '',
    endsAt: link.expiresAt ? link.expiresAt.slice(0, 10) : '',
    sortOrder,
  };
}
