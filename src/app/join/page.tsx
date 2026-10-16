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

export default async function JoinIndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const target = await getActiveMembershipApplication();

  if (target.status === 'open') {
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
    const destination = queryStr ? `${target.url}?${queryStr}` : target.url;
    redirect(destination);
  }

  const rawRole =
    typeof searchParams?.role === 'string'
      ? searchParams.role
      : Array.isArray(searchParams?.role)
        ? searchParams.role[0]
        : undefined;
  const role = normalizeRoleSlug(rawRole);

  return <RegistrationClosedView role={role} />;
}
