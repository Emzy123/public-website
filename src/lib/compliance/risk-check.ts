import { createHash } from 'crypto';
import type { AdvertItem, NewsPost } from '@admin/types/content';

/**
 * Widened risk regex for investment / financial promotions with strict word boundaries
 * to prevent false positives (e.g. "Learn more", "Android app", "heroic", "return to dashboard")
 * while matching financial claims ("15% returns", "earn monthly", "ROI", "guaranteed", "invest now", "only 5 slots left").
 */
export const FINANCIAL_RISK_REGEX =
  /\d+\s*%|\breturns\b|\breturn\b(?!\s+to\b)|\bROI\b|\bprofits?\b|\bguarantee(?:d|s)?\b|\bearn(?:s|ed|ing|ings)?\b|\byields?\b|per annum|interest rate|\bslots? (?:only|left)\b|\binvest\w*/i;

export function containsFinancialRisk(text: string | null | undefined): boolean {
  if (!text) return false;
  return FINANCIAL_RISK_REGEX.test(text);
}

/**
 * Computes a normalized SHA-256 hash binding approved content fields:
 * title, body, CTA (label & href), advert image (imageUrl), flyer image (flyerImage),
 * and image alt text (imageAlt).
 * Normalizes whitespace and sorts keys alphabetically to ensure hash stability on no-op saves.
 */
export function computeAdvertContentHash(item: Partial<AdvertItem>): string {
  const normalized = {
    body: (item.body ?? '').trim().replace(/\r\n/g, '\n'),
    ctaHref: (item.ctaHref ?? '').trim(),
    ctaLabel: (item.ctaLabel ?? '').trim(),
    flyerImage: (item.flyerImage ?? '').trim(),
    imageAlt: (item.imageAlt ?? '').trim(),
    imageUrl: (item.imageUrl ?? '').trim(),
    title: (item.title ?? '').trim(),
  };

  const keys = Object.keys(normalized).sort() as Array<keyof typeof normalized>;
  const sortedObj: Record<string, string> = {};
  for (const k of keys) {
    sortedObj[k] = normalized[k];
  }

  return createHash('sha256').update(JSON.stringify(sortedObj)).digest('hex');
}

/**
 * Verifies if an advert's legal approval is valid and matches the current content hash.
 */
export function isAdvertApprovalValid(item: Partial<AdvertItem>): boolean {
  if (!item.legalApproval) return false;
  if (!item.legalApprovalHash) return false;
  return item.legalApprovalHash === computeAdvertContentHash(item);
}

export type RiskCheckResult = {
  hasRisk: boolean;
  matchedFields: string[];
  matchedTerms: string[];
  imageRisk: boolean;
};

/**
 * Runs the compliance risk check on an advert / flyer item.
 * Checks title, eyebrow, body, ctaLabel, and imageAlt.
 * Also checks if flyerImage or showModal is set: images cannot be auto-checked by regex,
 * so any image-based advert/modal requires legal approval.
 */
export function checkAdvertRisk(item: Partial<AdvertItem>): RiskCheckResult {
  const fieldsToCheck: Array<[string, string | undefined]> = [
    ['title', item.title],
    ['eyebrow', item.eyebrow],
    ['body', item.body],
    ['ctaLabel', item.ctaLabel],
    ['imageAlt', item.imageAlt],
  ];

  const matchedFields: string[] = [];
  const matchedTermsSet = new Set<string>();

  for (const [fieldName, val] of fieldsToCheck) {
    if (val && containsFinancialRisk(val)) {
      matchedFields.push(fieldName);
      const match = val.match(FINANCIAL_RISK_REGEX);
      if (match) {
        matchedTermsSet.add(match[0]);
      }
    }
  }

  // Any advert with flyerImage set or showModal: true requires legal approval
  // because image content cannot be auto-checked by text regex.
  const hasFlyerImage = Boolean(item.flyerImage && item.flyerImage.trim().length > 0);
  const isImageFlyer = hasFlyerImage || Boolean(item.showModal);

  if (isImageFlyer) {
    matchedFields.push(hasFlyerImage ? 'flyerImage' : 'showModal');
    matchedTermsSet.add("Image content can't be auto-checked.");
  }

  return {
    hasRisk: matchedFields.length > 0,
    matchedFields,
    matchedTerms: Array.from(matchedTermsSet),
    imageRisk: isImageFlyer,
  };
}

/**
 * Runs the compliance risk check on a news post.
 * Checks title, excerpt, and body.
 */
export function checkNewsPostRisk(post: Partial<NewsPost>): RiskCheckResult {
  const fieldsToCheck: Array<[string, string | undefined]> = [
    ['title', post.title],
    ['excerpt', post.excerpt],
    ['body', post.body],
  ];

  const matchedFields: string[] = [];
  const matchedTermsSet = new Set<string>();

  for (const [fieldName, val] of fieldsToCheck) {
    if (val && containsFinancialRisk(val)) {
      matchedFields.push(fieldName);
      const match = val.match(FINANCIAL_RISK_REGEX);
      if (match) {
        matchedTermsSet.add(match[0]);
      }
    }
  }

  return {
    hasRisk: matchedFields.length > 0,
    matchedFields,
    matchedTerms: Array.from(matchedTermsSet),
    imageRisk: false,
  };
}
