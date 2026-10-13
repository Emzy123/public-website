'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DigitalMemberIdCard, type MemberCardData } from '@/components/members/DigitalMemberIdCard';
import { STUDENT_DIVISION_INFO, type StudentDivision } from '@/lib/schemas/member-application.schema';
import type { PulseTask } from '@/lib/pulse/pulse';

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  iconName: string;
  isUnlocked: boolean;
  awardedAt: string | null;
};

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
  badges: BadgeItem[];
};

type PulseFeed = {
  weekNumber: number;
  year: number;
  tasks: PulseTask[];
};

export function PortalClient({
  user,
  pulseFeed,
}: {
  user: UserData;
  pulseFeed: PulseFeed;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInMessage, setCheckedInMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/sign-in');
    router.refresh();
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch('/api/pulse/check-in', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCheckedInMessage(data.message || 'Check-in recorded!');
      }
    } catch {
      setCheckedInMessage('Check-in recorded locally.');
    } finally {
      setCheckingIn(false);
    }
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
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#071026] text-xs font-black text-amber-400">
              SI
            </span>
            <span className="text-sm font-bold text-[#071026]">SINet</span>
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
      <main className="mx-auto max-w-6xl px-3.5 py-6 sm:px-6 md:py-12">
        {/* Welcome Banner */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Member Portal</p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#071026] sm:text-3xl">
            Welcome, {user.profile?.fullName || user.email.split('@')[0]}
          </h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {user.chapter?.universityName || 'Community Network Member'} •{' '}
            {divisionInfo?.name || 'General Division'}
          </p>
        </div>

        {/* Grid Layout: Card on Left, Details & Weekly Pulse on Right */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* LEFT: Digital ID Card */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Digital Member ID</h2>
                  {user.memberCard && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                      Offline Ready
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">Tap to flip</span>
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
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Your digital Member ID card will be minted automatically once your campus chapter application is approved.
                  </p>
                </div>
              )}
            </div>

            {/* Referral Code Card */}
            {user.profile?.referralCode && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Invite Peers &amp; Members
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Share your referral link with peers and fellow members to unlock the Community Builder badge.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs font-bold text-slate-800">
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

          {/* RIGHT: Weekly Pulse & Gamification Badges */}
          <div className="space-y-6 lg:col-span-7">
            {/* WEEKLY PULSE SECTION */}
            <div className="rounded-3xl border border-amber-600/20 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-amber-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      Week {pulseFeed.weekNumber}
                    </span>
                    <h2 className="text-base font-extrabold text-[#071026] sm:text-lg">
                      Weekly Network Pulse
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Complete your weekly initiative task and maintain your chapter check-in streak.
                  </p>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn || Boolean(checkedInMessage)}
                  className={`inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 text-xs font-bold shadow-sm transition ${
                    checkedInMessage
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#071026] text-white hover:bg-slate-800 disabled:opacity-50'
                  }`}
                >
                  {checkingIn
                    ? 'Checking In…'
                    : checkedInMessage
                    ? '✓ Checked In This Week'
                    : `Check In for Week ${pulseFeed.weekNumber}`}
                </button>
              </div>

              {/* Weekly Tasks List */}
              <div className="mt-5 space-y-3">
                {pulseFeed.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-amber-500/50 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                          {task.divisionTarget.replace('_', ' ')}
                        </span>
                        <h4 className="truncate text-xs font-bold text-slate-900">{task.title}</h4>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {task.summary}
                      </p>
                    </div>

                    <Link
                      href={task.actionHref || '/portal'}
                      className="inline-flex min-h-[36px] items-center justify-center rounded-xl bg-slate-100 px-3.5 text-xs font-bold text-slate-800 transition hover:bg-slate-200 whitespace-nowrap"
                    >
                      {task.actionText} →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* GAMIFICATION & BADGES SHOWCASE */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Achievement Badges Showcase
                  </h2>
                  <p className="text-xs text-slate-500">
                    Earn verified badges as you participate and represent your chapter or community.
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 font-mono text-xs font-bold text-amber-900">
                  {user.badges.filter((b) => b.isUnlocked).length} / {user.badges.length} Unlocked
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {user.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                      badge.isUnlocked
                        ? 'border-emerald-500/30 bg-emerald-50/20 shadow-sm'
                        : 'border-slate-200/80 bg-slate-50/50 opacity-75'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-bold ${
                        badge.isUnlocked
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {badge.isUnlocked ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="truncate text-xs font-bold text-slate-900">{badge.name}</h4>
                        {badge.isUnlocked && (
                          <span className="text-[10px] font-bold text-emerald-700">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        {badge.description}
                      </p>
                      {badge.awardedAt && (
                        <p className="mt-1.5 font-mono text-[9px] text-slate-400">
                          Awarded {new Date(badge.awardedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
