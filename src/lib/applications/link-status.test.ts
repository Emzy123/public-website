/**
 * @jest-environment node
 */
import {
  isCampaignLinkOpen,
  isLinkOpen,
  getCampaignLinkDisplayStatus,
  getLinkDisplayStatus,
  normalizeStatus,
  parseExpiryDate,
  getEffectiveCapacityLimit,
} from './link-status';

describe('Shared Link & Campaign Status Engine (Single Source of Truth)', () => {
  const baseNow = new Date('2026-10-16T12:00:00Z');

  describe('isCampaignLinkOpen calculation', () => {
    it('returns true when status is active, not expired, and under quota', () => {
      const openCampaign = {
        status: 'active',
        expiresAt: new Date('2026-11-01T00:00:00Z'),
        maxApplications: 100,
        applicationCount: 45,
      };
      expect(isCampaignLinkOpen(openCampaign, baseNow)).toBe(true);
      expect(isLinkOpen(openCampaign, baseNow)).toBe(true);
    });

    it('returns false when status is not active (e.g. closed, draft, archived)', () => {
      expect(isCampaignLinkOpen({ status: 'closed' }, baseNow)).toBe(false);
      expect(isCampaignLinkOpen({ status: 'draft' }, baseNow)).toBe(false);
      expect(isCampaignLinkOpen({ status: 'archived' }, baseNow)).toBe(false);
      expect(isCampaignLinkOpen({ isOpen: false }, baseNow)).toBe(false);
    });

    it('returns false when deadline is in the past even if status is active or isOpen', () => {
      const expiredLink = {
        status: 'active',
        isOpen: true,
        expiresAt: new Date('2026-10-15T23:59:59Z'), // yesterday
        maxApplications: 100,
        applicationCount: 10,
      };
      expect(isCampaignLinkOpen(expiredLink, baseNow)).toBe(false);
    });

    it('returns false when capacity limit is reached even if status is active or isOpen', () => {
      const fullLink = {
        status: 'active',
        isOpen: true,
        expiresAt: new Date('2026-11-01T00:00:00Z'),
        maxApplications: 100,
        applicationCount: 100,
      };
      expect(isCampaignLinkOpen(fullLink, baseNow)).toBe(false);
    });

    it('supports evergreen campaigns without expiration or quota', () => {
      const evergreen = {
        status: 'active',
        expiresAt: null,
        maxApplications: null,
        applicationCount: 1500,
      };
      expect(isCampaignLinkOpen(evergreen, baseNow)).toBe(true);
    });

    it('handles legacy MongoDB registration link fields (quota, isOpen)', () => {
      const mongoLink = {
        isOpen: true,
        quota: 50,
        applicationCount: 20,
        expiresAt: '2026-12-01T00:00:00Z',
      };
      expect(isCampaignLinkOpen(mongoLink, baseNow)).toBe(true);
    });

    it('handles PostgreSQL campaign fields (seatLimit, endsAt)', () => {
      const pgCampaign = {
        status: 'active',
        endsAt: new Date('2026-12-01T00:00:00Z'),
        seatLimit: 200,
        applicationCount: 199,
      };
      expect(isCampaignLinkOpen(pgCampaign, baseNow)).toBe(true);

      const pgFull = { ...pgCampaign, applicationCount: 200 };
      expect(isCampaignLinkOpen(pgFull, baseNow)).toBe(false);
    });
  });

  describe('normalizeStatus (handling auto-closed and auto_closed spellings)', () => {
    it('normalises both "auto-closed" and "auto_closed" to "auto_closed"', () => {
      expect(normalizeStatus('auto-closed')).toBe('auto_closed');
      expect(normalizeStatus('auto_closed')).toBe('auto_closed');
      expect(normalizeStatus('Auto-Closed')).toBe('auto_closed');
      expect(normalizeStatus('AUTO_CLOSED')).toBe('auto_closed');
    });

    it('normalises open, closed, active, and pending consistently', () => {
      expect(normalizeStatus('Open')).toBe('open');
      expect(normalizeStatus('closed')).toBe('closed');
      expect(normalizeStatus('under review')).toBe('under_review');
      expect(normalizeStatus('under-review')).toBe('under_review');
      expect(normalizeStatus('')).toBe('');
      expect(normalizeStatus(null)).toBe('');
    });
  });

  describe('Capacity limit precedence (maxApplications > quota > seatLimit)', () => {
    it('prefers maxApplications when all three are present', () => {
      const limit = getEffectiveCapacityLimit({
        maxApplications: 15,
        quota: 25,
        seatLimit: 50,
      });
      expect(limit).toBe(15);
    });

    it('prefers quota when maxApplications is null/undefined and seatLimit is present', () => {
      const limit = getEffectiveCapacityLimit({
        maxApplications: null,
        quota: 25,
        seatLimit: 50,
      });
      expect(limit).toBe(25);
    });

    it('falls back to seatLimit when maxApplications and quota are null/undefined', () => {
      const limit = getEffectiveCapacityLimit({
        maxApplications: null,
        quota: undefined,
        seatLimit: 50,
      });
      expect(limit).toBe(50);
    });

    it('returns null when no limit is defined', () => {
      expect(getEffectiveCapacityLimit({})).toBeNull();
      expect(getEffectiveCapacityLimit({ maxApplications: null, quota: null, seatLimit: null })).toBeNull();
    });
  });

  describe('Expiry timezone handling (Africa/Lagos UTC+1 end-of-day for date-only)', () => {
    it('parses date-only string "2026-10-20" as 23:59:59.999 in Africa/Lagos (22:59:59.999Z)', () => {
      const parsed = parseExpiryDate('2026-10-20');
      expect(parsed).not.toBeNull();
      // In UTC, 23:59:59.999+01:00 is 22:59:59.999Z
      expect(parsed?.toISOString()).toBe('2026-10-20T22:59:59.999Z');
    });

    it('keeps campaign open on 2026-10-20 at 22:59:59Z (Lagos 23:59:59)', () => {
      const campaign = {
        status: 'active',
        expiresAt: '2026-10-20',
        quota: 100,
        applicationCount: 5,
      };
      const justBeforeMidnightLagos = new Date('2026-10-20T22:59:59.000Z');
      expect(isCampaignLinkOpen(campaign, justBeforeMidnightLagos)).toBe(true);
      expect(getCampaignLinkDisplayStatus(campaign, justBeforeMidnightLagos)).toBe('Open');
    });

    it('marks campaign expired on 2026-10-20 at 23:00:00Z (Lagos 00:00:00 next day)', () => {
      const campaign = {
        status: 'active',
        expiresAt: '2026-10-20',
        quota: 100,
        applicationCount: 5,
      };
      const atMidnightLagos = new Date('2026-10-20T23:00:00.000Z');
      expect(isCampaignLinkOpen(campaign, atMidnightLagos)).toBe(false);
      expect(getCampaignLinkDisplayStatus(campaign, atMidnightLagos)).toBe('Expired');
    });
  });

  describe('Display Status Precedence: Closed > Full > Expired > Open', () => {
    it('returns Closed when manually closed even if full AND expired', () => {
      const link = {
        isOpen: false,
        status: 'closed',
        expiresAt: '2026-10-01T00:00:00Z', // past
        quota: 50,
        applicationCount: 50, // full
      };
      expect(getCampaignLinkDisplayStatus(link, baseNow)).toBe('Closed');
    });

    it('returns Closed when status is auto-closed even if full or expired', () => {
      const link = {
        status: 'auto-closed',
        expiresAt: '2026-10-01T00:00:00Z',
        quota: 50,
        applicationCount: 50,
      };
      expect(getCampaignLinkDisplayStatus(link, baseNow)).toBe('Closed');
    });

    it('returns Full when active and both capacity is reached AND deadline has passed (Full > Expired)', () => {
      const link = {
        status: 'active',
        isOpen: true,
        expiresAt: '2026-10-01T00:00:00Z', // expired
        quota: 50,
        applicationCount: 50, // full
      };
      expect(getCampaignLinkDisplayStatus(link, baseNow)).toBe('Full');
    });

    it('returns Expired when active, deadline has passed, but capacity remains (Expired > Open)', () => {
      const link = {
        status: 'active',
        isOpen: true,
        expiresAt: '2026-10-01T00:00:00Z', // expired
        quota: 50,
        applicationCount: 20, // not full
      };
      expect(getCampaignLinkDisplayStatus(link, baseNow)).toBe('Expired');
    });

    it('returns Full when active, within deadline, but capacity reached', () => {
      const link = {
        status: 'active',
        isOpen: true,
        expiresAt: '2026-11-01T00:00:00Z', // future
        quota: 50,
        applicationCount: 50, // full
      };
      expect(getCampaignLinkDisplayStatus(link, baseNow)).toBe('Full');
    });

    it('returns Open when active, within deadline, and capacity remains', () => {
      const link = {
        status: 'active',
        isOpen: true,
        expiresAt: '2026-11-01T00:00:00Z',
        quota: 50,
        applicationCount: 20,
      };
      expect(getCampaignLinkDisplayStatus(link, baseNow)).toBe('Open');
    });
  });
});
