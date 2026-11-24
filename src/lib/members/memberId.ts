/**
 * Member ID normalization, formatting, and identity helpers.
 *
 * Rules:
 * - Canonical Member ID format is SIN-XXXXXX (always uppercase, prefixed with SIN-)
 * - Accepts legacy doubled prefix (SIN-SINXXXXXX, SIN-SIN-XXXXXX, SINSINXXXXXX)
 * - Accepts unhyphenated prefix (SINXXXXXX)
 * - Accepts lowercase/mixed-case variants
 * - Rejects empty, whitespace-only, invalid characters, or malformed strings
 */

export type MemberStatus = 'pending' | 'active' | 'suspended' | 'alumni';

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  alumni: 'Alumni',
} as const;

export function getMemberStatusLabel(status?: string | null): string {
  if (!status) return 'Pending';
  const lower = status.toLowerCase() as MemberStatus;
  return MEMBER_STATUS_LABELS[lower] || 'Pending';
}

/**
 * Normalizes user input or legacy Member IDs into the canonical format: SIN-XXXXXX
 *
 * Accepts:
 * - Canonical: 'SIN-XXXXXX' (e.g. 'SIN-FULOKOJA-26-0001', 'SIN-UEPX3B', 'SIN-MBR-123456')
 * - Doubled prefix legacy: 'SIN-SINXXXXXX', 'SIN-SIN-XXXXXX', 'SINSINXXXXXX' (e.g. 'SIN-SINUEPX3B')
 * - Unhyphenated: 'SINXXXXXX' (e.g. 'SINUEPX3B')
 * - Casing variants: 'sin-uepx3b', 'sin-sinuepx3b', etc.
 *
 * Rejects (returns null):
 * - Empty string, null, undefined, non-string
 * - Strings with invalid characters (only alphanumeric and hyphens allowed)
 * - Strings with consecutive hyphens (e.g. 'SIN--TEST')
 * - Garbage inputs (e.g. '<script>', '???', etc.)
 */
export function normalizeMemberId(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject strings containing characters outside [a-zA-Z0-9-]
  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) return null;

  // Reject consecutive hyphens like '--'
  if (trimmed.includes('--')) return null;

  // Must match SIN prefix (case-insensitive), optionally doubled, followed by valid suffix
  const match = trimmed.match(/^sin-?(?:sin-?)?([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)$/i);
  if (!match) return null;

  const suffix = match[1].toUpperCase();
  if (!suffix) return null;

  return `SIN-${suffix}`;
}

/**
 * Formats a raw member ID or referral code into canonical SIN-XXXXXX format.
 * If raw already has a SIN prefix, it normalizes it.
 * If raw lacks a SIN prefix (e.g. 'UEPX3B' or 'MBR-123456'), it safely prefixes 'SIN-'.
 */
export function formatMemberId(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const normalized = normalizeMemberId(trimmed);
  if (normalized) return normalized;

  // Clean characters outside alphanumeric and hyphens
  const cleaned = trimmed.replace(/[^a-zA-Z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').toUpperCase();
  if (!cleaned) return '';

  if (cleaned.startsWith('SIN-')) return cleaned;
  if (cleaned.startsWith('SIN')) return `SIN-${cleaned.slice(3)}`;
  return `SIN-${cleaned}`;
}

/**
 * Sanitizes and extracts the real display name.
 * Never returns an email address or email handle.
 */
export function cleanFullName(name?: string | null, email?: string | null): string | null {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  // Never use email address as name
  if (trimmed.includes('@')) return null;

  // Never use email handle as name
  if (email && typeof email === 'string') {
    const handle = email.split('@')[0].trim().toLowerCase();
    if (trimmed.toLowerCase() === handle || trimmed.toLowerCase() === email.trim().toLowerCase()) {
      return null;
    }
  }

  return trimmed;
}

/**
 * Returns initials from a member's real name.
 * E.g. "Ada Lovelace" -> "AL", "Amina" -> "AM", empty/unknown -> "SI".
 */
export function getMemberInitials(name?: string | null, email?: string | null): string {
  const clean = cleanFullName(name, email);
  if (!clean) return 'SI';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SI';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Formats an academic student level (e.g. 100, 200, 300, 400, 500, 600) into '100L'.
 * Non-numeric levels like 'Active' or null return null to prevent typos like '(ActiveL)'.
 */
export function formatAcademicLevel(level?: string | null): string | null {
  if (!level || typeof level !== 'string') return null;
  const trimmed = level.trim();
  if (/^[1-6]00$/.test(trimmed)) {
    return `${trimmed}L`;
  }
  if (/^[1-6]00L$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return null;
}

export type MemberTierInfo = {
  tier: string;
  division: string | null;
  chapter: string | null;
  summaryLine: string;
};

export const STUDENT_DIVISION_LABELS: Record<string, string> = {
  student_finance: 'Student Finance',
  student_enterprise: 'Student Enterprise',
  governance_records: 'Governance & Records',
};

/**
 * Derives a single consistent tier, division, and chapter line from Postgres records.
 */
export function getMemberTierSummary(opts: {
  roles?: string[] | null;
  programme?: string | null;
  division?: string | null;
  chapterName?: string | null;
  universityName?: string | null;
  universityShortName?: string | null;
}): MemberTierInfo {
  // 1. Tier: from Postgres roles or programme
  let tier = 'Member';
  const roles = opts.roles || [];
  if (roles.includes('super_admin') || roles.includes('admin')) {
    tier = 'Admin';
  } else if (roles.includes('chapter_lead')) {
    tier = 'Chapter Lead';
  } else if (opts.programme && opts.programme.trim()) {
    tier = opts.programme.trim();
  } else if (roles.includes('member')) {
    tier = 'Member';
  }

  // 2. Division: from Postgres profile division
  let division: string | null = null;
  if (opts.division && STUDENT_DIVISION_LABELS[opts.division]) {
    division = STUDENT_DIVISION_LABELS[opts.division];
  } else if (opts.division && opts.division !== 'student_finance') {
    division = opts.division.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  } else if (opts.division === 'student_finance') {
    division = 'Student Finance';
  }

  // 3. Chapter: from Postgres university/chapter
  let chapter: string | null = null;
  if (opts.universityShortName && opts.universityShortName.trim()) {
    chapter = opts.universityShortName.trim();
  } else if (opts.chapterName && opts.chapterName.trim()) {
    chapter = opts.chapterName.trim();
  } else if (opts.universityName && opts.universityName.trim()) {
    chapter = opts.universityName.trim();
  }

  // Single consistent one-line summary
  const parts = [tier, division, chapter].filter(Boolean) as string[];
  const summaryLine = parts.length > 0 ? parts.join(' • ') : 'Community Member';

  return {
    tier,
    division,
    chapter,
    summaryLine,
  };
}
