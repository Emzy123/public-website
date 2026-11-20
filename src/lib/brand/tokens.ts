/**
 * SINet Brand Design Tokens
 * Source of truth: docs/agent/BRAND.md
 */

export const BRAND_COLORS = {
  // Primitives
  ink: '#0A0A0F',
  black: '#000000',
  navy: '#1B234C',
  blue700: '#022892',
  blue600: '#143DB1', // Primary
  blue500: '#2153D2',
  blue300: '#8BB4F8',
  gold700: '#946318', // Updated from #A06E1B for WCAG AA compliance on #FFFFFF and #F6F2E8
  gold500: '#E0A92E', // Accent
  gold300: '#EDB944',
  cream: '#DBD1A5',
  white: '#FFFFFF',

  // Semantic Aliases
  bg: '#0A0A0F',
  surface: '#1B234C',
  surfaceRaised: '#222B59',
  text: '#F6F2E8',
  textMuted: '#94A3B8',
  primary: '#143DB1',
  primaryHover: '#022892',
  accent: '#E0A92E',
  accentTextOnLight: '#946318',
  linkOnDark: '#8BB4F8',
  border: 'rgba(255, 255, 255, 0.12)',
  focusRing: '#2153D2',
} as const;

export function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(parseHex(hex1));
  const l2 = relativeLuminance(parseHex(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
