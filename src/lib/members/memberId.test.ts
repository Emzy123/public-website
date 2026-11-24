import {
  normalizeMemberId,
  formatMemberId,
  cleanFullName,
  getMemberInitials,
  formatAcademicLevel,
  getMemberStatusLabel,
  getMemberTierSummary,
} from './memberId';

describe('Member ID Helpers (Step 1)', () => {
  describe('normalizeMemberId', () => {
    it('normalizes canonical member IDs', () => {
      expect(normalizeMemberId('SIN-FULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(normalizeMemberId('SIN-UEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SIN-MBR-123456')).toBe('SIN-MBR-123456');
    });

    it('normalizes doubled-prefix legacy IDs', () => {
      expect(normalizeMemberId('SIN-SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SIN-SIN-UEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SINSINUEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SIN-SINFULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(normalizeMemberId('SIN-SIN-FULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
    });

    it('normalizes unhyphenated SIN prefix', () => {
      expect(normalizeMemberId('SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SINFULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
    });

    it('normalizes lowercase and mixed-case variants', () => {
      expect(normalizeMemberId('sin-fulokoja-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(normalizeMemberId('sin-sinuepx3b')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('sin-sin-uepx3b')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('sinuepx3b')).toBe('SIN-UEPX3B');
    });

    it('rejects garbage and malformed input', () => {
      expect(normalizeMemberId('')).toBeNull();
      expect(normalizeMemberId('   ')).toBeNull();
      expect(normalizeMemberId(null)).toBeNull();
      expect(normalizeMemberId(undefined)).toBeNull();
      expect(normalizeMemberId('garbage-no-prefix')).toBeNull();
      expect(normalizeMemberId('<script>alert(1)</script>')).toBeNull();
      expect(normalizeMemberId('SIN-')).toBeNull();
      expect(normalizeMemberId('SIN--TEST')).toBeNull();
      expect(normalizeMemberId('SIN-!@#$')).toBeNull();
    });
  });

  describe('formatMemberId', () => {
    it('formats raw codes with and without SIN prefix', () => {
      expect(formatMemberId('SIN-SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(formatMemberId('SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(formatMemberId('UEPX3B')).toBe('SIN-UEPX3B');
      expect(formatMemberId('sin-uepx3b')).toBe('SIN-UEPX3B');
      expect(formatMemberId('MBR-123456')).toBe('SIN-MBR-123456');
      expect(formatMemberId('SIN-FULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(formatMemberId('')).toBe('');
      expect(formatMemberId(null)).toBe('');
    });
  });

  describe('cleanFullName and getMemberInitials (Step 2)', () => {
    it('returns clean real names and rejects email addresses or handles', () => {
      expect(cleanFullName('Amina Ibrahim', 'amina@sinet.africa')).toBe('Amina Ibrahim');
      expect(cleanFullName('amina@sinet.africa', 'amina@sinet.africa')).toBeNull();
      expect(cleanFullName('amina', 'amina@sinet.africa')).toBeNull();
      expect(cleanFullName('   ', 'user@example.com')).toBeNull();
      expect(cleanFullName(null, 'user@example.com')).toBeNull();
    });

    it('computes correct initials', () => {
      expect(getMemberInitials('Amina Ibrahim')).toBe('AI');
      expect(getMemberInitials('Ada Lovelace')).toBe('AL');
      expect(getMemberInitials('Amina')).toBe('AM');
      expect(getMemberInitials(null)).toBe('SI');
      expect(getMemberInitials('user@example.com', 'user@example.com')).toBe('SI');
    });
  });

  describe('formatAcademicLevel & getMemberStatusLabel (Step 4)', () => {
    it('formats valid academic level numbers and never appends L to Active or non-numeric strings', () => {
      expect(formatAcademicLevel('100')).toBe('100L');
      expect(formatAcademicLevel('200')).toBe('200L');
      expect(formatAcademicLevel('300')).toBe('300L');
      expect(formatAcademicLevel('400')).toBe('400L');
      expect(formatAcademicLevel('500')).toBe('500L');
      expect(formatAcademicLevel('400L')).toBe('400L');

      // The typo (ActiveL) is impossible:
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

  describe('getMemberTierSummary (Step 3)', () => {
    it('returns consistent tier summary from Postgres fields', () => {
      const summary = getMemberTierSummary({
        programme: 'Undergraduate',
        division: 'student_finance',
        universityShortName: 'FULOKOJA',
      });
      expect(summary.tier).toBe('Undergraduate');
      expect(summary.division).toBe('Student Finance');
      expect(summary.chapter).toBe('FULOKOJA');
      expect(summary.summaryLine).toBe('Undergraduate • Student Finance • FULOKOJA');
    });

    it('falls back gracefully when chapter or division are not set', () => {
      const general = getMemberTierSummary({
        roles: ['member'],
      });
      expect(general.summaryLine).toBe('Member');

      const lead = getMemberTierSummary({
        roles: ['chapter_lead'],
        chapterName: 'Kogi State Chapter',
      });
      expect(lead.summaryLine).toBe('Chapter Lead • Kogi State Chapter');
    });
  });
});
