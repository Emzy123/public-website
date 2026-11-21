import { BRAND_COLORS, getContrastRatio } from './tokens';

describe('Brand Token WCAG Accessibility & Contrast Compliance', () => {
  // WCAG AA minimum contrast ratio for normal body text is 4.5:1
  const WCAG_AA_BODY = 4.5;
  // WCAG AA minimum contrast ratio for non-text UI components / graphical elements is 3.0:1
  const WCAG_AA_GRAPHICAL_OR_LARGE = 3.0;

  it('asserts high contrast for text on brand canvas (text on bg)', () => {
    const ratio = getContrastRatio(BRAND_COLORS.text, BRAND_COLORS.bg);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts text on brand surface (text on navy)', () => {
    const ratio = getContrastRatio(BRAND_COLORS.text, BRAND_COLORS.surface);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts WCAG AA for primary blue on white background', () => {
    const ratio = getContrastRatio(BRAND_COLORS.primary, BRAND_COLORS.white);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts WCAG AA for white on primary blue (buttons)', () => {
    const ratio = getContrastRatio(BRAND_COLORS.white, BRAND_COLORS.primary);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts WCAG AA for accent-text-on-light on white', () => {
    const ratio = getContrastRatio(BRAND_COLORS.accentTextOnLight, BRAND_COLORS.white);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts WCAG AA for accent-text-on-light on brand sand text canvas (#F6F2E8)', () => {
    const ratio = getContrastRatio(BRAND_COLORS.accentTextOnLight, BRAND_COLORS.text);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts WCAG AA for gold-500 accent on brand navy', () => {
    const ratio = getContrastRatio(BRAND_COLORS.accent, BRAND_COLORS.navy);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts WCAG AA for gold-500 accent on brand ink', () => {
    const ratio = getContrastRatio(BRAND_COLORS.accent, BRAND_COLORS.ink);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('documents and verifies that gold-500 on white is NOT ALLOWED for body text', () => {
    const ratio = getContrastRatio(BRAND_COLORS.accent, BRAND_COLORS.white);
    // Must fail WCAG AA body requirement (< 4.5:1)
    expect(ratio).toBeLessThan(WCAG_AA_BODY);
  });

  it('asserts text-on-dark link token (linkOnDark/blue-300) achieves WCAG AA on ink and navy', () => {
    const ratioOnInk = getContrastRatio(BRAND_COLORS.linkOnDark, BRAND_COLORS.ink);
    const ratioOnNavy = getContrastRatio(BRAND_COLORS.linkOnDark, BRAND_COLORS.navy);
    expect(ratioOnInk).toBeGreaterThanOrEqual(WCAG_AA_BODY);
    expect(ratioOnNavy).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts text-muted achieves WCAG AA on ink and navy', () => {
    const ratioOnInk = getContrastRatio(BRAND_COLORS.textMuted, BRAND_COLORS.ink);
    const ratioOnNavy = getContrastRatio(BRAND_COLORS.textMuted, BRAND_COLORS.navy);
    expect(ratioOnInk).toBeGreaterThanOrEqual(WCAG_AA_BODY);
    expect(ratioOnNavy).toBeGreaterThanOrEqual(WCAG_AA_BODY);
  });

  it('asserts focus-ring achieves >= 3:1 against ink background', () => {
    const ratio = getContrastRatio(BRAND_COLORS.focusRing, BRAND_COLORS.ink);
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_GRAPHICAL_OR_LARGE);
  });

  it('asserts header and footer nav text achieves WCAG AA on ink background', () => {
    // Normal nav text #F6F2E8 on ink #0A0A0F
    const normalNavRatio = getContrastRatio(BRAND_COLORS.text, BRAND_COLORS.ink);
    expect(normalNavRatio).toBeGreaterThanOrEqual(WCAG_AA_BODY); // Expect ~17.9:1

    // Hover/active nav text gold-500 #E0A92E on ink #0A0A0F
    const activeNavRatio = getContrastRatio(BRAND_COLORS.accent, BRAND_COLORS.ink);
    expect(activeNavRatio).toBeGreaterThanOrEqual(WCAG_AA_BODY); // Expect ~9.2:1
  });
});
