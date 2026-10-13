import { APPLICATION_ROLES, ROLE_LABELS, type ApplicationRole } from './types/membership';

function normalizeRoleSlug(raw?: string | null): ApplicationRole | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower === 'volunteer') return 'volunteer';
  if (lower === 'staff') return 'staff';
  if (lower.includes('ambassador')) return 'ambassador';
  if (lower.includes('community') || lower === 'member') return 'community-member';
  if (lower.includes('partner') || lower.includes('enterprise')) return 'partnership-interest';
  return null;
}

describe('Role Deep Links & Membership Names', () => {
  it('maps expected human-readable role labels', () => {
    expect(ROLE_LABELS.volunteer).toBe('Volunteer');
    expect(ROLE_LABELS['community-member']).toBe('Community Member');
    expect(ROLE_LABELS.ambassador).toBe('Campus Ambassador');
    expect(ROLE_LABELS.staff).toBe('Staff');
    expect(ROLE_LABELS['partnership-interest']).toBe('Partnership & Enterprise');
  });

  it('normalizes role aliases from query strings', () => {
    expect(normalizeRoleSlug('volunteer')).toBe('volunteer');
    expect(normalizeRoleSlug('campus-ambassador')).toBe('ambassador');
    expect(normalizeRoleSlug('ambassador')).toBe('ambassador');
    expect(normalizeRoleSlug('community')).toBe('community-member');
    expect(normalizeRoleSlug('community-member')).toBe('community-member');
    expect(normalizeRoleSlug('staff')).toBe('staff');
    expect(normalizeRoleSlug('partnership')).toBe('partnership-interest');
    expect(normalizeRoleSlug('enterprise')).toBe('partnership-interest');
    expect(normalizeRoleSlug('partnership-enterprise')).toBe('partnership-interest');
  });

  it('returns null for unknown role query strings', () => {
    expect(normalizeRoleSlug('unknown-role')).toBeNull();
    expect(normalizeRoleSlug('')).toBeNull();
    expect(normalizeRoleSlug(undefined)).toBeNull();
  });
});
