/**
 * @jest-environment node
 */
import {
  isCampaignLinkOpen,
  isLinkOpen,
  getCampaignLinkDisplayStatus,
  getLinkDisplayStatus,
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

  describe('getCampaignLinkDisplayStatus calculation (Admin card status)', () => {
    it('returns "Open" for active link under quota and within deadline', () => {
      const status = getCampaignLinkDisplayStatus(
        {
          status: 'active',
          expiresAt: '2026-11-01T00:00:00Z',
          quota: 50,
          applicationCount: 10,
        },
        baseNow
      );
      expect(status).toBe('Open');
      expect(getLinkDisplayStatus({ status: 'open' }, baseNow)).toBe('Open');
    });

    it('returns "Full" when application count equals or exceeds maxApplications / quota', () => {
      const fullQuota = getCampaignLinkDisplayStatus(
        {
          isOpen: true,
          status: 'open',
          quota: 50,
          applicationCount: 50,
          expiresAt: '2026-11-01T00:00:00Z',
        },
        baseNow
      );
      expect(fullQuota).toBe('Full');

      const overQuota = getCampaignLinkDisplayStatus(
        {
          status: 'active',
          seatLimit: 50,
          applicationCount: 55,
        },
        baseNow
      );
      expect(overQuota).toBe('Full');
    });

    it('returns "Expired" when expiration date is in the past', () => {
      const expiredLink = getCampaignLinkDisplayStatus(
        {
          isOpen: true,
          status: 'open',
          expiresAt: '2026-10-01T00:00:00Z',
          quota: 100,
          applicationCount: 5,
        },
        baseNow
      );
      expect(expiredLink).toBe('Expired');
    });

    it('returns "Closed" when link is manually closed or inactive', () => {
      expect(
        getCampaignLinkDisplayStatus({ isOpen: false, status: 'closed' }, baseNow)
      ).toBe('Closed');
    });
  });
});
