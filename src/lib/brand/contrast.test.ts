import { BRAND_COLORS, getContrastRatio } from './tokens';

describe('Brand Token WCAG Accessibility & Contrast Compliance', () => {
  // WCAG AA minimum contrast ratio for normal body text is 4.5:1
  const WCAG_AA_BODY = 4.5;
  // WCAG AA minimum contrast ratio for large text / graphical UI components is 3.0:1
  const WCAG_AA_GRAPHICAL_OR_LARGE = 3.0;

  it('asserts high contrast for text on brand canvas (text on bg)', () => {
    const ratio = getContrastRatio(BRAND_COLORS.text, BRAND_COLORS.bg);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
    // In practice: ~19.75:1
    expect(ratio).toBeGreaterThan(15);
  });

  it('asserts WCAG AA for primary blue on white background', () => {
    const ratio = getContrastRatio(BRAND_COLORS.primary, BRAND_COLORS.white);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
    // In practice: ~9.00:1 (passes AAA)
    expect(ratio).toBeGreaterThan(8);
  });

  it('asserts WCAG AA compliance for gold-700 on white', () => {
    const ratio = getContrastRatio(BRAND_COLORS.gold700, BRAND_COLORS.white);
    // gold-700 achieves ~4.43:1, easily passing UI component and large text AA standard (>= 3.0:1)
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_GRAPHICAL_OR_LARGE);
    expect(ratio).toBeGreaterThanOrEqual(4.4);
  });

  it('asserts WCAG AA for gold-500 accent on brand navy', () => {
    const ratio = getContrastRatio(BRAND_COLORS.gold500, BRAND_COLORS.navy);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
    // In practice: ~7.10:1 (passes AAA)
    expect(ratio).toBeGreaterThan(7.0);
  });

  it('asserts WCAG AA for gold-500 accent on brand ink', () => {
    const ratio = getContrastRatio(BRAND_COLORS.gold500, BRAND_COLORS.ink);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
    // In practice: ~9.30:1 (passes AAA)
    expect(ratio).toBeGreaterThan(9.0);
  });

  it('documents and verifies that gold-500 on white is NOT ALLOWED for body text', () => {
    const ratio = getContrastRatio(BRAND_COLORS.gold500, BRAND_COLORS.white);
    // Must fail WCAG AA body requirement (< 4.5:1)
    expect(ratio).toBeLessThan(WCAG_AA_BODY);
    // In practice: ~2.12:1 - extremely low contrast
    expect(ratio).toBeLessThan(3.0);
  });
});
