/**
 * Member display and profile formatting helpers.
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
 * E.g. "Ada Lovelace" -> "AL", "Amina" -> "AM".
 * Returns null when real name is absent (no "SI" fallback).
 */
export function getMemberInitials(name?: string | null, email?: string | null): string | null {
  const clean = cleanFullName(name, email);
  if (!clean) return null;

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
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
