import {
  APPLICATION_ROLES,
  ROLE_LABELS,
  normalizeRoleSlug,
  type ApplicationRole,
} from './types/membership';

describe('Role Deep Links & Membership Names', () => {
  it('maps expected human-readable role labels', () => {
    expect(ROLE_LABELS.volunteer).toBe('Volunteer');
    expect(ROLE_LABELS['community-member']).toBe('Community Member');
    expect(ROLE_LABELS.ambassador).toBe('Campus Ambassador');
    expect(ROLE_LABELS.staff).toBe('Staff');
    expect(ROLE_LABELS['partnership-interest']).toBe('Partnership & Enterprise');
  });

  describe('normalizeRoleSlug (exported from @/lib/types/membership)', () => {
    it('normalizes canonical role slugs', () => {
      expect(normalizeRoleSlug('volunteer')).toBe('volunteer');
      expect(normalizeRoleSlug('staff')).toBe('staff');
      expect(normalizeRoleSlug('ambassador')).toBe('ambassador');
      expect(normalizeRoleSlug('community-member')).toBe('community-member');
      expect(normalizeRoleSlug('partnership-interest')).toBe('partnership-interest');
    });

    it('normalizes role aliases and compound queries', () => {
      expect(normalizeRoleSlug('campus-ambassador')).toBe('ambassador');
      expect(normalizeRoleSlug('campus_ambassador')).toBe('ambassador');
      expect(normalizeRoleSlug('ambassadors')).toBe('ambassador');
      expect(normalizeRoleSlug('community')).toBe('community-member');
      expect(normalizeRoleSlug('member')).toBe('community-member');
      expect(normalizeRoleSlug('members')).toBe('community-member');
      expect(normalizeRoleSlug('community_member')).toBe('community-member');
      expect(normalizeRoleSlug('volunteers')).toBe('volunteer');
      expect(normalizeRoleSlug('partnership')).toBe('partnership-interest');
      expect(normalizeRoleSlug('enterprise')).toBe('partnership-interest');
      expect(normalizeRoleSlug('partner')).toBe('partnership-interest');
      expect(normalizeRoleSlug('partnership-enterprise')).toBe('partnership-interest');
    });

    it('handles whitespace, casing, and underscores', () => {
      expect(normalizeRoleSlug('  Volunteer  ')).toBe('volunteer');
      expect(normalizeRoleSlug('CAMPUS-AMBASSADOR')).toBe('ambassador');
      expect(normalizeRoleSlug('  PARTNERSHIP_INTEREST ')).toBe('partnership-interest');
      expect(normalizeRoleSlug('Community_Member')).toBe('community-member');
    });

    it('returns null for unknown, empty, or missing role query strings', () => {
      expect(normalizeRoleSlug('unknown-role')).toBeNull();
      expect(normalizeRoleSlug('hacker')).toBeNull();
      expect(normalizeRoleSlug('')).toBeNull();
      expect(normalizeRoleSlug('   ')).toBeNull();
      expect(normalizeRoleSlug(undefined)).toBeNull();
      expect(normalizeRoleSlug(null)).toBeNull();
    });
  });

  describe('URL searchParams redirection preservation', () => {
    function buildRedirectDestination(
      targetUrl: string,
      searchParams?: Record<string, string | string[] | undefined>
    ): string {
      const qs = new URLSearchParams();
      if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
          if (typeof value === 'string') {
            qs.set(key, value);
          } else if (Array.isArray(value)) {
            for (const v of value) qs.append(key, v);
          }
        }
      }
      const queryStr = qs.toString();
      return queryStr ? `${targetUrl}?${queryStr}` : targetUrl;
    }

    it('forwards ?role=<slug> to target campaign URL', () => {
      const destination = buildRedirectDestination('/join/cohort-2026', { role: 'ambassador' });
      expect(destination).toBe('/join/cohort-2026?role=ambassador');
    });

    it('preserves multiple query params alongside role', () => {
      const destination = buildRedirectDestination('/join/cohort-2026', {
        role: 'community-member',
        ref: 'REF-8821',
      });
      expect(destination).toContain('role=community-member');
      expect(destination).toContain('ref=REF-8821');
    });

    it('returns clean base URL when no query params are provided', () => {
      expect(buildRedirectDestination('/join/cohort-2026')).toBe('/join/cohort-2026');
      expect(buildRedirectDestination('/join/cohort-2026', {})).toBe('/join/cohort-2026');
    });
  });

  describe('Wizard effective role resolution', () => {
    function resolveEffectiveRole(
      allowedRoles: ApplicationRole[] | undefined,
      rawQueryRole?: string | null
    ): ApplicationRole {
      const availableRoles =
        allowedRoles && allowedRoles.length > 0
          ? APPLICATION_ROLES.filter((r) => allowedRoles.includes(r))
          : [...APPLICATION_ROLES];
      const roles = availableRoles.length > 0 ? availableRoles : [...APPLICATION_ROLES];
      const defaultRole = roles[0] || 'volunteer';
      const queryRole = normalizeRoleSlug(rawQueryRole);
      return queryRole && roles.includes(queryRole) ? queryRole : defaultRole;
    }

    it('preselects valid queryRole when allowed', () => {
      expect(resolveEffectiveRole(['volunteer', 'ambassador'], 'ambassador')).toBe('ambassador');
      expect(resolveEffectiveRole(['community-member', 'staff'], 'staff')).toBe('staff');
    });

    it('resolves aliased role query string', () => {
      expect(resolveEffectiveRole(['volunteer', 'ambassador'], 'campus-ambassador')).toBe('ambassador');
      expect(resolveEffectiveRole(['community-member', 'staff'], 'member')).toBe('community-member');
    });

    it('falls back to defaultRole when queryRole is not among allowedRoles', () => {
      // 'ambassador' is valid slug, but this campaign only allows volunteer & staff
      expect(resolveEffectiveRole(['volunteer', 'staff'], 'ambassador')).toBe('volunteer');
    });

    it('falls back to defaultRole for unknown role slug', () => {
      expect(resolveEffectiveRole(['volunteer', 'ambassador'], 'astronaut')).toBe('volunteer');
    });

    it('permits any canonical role when allowedRoles is empty (unrestricted campaign)', () => {
      expect(resolveEffectiveRole([], 'ambassador')).toBe('ambassador');
      expect(resolveEffectiveRole([], 'partnership-interest')).toBe('partnership-interest');
      expect(resolveEffectiveRole(undefined, 'community-member')).toBe('community-member');
    });
  });
});
