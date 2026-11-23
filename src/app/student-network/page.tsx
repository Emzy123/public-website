import Link from 'next/link';

export const metadata = {
  title: 'Student Network | SINet',
  description: 'A dedicated SINet pathway for student membership, 3 core divisions, and campus participation.',
};

const STEPS = [
  ['01', 'Verify your email', 'Confirm you are reachable with a campus or personal email.'],
  ['02', 'Complete your university profile', 'Share school, programme, and how you want to contribute.'],
  ['03', 'Submit for review', 'SINet reviews student applications during open campaign windows.'],
  ['04', 'Receive your SINet Member ID', 'Approved students get a unique Member ID for the network.'],
];

export default function StudentNetworkPage() {
  return (
    <div className="min-h-screen bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="orange-grid bg-[#d9711b] px-4 py-14 text-[#f6f2e8] xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1180px] gap-8 md:gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[.16em]">Student Network</p>
            <h1 className="mt-6 font-editorial text-[clamp(2.75rem,8vw,6rem)] leading-[.86] tracking-[-.06em]">
              Start with community.
            </h1>
            {/* TODO [OWNER APPROVAL]: Verify student network purpose and timeline claims */}
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#fff2df] md:mt-8">
              The Student Network is a dedicated SINet space for university members who want to learn, contribute, and
              build responsible ownership before they graduate.
            </p>
          </div>
          <div className="self-end font-editorial text-[clamp(5rem,15vw,10rem)] leading-none tracking-[-.1em] text-[#f6f2e8]/85">
            01
          </div>
        </div>
      </section>

      {/* The 3 Student Divisions: Student Finance, Student Enterprise, Governance & Records */}
      <section className="mx-auto max-w-[1180px] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Network Structure</p>
        <h2 className="mt-4 font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.92] tracking-[-.05em]">
          Three Student Divisions
        </h2>
        <p className="mt-4 max-w-2xl text-base text-[#5b554a]">
          Every student member aligns with one of our three core divisions, driving practical peer initiatives and campus execution.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="border border-[#0d1a4a]/20 bg-white p-6 xs:p-8">
            <span className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">Division 01</span>
            <h3 className="mt-2 font-editorial text-2xl text-[#0d1a4a]">Student Finance</h3>
            <p className="mt-3 text-sm leading-6 text-[#5b554a]">
              Financial literacy, capital markets, investment research, and personal wealth mastery across campus communities.
            </p>
          </div>
          <div className="border border-[#0d1a4a]/20 bg-white p-6 xs:p-8">
            <span className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">Division 02</span>
            <h3 className="mt-2 font-editorial text-2xl text-[#0d1a4a]">Student Enterprise</h3>
            <p className="mt-3 text-sm leading-6 text-[#5b554a]">
              Campus venture creation, entrepreneurship sprints, pitch showcases, and SME growth for student-led businesses.
            </p>
          </div>
          <div className="border border-[#0d1a4a]/20 bg-white p-6 xs:p-8">
            <span className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">Division 03</span>
            <h3 className="mt-2 font-editorial text-2xl text-[#0d1a4a]">Governance &amp; Records</h3>
            <p className="mt-3 text-sm leading-6 text-[#5b554a]">
              Chapter operations, student advocacy, treasury oversight, and institutional record-keeping across university chapters.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#0d1a4a]/15 bg-[#eee6d0] px-4 py-14 xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] grid gap-8 md:gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">The pathway</p>
            <h2 className="mt-5 font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.9] tracking-[-.05em]">
              Membership designed for students.
            </h2>
          </div>
          <div className="grid gap-px border border-[#0d1a4a]/20 bg-[#0d1a4a]/10 xs:grid-cols-2">
            {STEPS.map(([number, title, body]) => (
              <div key={number} className="bg-white p-5 xs:p-6">
                <p className="font-data text-xs text-[#d9711b]">{number}</p>
                <h3 className="mt-5 font-editorial text-xl xs:mt-7 xs:text-2xl">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b554a]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#0d1a4a]/15 bg-white px-4 py-14 xs:px-5 md:py-16 lg:px-8">
        <div className="mx-auto max-w-[1180px] grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">Join now</p>
            <h2 className="mt-4 font-editorial text-[clamp(2rem,4vw,3rem)] leading-[.95] tracking-[-.04em]">
              While the student portal is in build, join through SINet membership routes.
            </h2>
            {/* TODO [OWNER APPROVAL]: Verify student campaign intake routes and ambassador requirements */}
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5b554a]">
              Open campaign links accept student ambassadors and community members. If you do not have a link yet,
              contact SINet and ask to be notified for the next student intake.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/membership"
              className="inline-flex min-h-[48px] items-center justify-center bg-[#0d1a4a] px-6 text-sm font-bold text-white hover:bg-[#d9711b]"
            >
              Explore membership
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center border border-[#0d1a4a] px-6 text-sm font-bold hover:border-[#d9711b] hover:text-[#d9711b]"
            >
              Request student intake
            </Link>
            <Link
              href="/academy"
              className="inline-flex min-h-[48px] items-center justify-center border border-[#0d1a4a]/20 px-6 text-sm font-bold text-[#5b554a] hover:border-[#d9711b] hover:text-[#d9711b]"
            >
              Academy interest
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#0d1a4a] px-4 py-14 text-[#f6f2e8] xs:px-5 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#eccb7c]">Coming next</p>
          <h2 className="mt-5 max-w-2xl font-editorial text-[clamp(2.25rem,5vw,3.5rem)] leading-[.9] tracking-[-.05em]">
            A secure student membership portal.
          </h2>
          {/* TODO [OWNER APPROVAL]: Confirm planned student portal technical specifications */}
          <p className="mt-7 max-w-2xl leading-7 text-[#c9ccda]">
            The student-specific onboarding portal will include email verification, academic profile review, secure
            document storage, approval remarks, and a unique Member ID. It is being designed as a distinct system and is
            not substituted by the general membership application.
          </p>
        </div>
      </section>
    </div>
  );
}
