'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ChapterListItem } from '@/lib/chapters/chapters';

import { EmptyState, Badge } from '@/components/ui';

export function ChaptersDirectoryClient({
  initialChapters,
  stats,
  showMemberCounts = false,
}: {
  initialChapters: ChapterListItem[];
  stats: {
    chapterCount: number;
    universityCount: number;
    totalMembers: number;
    state: string;
  };
  showMemberCounts?: boolean;
}) {
  const [search, setSearch] = useState('');

  const filteredChapters = useMemo(() => {
    if (!search.trim()) return initialChapters;
    const q = search.trim().toLowerCase();
    return initialChapters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.universityName.toLowerCase().includes(q) ||
        c.universityShortName.toLowerCase().includes(q) ||
        c.campusCode.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [initialChapters, search]);

  return (
    <div className="min-h-screen bg-brand-canvas text-brand-ink">
      {/* Hero Section */}
      <section className="border-b border-slate-200/80 bg-white px-4 py-12 xs:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand-accent">
                Tertiary Institutions Network • Kogi State
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl md:text-5xl font-editorial">
                Campus Chapters Directory
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Discover student-led chapters of SINet across universities
                in Kogi State. Join your campus chapter to access mentorship, investment clubs, and
                enterprise sprints.
              </p>
            </div>

            <Link
              href="/join"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-brand-ink px-6 text-sm font-bold text-white shadow-sm transition hover:bg-brand-ink-navy active:scale-[0.98]"
            >
              Join Student Network →
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Active Chapters
              </p>
              <p className="mt-1 text-2xl font-black text-[#071026]">{stats.chapterCount}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Universities
              </p>
              <p className="mt-1 text-2xl font-black text-[#071026]">{stats.universityCount}</p>
            </div>

            {showMemberCounts ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Active Members
                </p>
                <p className="mt-1 text-2xl font-black text-amber-700">{stats.totalMembers}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Members
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-400">Coming soon</p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                State Pilot
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{stats.state}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Directory Body */}
      <main className="mx-auto max-w-6xl px-4 py-8 xs:px-6 md:py-12">
        {/* Search Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by university name, acronym (e.g. FULOKOJA, PAAU)..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
            <svg
              className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <p className="text-xs font-semibold text-slate-500">
            Showing {filteredChapters.length} of {initialChapters.length} institutions
          </p>
        </div>

        {/* Chapters Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-amber-600/50 hover:shadow-md"
            >
              <div>
                {/* Header: Campus Code & Status */}
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-brand-ink px-2.5 py-1 font-mono text-xs font-black text-amber-400">
                    {chapter.campusCode}
                  </span>
                  <Badge variant="success" dot>
                    Chapter Active
                  </Badge>
                </div>

                {/* Chapter Name & University */}
                <h3 className="mt-4 text-lg font-bold text-brand-ink group-hover:text-brand-accent transition">
                  {chapter.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {chapter.universityName} • {chapter.state} State
                </p>

                {chapter.description && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {chapter.description}
                  </p>
                )}

                {/* Divisions Preview Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Finance
                  </span>
                  <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                    Enterprise
                  </span>
                  <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                    Governance
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                {showMemberCounts ? (
                  <div className="text-xs font-semibold text-slate-600">
                    <span className="font-bold text-brand-ink">{chapter.memberCount}</span> members
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/chapters/${chapter.slug}`}
                    className="inline-flex min-h-[36px] items-center rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-brand-ink transition hover:bg-brand-canvas-subtle hover:border-slate-300"
                  >
                    View Chapter →
                  </Link>
                  <Link
                    href={`/join/student-network?campus=${chapter.campusCode}`}
                    className="inline-flex min-h-[36px] items-center rounded-xl bg-brand-ink px-4 text-xs font-bold text-white transition hover:bg-brand-ink-navy active:scale-[0.98]"
                  >
                    Join
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredChapters.length === 0 && (
          <div className="my-12">
            <EmptyState
              title="No chapters matched your search query"
              description="Try clearing your search query or entering a different campus name."
              action={
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="rounded-xl bg-brand-ink px-4 py-2 text-xs font-bold text-white hover:bg-brand-ink-navy transition"
                >
                  Clear search filter
                </button>
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
