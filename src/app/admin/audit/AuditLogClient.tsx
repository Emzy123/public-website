'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatWatDateTime } from '@/lib/date';

type AuditEntry = {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

const PAGE_SIZE = 25;

export function AuditLogClient({
  initialLogs,
  databaseUnavailable = false,
}: {
  initialLogs: AuditEntry[];
  databaseUnavailable?: boolean;
}) {
  const [logs] = useState<AuditEntry[]>(initialLogs);
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).sort();
  }, [logs]);

  const uniqueActors = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.actorEmail).filter(Boolean))).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (actorFilter !== 'all' && log.actorEmail !== actorFilter) return false;
      if (dateFrom) {
        const start = new Date(dateFrom).getTime();
        if (new Date(log.createdAt).getTime() < start) return false;
      }
      if (dateTo) {
        const end = new Date(dateTo).getTime() + 86400000;
        if (new Date(log.createdAt).getTime() > end) return false;
      }
      return true;
    });
  }, [logs, actionFilter, actorFilter, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageLogs = filteredLogs.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('approved') || action.includes('created')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (action.includes('rejected') || action.includes('revoked') || action.includes('deleted')) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (action.includes('2fa') || action.includes('auth')) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  function resetFilters() {
    setActionFilter('all');
    setActorFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/applications"
              className="text-xs font-semibold uppercase tracking-wider text-amber-700 hover:text-amber-800"
            >
              ← Applications Queue
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-bold text-[#071026]">Institutional Audit Log</span>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Admin Panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        {databaseUnavailable && (
          <div role="alert" className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm flex items-start gap-3.5">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">Audit Log Service Temporarily Unavailable</h3>
              <p className="mt-1 text-xs text-amber-800">
                The institutional audit trail database is currently unreachable. Please retry shortly.
              </p>
              <div className="mt-3">
                <Link
                  href="/admin/audit"
                  className="inline-flex items-center rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  Retry Loading Audit Log
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-amber-700">
              Governance & Records
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#071026] sm:text-3xl">
              Administrative Audit Log
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Append-only immutable record of administrative decisions, 2FA events, and application reviews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2" data-testid="audit-filters">
            <label className="text-xs font-semibold text-slate-500">
              Action
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
                className="ml-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none shadow-sm"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action.replace(/[._]/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-500">
              Actor
              <select
                value={actorFilter}
                onChange={(e) => {
                  setActorFilter(e.target.value);
                  setPage(0);
                }}
                className="ml-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none shadow-sm"
              >
                <option value="all">All Actors</option>
                {uniqueActors.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-500">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="ml-1 rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
              />
            </label>

            <label className="text-xs font-semibold text-slate-500">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="ml-1 rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
              />
            </label>

            {(actionFilter !== 'all' || actorFilter !== 'all' || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-amber-700 underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Timestamp (WAT)</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Resource</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pageLogs.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-sans">
                          {formatWatDateTime(entry.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${getActionBadgeClass(
                              entry.action
                            )}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-sans text-slate-700">
                          {entry.actorEmail}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                          {entry.resource}
                          {entry.resourceId ? ` / ${entry.resourceId.slice(0, 8)}…` : ''}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                          {entry.ipAddress || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {entry.metadata ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="font-sans text-[11px] font-bold text-amber-700 hover:underline"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                      {isExpanded && entry.metadata && (
                        <tr className="bg-slate-50/80 border-t border-slate-100">
                          <td colSpan={6} className="px-5 py-3 font-mono text-[11px] text-slate-700">
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-inner">
                              <p className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
                                Audit Event Context &amp; Metadata
                              </p>
                              <pre className="overflow-x-auto text-[11px] text-slate-800 leading-relaxed max-h-48">
                                {JSON.stringify(entry.metadata, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No audit log entries matching this filter.
            </div>
          )}

          {filteredLogs.length > 0 && (
            <div
              className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-600"
              data-testid="audit-pagination"
            >
              <span>
                Showing {safePage * PAGE_SIZE + 1}–
                {Math.min((safePage + 1) * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safePage <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
