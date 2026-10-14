'use client';

import React, { useState, useMemo } from 'react';
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

export function AuditLogClient({ initialLogs }: { initialLogs: AuditEntry[] }) {
  const [logs] = useState<AuditEntry[]>(initialLogs);
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).sort();
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter === 'all') return true;
    return log.action === actionFilter;
  });

  const getActionBadgeClass = (action: string) => {
    if (action.includes('approved') || action.includes('created')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (action.includes('rejected') || action.includes('revoked') || action.includes('deleted')) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (action.includes('2fa') || action.includes('auth')) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* Header */}
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

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Filter Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none shadow-sm"
            >
              <option value="all">All Actions ({logs.length})</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/[._]/g, ' ').toUpperCase()} ({logs.filter((l) => l.action === action).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
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
                {filteredLogs.map((entry) => {
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
        </div>
      </main>
    </div>
  );
}
