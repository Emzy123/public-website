import { formatWatDate, formatWatDateTime, formatWatTime } from './date';

describe('WAT Date and Time Utility', () => {
  it('formats dates into standard "DD MMM YYYY" WAT format', () => {
    // 2026-10-14T12:00:00Z is 13:00 WAT (UTC+1)
    const testDate = new Date('2026-10-14T12:00:00Z');
    expect(formatWatDate(testDate)).toBe('14 Oct 2026');
  });

  it('formats date and time with WAT suffix', () => {
    const testDate = new Date('2026-10-14T12:30:00Z'); // 13:30 WAT
    expect(formatWatDateTime(testDate)).toBe('14 Oct 2026, 13:30 WAT');
    expect(formatWatDateTime(testDate, false)).toBe('14 Oct 2026, 13:30');
  });

  it('formats time with WAT suffix', () => {
    const testDate = new Date('2026-10-14T12:30:00Z');
    expect(formatWatTime(testDate)).toBe('13:30 WAT');
  });

  it('handles null, undefined, and invalid dates gracefully', () => {
    expect(formatWatDate(null)).toBe('—');
    expect(formatWatDate(undefined)).toBe('—');
    expect(formatWatDate('invalid-date')).toBe('—');
    expect(formatWatDateTime(null)).toBe('—');
    expect(formatWatTime(null)).toBe('—');
  });
});
