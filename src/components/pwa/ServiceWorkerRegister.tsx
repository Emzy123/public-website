'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DigitalMemberIdCard, type MemberCardData } from '@/components/members/DigitalMemberIdCard';
import { CONTACT_PHONE, CONTACT_PHONE_RAW } from '@/lib/site-config';

export function ServiceWorkerRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cachedCard, setCachedCard] = useState<MemberCardData | null>(null);
  const [checkingCard, setCheckingCard] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  // Load cached member card from localStorage
  const loadCachedCard = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('sinet_cached_member_card');
      if (stored) {
        setCachedCard(JSON.parse(stored));
      } else {
        setCachedCard(null);
      }
    } catch {
      setCachedCard(null);
    } finally {
      setCheckingCard(false);
    }
  };

  useEffect(() => {
    // 1. Service Worker registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[SINet SW] Registered scope:', registration.scope);
            }
          })
          .catch((err) => {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[SINet SW] Registration failed:', err);
            }
          });
      });
    }

    // 2. Offline / Online event listeners
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      setIsMinimized(false);
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
      setIsMinimized(false); // Automatically show when network becomes unavailable
      loadCachedCard();
    };

    if (typeof window !== 'undefined') {
      const offlineNow = !navigator.onLine;
      setIsOffline(offlineNow);
      if (offlineNow) {
        loadCachedCard();
      }
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const handleTestReconnect = async () => {
    setReconnecting(true);
    try {
      const res = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
      if (res.ok) {
        setIsOffline(false);
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 3000);
      }
    } catch {
      // Still offline
    } finally {
      setReconnecting(false);
    }
  };

  // 1. Just Reconnected Notification Toast
  if (justReconnected) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-[#071026]/95 px-5 py-3 text-white shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3"
      >
        <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
        <div>
          <p className="text-xs font-bold text-emerald-300">Connection Restored</p>
          <p className="text-[11px] text-slate-300">You are back online. Resynced with SINet network.</p>
        </div>
      </aside>
    );
  }

  if (!isOffline) return null;

  // 2. Minimized floating pill (when user wants to keep reading cached pages)
  if (isMinimized) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-2xl border border-amber-500/50 bg-[#071026]/95 px-4 py-2.5 text-white shadow-2xl backdrop-blur-md transition hover:bg-[#071026]"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <div className="text-xs">
          <p className="font-bold text-amber-300">Offline Mode Active</p>
          <p className="text-[10px] text-slate-400">Browsing cached resources</p>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="ml-2 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
        >
          View ID / Details ↑
        </button>
      </aside>
    );
  }

  // 3. Automated Full Offline Experience Modal
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Offline Mode Notification"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-5"
    >
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-amber-500/30 bg-[#071026] p-5 text-white shadow-2xl ring-1 ring-white/10 sm:p-7">
        {/* Top Header with live offline pulse */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500" />
            </span>
            <div>
              <span className="inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 ring-1 ring-amber-500/40">
                AUTOMATED OFFLINE PROCESS
              </span>
              <h2 className="mt-1 text-lg font-extrabold text-white sm:text-xl">
                Network Unavailable
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize offline screen"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-xs font-semibold">Minimize ↘</span>
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
          No internet connection detected on your device. SINet has automatically switched to offline mode. All locally cached resources, credentials, and contact details are available below without requiring data.
        </p>

        {/* Cached Member ID Presentation */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Offline Digital Member ID
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              Zero Data Needed
            </span>
          </div>

          {checkingCard ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Checking locally cached ID pass…
            </div>
          ) : cachedCard ? (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-300">
                Your authenticated digital credential is saved on this device. Present this pass at campus chapters and partner locations:
              </p>
              <DigitalMemberIdCard card={cachedCard} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
              <p className="text-xs font-semibold text-slate-200">
                No Member ID Pass Cached on this Browser
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Once internet is restored, sign in to your student account to automatically cache your offline pass and cryptographic QR badge on this phone.
              </p>
              <div className="mt-3">
                <Link
                  href="/sign-in"
                  onClick={() => setIsMinimized(true)}
                  className="inline-flex min-h-[34px] items-center rounded-xl bg-amber-500/20 px-3.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                >
                  Sign In Page →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Emergency & Offline Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTestReconnect}
              disabled={reconnecting}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {reconnecting ? 'Checking Connection…' : 'Check Connection'}
            </button>
            <a
              href={CONTACT_PHONE_RAW}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              📞 Call Chapter: {CONTACT_PHONE}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="text-xs text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-white"
          >
            Keep browsing cached pages
          </button>
        </div>
      </div>
    </div>
  );
}
