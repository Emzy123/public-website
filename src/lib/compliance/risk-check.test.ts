import {
  FINANCIAL_RISK_REGEX,
  containsFinancialRisk,
  checkAdvertRisk,
  checkNewsPostRisk,
  computeAdvertContentHash,
  isAdvertApprovalValid,
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
      ['15% returns', true],
      ['earn monthly', true],
      ['ROI', true],
      ['guaranteed', true],
      ['invest now', true],
      ['only 5 slots left', true],
      ['Learn more', false],
      ['heroic', false],
      ['Android app', false],
      ['return to dashboard', false],
      ['Join our campus meetup this Saturday', false],
      ['Applications for campus ambassador are open', false],
      ['Community spotlight: agriculture innovation', false],
      ['Building sustainable trade networks', false],
    ])('correctly evaluates "%s" -> %s', (input, expected) => {
      expect(containsFinancialRisk(input)).toBe(expected);
      expect(FINANCIAL_RISK_REGEX.test(input)).toBe(expected);
    });

    it('proves word boundaries prevent false positives', () => {
      expect(containsFinancialRisk('Learn more')).toBe(false);
      expect(containsFinancialRisk('heroic efforts by the team')).toBe(false);
      expect(containsFinancialRisk('Download our Android app')).toBe(false);
      expect(containsFinancialRisk('Click here to return to dashboard')).toBe(false);
    });

    it('proves financial promotion claims are strictly matched', () => {
      expect(containsFinancialRisk('15% returns')).toBe(true);
      expect(containsFinancialRisk('earn monthly')).toBe(true);
      expect(containsFinancialRisk('Target ROI is 25%')).toBe(true);
      expect(containsFinancialRisk('Returns are guaranteed')).toBe(true);
      expect(containsFinancialRisk('invest now')).toBe(true);
      expect(containsFinancialRisk('only 5 slots left')).toBe(true);
    });
  });

  describe('computeAdvertContentHash & isAdvertApprovalValid', () => {
    const advert = {
      title: 'Annual Harvest Partner Program',
      body: 'Support agricultural cold storage with structured participation.',
      ctaLabel: 'Learn more',
      ctaHref: '/contact',
      imageAlt: 'Farm harvest crates ready for distribution',
    };

    it('generates consistent hash for identical content', () => {
      const hash1 = computeAdvertContentHash(advert);
      const hash2 = computeAdvertContentHash({ ...advert });
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('changes hash when any bound field is modified', () => {
      const baseHash = computeAdvertContentHash(advert);

      expect(computeAdvertContentHash({ ...advert, title: 'Edited Title' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, body: 'Edited Body' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, ctaLabel: 'Apply' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, ctaHref: '/apply' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, imageAlt: 'Different alt' })).not.toBe(baseHash);
    });

    it('validates legal approval only when hash matches current content', () => {
      const hash = computeAdvertContentHash(advert);

      // Valid: approved with matching hash
      expect(isAdvertApprovalValid({
        ...advert,
        legalApproval: true,
        legalApprovalHash: hash,
      })).toBe(true);

      // Invalid: not approved
      expect(isAdvertApprovalValid({
        ...advert,
        legalApproval: false,
        legalApprovalHash: hash,
      })).toBe(false);

      // Invalid: missing hash
      expect(isAdvertApprovalValid({
        ...advert,
        legalApproval: true,
      })).toBe(false);

      // Invalid: edited after approval (hash mismatch)
      expect(isAdvertApprovalValid({
        ...advert,
        title: 'Tampered Title with 40% Return',
        legalApproval: true,
        legalApprovalHash: hash,
      })).toBe(false);
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

    it('detects risk in advert imageAlt', () => {
      const result = checkAdvertRisk({
        title: 'Safe Title',
        imageAlt: 'Graph displaying 25% annual ROI',
      });
      expect(result.hasRisk).toBe(true);
      expect(result.matchedFields).toContain('imageAlt');
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
