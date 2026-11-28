import {
  cleanFullName,
  getMemberInitials,
  formatAcademicLevel,
  getMemberStatusLabel,
} from './display';

describe('Member Display Helpers', () => {
  describe('cleanFullName and getMemberInitials', () => {
    it('returns clean real names and rejects email addresses or handles', () => {
      expect(cleanFullName('Amina Ibrahim', 'amina@sinet.africa')).toBe('Amina Ibrahim');
      expect(cleanFullName('amina@sinet.africa', 'amina@sinet.africa')).toBeNull();
      expect(cleanFullName('amina', 'amina@sinet.africa')).toBeNull();
      expect(cleanFullName('   ', 'user@example.com')).toBeNull();
      expect(cleanFullName(null, 'user@example.com')).toBeNull();
    });

    it('computes correct initials and returns null (never "SI") when real name is absent', () => {
      expect(getMemberInitials('Amina Ibrahim')).toBe('AI');
      expect(getMemberInitials('Ada Lovelace')).toBe('AL');
      expect(getMemberInitials('Amina')).toBe('AM');
      expect(getMemberInitials(null)).toBeNull();
      expect(getMemberInitials('')).toBeNull();
      expect(getMemberInitials('   ')).toBeNull();
      expect(getMemberInitials('user@example.com', 'user@example.com')).toBeNull();
      expect(getMemberInitials('user', 'user@example.com')).toBeNull();
    });
  });

  describe('formatAcademicLevel & getMemberStatusLabel', () => {
    it('formats valid academic level numbers and never appends L to Active or non-numeric strings', () => {
      expect(formatAcademicLevel('100')).toBe('100L');
      expect(formatAcademicLevel('200')).toBe('200L');
      expect(formatAcademicLevel('300')).toBe('300L');
      expect(formatAcademicLevel('400')).toBe('400L');
      expect(formatAcademicLevel('500')).toBe('500L');
      expect(formatAcademicLevel('400L')).toBe('400L');

      expect(formatAcademicLevel('Active')).toBeNull();
      expect(formatAcademicLevel('active')).toBeNull();
      expect(formatAcademicLevel('Member')).toBeNull();
      expect(formatAcademicLevel(null)).toBeNull();
      expect(formatAcademicLevel('')).toBeNull();
    });

    it('returns typed member status labels', () => {
      expect(getMemberStatusLabel('active')).toBe('Active');
      expect(getMemberStatusLabel('ACTIVE')).toBe('Active');
      expect(getMemberStatusLabel('pending')).toBe('Pending');
      expect(getMemberStatusLabel('suspended')).toBe('Suspended');
      expect(getMemberStatusLabel('alumni')).toBe('Alumni');
      expect(getMemberStatusLabel(null)).toBe('Pending');
    });
  });
});
