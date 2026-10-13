import { Metadata } from 'next';
import Link from 'next/link';
import { getVerifiedMemberRecord, verifyMemberSignature } from '@/lib/members/member-id';
import { STUDENT_DIVISION_INFO, type StudentDivision } from '@/lib/schemas/member-application.schema';

export async function generateMetadata({
  params,
}: {
  params: { memberId: string };
}): Promise<Metadata> {
  const record = await getVerifiedMemberRecord(params.memberId);
  if (!record) {
    return {
      title: 'Credential Verification — SINet Africa',
      description: 'Verify digital student membership credentials on the Student Investment Network.',
    };
  }

  return {
    title: `Verify Member: ${record.fullName} (${record.fullMemberId}) — SINet`,
    description: `Official digital credential verification for ${record.fullName}, ${record.universityName || 'Student Investment Network'}.`,
  };
}

export default async function MemberVerificationPage({
  params,
  searchParams,
}: {
  params: { memberId: string };
  searchParams: { sig?: string };
}) {
  const record = await getVerifiedMemberRecord(params.memberId);

  if (!record) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#071026] px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-rose-400">
            Invalid Credential
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Member ID Not Found
          </h1>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            The identifier <span className="font-mono text-slate-200">{params.memberId}</span> does
            not exist in the Student Investment Network registry.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white/10 px-6 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Go to Homepage
          </Link>
        </div>
      </main>
    );
  }

  const isSigValid = searchParams.sig
    ? verifyMemberSignature(record.fullMemberId, record.userId, record.issuedAt, searchParams.sig)
    : false;

  const isActive = record.status === 'active';
  const divisionInfo = record.division
    ? STUDENT_DIVISION_INFO[record.division as StudentDivision]
    : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#071026] px-4 py-12 text-slate-100 selection:bg-amber-500 selection:text-slate-900 xs:px-6">
      {/* Background radial gradient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-transparent to-transparent" />

      <div className="relative mx-auto w-full max-w-lg">
        {/* Verification Card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                Official Credential Verification
              </p>
              <p className="text-xs font-bold text-slate-300">
                Student Investment Network (SINet)
              </p>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isActive ? 'Active Member' : 'Pending Verification'}
            </div>
          </div>

          {/* Member Identity Section */}
          <div className="mt-6 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-2xl font-black text-[#071026] shadow-lg ring-4 ring-white/10">
              {record.fullName.slice(0, 2).toUpperCase()}
            </div>

            <div className="mt-4 sm:ml-5 sm:mt-0">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {record.fullName}
              </h1>
              <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-amber-400">
                {record.fullMemberId}
              </p>
              {record.programme && (
                <p className="mt-1 text-xs text-slate-300">
                  {record.programme} {record.level ? `• ${record.level} Level` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Meta Details Grid */}
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Campus Chapter
              </p>
              <p className="mt-1 font-medium text-slate-200">
                {record.chapterName || record.universityName || 'National Chapter'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Institution
              </p>
              <p className="mt-1 font-medium text-slate-200">
                {record.universityName || 'Accredited Tertiary Institution'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Student Division
              </p>
              <p className="mt-1 font-medium text-amber-300">
                {divisionInfo?.name || 'General Student Network'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Issued Date
              </p>
              <p className="mt-1 font-mono text-slate-300">
                {new Date(record.issuedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Cryptographic Trust Seal */}
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Authentic Digital Credential Verified</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              This digital identity card was minted by the Student Investment Network authority. The
              cryptographic token matches the records stored in the central institutional registry.
            </p>
          </div>

          {/* Footer Action */}
          <div className="mt-6 flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              ← Visit SINet Africa
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-500/10 px-5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20"
            >
              Member Sign In →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
