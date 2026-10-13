import { CORE_PILLARS, PILLAR_MAPPING, mapLegacyTagToPillar, mapLeadershipTags } from './pillars';

describe('Pillars and Leadership Mapping (Unified Config)', () => {
  it('defines the 3 core pillars via PILLAR_MAPPING', () => {
    expect(CORE_PILLARS.map((p) => p.id)).toEqual(['agriculture', 'trade-distribution', 'real-estate']);
    expect(PILLAR_MAPPING.pillars.agriculture.name).toBe('Agriculture');
    expect(PILLAR_MAPPING.pillars['trade-distribution'].name).toBe('Trade & Goods Distribution');
    expect(PILLAR_MAPPING.pillars['real-estate'].name).toBe('Real Estate');
  });

  it('maps Agriculture and Food & Processing to Agriculture pillar', () => {
    const agri = mapLegacyTagToPillar('Agriculture');
    expect(agri.isPillar).toBe(true);
    expect(agri.label).toBe('Agriculture');
    expect(agri.pillarId).toBe('agriculture');

    const food = mapLegacyTagToPillar('Food & Processing');
    expect(food.isPillar).toBe(true);
    expect(food.label).toBe('Agriculture');
    expect(food.pillarId).toBe('agriculture');
  });

  it('maps Fashion & Creative and Trade & Distribution to Trade & Goods Distribution pillar', () => {
    const fashion = mapLegacyTagToPillar('Fashion & Creative');
    expect(fashion.isPillar).toBe(true);
    expect(fashion.label).toBe('Trade & Goods Distribution');
    expect(fashion.pillarId).toBe('trade-distribution');

    const trade = mapLegacyTagToPillar('Trade & Distribution');
    expect(trade.isPillar).toBe(true);
    expect(trade.label).toBe('Trade & Goods Distribution');
    expect(trade.pillarId).toBe('trade-distribution');
  });

  it('maps Real Estate tags to Real Estate pillar', () => {
    const re = mapLegacyTagToPillar('Real Estate');
    expect(re.isPillar).toBe(true);
    expect(re.label).toBe('Real Estate');
    expect(re.pillarId).toBe('real-estate');
  });

  it('keeps Tech & Innovation and Social Impact cross-pillar', () => {
    const tech = mapLegacyTagToPillar('Tech & Innovation');
    expect(tech.isPillar).toBe(false);
    expect(tech.label).toBe('Cross-Pillar: Tech & Innovation');

    const social = mapLegacyTagToPillar('Social Impact');
    expect(social.isPillar).toBe(false);
    expect(social.label).toBe('Cross-Pillar: Social Impact');
  });

  it('deduplicates mapped tags across compound string lists', () => {
    const mapped = mapLeadershipTags('Food & Processing, Agriculture, Fashion & Creative');
    // Food & Processing and Agriculture both map to Agriculture
    expect(mapped).toEqual([
      { label: 'Agriculture', isPillar: true },
      { label: 'Trade & Goods Distribution', isPillar: true },
    ]);
  });

  it('handles array input for founder tags correctly', () => {
    const raw = ['Fashion & Creative', 'Food & Processing', 'Tech & Innovation', 'Social Impact', 'Agriculture'];
    const mapped = mapLeadershipTags(raw);
    expect(mapped.map((m) => m.label)).toEqual([
      'Trade & Goods Distribution',
      'Agriculture',
      'Cross-Pillar: Tech & Innovation',
      'Cross-Pillar: Social Impact',
    ]);
  });
});
