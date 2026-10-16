import { redirect } from 'next/navigation';
import { getActiveMembershipApplication } from '@/lib/applications/active-link';
import { RegistrationClosedView } from '@/components/applications/RegistrationClosedView';
import { normalizeRoleSlug } from '@/lib/types/membership';

export const metadata = {
  title: 'Join SINet | Admissions & Membership',
  description:
    'Apply to join SINet or get notified when the next cohort opens.',
};

export const dynamic = 'force-dynamic';

const ALLOWED_UTM_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]);

export default async function JoinIndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
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

  if (target.status === 'open') {
    const qs = new URLSearchParams();
    // Only forward whitelisted, public canonical role slugs
    if (publicRole) {
      qs.set('role', publicRole);
    }

    // Whitelist utm_* attribution and referral parameters only
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
    const destination = queryStr ? `${target.url}?${queryStr}` : target.url;
    redirect(destination);
  }

  return <RegistrationClosedView role={publicRole} inviteNotice={staffNotice} />;
}
