export type CorePillarId = 'agriculture' | 'trade-distribution' | 'real-estate';

export interface CorePillar {
  id: CorePillarId;
  name: string;
  shortName: string;
  description: string;
}

/**
 * Single config object defining the official pillars, their subsectors/keywords,
 * and cross-pillar functional leadership mappings.
 */
export const PILLAR_MAPPING = {
  pillars: {
    agriculture: {
      id: 'agriculture' as const,
      name: 'Agriculture',
      shortName: 'Agriculture',
      description: 'Crop cycles, agro-allied commerce, food processing, and farm-to-market systems.',
      subsectors: ['Agriculture', 'Food & Processing'],
      keywords: ['agri', 'farm', 'food', 'processing', 'crop', 'agro'],
    },
    'trade-distribution': {
      id: 'trade-distribution' as const,
      name: 'Trade & Goods Distribution',
      shortName: 'Trade & Distribution',
      description: 'Active goods trade, fashion, creative enterprise, wholesale distribution, and retail operations.',
      subsectors: ['Trade & Goods Distribution', 'Fashion & Creative'],
      keywords: ['trade', 'distribut', 'fashion', 'creative', 'retail', 'wholesale', 'merchandis'],
    },
    'real-estate': {
      id: 'real-estate' as const,
      name: 'Real Estate',
      shortName: 'Real Estate',
      description: 'Student living communities, logistics hubs, property marketing, and long-term land acquisition.',
      subsectors: ['Real Estate'],
      keywords: ['estate', 'property', 'housing', 'hostel', 'land'],
    },
  },
  crossPillar: {
    tech: {
      label: 'Cross-Pillar: Tech & Innovation',
      keywords: ['tech', 'innovation', 'software', 'systems'],
    },
    socialImpact: {
      label: 'Cross-Pillar: Social Impact',
      keywords: ['social', 'impact', 'branding', 'media', 'community'],
    },
  },
} as const;

export const CORE_PILLARS: CorePillar[] = [
  {
    id: PILLAR_MAPPING.pillars.agriculture.id,
    name: PILLAR_MAPPING.pillars.agriculture.name,
    shortName: PILLAR_MAPPING.pillars.agriculture.shortName,
    description: PILLAR_MAPPING.pillars.agriculture.description,
  },
  {
    id: PILLAR_MAPPING.pillars['trade-distribution'].id,
    name: PILLAR_MAPPING.pillars['trade-distribution'].name,
    shortName: PILLAR_MAPPING.pillars['trade-distribution'].shortName,
    description: PILLAR_MAPPING.pillars['trade-distribution'].description,
  },
  {
    id: PILLAR_MAPPING.pillars['real-estate'].id,
    name: PILLAR_MAPPING.pillars['real-estate'].name,
    shortName: PILLAR_MAPPING.pillars['real-estate'].shortName,
    description: PILLAR_MAPPING.pillars['real-estate'].description,
  },
];

/**
 * Maps a single legacy tag/sector string to either one of the 3 official pillars
 * or a cross-pillar / functional leadership designation according to PILLAR_MAPPING.
 */
export function mapLegacyTagToPillar(rawTag: string): {
  isPillar: boolean;
  label: string;
  pillarId?: CorePillarId;
} {
  const trimmed = rawTag.trim();
  const lower = trimmed.toLowerCase();

  // 1. Agriculture: Agriculture + Food & Processing
  if (
    PILLAR_MAPPING.pillars.agriculture.keywords.some((kw) => lower.includes(kw))
  ) {
    return {
      isPillar: true,
      label: PILLAR_MAPPING.pillars.agriculture.name,
      pillarId: 'agriculture',
    };
  }

  // 2. Trade & Goods Distribution: Fashion & Creative (+ Trade/Distribution)
  if (
    PILLAR_MAPPING.pillars['trade-distribution'].keywords.some((kw) => lower.includes(kw))
  ) {
    return {
      isPillar: true,
      label: PILLAR_MAPPING.pillars['trade-distribution'].name,
      pillarId: 'trade-distribution',
    };
  }

  // 3. Real Estate: Real Estate
  if (
    PILLAR_MAPPING.pillars['real-estate'].keywords.some((kw) => lower.includes(kw))
  ) {
    return {
      isPillar: true,
      label: PILLAR_MAPPING.pillars['real-estate'].name,
      pillarId: 'real-estate',
    };
  }

  // 4. Cross-Pillar: Tech & Innovation
  if (
    PILLAR_MAPPING.crossPillar.tech.keywords.some((kw) => lower.includes(kw))
  ) {
    return { isPillar: false, label: PILLAR_MAPPING.crossPillar.tech.label };
  }

  // 5. Cross-Pillar: Social Impact
  if (
    PILLAR_MAPPING.crossPillar.socialImpact.keywords.some((kw) => lower.includes(kw))
  ) {
    return { isPillar: false, label: PILLAR_MAPPING.crossPillar.socialImpact.label };
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
