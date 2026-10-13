'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DigitalMemberIdCard, type MemberCardData } from '@/components/members/DigitalMemberIdCard';
import { STUDENT_DIVISION_INFO, type StudentDivision } from '@/lib/schemas/member-application.schema';

type UserData = {
  id: string;
  email: string;
  phone: string | null;
  roles: string[];
  is2faAuthenticated: boolean;
  profile: {
    fullName: string;
    avatarUrl: string | null;
    bio: string | null;
    programme: string | null;
    level: string | null;
    division: string | null;
    status: string;
    referralCode: string;
    profileCompletenessPct: number;
  } | null;
  memberId: string | null;
  memberCard: MemberCardData | null;
  chapter: {
    id: string;
    name: string;
    slug: string;
    universityName?: string;
    universityShortName?: string;
  } | null;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    awardedAt: string;
  }>;
};

export function PortalClient({ user }: { user: UserData }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/sign-in');
    router.refresh();
  };

  const referralLink = user.profile?.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.sinet.africa'}/join?ref=${user.profile.referralCode}`
    : '';

  const copyReferral = () => {
    if (referralLink && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2500);
    }
  };

  const divisionInfo = user.profile?.division
    ? STUDENT_DIVISION_INFO[user.profile.division as StudentDivision]
    : null;

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#071026] text-xs font-black text-amber-400">
              SI
            </span>
            <span className="font-bold text-sm text-[#071026]">Student Investment Network</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        {/* Welcome Banner */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Member Portal</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#071026] sm:text-3xl">
            Welcome, {user.profile?.fullName || user.email.split('@')[0]}
          </h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {user.chapter?.universityName || 'Student Network Member'} •{' '}
            {divisionInfo?.name || 'General Division'}
          </p>
        </div>

        {/* Grid Layout: Card on Left, Details on Right */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: Digital ID Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Digital Member ID</h2>
                <span className="text-[11px] font-semibold text-slate-500">Tap card to flip</span>
              </div>

              {user.memberCard ? (
                <DigitalMemberIdCard card={user.memberCard} />
              ) : (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-amber-900">Application Under Review</h3>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Your digital Member ID card will be minted automatically once your campus chapter application is approved.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Chapter, Division, Badges & Referral */}
          <div className="space-y-6 lg:col-span-7">
            {/* Campus Chapter Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Campus Chapter Affiliation
              </h2>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#071026] font-mono text-sm font-black text-amber-400">
                  {user.chapter?.universityShortName || 'SIN'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {user.chapter?.name || 'Kogi State Tertiary Institutions Chapter'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {user.chapter?.universityName || 'Federal University Lokoja / State Campuses'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      Programme: {user.profile?.programme || 'General'}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      Level: {user.profile?.level || 'Undergraduate'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Division & Focus */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Student Division
              </h2>
              {divisionInfo ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                      {divisionInfo.name}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {divisionInfo.description}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Focus Areas:</span> {divisionInfo.focus}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Assigned after initial onboarding review.
                </p>
              )}
            </div>

            {/* Earned Badges */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Earned Credentials & Badges ({user.badges.length})
              </h2>
              {user.badges.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {user.badges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{b.name}</h4>
                        <p className="text-[11px] text-slate-500">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Badges will be unlocked as you complete your profile and participate weekly.
                </p>
              )}
            </div>

            {/* Referral Code Card */}
            {user.profile?.referralCode && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Invite Fellow Students
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Share your unique referral code with fellow students on campus.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs font-bold text-slate-800">
                    {user.profile.referralCode}
                  </div>
                  <button
                    onClick={copyReferral}
                    className="rounded-xl bg-[#071026] px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    {copiedReferral ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
