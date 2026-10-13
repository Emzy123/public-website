export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'chapter_lead'
  | 'publisher'
  | 'member'
  | 'applicant';

export const ALL_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'chapter_lead',
  'publisher',
  'member',
  'applicant',
] as const;

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  chapter_lead: 'Chapter Lead (Ambassador)',
  publisher: 'Publisher',
  member: 'Student Member',
  applicant: 'Applicant',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  chapter_lead: 60,
  publisher: 40,
  member: 20,
  applicant: 10,
};

export function hasRole(userRoles: UserRole[], requiredRole: UserRole): boolean {
  if (userRoles.includes('super_admin')) return true;
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  if (userRoles.includes('super_admin')) return true;
  return requiredRoles.some((r) => userRoles.includes(r));
}

export function isGlobalAdmin(userRoles: UserRole[]): boolean {
  return userRoles.includes('super_admin') || userRoles.includes('admin');
}

export function canModerateChapter(
  userRoles: UserRole[],
  userChapterIds: string[],
  targetChapterId: string
): boolean {
  if (isGlobalAdmin(userRoles)) return true;
  if (userRoles.includes('chapter_lead') && userChapterIds.includes(targetChapterId)) {
    return true;
  }
  return false;
}

export function isStaffOrAmbassador(userRoles: UserRole[]): boolean {
  return hasAnyRole(userRoles, ['super_admin', 'admin', 'chapter_lead', 'publisher']);
}

