export type CorePillarId = 'agriculture' | 'trade-distribution' | 'real-estate';

export interface CorePillar {
  id: CorePillarId;
  name: string;
  shortName: string;
  description: string;
}

export const CORE_PILLARS: CorePillar[] = [
  {
    id: 'agriculture',
    name: 'Agriculture',
    shortName: 'Agriculture',
    description: 'Crop cycles, agro-allied commerce, and farm-to-market systems.',
  },
  {
    id: 'trade-distribution',
    name: 'Trade & Goods Distribution',
    shortName: 'Trade & Distribution',
    description: 'Active goods trade, wholesale distribution, and commercial retail operations.',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    shortName: 'Real Estate',
    description: 'Student living communities, logistics hubs, and long-term land acquisition.',
  },
];

/**
 * Maps a single legacy tag/sector string to either one of the 3 official pillars
 * or a cross-pillar / functional leadership designation.
 */
export function mapLegacyTagToPillar(rawTag: string): {
  isPillar: boolean;
  label: string;
  pillarId?: CorePillarId;
} {
  const trimmed = rawTag.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('agri')) {
    return { isPillar: true, label: 'Agriculture', pillarId: 'agriculture' };
  }
  if (
    lower.includes('trade') ||
    lower.includes('distribut') ||
    lower.includes('food') ||
    lower.includes('processing') ||
    lower.includes('fashion') ||
    lower.includes('creative')
  ) {
    return { isPillar: true, label: 'Trade & Goods Distribution', pillarId: 'trade-distribution' };
  }
  if (lower.includes('estate') || lower.includes('property') || lower.includes('housing') || lower.includes('hostel')) {
    return { isPillar: true, label: 'Real Estate', pillarId: 'real-estate' };
  }

  // Tags that do not map to the 3 commercial pillars represent cross-pillar functional leadership:
  if (lower.includes('tech') || lower.includes('innovation') || lower.includes('software')) {
    return { isPillar: false, label: 'Cross-Pillar: Tech & Systems' };
  }
  if (lower.includes('social') || lower.includes('impact') || lower.includes('branding') || lower.includes('media')) {
    return { isPillar: false, label: 'Cross-Pillar: Brand & Impact' };
  }

  return { isPillar: false, label: trimmed };
}

/**
 * Takes a comma-separated string or array of tags and returns deduplicated mapped public tags.
 */
export function mapLeadershipTags(raw: string | string[]): Array<{ label: string; isPillar: boolean }> {
  const parts: string[] = Array.isArray(raw)
    ? raw
    : raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const seen = new Set<string>();
  const result: Array<{ label: string; isPillar: boolean }> = [];

  for (const part of parts) {
    const mapped = mapLegacyTagToPillar(part);
    if (!seen.has(mapped.label)) {
      seen.add(mapped.label);
      result.push({ label: mapped.label, isPillar: mapped.isPillar });
    }
  }

  return result;
}
