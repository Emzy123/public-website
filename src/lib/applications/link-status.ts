export type LinkDisplayStatus = 'Open' | 'Expired' | 'Full' | 'Closed';

export interface CampaignLinkLike {
  status?: string | null;
  isOpen?: boolean | null;
  expiresAt?: Date | string | null;
  endsAt?: Date | string | null;
  maxApplications?: number | null;
  quota?: number | null;
  seatLimit?: number | null;
  applicationCount?: number | null;
  startsAt?: Date | string | null;
}

/**
 * Shared helper: Single source of truth for whether a campaign or registration link is open.
 * Calculation per brief §1.3:
 * isOpen = campaign.status === 'active' &&
 *          (!campaign.expiresAt || new Date(campaign.expiresAt) > now) &&
 *          (!campaign.maxApplications || campaign.applicationCount < campaign.maxApplications)
 */
export function isCampaignLinkOpen(
  campaign: CampaignLinkLike,
  now: Date = new Date()
): boolean {
  if (!campaign) return false;

  const rawStatus = (campaign.status ?? (campaign.isOpen ? 'active' : 'closed')).toLowerCase();
  const isActive = rawStatus === 'active' || rawStatus === 'open';

  const rawExpiry = campaign.expiresAt ?? campaign.endsAt;
  const isNotExpired = !rawExpiry || new Date(rawExpiry).getTime() > now.getTime();

  const maxApps = campaign.maxApplications ?? campaign.quota ?? campaign.seatLimit;
  const count = campaign.applicationCount ?? 0;
  const hasRemainingCapacity = !maxApps || count < maxApps;

  return Boolean(isActive && isNotExpired && hasRemainingCapacity);
}

export const isLinkOpen = isCampaignLinkOpen;

/**
 * Derives 'Open', 'Expired', 'Full', or 'Closed' for display on admin link cards
 * using the exact same calculation as the public /join/[slug] route.
 */
export function getCampaignLinkDisplayStatus(
  campaign: CampaignLinkLike,
  now: Date = new Date()
): LinkDisplayStatus {
  if (!campaign) return 'Closed';

  const rawExpiry = campaign.expiresAt ?? campaign.endsAt;
  const isExpired = Boolean(rawExpiry && new Date(rawExpiry).getTime() <= now.getTime());

  const maxApps = campaign.maxApplications ?? campaign.quota ?? campaign.seatLimit;
  const count = campaign.applicationCount ?? 0;
  const isFull = Boolean(maxApps != null && maxApps > 0 && count >= maxApps);

  if (isFull) {
    return 'Full';
  }

  if (isExpired) {
    return 'Expired';
  }

  const rawStatus = (campaign.status ?? (campaign.isOpen ? 'active' : 'closed')).toLowerCase();
  const isActive = rawStatus === 'active' || rawStatus === 'open';

  if (isActive) {
    return 'Open';
  }

  return 'Closed';
}

export const getLinkDisplayStatus = getCampaignLinkDisplayStatus;
