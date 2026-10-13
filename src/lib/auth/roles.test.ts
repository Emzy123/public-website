import {
  hasRole,
  hasAnyRole,
  isGlobalAdmin,
  canModerateChapter,
  isStaffOrAmbassador,
  type UserRole,
} from './roles';

describe('Roles and Permissions Engine', () => {
  it('correctly checks role access in hasRole', () => {
    // Super admin has universal role access
    expect(hasRole(['super_admin'], 'admin')).toBe(true);
    expect(hasRole(['super_admin'], 'chapter_lead')).toBe(true);
    expect(hasRole(['super_admin'], 'member')).toBe(true);
    expect(hasRole(['super_admin'], 'applicant')).toBe(true);

    // Admin has admin role, but not super_admin
    expect(hasRole(['admin'], 'super_admin')).toBe(false);
    expect(hasRole(['admin'], 'admin')).toBe(true);
    expect(hasRole(['admin'], 'chapter_lead')).toBe(false);

    // Chapter lead cannot access admin
    expect(hasRole(['chapter_lead'], 'admin')).toBe(false);
    expect(hasRole(['chapter_lead'], 'chapter_lead')).toBe(true);

    // Member has member role
    expect(hasRole(['member'], 'chapter_lead')).toBe(false);
    expect(hasRole(['member'], 'member')).toBe(true);

    // Applicant has applicant role
    expect(hasRole(['applicant'], 'member')).toBe(false);
    expect(hasRole(['applicant'], 'applicant')).toBe(true);
  });

  it('checks hasAnyRole across multiple required roles', () => {
    expect(hasAnyRole(['super_admin'], ['admin', 'publisher'])).toBe(true);
    expect(hasAnyRole(['publisher'], ['admin', 'publisher'])).toBe(true);
    expect(hasAnyRole(['member'], ['admin', 'publisher'])).toBe(false);
    expect(hasAnyRole(['member', 'chapter_lead'], ['chapter_lead', 'admin'])).toBe(true);
  });

  it('verifies global admin status', () => {
    expect(isGlobalAdmin(['super_admin'])).toBe(true);
    expect(isGlobalAdmin(['admin'])).toBe(true);
    expect(isGlobalAdmin(['chapter_lead'])).toBe(false);
    expect(isGlobalAdmin(['member'])).toBe(false);
    expect(isGlobalAdmin([])).toBe(false);
  });

  it('verifies chapter moderation permission with campus scoping', () => {
    // Global admin can moderate any chapter
    expect(canModerateChapter(['admin'], [], 'kogi-fulokoja')).toBe(true);
    expect(canModerateChapter(['super_admin'], [], 'kogi-paau')).toBe(true);

    // Chapter lead can moderate their assigned chapter
    expect(canModerateChapter(['chapter_lead'], ['kogi-fulokoja'], 'kogi-fulokoja')).toBe(true);

    // Chapter lead CANNOT moderate a different chapter
    expect(canModerateChapter(['chapter_lead'], ['kogi-fulokoja'], 'kogi-paau')).toBe(false);

    // Standard member cannot moderate even their own chapter
    expect(canModerateChapter(['member'], ['kogi-fulokoja'], 'kogi-fulokoja')).toBe(false);
  });

  it('identifies staff or ambassador roles', () => {
    expect(isStaffOrAmbassador(['super_admin'])).toBe(true);
    expect(isStaffOrAmbassador(['admin'])).toBe(true);
    expect(isStaffOrAmbassador(['chapter_lead'])).toBe(true);
    expect(isStaffOrAmbassador(['publisher'])).toBe(true);
    expect(isStaffOrAmbassador(['member'])).toBe(false);
    expect(isStaffOrAmbassador(['applicant'])).toBe(false);
  });
});
