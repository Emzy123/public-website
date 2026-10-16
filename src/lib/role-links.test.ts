import {
  APPLICATION_ROLES,
  ROLE_LABELS,
  ROLE_ALIASES,
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

  describe('1. Each of the 5 canonical slugs preselects its role', () => {
    it.each(APPLICATION_ROLES)('preselects canonical role "%s"', (role) => {
      const normalized = normalizeRoleSlug(role);
      expect(normalized).toBe(role);
    });
  });

  describe('2. Every alias in the table resolves to canonical role', () => {
    it.each(Object.entries(ROLE_ALIASES))(
      'alias "%s" correctly resolves to canonical "%s"',
      (alias, expectedRole) => {
        expect(normalizeRoleSlug(alias)).toBe(expectedRole);
      }
    );

    it('covers all key aliases explicitly', () => {
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
      expect(normalizeRoleSlug('enterprises')).toBe('partnership-interest');
      expect(normalizeRoleSlug('partner')).toBe('partnership-interest');
      expect(normalizeRoleSlug('partners')).toBe('partnership-interest');
      expect(normalizeRoleSlug('partnership-enterprise')).toBe('partnership-interest');
    });
  });

  describe('3. Casing, whitespace, and underscore normalization', () => {
    it('normalizes uppercase, mixed-case, and padded inputs', () => {
      expect(normalizeRoleSlug('  Volunteer  ')).toBe('volunteer');
      expect(normalizeRoleSlug('CAMPUS-AMBASSADOR')).toBe('ambassador');
      expect(normalizeRoleSlug('  PARTNERSHIP_INTEREST ')).toBe('partnership-interest');
      expect(normalizeRoleSlug('Community_Member')).toBe('community-member');
      expect(normalizeRoleSlug('  ENTERPRISE  ')).toBe('partnership-interest');
      expect(normalizeRoleSlug('\tStaff\n')).toBe('staff');
    });
  });

  describe('4. Unknown or malicious slugs never preselect volunteer or leak into UI', () => {
    const maliciousInputs = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:void(0)',
      'anything-random',
      'garbage',
      'volunteer<script>',
      'staff"',
      "ambassador'",
      '${7*7}',
      '{{7*7}}',
      'hacker',
      'admin',
      'investor',
      'super_admin',
      '',
      '   ',
    ];

    it.each(maliciousInputs)('returns null for unsafe or unknown input: %j', (input) => {
      expect(normalizeRoleSlug(input)).toBeNull();
    });

    it('returns null for undefined and null', () => {
      expect(normalizeRoleSlug(undefined)).toBeNull();
      expect(normalizeRoleSlug(null)).toBeNull();
    });

    it('ensures unknown slug results in neutral picker with nothing selected', () => {
      const allowedRoles: ApplicationRole[] = ['volunteer', 'community-member', 'ambassador'];
      const queryRole = normalizeRoleSlug('garbage');

      // Crucial test: must NOT fall back to volunteer or default role!
      const effectiveRole = queryRole && allowedRoles.includes(queryRole) ? queryRole : '';
      expect(effectiveRole).toBe('');
    });
  });

  describe('5. Campaign restrictions and allowedRoles conflicts', () => {
    function evaluateWizardRoleResolution(
      allowedRoles: ApplicationRole[] | undefined,
      rawQueryRole?: string | null
    ) {
      const availableRoles =
        allowedRoles && allowedRoles.length > 0
          ? APPLICATION_ROLES.filter((r) => allowedRoles.includes(r))
          : [...APPLICATION_ROLES];
      const roles = availableRoles.length > 0 ? availableRoles : [...APPLICATION_ROLES];
      const queryRole = normalizeRoleSlug(rawQueryRole);
      const isConflict = Boolean(queryRole && !roles.includes(queryRole));
      const effectiveRole = queryRole && roles.includes(queryRole) ? queryRole : '';
      const conflictMessage =
        isConflict && queryRole
          ? `The requested role (${ROLE_LABELS[queryRole] || queryRole}) is not available for this campaign. Please select an open role below:`
          : null;

      return { roles, queryRole, effectiveRole, isConflict, conflictMessage };
    }

    it('preselects valid allowed role', () => {
      const res = evaluateWizardRoleResolution(['volunteer', 'ambassador'], 'ambassador');
      expect(res.effectiveRole).toBe('ambassador');
      expect(res.isConflict).toBe(false);
      expect(res.conflictMessage).toBeNull();
    });

    it('does NOT preselect when role is outside allowedRoles, and sets conflict note', () => {
      // Campaign only accepts volunteer & staff; user arrives via /join?role=ambassador
      const res = evaluateWizardRoleResolution(['volunteer', 'staff'], 'ambassador');
      expect(res.effectiveRole).toBe('');
      expect(res.isConflict).toBe(true);
      expect(res.conflictMessage).toContain('Campus Ambassador');
      expect(res.conflictMessage).toContain('not available for this campaign');
    });

    it('does NOT set conflict note for random/unknown slugs (renders clean neutral picker)', () => {
      const res = evaluateWizardRoleResolution(['volunteer', 'staff'], 'unknown-garbage');
      expect(res.effectiveRole).toBe('');
      expect(res.isConflict).toBe(false);
      expect(res.conflictMessage).toBeNull();
    });

    it('defaults allowedRoles to all APPLICATION_ROLES when empty, permitting any valid role', () => {
      const res = evaluateWizardRoleResolution([], 'partnership-interest');
      expect(res.effectiveRole).toBe('partnership-interest');
      expect(res.isConflict).toBe(false);
    });
  });

  describe('6. Redirection query parameter whitelisting', () => {
    const ALLOWED_UTM_PARAMS = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ]);

    function buildWhitelistedRedirect(
      targetUrl: string,
      searchParams?: Record<string, string | string[] | undefined>
    ): string {
      const rawRole =
        typeof searchParams?.role === 'string'
          ? searchParams.role
          : Array.isArray(searchParams?.role)
            ? searchParams.role[0]
            : undefined;
      const canonicalRole = normalizeRoleSlug(rawRole);

      const qs = new URLSearchParams();
      if (canonicalRole) {
        qs.set('role', canonicalRole);
      }

      if (searchParams) {
        for (const [key, rawValue] of Object.entries(searchParams)) {
          const val = typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue[0] : '';
          if (!val) continue;

          if (ALLOWED_UTM_PARAMS.has(key)) {
            if (/^[a-zA-Z0-9_\-\.]{1,100}$/.test(val)) {
              qs.set(key, val);
            }
          } else if (key === 'ref') {
            if (/^[a-zA-Z0-9_-]{1,32}$/.test(val)) {
              qs.set('ref', val);
            }
          }
        }
      }

      const queryStr = qs.toString();
      return queryStr ? `${targetUrl}?${queryStr}` : targetUrl;
    }

    it('forwards canonical role slug', () => {
      const dest = buildWhitelistedRedirect('/join/cohort-2026', { role: 'ambassador' });
      expect(dest).toBe('/join/cohort-2026?role=ambassador');
    });

    it('normalizes alias on redirect (e.g. campus-ambassador -> ambassador)', () => {
      const dest = buildWhitelistedRedirect('/join/cohort-2026', { role: 'campus-ambassador' });
      expect(dest).toBe('/join/cohort-2026?role=ambassador');
    });

    it('discards unknown or malicious role on redirect', () => {
      const dest = buildWhitelistedRedirect('/join/cohort-2026', { role: '<script>alert(1)</script>' });
      expect(dest).toBe('/join/cohort-2026');
    });

    it('forwards whitelisted utm params and referral code', () => {
      const dest = buildWhitelistedRedirect('/join/cohort-2026', {
        role: 'volunteer',
        utm_source: 'twitter',
        utm_medium: 'social',
        utm_campaign: 'campus_launch_2026',
        ref: 'CAMPUS-8821',
      });
      expect(dest).toContain('role=volunteer');
      expect(dest).toContain('utm_source=twitter');
      expect(dest).toContain('utm_medium=social');
      expect(dest).toContain('utm_campaign=campus_launch_2026');
      expect(dest).toContain('ref=CAMPUS-8821');
    });

    it('drops arbitrary non-whitelisted query params', () => {
      const dest = buildWhitelistedRedirect('/join/cohort-2026', {
        role: 'staff',
        unauthorized_key: 'malicious_value',
        admin_preview: 'true',
        session: 'secret_leak',
      });
      expect(dest).toBe('/join/cohort-2026?role=staff');
      expect(dest).not.toContain('unauthorized_key');
      expect(dest).not.toContain('admin_preview');
      expect(dest).not.toContain('session');
    });
  });

  describe('7. Closed-state view & notify payload per role', () => {
    function resolveClosedViewContent(role: ApplicationRole | null | undefined) {
      const roleTitle = role ? ROLE_LABELS[role] : null;
      const notifySource = role ? `join-${role}` : 'join';
      const pill = roleTitle ? `${roleTitle} Admissions Closed` : 'Applications Closed';
      const heading = roleTitle ? `${roleTitle} Applications are Closed` : 'Registration is Closed at the Moment';

      return { roleTitle, notifySource, pill, heading };
    }

    it.each(APPLICATION_ROLES)('generates correct closed view & notify payload for canonical role "%s"', (role) => {
      const res = resolveClosedViewContent(role);
      const title = ROLE_LABELS[role];
      expect(res.heading).toBe(`${title} Applications are Closed`);
      expect(res.pill).toBe(`${title} Admissions Closed`);
      expect(res.notifySource).toBe(`join-${role}`);
    });

    it('generates generic closed view and source: "join" for unknown/null role', () => {
      const resNull = resolveClosedViewContent(null);
      expect(resNull.heading).toBe('Registration is Closed at the Moment');
      expect(resNull.pill).toBe('Applications Closed');
      expect(resNull.notifySource).toBe('join');

      const resUndefined = resolveClosedViewContent(undefined);
      expect(resUndefined.heading).toBe('Registration is Closed at the Moment');
      expect(resUndefined.notifySource).toBe('join');
    });

    it('notify payload never leaks unknown or unsanitized strings', () => {
      const unknownSlug = normalizeRoleSlug('<script>alert(1)</script>');
      expect(unknownSlug).toBeNull();
      const res = resolveClosedViewContent(unknownSlug);
      expect(res.notifySource).toBe('join');
      expect(res.heading).not.toContain('<script>');
    });
  });
});
