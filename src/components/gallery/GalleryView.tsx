'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { PILLAR_LABELS, PILLARS, type Pillar } from '@/lib/types/membership';
import type { GalleryContent, GalleryItem } from '@admin/types/content';

function isFilenameLike(text?: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  return (
    /^(IMG[-_]|WA\d{4}|PXL[-_]|DSC[-_]|\d{6,})/i.test(trimmed) ||
    /\.(jpe?g|png|webp|avif|gif)$/i.test(trimmed)
  );
}

function getPillarFallbackAlt(pillar: string): string {
  switch (pillar) {
    case 'agriculture':
      return 'SINet agricultural production and agribusiness operations';
    case 'trade-distribution':
      return 'SINet trade logistics, goods distribution, and wholesale supply';
    case 'real-estate':
      return 'SINet property development and real estate operations';
    default:
      return 'SINet enterprise operations and community activity';
  }
}

function getItemAlt(item: GalleryItem): string {
  if (item.alt?.trim()) return item.alt.trim();
  if (item.caption?.trim() && !isFilenameLike(item.caption)) return item.caption.trim();
  return getPillarFallbackAlt(item.pillar);
}

function getItemCaption(item: GalleryItem): string | null {
  if (!item.caption?.trim()) return null;
  return isFilenameLike(item.caption) ? null : item.caption.trim();
}

export function normalizeGalleryPillar(raw?: string): Pillar | 'other' {
  if (!raw) return 'other';
  const val = raw.toLowerCase().trim();
  if (val.includes('agri')) return 'agriculture';
  if (
    val.includes('trade') ||
    val.includes('distribut') ||
    val.includes('food') ||
    val.includes('fashion') ||
    val.includes('creative')
  ) {
    return 'trade-distribution';
  }
  if (val.includes('estate') || val.includes('property') || val.includes('housing')) {
    return 'real-estate';
  }
  return 'other';
}

type Props = {
  content: GalleryContent;
};

export function GalleryView({ content }: Props) {
  const [filter, setFilter] = useState<Pillar | 'all'>('all');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const items = useMemo(() => {
    const sorted = [...content.items]
      .filter((item) => item.imageUrl.trim())
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (filter === 'all') return sorted;
    return sorted.filter((item) => item.pillar === filter || normalizeGalleryPillar(item.pillar) === filter);
  }, [content.items, filter]);

  // Close lightbox if filter changes and current item is gone
  useEffect(() => {
    setViewerIndex(null);
  }, [filter]);

  return (
    <div className="bg-[#f6f2e8] text-[#0d1a4a]">
      <section className="border-b border-[#0d1a4a]/20 px-4 py-14 xs:px-5 md:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          {content.hero.badge && (
            <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#d9711b]">{content.hero.badge}</p>
          )}
          <h1 className="mt-6 max-w-4xl font-editorial text-[clamp(2.75rem,8vw,5.5rem)] leading-[.86] tracking-[-.06em]">
            {content.hero.title}
          </h1>
          {content.hero.subtitle && (
            <p className="mt-9 max-w-2xl text-lg leading-8 text-[#554e43]">{content.hero.subtitle}</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-10 xs:px-5 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All pillars</FilterButton>
          {PILLARS.map((p) => (
            <FilterButton key={p} active={filter === p} onClick={() => setFilter(p)}>{PILLAR_LABELS[p]}</FilterButton>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="mt-12 border border-dashed border-[#0d1a4a]/25 bg-white p-12 text-center">
            <p className="text-sm text-[#7b7263]">Gallery images will appear here once published from the admin dashboard.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <GalleryFigure key={item.id} item={item} onOpen={() => setViewerIndex(index)} />
            ))}
          </div>
        )}
      </section>

      {viewerIndex !== null && items[viewerIndex] && (
        <GalleryLightbox
          items={items}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function GalleryFigure({ item, onOpen }: { item: GalleryItem; onOpen: () => void }) {
  const altText = getItemAlt(item);
  const caption = getItemCaption(item);

  return (
    <figure className="overflow-hidden border border-[#0d1a4a]/20 bg-white">
      <button
        type="button"
        onClick={onOpen}
        className="group relative block w-full aspect-[4/3] bg-[#eee6d0] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d9711b] focus-visible:ring-offset-2"
        aria-label={`View ${caption || altText}`}
      >
        <Image
          src={item.imageUrl}
          alt={altText}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute inset-0 bg-[#0d1a4a]/0 transition-colors group-hover:bg-[#0d1a4a]/25" />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded bg-[#0d1a4a]/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
          View
        </span>
      </button>
      <figcaption className="p-4">
        {(() => {
          const pk = normalizeGalleryPillar(item.pillar);
          const label = pk !== 'other' ? PILLAR_LABELS[pk] : (PILLAR_LABELS[item.pillar as Pillar] || item.pillar);
          return <p className="font-data text-[10px] uppercase tracking-wider text-[#d9711b]">{label}</p>;
        })()}
        {caption && <p className="mt-2 text-sm leading-6 text-[#5b554a]">{caption}</p>}
      </figcaption>
    </figure>
  );
}

function GalleryLightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const altText = getItemAlt(item);
  const caption = getItemCaption(item);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [direction, setDirection] = useState(0);

  const goPrev = useCallback(() => {
    setDirection(-1);
    onIndexChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onIndexChange]);

  const goNext = useCallback(() => {
    setDirection(1);
    onIndexChange((index + 1) % items.length);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const current = event.touches[0]?.clientX ?? touchStartX.current;
    const delta = current - touchStartX.current;
    touchDeltaX.current = delta;
    setDragX(delta);
  };

  const onTouchEnd = () => {
    const delta = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setDragX(0);
    if (Math.abs(delta) < 56) return;
    if (delta > 0) goPrev();
    else goNext();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0d1a4a]/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-4 text-[#f6f2e8] xs:px-5 lg:px-8">
        <div className="min-w-0">
          <p className="font-data text-[11px] uppercase tracking-[.16em] text-[#eccb7c]">
            {PILLAR_LABELS[item.pillar as Pillar]}
          </p>
          <p className="mt-1 truncate text-sm text-[#c8ccdb]">
            {index + 1} / {items.length}
            {caption ? ` · ${caption}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/25 text-2xl text-white transition-colors hover:border-[#eccb7c] hover:text-[#eccb7c]"
          aria-label="Close viewer"
        >
          ×
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8 xs:px-5 lg:px-8"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 z-10 hidden h-12 w-12 items-center justify-center border border-white/25 text-white transition-colors hover:border-[#eccb7c] hover:text-[#eccb7c] md:flex lg:left-8"
              aria-label="Previous image"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="square" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 z-10 hidden h-12 w-12 items-center justify-center border border-white/25 text-white transition-colors hover:border-[#eccb7c] hover:text-[#eccb7c] md:flex lg:right-8"
              aria-label="Next image"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="square" strokeWidth={1.8} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={item.id}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 48 : -48 }}
            animate={{ opacity: 1, x: dragX }}
            exit={{ opacity: 0, x: direction >= 0 ? -48 : 48 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative flex max-h-full w-full max-w-5xl items-center justify-center"
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={altText}
              className="max-h-[min(78vh,900px)] w-auto max-w-full object-contain shadow-[0_20px_60px_rgba(0,0,0,.35)]"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 pb-6 text-[#aab2d4] md:hidden">
          <button type="button" onClick={goPrev} className="min-h-[44px] px-4 text-sm font-semibold text-white">
            ← Prev
          </button>
          <span className="font-data text-[11px] uppercase tracking-[.14em]">Swipe</span>
          <button type="button" onClick={goNext} className="min-h-[44px] px-4 text-sm font-semibold text-white">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white' : 'border-[#0d1a4a]/20 text-[#5b554a] hover:border-[#0d1a4a]'}`}
    >
      {children}
    </button>
  );
}
