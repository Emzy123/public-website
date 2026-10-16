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
      imageUrl: '/images/adverts/harvest.jpg',
      flyerImage: '/images/flyers/harvest-poster.png',
      imageAlt: 'Farm harvest crates ready for distribution',
    };

    it('generates consistent hash for identical content', () => {
      const hash1 = computeAdvertContentHash(advert);
      const hash2 = computeAdvertContentHash({ ...advert });
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('proves hash stability across whitespace, newlines, and key ordering', () => {
      const hash1 = computeAdvertContentHash(advert);

      // Variation with leading/trailing whitespace, CRLF line endings, and different object key ordering
      const stableVariation = {
        imageAlt: '  Farm harvest crates ready for distribution  ',
        title: '  Annual Harvest Partner Program  ',
        body: 'Support agricultural cold storage with structured participation.\r\n',
        ctaHref: '  /contact  ',
        ctaLabel: '  Learn more  ',
        flyerImage: '  /images/flyers/harvest-poster.png  ',
        imageUrl: '  /images/adverts/harvest.jpg  ',
      };

      const hash2 = computeAdvertContentHash(stableVariation);
      expect(hash2).toBe(hash1);
    });

    it('changes hash when any bound field is modified, including images', () => {
      const baseHash = computeAdvertContentHash(advert);

      expect(computeAdvertContentHash({ ...advert, title: 'Edited Title' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, body: 'Edited Body' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, ctaLabel: 'Apply' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, ctaHref: '/apply' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, imageAlt: 'Different alt' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, imageUrl: '/images/different-image.jpg' })).not.toBe(baseHash);
      expect(computeAdvertContentHash({ ...advert, flyerImage: '/images/different-flyer.png' })).not.toBe(baseHash);
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

      // Invalid: flyer image changed after approval
      expect(isAdvertApprovalValid({
        ...advert,
        flyerImage: '/images/swapped-flyer.png',
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

    it('flags flyerImage as compliance risk requiring legal approval because image text cannot be auto-checked', () => {
      const result = checkAdvertRisk({
        title: 'Campus Gathering',
        flyerImage: '/posters/october-meetup.png',
      });
      expect(result.hasRisk).toBe(true);
      expect(result.imageRisk).toBe(true);
      expect(result.matchedFields).toContain('flyerImage');
      expect(result.matchedTerms).toContain("Image content can't be auto-checked.");
    });

    it('flags showModal: true as compliance risk requiring legal approval because modal flyers cannot be auto-checked', () => {
      const result = checkAdvertRisk({
        title: 'Special Event',
        showModal: true,
      });
      expect(result.hasRisk).toBe(true);
      expect(result.imageRisk).toBe(true);
      expect(result.matchedFields).toContain('showModal');
      expect(result.matchedTerms).toContain("Image content can't be auto-checked.");
    });

    it('passes clean text-only advert without risk', () => {
      const result = checkAdvertRisk({
        title: 'Student Network Workshop',
        eyebrow: 'Campus Events',
        body: 'Join the orientation session this Friday at 4pm.',
        ctaLabel: 'Register now',
      });
      expect(result.hasRisk).toBe(false);
      expect(result.imageRisk).toBe(false);
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

  describe('Legacy-shaped advert records (imageUrl only, no flyerImage)', () => {
    /**
     * Inventory of image fields that existing Mongo advert records may carry:
     *
     *   imageUrl   — the primary banner/card thumbnail; present on all records
     *                since the first CMS schema (normalizeAdvertsContent line ~754, 833, 898).
     *   flyerImage — added in Phase 0.2 (AdvertItem type + computeAdvertContentHash).
     *                May be absent on pre-Phase-0.2 records ("legacy shape").
     *   imageAlt   — optional accessibility label; also normalized and hashed.
     *
     * No field named `modalImage` or `image` (bare) was ever used in the schema.
     * Both imageUrl and flyerImage are included in computeAdvertContentHash().
     * flyerImage (or showModal: true) triggers imageRisk in checkAdvertRisk().
     */

    it('legacy record with imageUrl only: hash is stable and no imageRisk is raised', () => {
      const legacyAdvert = {
        id: 'advert-legacy-001',
        title: 'Harvest Season Commodity Offer',
        eyebrow: 'Agricultural Trade',
        body: 'Direct purchase of verified crop batches from Kogi State.',
        imageUrl: '/images/adverts/harvest-banner.jpg',
        // flyerImage intentionally absent — older Mongo record shape
        ctaLabel: 'View Offer',
        ctaHref: '/sectors#agriculture',
        enabled: true,
        showModal: false,
        startsAt: '',
        endsAt: '',
        sortOrder: 0,
      };

      // Hash should be deterministic and stable for legacy-shaped records
      const hash1 = computeAdvertContentHash(legacyAdvert);
      const hash2 = computeAdvertContentHash({ ...legacyAdvert });
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex

      // Changing imageUrl must change the hash
      expect(computeAdvertContentHash({ ...legacyAdvert, imageUrl: '/images/adverts/different.jpg' })).not.toBe(hash1);

      // No flyerImage + showModal: false → no imageRisk
      const risk = checkAdvertRisk(legacyAdvert);
      expect(risk.imageRisk).toBe(false);
      expect(risk.hasRisk).toBe(false);
    });

    it('legacy record gains imageRisk once flyerImage is set (e.g. after CMS edit)', () => {
      const legacyAdvert = {
        title: 'Trade Update',
        body: 'Seasonal overview of commodity trades.',
        imageUrl: '/images/adverts/trade-update.jpg',
      };

      const upgraded = { ...legacyAdvert, flyerImage: '/images/flyers/trade-flyer.png' };

      expect(checkAdvertRisk(legacyAdvert).imageRisk).toBe(false);
      expect(checkAdvertRisk(upgraded).imageRisk).toBe(true);
      expect(checkAdvertRisk(upgraded).matchedFields).toContain('flyerImage');

      // Hash changes when flyerImage is added
      expect(computeAdvertContentHash(upgraded)).not.toBe(computeAdvertContentHash(legacyAdvert));
    });

    it('legacy record with showModal: true triggers imageRisk even without flyerImage', () => {
      const modalAdvert = {
        title: 'Campus Opportunity Brief',
        body: 'Monthly update from the chapter executives.',
        imageUrl: '/images/adverts/campus-brief.jpg',
        showModal: true,
      };

      const risk = checkAdvertRisk(modalAdvert);
      expect(risk.imageRisk).toBe(true);
      expect(risk.matchedFields).toContain('showModal');
      expect(risk.matchedTerms).toContain("Image content can't be auto-checked.");
    });
  });
});

