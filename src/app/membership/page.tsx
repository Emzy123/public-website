import Link from 'next/link';

export const metadata = {
  title: 'Join SINet | Membership',
  description: 'Learn how to join SINet as a volunteer, community member, ambassador, staff member, or partnership contact.',
};

export default function MembershipPage() {
  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Membership</p>
          <h1 className="mt-6 max-w-3xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.9] tracking-[-.06em]">Join SINet</h1>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">
            SINet membership opens through admin-controlled application periods — each scoped to specific roles and shared via a unique link. There is no always-open general registration form.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <h2 className="font-editorial text-3xl tracking-[-.04em]">Ways to join</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['Volunteer', 'Support outreach, events, and community programs.'],
            ['Community Member', 'Join the network, events, and updates.'],
            ['Ambassador', 'Represent SINet in your campus or region.'],
            ['Staff', 'Apply for an internal role with SINet.'],
            ['Partnership & Investment Interest', 'Express business or partnership interest — our team follows up directly. No amounts or tiers.'],
          ].map(([title, body]) => (
            <div key={title} className="border border-[#0d1a4a]/20 bg-white p-6">
              <h3 className="font-editorial text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5b554a]">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-7 text-[#5b554a]">
          When an application period is open, you will receive a link from SINet. If the period has closed, you can leave your email on the closed-link page to be notified next time.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/student-network" className="inline-flex min-h-[48px] items-center justify-center bg-[#0d1a4a] px-6 text-sm font-bold text-white hover:bg-[#d9711b]">Student Network (evergreen)</Link>
          <Link href="/contact" className="inline-flex min-h-[48px] items-center justify-center border border-[#0d1a4a] px-6 text-sm font-bold hover:border-[#d9711b] hover:text-[#d9711b]">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
