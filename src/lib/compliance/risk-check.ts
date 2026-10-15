import type { AdvertItem, NewsPost } from '@admin/types/content';

/**
 * Widen risk regex for investment / financial promotions:
 * Matches any percentage return, return/ROI claims, profit/yield,
 * guarantees, per annum, interest rates, urgency slots, and investment language.
 */
export const FINANCIAL_RISK_REGEX =
  /\d+\s*%|return|ROI|profit|guarantee|earn|yield|per annum|interest rate|slots? (only|left)|invest/i;

export function containsFinancialRisk(text: string | null | undefined): boolean {
  if (!text) return false;
  return FINANCIAL_RISK_REGEX.test(text);
}

export type RiskCheckResult = {
  hasRisk: boolean;
  matchedFields: string[];
  matchedTerms: string[];
};

/**
 * Runs the compliance risk check on an advert / flyer item.
 * Checks title, eyebrow, body, and ctaLabel.
 */
export function checkAdvertRisk(item: Partial<AdvertItem>): RiskCheckResult {
  const fieldsToCheck: Array<[string, string | undefined]> = [
    ['title', item.title],
    ['eyebrow', item.eyebrow],
    ['body', item.body],
    ['ctaLabel', item.ctaLabel],
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
  };
}
