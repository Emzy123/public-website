import {
  APPLICATION_ROLES,
  ALL_APPLICATION_ROLES,
  ROLE_LABELS,
  ROLE_ALIASES,
  normalizeRoleSlug,
  type ApplicationRole,
} from './types/membership';
import { createRegistrationLinkSchema, isReservedLinkSlug } from './schemas/registration-link.schema';
import { campaignApplicationSchema } from './schemas/application.schema';
import { buildJoinRedirectUrl, normalizeDivisionSlug } from './registration-links';
import { registerKnownChapterSlug } from './chapters/chapters';

describe('Role Deep Links & Membership Names', () => {
  it('maps expected human-readable role labels', () => {
    expect(ROLE_LABELS.volunteer).toBe('Volunteer');
    expect(ROLE_LABELS['community-member']).toBe('Community Member');
    expect(ROLE_LABELS.ambassador).toBe('Campus Ambassador');
    expect(ROLE_LABELS.staff).toBe('Staff');
    expect(ROLE_LABELS['partnership-interest']).toBe('Partnership & Enterprise');
  });

  it('maintains staff as invite-only, excluded from public APPLICATION_ROLES', () => {
    expect(APPLICATION_ROLES).not.toContain('staff');
    expect(APPLICATION_ROLES).toEqual([
      'volunteer',
      'community-member',
      'ambassador',
      'partnership-interest',
    ]);
    expect(ALL_APPLICATION_ROLES).toContain('staff');
  });

  describe('1. Each of the 5 canonical slugs resolves to its canonical role', () => {
    it.each(ALL_APPLICATION_ROLES)('resolves canonical role "%s"', (role) => {
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
          ? ALL_APPLICATION_ROLES.filter((r) => allowedRoles.includes(r))
          : [...APPLICATION_ROLES];
      const roles = availableRoles.length > 0 ? availableRoles : [...APPLICATION_ROLES];
      const queryRole = normalizeRoleSlug(rawQueryRole);
      const isStaffRequested = queryRole === 'staff' && !roles.includes('staff');
      const isConflict = Boolean(queryRole && !roles.includes(queryRole));
      const effectiveRole = queryRole && roles.includes(queryRole) ? queryRole : '';
      const conflictMessage = isStaffRequested
        ? 'Staff positions are by invitation. Choose an open role below.'
        : isConflict && queryRole
          ? `The requested role (${ROLE_LABELS[queryRole] || queryRole}) is not available for this campaign. Please select an open role below:`
          : null;

      return { roles, queryRole, effectiveRole, isStaffRequested, isConflict, conflictMessage };
    }

    it('preselects valid allowed role', () => {
      const res = evaluateWizardRoleResolution(['volunteer', 'ambassador'], 'ambassador');
      expect(res.effectiveRole).toBe('ambassador');
      expect(res.isConflict).toBe(false);
      expect(res.conflictMessage).toBeNull();
    });

    it('does NOT preselect when role is outside allowedRoles, and sets conflict note', () => {
      const res = evaluateWizardRoleResolution(['volunteer', 'community-member'], 'ambassador');
      expect(res.effectiveRole).toBe('');
      expect(res.isConflict).toBe(true);
      expect(res.conflictMessage).toContain('Campus Ambassador');
      expect(res.conflictMessage).toContain('not available for this campaign');
    });

    it('shows invitation note and neutral picker for /join?role=staff on public campaign', () => {
      // Default public campaign has allowedRoles empty -> resolves to public APPLICATION_ROLES (no staff)
      const res = evaluateWizardRoleResolution([], 'staff');
      expect(res.roles).not.toContain('staff');
      expect(res.effectiveRole).toBe('');
      expect(res.isStaffRequested).toBe(true);
      expect(res.conflictMessage).toBe('Staff positions are by invitation. Choose an open role below.');
    });

    it('enables staff selection and preselection on admin-created staff link', () => {
      // Admin created a link via /admin/links with roles: ['staff']
      const res = evaluateWizardRoleResolution(['staff'], 'staff');
      expect(res.roles).toEqual(['staff']);
      expect(res.effectiveRole).toBe('staff');
      expect(res.isStaffRequested).toBe(false);
      expect(res.conflictMessage).toBeNull();
    });

    it('does NOT set conflict note for random/unknown slugs (renders clean neutral picker)', () => {
      const res = evaluateWizardRoleResolution(['volunteer', 'community-member'], 'unknown-garbage');
      expect(res.effectiveRole).toBe('');
      expect(res.isConflict).toBe(false);
      expect(res.conflictMessage).toBeNull();
    });

    it('defaults allowedRoles to all public APPLICATION_ROLES when empty, permitting any valid public role', () => {
      const res = evaluateWizardRoleResolution([], 'partnership-interest');
      expect(res.effectiveRole).toBe('partnership-interest');
      expect(res.isConflict).toBe(false);
    });
  });

  describe('6. Redirection query parameter whitelisting', () => {
    it('forwards canonical public role slug', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', { role: 'ambassador' });
      expect(dest).toBe('/join/cohort-2026?role=ambassador');
    });

    it('normalizes alias on redirect (e.g. campus-ambassador -> ambassador)', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', { role: 'campus-ambassador' });
      expect(dest).toBe('/join/cohort-2026?role=ambassador');
    });

    it('normalizes student and student-network aliases to community-member', () => {
      const dest1 = buildJoinRedirectUrl('/join/cohort-2026', { role: 'student' });
      expect(dest1).toBe('/join/cohort-2026?role=community-member');

      const dest2 = buildJoinRedirectUrl('/join/cohort-2026', { role: 'student-network' });
      expect(dest2).toBe('/join/cohort-2026?role=community-member');
    });

    it('discards invite-only staff role on public redirect', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', { role: 'staff' });
      expect(dest).toBe('/join/cohort-2026');
    });

    it('discards unknown or malicious role on redirect', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', { role: '<script>alert(1)</script>' });
      expect(dest).toBe('/join/cohort-2026');
    });

    it('forwards whitelisted real chapter parameter (e.g. fulokoja)', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'fulokoja',
      });
      expect(dest).toBe('/join/cohort-2026?role=community-member&chapter=fulokoja');
    });

    it('normalizes uppercase real chapter parameter to lowercase', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'FULOKOJA',
      });
      expect(dest).toBe('/join/cohort-2026?role=community-member&chapter=fulokoja');
    });

    it('drops unknown chapter parameter not in real chapter slugs', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'unknown-campus-999',
      });
      expect(dest).toBe('/join/cohort-2026?role=community-member');
      expect(dest).not.toContain('unknown-campus-999');
    });

    it('recognizes dynamically registered chapters from data source without dropping to null', () => {
      registerKnownChapterSlug('abu-zaria');
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'abu-zaria',
      });
      expect(dest).toBe('/join/cohort-2026?role=community-member&chapter=abu-zaria');
    });

    it('sanitizes and drops malicious chapter parameter', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: '<script>alert(1)</script>',
      });
      expect(dest).toBe('/join/cohort-2026?role=community-member');
      expect(dest).not.toContain('<script>');
    });

    it('forwards whitelisted division parameter (finance, enterprise, governance)', () => {
      const dest1 = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'fulokoja',
        division: 'finance',
      });
      expect(dest1).toBe('/join/cohort-2026?role=community-member&chapter=fulokoja&division=finance');

      const dest2 = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'fulokoja',
        division: 'student-enterprise',
      });
      expect(dest2).toBe('/join/cohort-2026?role=community-member&chapter=fulokoja&division=enterprise');

      const dest3 = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'fulokoja',
        division: 'governance_records',
      });
      expect(dest3).toBe('/join/cohort-2026?role=community-member&chapter=fulokoja&division=governance');
    });

    it('drops invalid division parameter', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'community-member',
        chapter: 'fulokoja',
        division: 'crypto_trading',
      });
      expect(dest).toBe('/join/cohort-2026?role=community-member&chapter=fulokoja');
      expect(dest).not.toContain('crypto_trading');
    });

    it('forwards whitelisted utm params and referral code', () => {
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
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
      const dest = buildJoinRedirectUrl('/join/cohort-2026', {
        role: 'volunteer',
        unauthorized_key: 'malicious_value',
        admin_preview: 'true',
        session: 'secret_leak',
      });
      expect(dest).toBe('/join/cohort-2026?role=volunteer');
      expect(dest).not.toContain('unauthorized_key');
      expect(dest).not.toContain('admin_preview');
      expect(dest).not.toContain('session');
    });
  });

  describe('7. Closed-state view & notify payload per role', () => {
    function resolveClosedViewContent(role: ApplicationRole | null | undefined, inviteNotice?: string) {
      const roleTitle = role ? ROLE_LABELS[role] : null;
      const notifySource = role ? `join-${role}` : 'join';
      const pill = roleTitle ? `${roleTitle} Admissions Closed` : 'Applications Closed';
      const heading = roleTitle ? `${roleTitle} Applications are Closed` : 'Registration is Closed at the Moment';

      return { roleTitle, notifySource, pill, heading, inviteNotice };
    }

    it.each(APPLICATION_ROLES)('generates correct closed view & notify payload for canonical role "%s"', (role) => {
      const res = resolveClosedViewContent(role);
      const title = ROLE_LABELS[role];
      expect(res.heading).toBe(`${title} Applications are Closed`);
      expect(res.pill).toBe(`${title} Admissions Closed`);
      expect(res.notifySource).toBe(`join-${role}`);
    });

    it('generates neutral closed view with invitation notice and source: "join" for /join?role=staff', () => {
      const rawRole = normalizeRoleSlug('staff');
      expect(rawRole).toBe('staff');
      const isStaff = rawRole === 'staff';
      const effectiveRole = isStaff ? null : rawRole;
      const notice = isStaff ? 'Staff positions are by invitation. Choose an open role below.' : undefined;

      const res = resolveClosedViewContent(effectiveRole, notice);
      expect(res.roleTitle).toBeNull();
      expect(res.heading).toBe('Registration is Closed at the Moment');
      expect(res.pill).toBe('Applications Closed');
      expect(res.notifySource).toBe('join');
      expect(res.inviteNotice).toBe('Staff positions are by invitation. Choose an open role below.');
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

  describe('8. Admin staff link works end-to-end', () => {
    it('successfully creates an admin registration link scoped to roles: ["staff"]', () => {
      const linkInput = {
        name: 'SINet HQ Operations Staff Onboarding',
        roles: ['staff'],
        quota: 5,
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      };
      const parseResult = createRegistrationLinkSchema.safeParse(linkInput);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.roles).toEqual(['staff']);
      }
    });

    it('validates a complete staff application payload against campaignApplicationSchema', () => {
      const staffApplicationPayload = {
        role: 'staff',
        fullName: 'Amina Bello',
        email: 'amina.bello@sinet.africa',
        phone: '+2348098765432',
        location: 'Abuja, FCT',
        education: 'B.Sc Economics',
        experienceYears: '3–5 years',
        skills: ['Operations', 'Logistics'],
        availability: ['Flexible / on-call'],
        emergencyContact: 'Mr. Bello, +2348011122233',
        motivation: 'I want to bring my operational background to scale agricultural supply chains with SINet across Nigeria.',
        hearAbout: 'SINet website',
        documents: {
          resume: '507f1f77bcf86cd799439011',
          coverLetter: '507f1f77bcf86cd799439022',
        },
        codeOfConductAccepted: true,
      };

      const result = campaignApplicationSchema.safeParse(staffApplicationPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('staff');
        expect((result.data as any).education).toBe('B.Sc Economics');
      }
    });

    it('rejects reserved link slugs in schema to prevent shadowing redirects', () => {
      expect(isReservedLinkSlug('student-network')).toBe(true);
      expect(isReservedLinkSlug('campus-ambassadors-2026')).toBe(true);
      expect(isReservedLinkSlug('legitimate-cohort')).toBe(false);

      const reservedInput = {
        name: 'Shadowing Link Attempt',
        slug: 'student-network',
        roles: ['community-member'],
      };
      const result = createRegistrationLinkSchema.safeParse(reservedInput);
      expect(result.success).toBe(false);
    });

    it('rejects invalid staff application payload', () => {
      const invalidStaffPayload = {
        role: 'staff',
        fullName: 'Amina Bello',
        email: 'amina.bello@sinet.africa',
        phone: '+2348098765432',
        location: 'Abuja',
        education: 'B.Sc',
        experienceYears: '3–5 years',
        skills: ['Operations'],
        availability: ['Flexible / on-call'],
        emergencyContact: 'Bello',
        motivation: 'Short', // minLength 40
        hearAbout: 'SINet website',
        documents: {}, // resume missing
        codeOfConductAccepted: true,
      };

      const result = campaignApplicationSchema.safeParse(invalidStaffPayload);
      expect(result.success).toBe(false);
    });
  });
});
