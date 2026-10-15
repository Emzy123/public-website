import {
  FINANCIAL_RISK_REGEX,
  containsFinancialRisk,
  checkAdvertRisk,
  checkNewsPostRisk,
} from './risk-check';

describe('Financial Risk Compliance Check', () => {
  describe('FINANCIAL_RISK_REGEX & containsFinancialRisk', () => {
    it.each([
      ['Earn 40% Return in 3 Months with SINet Private Capital Partnership, 30 slots only', true],
      ['40% ROI in 60 days', true],
      ['Guaranteed profit for partners', true],
      ['High yield opportunities', true],
      ['Earn passive income', true],
      ['15% per annum fixed return', true],
      ['Current interest rate directives', true],
      ['Only 5 slots left', true],
      ['30 slots only available', true],
      ['Invest in African agribusiness', true],
      ['Join our campus meetup this Saturday', false],
      ['Applications for campus ambassador are open', false],
      ['Community spotlight: agriculture innovation', false],
      ['Building sustainable trade networks', false],
    ])('correctly evaluates "%s" -> %s', (input, expected) => {
      expect(containsFinancialRisk(input)).toBe(expected);
      expect(FINANCIAL_RISK_REGEX.test(input)).toBe(expected);
    });
  });

  describe('checkAdvertRisk', () => {
    it('detects risk in advert title', () => {
      const result = checkAdvertRisk({
        title: 'Earn 40% Return',
        eyebrow: 'Announcement',
        body: 'Join us today',
      });
      expect(result.hasRisk).toBe(true);
      expect(result.matchedFields).toContain('title');
    });

    it('detects risk in advert body', () => {
      const result = checkAdvertRisk({
        title: 'Private Capital Partnership',
        eyebrow: 'Special event',
        body: '30 slots only with guaranteed yield',
      });
      expect(result.hasRisk).toBe(true);
      expect(result.matchedFields).toContain('body');
    });

    it('detects risk in advert CTA label', () => {
      const result = checkAdvertRisk({
        title: 'Private Capital Partnership',
        ctaLabel: 'Invest now',
      });
      expect(result.hasRisk).toBe(true);
      expect(result.matchedFields).toContain('ctaLabel');
    });

    it('passes clean advert without risk', () => {
      const result = checkAdvertRisk({
        title: 'Student Network Workshop',
        eyebrow: 'Campus Events',
        body: 'Join the orientation session this Friday at 4pm.',
        ctaLabel: 'Register now',
      });
      expect(result.hasRisk).toBe(false);
      expect(result.matchedFields).toHaveLength(0);
    });
  });

  describe('checkNewsPostRisk', () => {
    it('detects risk in news post excerpt or body', () => {
      const result = checkNewsPostRisk({
        title: 'Quarterly Update',
        excerpt: 'Our trade cycles yielded strong profit for participants.',
        body: 'Full breakdown inside.',
      });
      expect(result.hasRisk).toBe(true);
      expect(result.matchedFields).toContain('excerpt');
    });

    it('passes safe news post', () => {
      const result = checkNewsPostRisk({
        title: 'New Chapter Launched in Kano',
        excerpt: 'SINet students establish agricultural outreach.',
        body: 'Detailed report on community expansion.',
      });
      expect(result.hasRisk).toBe(false);
      expect(result.matchedFields).toHaveLength(0);
    });
  });
});
