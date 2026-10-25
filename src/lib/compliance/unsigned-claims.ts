import { FEATURE_FLAGS } from '@/lib/site-config';

/** Unsigned financial figures, scale stats, and construction claims pending CEO/legal sign-off. */
export const UNSIGNED_CLAIM_REGEX =
  /₦|\b11\.8\s*M\b|\b280\+(?!\w)|\bover 280\b|\b2 manufacturing plants\b|\b2 plants building\b|\b5,000-bed\b|\b5000-bed\b|\bmanufacturing plants under (?:construction|development)\b|\bhostel estate\b/i;

export function containsUnsignedClaim(text: string | null | undefined): boolean {
  if (!text) return false;
  return UNSIGNED_CLAIM_REGEX.test(text);
}

function getObjectTextBlob(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(getObjectTextBlob).join(' ');
  }
  if (value && typeof value === 'object') {
    return Object.values(value).map(getObjectTextBlob).join(' ');
  }
  return '';
}

function shouldDropObject(value: Record<string, unknown>): boolean {
  return containsUnsignedClaim(getObjectTextBlob(value));
}

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    return containsUnsignedClaim(value) ? '' : value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => {
        if (item === '' || item == null) return false;
        if (typeof item === 'string') return !containsUnsignedClaim(item);
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return !shouldDropObject(item as Record<string, unknown>);
        }
        return true;
      })
      .map(redact)
      .filter((item) => item !== '' && item != null);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redact(child);
    }
    return out;
  }
  return value;
}

/**
 * Public CMS read path: hide unsigned claims unless the legal-approval flag is on.
 * Does not mutate Mongo drafts or delete source copy.
 */
export function gateUnsignedCmsContent<T>(
  data: T,
  allow: boolean = FEATURE_FLAGS.showUnsignedFinancialClaims
): T {
  if (allow) return data;
  return redact(data) as T;
}
