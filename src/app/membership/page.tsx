import Link from 'next/link';
import { getActiveMembershipApplication } from '@/lib/applications/active-link';
import { MembershipRolesGrid } from '@/components/membership/MembershipRolesGrid';

export const metadata = {
  title: 'Join SINet | Membership',
  description:
    'Learn how to join SINet as a volunteer, community member, ambassador, staff member, or partnership contact.',
};

export const dynamic = 'force-dynamic';

export default async function MembershipPage() {
  const activeTarget = await getActiveMembershipApplication();

  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      {/* Live Application Status Banner */}
      <div
        className={`border-b px-4 py-3 text-center text-xs font-semibold sm:px-6 ${
          activeTarget.status === 'open'
            ? 'border-emerald-600/30 bg-emerald-50 text-emerald-950'
            : 'border-amber-600/30 bg-amber-50 text-amber-950'
        }`}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                activeTarget.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {activeTarget.status === 'open' ? (
                <>
                  <strong>Admissions Open:</strong> {activeTarget.name} is currently accepting applications.
                </>
              ) : (
                <>
                  <strong>Admissions Notice:</strong> Registration is currently closed at the moment.
                </>
              )}
            </span>
          </div>

          <Link
            href={activeTarget.status === 'open' ? activeTarget.url : '/join'}
            className={`rounded-lg px-3.5 py-1 text-xs font-bold transition shadow-sm ${
              activeTarget.status === 'open'
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-[#0d1a4a] text-white hover:bg-[#d9711b]'
            }`}
          >
            {activeTarget.status === 'open' ? 'Apply Now →' : 'Join Waitlist →'}
          </Link>
        </div>
      </div>

      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Membership</p>
          <h1 className="mt-6 max-w-3xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.9] tracking-[-.06em]">
            Join SINet
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#554e43]">
            SINet membership opens through admin-controlled application periods — each scoped to specific roles and shared via a unique link. When an application period is active, our Admissions Portal opens for submissions.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={activeTarget.status === 'open' ? activeTarget.url : '/join'}
              className="inline-flex min-h-[48px] items-center justify-center bg-[#0d1a4a] px-6 text-sm font-bold text-white transition hover:bg-[#d9711b]"
            >
              {activeTarget.status === 'open' ? 'Start Application Process →' : 'Check Application Status / Waitlist →'}
            </Link>
            <Link
              href="/chapters"
              className="inline-flex min-h-[48px] items-center justify-center border border-[#0d1a4a] px-6 text-sm font-bold text-[#0d1a4a] transition hover:border-[#d9711b] hover:text-[#d9711b]"
            >
              Explore Campus Chapters
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <h2 className="font-editorial text-3xl tracking-[-.04em]">Ways to join</h2>
        <MembershipRolesGrid isOpen={activeTarget.status === 'open'} />
        <p className="mt-10 max-w-2xl text-sm leading-7 text-[#5b554a]">
          When an application period is open, the &ldquo;Join SINet&rdquo; button takes you directly to the active registration wizard. If all application rounds are closed, you can leave your email to receive priority notification when the next window opens.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/student-network"
            className="inline-flex min-h-[48px] items-center justify-center bg-[#0d1a4a] px-6 text-sm font-bold text-white hover:bg-[#d9711b]"
          >
            Student Network (3 Divisions)
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] items-center justify-center border border-[#0d1a4a] px-6 text-sm font-bold hover:border-[#d9711b] hover:text-[#d9711b]"
          >
            Contact Admissions Team
          </Link>
        </div>
      </section>
    </div>
  );
}
