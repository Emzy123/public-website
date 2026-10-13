import { redirect } from 'next/navigation';
import { getActiveMembershipApplication } from '@/lib/applications/active-link';
import { RegistrationClosedView } from '@/components/applications/RegistrationClosedView';

export const metadata = {
  title: 'Join SINet | Admissions & Membership',
  description:
    'Apply to join the Student Investment Network or get notified when the next cohort opens.',
};

export const dynamic = 'force-dynamic';

export default async function JoinIndexPage() {
  const target = await getActiveMembershipApplication();

  if (target.status === 'open') {
    redirect(target.url);
  }

  return <RegistrationClosedView />;
}
