import { redirect } from 'next/navigation';
import { getActiveMembershipApplication } from '@/lib/applications/active-link';
import { RegistrationClosedView } from '@/components/applications/RegistrationClosedView';
import { normalizeRoleSlug } from '@/lib/types/membership';
import { buildJoinRedirectUrl } from '@/lib/registration-links';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: 'Join SINet | Admissions & Membership',
  description:
    'Apply to join SINet or get notified when the next cohort opens.',
};

export const dynamic = 'force-dynamic';

export default async function JoinIndexPage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const target = await getActiveMembershipApplication();

  const rawRole =
    typeof searchParams?.role === 'string'
      ? searchParams.role
      : Array.isArray(searchParams?.role)
        ? searchParams.role[0]
        : undefined;
  const canonicalRole = normalizeRoleSlug(rawRole);
  const isStaffRequested = canonicalRole === 'staff';
  const publicRole = isStaffRequested ? null : canonicalRole;
  const staffNotice = isStaffRequested
    ? 'Staff positions are by invitation. Choose an open role below.'
    : undefined;

  const rawChapter =
    typeof searchParams?.chapter === 'string'
      ? searchParams.chapter
      : Array.isArray(searchParams?.chapter)
        ? searchParams.chapter[0]
        : undefined;
  const validChapter =
    rawChapter && /^[a-zA-Z0-9_-]{1,64}$/.test(rawChapter)
      ? rawChapter.toLowerCase()
      : undefined;

  if (target.status === 'open') {
    const destination = buildJoinRedirectUrl(target.url, searchParams);
    redirect(destination);
  }

  return (
    <RegistrationClosedView
      role={publicRole}
      inviteNotice={staffNotice}
      chapter={validChapter}
    />
  );
}

