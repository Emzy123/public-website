import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChapterBySlug } from '@/lib/chapters/chapters';
import { STUDENT_DIVISION_INFO } from '@/lib/schemas/member-application.schema';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const chapter = await getChapterBySlug(params.slug);
  if (!chapter) {
    return {
      title: 'Chapter Not Found — SINet',
      description: 'The requested campus chapter does not exist.',
    };
  }

  return {
    title: `${chapter.name} (${chapter.campusCode}) — SINet`,
    description: `Official campus chapter of SINet at ${chapter.universityName}, Kogi State.`,
  };
}

export default async function ChapterDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const chapter = await getChapterBySlug(params.slug);

  if (!chapter) {
    notFound();
  }

  const divisionStats = [
    {
      key: 'student_finance',
      ...STUDENT_DIVISION_INFO.student_finance,
      count: chapter.divisionCounts.student_finance,
      accent: 'from-amber-600 to-amber-500',
      badgeBg: 'bg-amber-100 text-amber-900',
    },
    {
      key: 'student_enterprise',
      ...STUDENT_DIVISION_INFO.student_enterprise,
      count: chapter.divisionCounts.student_enterprise,
      accent: 'from-sky-600 to-sky-500',
      badgeBg: 'bg-sky-100 text-sky-900',
    },
    {
      key: 'governance_records',
      ...STUDENT_DIVISION_INFO.governance_records,
      count: chapter.divisionCounts.governance_records,
      accent: 'from-purple-600 to-purple-500',
      badgeBg: 'bg-purple-100 text-purple-900',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* Chapter Hero */}
      <section className="border-b border-slate-200/80 bg-white/90 px-4 py-12 backdrop-blur-md xs:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/chapters"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-amber-700 hover:text-amber-800"
          >
            ← Back to Chapters Directory
          </Link>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#071026] px-3 py-1 font-mono text-xs font-black text-amber-400">
                  {chapter.campusCode}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  Active Chapter
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {chapter.state} State
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#071026] sm:text-4xl md:text-5xl">
                {chapter.name}
              </h1>

              <p className="mt-2 text-base font-semibold text-amber-800 sm:text-lg">
                {chapter.universityName} ({chapter.universityShortName})
              </p>

              {chapter.description && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {chapter.description}
                </p>
              )}
            </div>

            {/* Quick Action Card */}
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:w-auto sm:min-w-[280px]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Campus Members
                </p>
                <p className="mt-1 text-3xl font-black text-[#071026]">{chapter.memberCount}</p>
              </div>

              <Link
                href={`/join?role=community-member&chapter=${chapter.slug}`}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#071026] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Join {chapter.universityShortName} Chapter →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Chapter Content */}
      <main className="mx-auto max-w-6xl px-4 py-10 xs:px-6 md:py-14">
        {/* SECTION 1: Three Ecosystem Divisions */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Student Ecosystem
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#071026] sm:text-3xl">
            Divisions at this Chapter
          </h2>
          <p className="mt-2 text-xs text-slate-600 sm:text-sm">
            Every member of SINet belongs to one of three operational
            divisions:
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {divisionStats.map((div) => (
              <div
                key={div.key}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${div.badgeBg}`}>
                      {div.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {div.count} {div.count === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-600">
                    {div.description}
                  </p>

                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-900">Campus Activities:</span>{' '}
                    {div.focus}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={`/join?role=community-member&chapter=${chapter.slug}`}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800"
                  >
                    Apply for this division →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Chapter Leadership / Ambassador Spotlight */}
        <div className="mt-14">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Campus Representation
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#071026] sm:text-3xl">
            Chapter Leadership & Ambassador
          </h2>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {chapter.leads.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {chapter.leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-600 font-bold text-white shadow-sm">
                      {lead.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{lead.fullName}</h4>
                      <p className="text-xs font-semibold text-amber-800">
                        Campus Chapter Ambassador
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h3 className="text-lg font-bold text-[#071026]">
                    Apply to Lead the {chapter.universityShortName} Chapter
                  </h3>
                  <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                    SINet is accepting applications for the 2026/2027 Campus Ambassador cohort. Lead your
                    peers, coordinate financial literacy clubs, and represent SINet at {chapter.universityName}.
                  </p>
                </div>
                <Link
                  href={`/join?role=ambassador&chapter=${chapter.slug}`}
                  className="inline-flex min-h-[44px] items-center rounded-xl bg-amber-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
                >
                  Apply as Campus Ambassador →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Bottom Call to Action */}
        <div className="mt-14 rounded-3xl bg-gradient-to-br from-[#071026] to-[#0d1a4a] p-8 text-white shadow-xl sm:p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-amber-400">
            {chapter.campusCode} Student Chapter
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl md:text-4xl">
            Start Your Journey at {chapter.universityShortName}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
            Join hundreds of Nigerian students gaining practical investment literacy, venture incubation,
            and leadership credentials before graduation.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/join?role=community-member&chapter=${chapter.slug}`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-amber-600 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-amber-500"
            >
              Apply to Join Chapter →
            </Link>
            <Link
              href="/chapters"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore Other Campuses
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
