export type LinkDisplayStatus = 'Open' | 'Expired' | 'Full' | 'Closed';

export interface CampaignLinkLike {
  [key: string]: unknown;
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
 * Normalizes any status string into a uniform lowercase snake_case token.
 * For example, 'auto-closed', 'auto_closed', 'Auto Closed' -> 'auto_closed'.
 */
export function normalizeStatus(status?: string | null): string {
  if (!status) return '';
  return status.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

/**
 * Parses expiry timestamp.
 * If expiry is provided as date-only 'YYYY-MM-DD', ISO 8601 would default to UTC midnight
 * (which is 01:00 AM in Lagos / West Africa Time, cutting off the entire day).
 * In SINet, date-only expiries are treated as the end of that day in Africa/Lagos (UTC+1: 23:59:59.999+01:00).
 */
export function parseExpiryDate(expiry: Date | string | null | undefined): Date | null {
  if (!expiry) return null;
  if (expiry instanceof Date) return expiry;
  const str = String(expiry).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T23:59:59.999+01:00`);
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Resolves the effective capacity limit for a campaign link.
 * Precedence rule: maxApplications > quota > seatLimit.
 * - maxApplications: explicit application override limit
 * - quota: MongoDB registration link capacity
 * - seatLimit: PostgreSQL campaign cohort limit
 * Returns null if unbounded (no limit specified).
 */
export function getEffectiveCapacityLimit(campaign: CampaignLinkLike): number | null {
  if (campaign.maxApplications != null) return campaign.maxApplications;
  if (campaign.quota != null) return campaign.quota;
  if (campaign.seatLimit != null) return campaign.seatLimit;
  return null;
}

/**
 * Checks whether a campaign link's base administrative status is active.
 * Checks both status string and isOpen boolean.
 * Explicit closures ('closed', 'auto_closed', 'archived', 'draft', isOpen === false)
 * are not active.
 */
export function isBaseStatusActive(campaign: CampaignLinkLike): boolean {
  if (!campaign) return false;
  if (campaign.isOpen === false) return false;

  const raw = campaign.status ?? (campaign.isOpen === true ? 'active' : 'closed');
  const normalized = normalizeStatus(raw);
  if (['closed', 'auto_closed', 'archived', 'draft'].includes(normalized)) {
    return false;
  }
  return normalized === 'active' || normalized === 'open';
}

/**
 * Shared helper: Single source of truth for whether a campaign or registration link is open.
 * Evaluated with precedence:
 * Active Base Status AND Not Expired AND Has Capacity Remaining
 */
export function isCampaignLinkOpen(
  campaign: CampaignLinkLike,
  now: Date = new Date()
): boolean {
  if (!campaign) return false;

  const isActive = isBaseStatusActive(campaign);
  if (!isActive) return false;

  const rawExpiry = campaign.expiresAt ?? campaign.endsAt;
  const expiryDate = parseExpiryDate(rawExpiry);
  const isNotExpired = !expiryDate || expiryDate.getTime() > now.getTime();
  if (!isNotExpired) return false;

  const limit = getEffectiveCapacityLimit(campaign);
  const count = campaign.applicationCount ?? 0;
  const hasRemainingCapacity = limit == null || count < limit;

  return Boolean(hasRemainingCapacity);
}

export const isLinkOpen = isCampaignLinkOpen;

/**
 * Derives 'Open', 'Expired', 'Full', or 'Closed' for display.
 * Precedence order: Closed > Full > Expired > Open
 * 1. Closed: Manually closed, auto-closed, archived, draft, or isOpen === false
 * 2. Full: Capacity limit reached (applicationCount >= effectiveLimit)
 * 3. Expired: Expiration timestamp passed (<= now)
 * 4. Open: Active, within deadline, and capacity remaining
 */
export function getCampaignLinkDisplayStatus(
  campaign: CampaignLinkLike,
  now: Date = new Date()
): LinkDisplayStatus {
  if (!campaign) return 'Closed';

  const isActive = isBaseStatusActive(campaign);
  if (!isActive) {
    return 'Closed';
  }

  const limit = getEffectiveCapacityLimit(campaign);
  const count = campaign.applicationCount ?? 0;
  const isFull = Boolean(limit != null && limit > 0 && count >= limit);
  if (isFull) {
    return 'Full';
  }

  const rawExpiry = campaign.expiresAt ?? campaign.endsAt;
  const expiryDate = parseExpiryDate(rawExpiry);
  const isExpired = Boolean(expiryDate && expiryDate.getTime() <= now.getTime());
  if (isExpired) {
    return 'Expired';
  }

  return 'Open';
}

export const getLinkDisplayStatus = getCampaignLinkDisplayStatus;
