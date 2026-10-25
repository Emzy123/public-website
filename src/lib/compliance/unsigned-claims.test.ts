import { containsUnsignedClaim, gateUnsignedCmsContent } from './unsigned-claims';

describe('unsigned claim legal gate', () => {
  it('detects naira figures and construction claims', () => {
    expect(containsUnsignedClaim('₦11.8M cash flow')).toBe(true);
    expect(containsUnsignedClaim('2 manufacturing plants under construction')).toBe(true);
    expect(containsUnsignedClaim('5,000-bed student hostel estate planned')).toBe(true);
    expect(containsUnsignedClaim('280+ students across 16 universities')).toBe(true);
    expect(containsUnsignedClaim('A business ecosystem built on community')).toBe(false);
  });

  it('keeps copy when legal approval is on', () => {
    const input = { spark: 'Generated over ₦11.8 million in cash flow.' };
    expect(gateUnsignedCmsContent(input, true)).toEqual(input);
  });

  it('hides unsigned stats and paragraphs when the flag is off', () => {
    const gated = gateUnsignedCmsContent(
      {
        sparkParagraphs: [
          'SINet organises student enterprise around real goods distribution.',
          'Within three months, SINet had engaged 280+ students and generated over ₦11.8 million in cash flow.',
        ],
        founderStats: [
          { value: '280+', label: 'Students Engaged' },
          { value: 'Active', label: 'Campus chapters' },
        ],
        timeline: [
          { title: 'Manufacturing Begins', desc: '2 manufacturing plants under development. The 5,000-bed hostel estate planned.' },
          { title: 'Public Launch', desc: 'sinet.africa launches publicly.' },
        ],
      },
      false
    );

    expect(gated.sparkParagraphs).toEqual([
      'SINet organises student enterprise around real goods distribution.',
    ]);
    expect(gated.founderStats).toEqual([{ value: 'Active', label: 'Campus chapters' }]);
    expect(gated.timeline).toEqual([{ title: 'Public Launch', desc: 'sinet.africa launches publicly.' }]);
  });

  it('hides split naira stats that store the sign in prefix', () => {
    const gated = gateUnsignedCmsContent(
      {
        stats: [{ value: '2M', label: 'Capital Deployed', prefix: '₦', suffix: '+' }],
      },
      false
    );
    expect(gated.stats).toEqual([]);
  });
});
