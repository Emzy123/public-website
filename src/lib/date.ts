/**
 * Centralized Date & Time formatting utility for SINetwork Global Ltd. (SINet).
 *
 * Rules:
 * - All displayed dates in one format: "14 Oct 2026"
 * - All timestamps formatted in West Africa Time (WAT) - Africa/Lagos
 */

const WAT_TIMEZONE = 'Africa/Lagos';

/**
 * Formats a date into standard SINet format: "14 Oct 2026" (in WAT).
 */
export function formatWatDate(date: string | number | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats a date & time into standard SINet format: "14 Oct 2026, 15:30 WAT"
 */
export function formatWatDateTime(
  date: string | number | Date | null | undefined,
  includeTimezoneSuffix = true
): string {
  if (!date) return '—';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return includeTimezoneSuffix ? `${formatted} WAT` : formatted;
}

/**
 * Formats only the time portion in WAT: "15:30 WAT"
 */
export function formatWatTime(date: string | number | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${timeStr} WAT`;
}
