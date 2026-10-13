import { CORE_PILLARS, mapLegacyTagToPillar, mapLeadershipTags } from './pillars';

describe('Pillars and Leadership Mapping', () => {
  it('defines the 3 core pillars', () => {
    expect(CORE_PILLARS.map((p) => p.id)).toEqual(['agriculture', 'trade-distribution', 'real-estate']);
  });

  it('maps agriculture tags to Agriculture pillar', () => {
    const res = mapLegacyTagToPillar('Agriculture');
    expect(res.isPillar).toBe(true);
    expect(res.label).toBe('Agriculture');
    expect(res.pillarId).toBe('agriculture');
  });

  it('maps Food & Processing and Fashion & Creative to Trade & Goods Distribution', () => {
    const food = mapLegacyTagToPillar('Food & Processing');
    expect(food.isPillar).toBe(true);
    expect(food.label).toBe('Trade & Goods Distribution');
    expect(food.pillarId).toBe('trade-distribution');

    const fashion = mapLegacyTagToPillar('Fashion & Creative');
    expect(fashion.isPillar).toBe(true);
    expect(fashion.label).toBe('Trade & Goods Distribution');
  });

  it('maps Real Estate tags to Real Estate pillar', () => {
    const re = mapLegacyTagToPillar('Real Estate');
    expect(re.isPillar).toBe(true);
    expect(re.label).toBe('Real Estate');
    expect(re.pillarId).toBe('real-estate');
  });

  it('labels Tech & Innovation and Social Impact as cross-pillar functional leadership', () => {
    const tech = mapLegacyTagToPillar('Tech & Innovation');
    expect(tech.isPillar).toBe(false);
    expect(tech.label).toBe('Cross-Pillar: Tech & Systems');

    const social = mapLegacyTagToPillar('Social Impact');
    expect(social.isPillar).toBe(false);
    expect(social.label).toBe('Cross-Pillar: Brand & Impact');
  });

  it('deduplicates mapped tags across compound string lists', () => {
    const mapped = mapLeadershipTags('Food & Processing, Fashion & Creative, Agriculture');
    // Both Food & Processing and Fashion & Creative map to 'Trade & Goods Distribution'
    expect(mapped).toEqual([
      { label: 'Trade & Goods Distribution', isPillar: true },
      { label: 'Agriculture', isPillar: true },
    ]);
  });

  it('handles array input for founder tags correctly', () => {
    const raw = ['Fashion & Creative', 'Food & Processing', 'Tech & Innovation', 'Social Impact', 'Agriculture'];
    const mapped = mapLeadershipTags(raw);
    expect(mapped.map((m) => m.label)).toEqual([
      'Trade & Goods Distribution',
      'Cross-Pillar: Tech & Systems',
      'Cross-Pillar: Brand & Impact',
      'Agriculture',
    ]);
  });
});
