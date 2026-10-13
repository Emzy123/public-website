'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DigitalMemberIdCard, type MemberCardData } from '@/components/members/DigitalMemberIdCard';

export default function OfflinePage() {
  const [cachedCard, setCachedCard] = useState<MemberCardData | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sinet_cached_member_card');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCachedCard(parsed);
        }
      } catch (err) {
        console.warn('Failed to parse cached member card:', err);
      } finally {
        setIsChecking(false);
      }
    }
  }, []);

  const handleRetry = () => {
    setReconnecting(true);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#071026] px-3.5 py-10 text-white xs:px-6">
      {/* Background radial highlight */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent" />

      <div className="relative mx-auto w-full max-w-lg space-y-6">
        {/* Header Alert */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-center shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.828m2.829 2.828L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.828m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.829-2.828m-2.829 2.828L3 21m2.828-5.657a5 5 0 010-7.072m0 0l2.829 2.828"
              />
            </svg>
          </div>

          <span className="mt-3 inline-block rounded-full bg-amber-500/20 px-3 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 ring-1 ring-amber-500/40">
            OFFLINE MODE
          </span>

          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            You are Currently Offline
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            No internet connection detected, but your saved credentials remain accessible right here.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleRetry}
              disabled={reconnecting}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-400 disabled:opacity-60"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {reconnecting ? 'Reconnecting…' : 'Try Reconnecting'}
            </button>
            <Link
              href="/portal"
              className="inline-flex min-h-[38px] items-center rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              Go to Portal
            </Link>
          </div>
        </div>

        {/* Local Member ID Viewer */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Offline Digital Member ID</h2>
              <p className="text-[11px] text-slate-400">Stored locally on your device storage</p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400">
              Zero Data Needed
            </span>
          </div>

          {isChecking ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading saved pass…</div>
          ) : cachedCard ? (
            <DigitalMemberIdCard card={cachedCard} />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="text-xs text-slate-300">
                No Member ID cached on this device yet.
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Sign in to your account while connected to automatically save your ID pass for offline use.
              </p>
              <Link
                href="/sign-in"
                className="mt-3 inline-flex min-h-[36px] items-center rounded-xl bg-amber-500/20 px-4 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40"
              >
                Sign In when online →
              </Link>
            </div>
          )}
        </div>

        {/* Budget Android & Data Saver Tips */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400">
          <h3 className="font-bold text-slate-200">Tips for Nigerian Student Data Savers</h3>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
            <li>
              • <strong>Install to Home Screen:</strong> Tap your browser menu and choose &ldquo;Add to Home screen&rdquo; to use SINet like a native mobile app.
            </li>
            <li>
              • <strong>Save Pass to Files:</strong> Tap &ldquo;Save Pass&rdquo; on your card to download an offline HTML pass that opens even with mobile data switched off.
            </li>
            <li>
              • <strong>Fast Loading:</strong> All credentials and QR verification codes are generated natively in lightweight SVG without heavy images.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
