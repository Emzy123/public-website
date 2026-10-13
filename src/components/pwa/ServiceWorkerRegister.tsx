'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function ServiceWorkerRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
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

  if (!isOffline || dismissed) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-amber-500/40 bg-[#071026]/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md transition sm:bottom-6"
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
          <div>
            <p className="font-bold text-amber-300">Offline Mode Active</p>
            <p className="text-[11px] text-slate-300">
              No connection. Your saved Member ID remains accessible offline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/offline"
            className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
          >
            Offline ID →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss offline banner"
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
