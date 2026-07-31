import { isUnread, matchesSearch } from '@admin/lib/submissions';

describe('submissions helpers', () => {
  describe('isUnread', () => {
    it('returns true when readAt is missing', () => {
      expect(isUnread({})).toBe(true);
    });

    it('returns false when readAt is set', () => {
      expect(isUnread({ readAt: '2026-01-01T00:00:00.000Z' })).toBe(false);
    });
  });

  describe('matchesSearch', () => {
    const contact = {
      _id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Investment inquiry',
      message: 'Tell me more about returns',
    };

    it('matches contact fields case-insensitively', () => {
      expect(matchesSearch('contact', contact, 'investment')).toBe(true);
      expect(matchesSearch('contact', contact, 'JANE@')).toBe(true);
      expect(matchesSearch('contact', contact, 'returns')).toBe(true);
    });

    it('returns true for empty query', () => {
      expect(matchesSearch('contact', contact, '')).toBe(true);
      expect(matchesSearch('contact', contact, '   ')).toBe(true);
    });

    it('matches academy fields', () => {
      const academy = { _id: '2', fullName: 'John Smith', email: 'john@test.com' };
      expect(matchesSearch('academy', academy, 'smith')).toBe(true);
      expect(matchesSearch('academy', academy, 'nomatch')).toBe(false);
    });
  });
});
