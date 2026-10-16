'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AdvertItem } from '@admin/types/content';

import { isAdvertSuppressedRoute } from '@/lib/adverts/suppression';

const STRIP_DISMISS_KEY = 'sinet-advert-strip-dismissed';
const MODAL_DISMISS_KEY = 'sinet-flyer-modal-dismissed';
const ROTATE_MS = 4000;
const DEFAULT_TTL_DAYS = 7;

function isMediaUrl(url: string): boolean {
  return Boolean(url) && (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'));
}

function isModalDismissed(ttlDays: number): boolean {
  try {
    const raw = localStorage.getItem(MODAL_DISMISS_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw) as { ts: number };
    return Date.now() - ts < ttlDays * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function setModalDismissed(): void {
  try {
    localStorage.setItem(MODAL_DISMISS_KEY, JSON.stringify({ ts: Date.now() }));
  } catch {
    /* storage blocked */
  }
}

type Props = {
  adverts: AdvertItem[];
  stackOffset?: boolean;
};

export function AdvertSpotlight({ adverts, stackOffset = false }: Props) {
  const pathname = usePathname() || '/';

  const items = useMemo(
    () => adverts.filter((item) => item && item.enabled && String(item.title || '').trim()),
    [adverts],
  );

  const flyer = useMemo(
    () => items.find((item) => item.showModal !== false && isMediaUrl(item.flyerImage || item.imageUrl)) ?? null,
    [items],
  );

  const [index, setIndex] = useState(0);
  const [stripDismissed, setStripDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [modalAdvert, setModalAdvert] = useState<AdvertItem | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Strip uses sessionStorage (per-session strip dismiss is intentional)
    try {
      setStripDismissed(sessionStorage.getItem(STRIP_DISMISS_KEY) === '1');
    } catch {
      setStripDismissed(false);
    }
    setReady(true);

    // Flyer modal — only on first visit within the TTL window, and never on excluded paths
    if (flyer) {
      const ttl = (flyer as AdvertItem & { dismissalDays?: number }).dismissalDays ?? DEFAULT_TTL_DAYS;
      const excluded = isAdvertSuppressedRoute(pathname);
      if (!excluded && !isModalDismissed(ttl)) {
        const timer = window.setTimeout(() => setModalAdvert(flyer), 600);
        return () => window.clearTimeout(timer);
      }
    }
  }, [flyer, pathname]);

  useEffect(() => {
    setIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((item) => item.id).join('|')]);

  useEffect(() => {
    if (items.length <= 1 || paused || stripDismissed) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [items.length, paused, stripDismissed]);

  if (!ready || items.length === 0 || isAdvertSuppressedRoute(pathname)) {
    return null;
  }

  const advert = items[Math.min(index, items.length - 1)] ?? items[0];

  const dismissStrip = () => {
    try {
      sessionStorage.setItem(STRIP_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setStripDismissed(true);
  };

  const closeModal = () => {
    if (flyer) {
      const ttl = (flyer as AdvertItem & { dismissalDays?: number }).dismissalDays ?? DEFAULT_TTL_DAYS;
      if (ttl > 0) setModalDismissed();
    }
    setModalAdvert(null);
  };

  const openFlyer = (item: AdvertItem) => {
    if (!isMediaUrl(item.imageUrl)) return;
    setModalAdvert(item);
    const at = items.findIndex((candidate) => candidate.id === item.id);
    if (at >= 0) setIndex(at);
  };

  return (
    <>
      {!stripDismissed && (
        <div
          className={`sticky z-[35] border-b border-[#eccb7c]/40 bg-[#0d1a4a] text-[#f6f2e8] shadow-[0_8px_30px_rgba(13,26,74,.18)] ${
            stackOffset ? 'top-[calc(2.5rem+77px)]' : 'top-[77px]'
          }`}
          role="region"
          aria-label="Featured announcements"
          aria-live="polite"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
          }}
        >
          <div className="mx-auto flex max-w-[1220px] flex-col gap-3 px-4 py-3 xs:px-5 sm:flex-row sm:items-center sm:gap-5 lg:px-8">
            {(advert.flyerImage || advert.imageUrl) && isMediaUrl(advert.flyerImage || advert.imageUrl) && (
              <button
                type="button"
                onClick={() => openFlyer(advert)}
                className="group relative h-16 w-12 shrink-0 overflow-hidden border border-[#eccb7c]/50 bg-[#162456] sm:h-[4.5rem] sm:w-14"
                aria-label="View flyer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={advert.id}
                  src={advert.flyerImage || advert.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            )}
            <div className="min-w-0 flex-1" key={advert.id}>
              {advert.eyebrow && (
                <p className="font-data text-[10px] uppercase tracking-[.18em] text-[#eccb7c]">{advert.eyebrow}</p>
              )}
              <p className="mt-0.5 truncate font-editorial text-lg leading-tight tracking-[-.03em] sm:text-xl">
                {advert.title}
              </p>
              {advert.body && (
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#c9ccda] sm:line-clamp-1">{advert.body}</p>
              )}
              {items.length > 1 && (
                <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? 'w-5 bg-[#eccb7c]' : 'w-1.5 bg-white/35 hover:bg-white/60'
                      }`}
                      aria-label={`Show announcement ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(advert.flyerImage || advert.imageUrl) && isMediaUrl(advert.flyerImage || advert.imageUrl) && (
                <button
                  type="button"
                  onClick={() => openFlyer(advert)}
                  className="inline-flex min-h-[40px] items-center border border-[#eccb7c]/60 px-3 text-xs font-bold text-[#eccb7c] hover:bg-[#eccb7c] hover:text-[#0d1a4a]"
                >
                  View flyer
                </button>
              )}
              {advert.ctaHref && advert.ctaLabel && (
                <Link
                  href={advert.ctaHref}
                  className="inline-flex min-h-[40px] items-center bg-[#d9711b] px-4 text-xs font-bold text-white hover:bg-[#eccb7c] hover:text-[#0d1a4a]"
                >
                  {advert.ctaLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={dismissStrip}
                className="grid h-9 w-9 place-items-center text-[#c9ccda] hover:text-white"
                aria-label="Dismiss announcement"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {modalAdvert && <FlyerModal advert={modalAdvert} onClose={closeModal} />}
    </>
  );
}

function FlyerModal({ advert, onClose }: { advert: AdvertItem; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first) return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the modal on open
    const timer = window.setTimeout(() => {
      const closeBtn = dialogRef.current?.querySelector<HTMLElement>('[data-modal-close]');
      closeBtn?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flyer-modal-title"
    >
      {/* Backdrop — click to close */}
      <button
        type="button"
        className="absolute inset-0 bg-[#0d1a4a]/75 backdrop-blur-sm"
        aria-label="Close flyer"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        className="relative z-10 grid max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-[#eccb7c]/30 bg-[#f6f2e8] shadow-2xl md:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]"
      >
        {/* Visible close button — top-right corner */}
        <button
          type="button"
          data-modal-close
          onClick={onClose}
          aria-label="Close flyer"
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-[#0d1a4a]/80 text-white transition hover:bg-[#d9711b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d9711b]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="relative flex min-h-[280px] items-center justify-center bg-[#0d1a4a] p-3 sm:p-5 md:min-h-[520px]">
          {(advert.flyerImage || advert.imageUrl) && isMediaUrl(advert.flyerImage || advert.imageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={advert.flyerImage || advert.imageUrl}
              alt={advert.title}
              className="max-h-[70vh] w-full object-contain md:max-h-[480px]"
            />
          ) : (
            <div className="px-8 text-center font-editorial text-3xl text-[#eccb7c]">{advert.title}</div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
          <div>
            {advert.eyebrow && (
              <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">{advert.eyebrow}</p>
            )}
            <h2
              id="flyer-modal-title"
              className="mt-3 font-editorial text-[clamp(1.75rem,4vw,2.75rem)] leading-[.95] tracking-[-.04em] text-[#0d1a4a]"
            >
              {advert.title}
            </h2>
            {advert.body && <p className="mt-5 text-base leading-7 text-[#554e43]">{advert.body}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {advert.ctaHref && advert.ctaLabel && (
              <Link
                href={advert.ctaHref}
                onClick={onClose}
                className="inline-flex min-h-[48px] items-center justify-center bg-[#0d1a4a] px-6 text-sm font-bold text-white hover:bg-[#d9711b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d9711b]"
              >
                {advert.ctaLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[48px] items-center justify-center border border-[#0d1a4a]/25 px-6 text-sm font-bold text-[#0d1a4a] hover:border-[#d9711b] hover:text-[#d9711b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d9711b]"
            >
              Continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
