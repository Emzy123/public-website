import type { AdvertItem, AdvertsContent } from '@admin/types/content';
import { checkAdvertRisk, isAdvertApprovalValid } from '@/lib/compliance/risk-check';

function parseBoundary(value: string | undefined, edge: 'start' | 'end'): number | null {
  const raw = value?.trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return null;
  if (edge === 'end' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    // Inclusive end date when only YYYY-MM-DD is provided
    return ms + 24 * 60 * 60 * 1000 - 1;
  }
  return ms;
}

/** Active, enabled adverts sorted for public display. */
export function getActiveAdverts(content: AdvertsContent | AdvertItem[] | null | undefined, now = Date.now()): AdvertItem[] {
  const items = Array.isArray(content) ? content : content?.items ?? [];
  return items
    .filter((item) => item && item.enabled && String(item.title || '').trim())
    .filter((item) => {
      // Advert containing financial promotion / return claims requires valid legal approval bound to content
      if (checkAdvertRisk(item).hasRisk && !isAdvertApprovalValid(item)) {
        return false;
      }
      const start = parseBoundary(item.startsAt, 'start');
      const end = parseBoundary(item.endsAt, 'end');
      if (start !== null && now < start) return false;
      if (end !== null && now > end) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPrimaryAdvert(content: AdvertsContent | AdvertItem[] | null | undefined, now = Date.now()): AdvertItem | null {
  return getActiveAdverts(content, now)[0] ?? null;
}

/**
 * Merge CMS flyers with open registration-link promos.
 * Registration links sort first (negative sortOrder) so open campaigns stay visible.
 */
export function mergeAdvertSources(
  cms: AdvertsContent | AdvertItem[] | null | undefined,
  linkAdverts: AdvertItem[],
  now = Date.now(),
): AdvertItem[] {
  const cmsItems = Array.isArray(cms) ? cms : cms?.items ?? [];
  return getActiveAdverts([...linkAdverts, ...cmsItems], now);
}

export function getPrimaryMergedAdvert(
  cms: AdvertsContent | AdvertItem[] | null | undefined,
  linkAdverts: AdvertItem[],
  now = Date.now(),
): AdvertItem | null {
  return mergeAdvertSources(cms, linkAdverts, now)[0] ?? null;
}
