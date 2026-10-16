/**
 * @jest-environment node
 */
import {
  tryReserveApplicationSlot,
  normalizeDivisionSlug,
  buildJoinRedirectUrl,
  REGISTRATION_LINKS_COLLECTION,
} from './registration-links';

describe('registration-links service', () => {
  describe('tryReserveApplicationSlot atomic reservation', () => {
    it('executes atomic findOneAndUpdate with capacity and active status guards', async () => {
      const mockUpdatedDoc = {
        _id: '507f1f77bcf86cd799439011',
        slug: 'campus-drive',
        name: 'Campus Drive',
        isOpen: true,
        quota: 10,
        applicationCount: 5,
      };

      const findOneAndUpdateMock = jest.fn().mockResolvedValue(mockUpdatedDoc);
      const updateOneMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOneAndUpdate: findOneAndUpdateMock,
          updateOne: updateOneMock,
        }),
      } as any;

      const now = new Date('2026-10-16T12:00:00Z');
      const result = await tryReserveApplicationSlot(mockDb, 'campus-drive', now);

      expect(result).toBe(mockUpdatedDoc);
      expect(mockDb.collection).toHaveBeenCalledWith(REGISTRATION_LINKS_COLLECTION);

      const [filter, update, options] = findOneAndUpdateMock.mock.calls[0];
      expect(filter.slug).toBe('campus-drive');
      expect(filter.isOpen).toEqual({ $ne: false });
      expect(filter.status).toEqual({
        $nin: ['closed', 'auto-closed', 'auto_closed', 'archived', 'draft'],
      });
      expect(update).toEqual({
        $inc: { applicationCount: 1 },
        $set: { updatedAt: now },
      });
      expect(options).toEqual({ returnDocument: 'after' });
    });

    it('returns null when capacity or status filter does not match (slot full or closed)', async () => {
      const findOneAndUpdateMock = jest.fn().mockResolvedValue(null);

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOneAndUpdate: findOneAndUpdateMock,
        }),
      } as any;

      const result = await tryReserveApplicationSlot(mockDb, 'full-drive');
      expect(result).toBeNull();
    });
  });

  describe('normalizeDivisionSlug', () => {
    it('normalises various division inputs to canonical slugs', () => {
      expect(normalizeDivisionSlug('finance')).toBe('finance');
      expect(normalizeDivisionSlug('student_finance')).toBe('finance');
      expect(normalizeDivisionSlug('student-finance')).toBe('finance');
      expect(normalizeDivisionSlug('enterprise')).toBe('enterprise');
      expect(normalizeDivisionSlug('student_enterprise')).toBe('enterprise');
      expect(normalizeDivisionSlug('governance')).toBe('governance');
      expect(normalizeDivisionSlug('governance_records')).toBe('governance');
      expect(normalizeDivisionSlug('unknown-div')).toBeNull();
      expect(normalizeDivisionSlug(null)).toBeNull();
    });
  });

  describe('buildJoinRedirectUrl', () => {
    it('preserves valid chapter, division, and role query params', () => {
      const url = buildJoinRedirectUrl('/join/student-network', {
        role: 'member',
        chapter: 'fulokoja',
        division: 'finance',
        utm_source: 'twitter',
      });
      expect(url).toContain('chapter=fulokoja');
      expect(url).toContain('division=finance');
      expect(url).toContain('role=community-member');
      expect(url).toContain('utm_source=twitter');
    });

    it('strips staff from public redirect URLs', () => {
      const url = buildJoinRedirectUrl('/join/student-network', {
        role: 'staff',
        chapter: 'fulokoja',
      });
      expect(url).not.toContain('role=staff');
      expect(url).toContain('chapter=fulokoja');
    });
  });
});
