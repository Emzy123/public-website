'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@admin/components/AdminShell';
import {
  isUnread,
  submissionReplyMailto,
  type AcademySubmission,
  type ContactSubmission,
  type SubmissionCounts,
  type SubmissionType,
} from '@admin/lib/submissions';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}${'*'.repeat(Math.min(local.length - 2, 6))}@${domain}`;
}

type StatusFilter = 'all' | 'unread' | 'read';
type TypeFilter = 'all' | SubmissionType;

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-[#0d1a4a] text-white shadow-sm' : 'text-[#7b7263] hover:text-[#0d1a4a]'
      }`}
    >
      {children}
    </button>
  );
}

function SubmissionCard({
  unread,
  isTest,
  onToggleRead,
  toggling,
  children,
}: {
  unread: boolean;
  isTest?: boolean;
  onToggleRead: () => void;
  toggling: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        unread ? 'border-[#d9a23c]/40 bg-[#fdf8ef]' : 'border-[#e4dcc9] bg-white'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {unread && (
            <span className="rounded-full bg-[#d9a23c] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0d1a4a]">
              New
            </span>
          )}
          {isTest && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
              Test data
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleRead}
          disabled={toggling}
          className="text-xs text-[#7b7263] transition-colors hover:text-[#0d1a4a] disabled:opacity-40"
        >
          {unread ? 'Mark as read' : 'Mark as unread'}
        </button>
      </div>
      {children}
    </div>
  );
}

export default function SubmissionsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [academy, setAcademy] = useState<AcademySubmission[]>([]);
  const [counts, setCounts] = useState<SubmissionCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showTest, setShowTest] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [markingTest, setMarkingTest] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (showTest) params.set('showTest', 'true');
    if (search.trim()) params.set('q', search.trim());

    try {
      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load submissions');
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setAcademy(data.academy ?? []);
      setCounts(data.counts ?? null);
      setCsrfToken(res.headers.get('x-csrf-token') ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [search, showTest, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(loadSubmissions, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadSubmissions, search]);

  const toggleRead = async (type: SubmissionType, id: string, read: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ type, id, read }),
      });
      if (!res.ok) throw new Error('Update failed');

      if (type === 'contact') {
        setContacts((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, readAt: read ? new Date().toISOString() : undefined } : item
          )
        );
      } else {
        setAcademy((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, readAt: read ? new Date().toISOString() : undefined } : item
          )
        );
      }

      setCounts((prev) => {
        if (!prev) return prev;
        const key = type === 'contact' ? 'contacts' : 'academy';
        return {
          ...prev,
          [key]: { ...prev[key], unread: Math.max(0, prev[key].unread + (read ? -1 : 1)) },
        };
      });
    } catch {
      setError('Failed to update submission');
    } finally {
      setTogglingId(null);
    }
  };

  const exportCsv = async (type: 'all' | SubmissionType, ids: string[] = []) => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ type, ids }),
      });
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sinet-submissions.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const unreadTotal = useMemo(
    () => (counts ? counts.contacts.unread + counts.academy.unread : 0),
    [counts]
  );

  const showContacts = typeFilter === 'all' || typeFilter === 'contact';
  const showAcademy = typeFilter === 'all' || typeFilter === 'academy';

  const markSmokeTests = async () => {
    if (!window.confirm('Tag known smoke test submissions (e.g. test@example.com, Tester) as test data?')) return;
    setMarkingTest(true);
    try {
      const res = await fetch('/api/admin/submissions/mark-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to mark smoke tests');
      await loadSubmissions();
      alert(`Marked ${data.modifiedCount ?? 0} submission(s) as test data.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark smoke tests');
    } finally {
      setMarkingTest(false);
    }
  };

  return (
    <AdminShell
      title="Form Submissions"
      description={
        counts
          ? `${counts.contacts.total + counts.academy.total} total · ${unreadTotal} unread`
          : 'Contact messages and academy interest from the public site'
      }
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markSmokeTests}
            disabled={markingTest || loading}
            className="rounded-lg border border-[#e4dcc9] bg-white px-3 py-2 text-xs font-medium text-[#7b7263] transition-colors hover:border-[#d9a23c] hover:text-[#0d1a4a] disabled:opacity-40"
            title="Mark known smoke-test submissions as test data"
          >
            {markingTest ? 'Tagging…' : 'Tag smoke tests'}
          </button>
          <button
            type="button"
            onClick={() => void exportCsv('all')}
            disabled={loading || exporting || (contacts.length === 0 && academy.length === 0)}
            className="rounded-lg border border-[#e4dcc9] bg-white px-4 py-2 text-sm font-medium text-[#0d1a4a] transition-colors hover:border-[#d9a23c] hover:bg-[#fdf8ef] disabled:opacity-40"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or subject…"
          className="w-full rounded-xl border border-[#e4dcc9] bg-white px-4 py-2.5 text-sm text-[#0d1a4a] placeholder:text-[#b0a799] focus:border-[#d9a23c] focus:outline-none"
        />
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 rounded-xl border border-[#e4dcc9] bg-white p-1">
            {(['all', 'contact', 'academy'] as TypeFilter[]).map((v) => (
              <Tab key={v} active={typeFilter === v} onClick={() => setTypeFilter(v)}>
                {v === 'all' ? 'All types' : v === 'contact' ? 'Contact' : 'Academy'}
              </Tab>
            ))}
          </div>
          <div className="flex gap-1 rounded-xl border border-[#e4dcc9] bg-white p-1">
            <Tab active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
              All
            </Tab>
            <Tab active={statusFilter === 'unread'} onClick={() => setStatusFilter('unread')}>
              Unread{counts ? ` (${unreadTotal})` : ''}
            </Tab>
            <Tab active={statusFilter === 'read'} onClick={() => setStatusFilter('read')}>
              Read
            </Tab>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-[#e4dcc9] bg-white px-3 py-2 text-xs font-medium text-[#0d1a4a] cursor-pointer hover:bg-[#fdf8ef] select-none">
            <input
              type="checkbox"
              checked={showTest}
              onChange={(e) => setShowTest(e.target.checked)}
              className="h-4 w-4 rounded border-[#d9d1bf] text-[#0d1a4a] focus:ring-[#d9a23c]"
            />
            Show test data
          </label>
        </div>
      </div>

      {loading && (
        <div className="py-10 text-center text-sm text-[#7b7263]">Loading submissions…</div>
      )}

      {!loading && (
        <div className={`grid gap-8 ${showContacts && showAcademy ? 'lg:grid-cols-2' : ''}`}>
          {showContacts && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#7b7263]">
                Contact Messages
                <span className="rounded-full border border-[#e4dcc9] bg-white px-2 py-0.5 text-[10px] font-normal text-[#0d1a4a]">
                  {contacts.length}
                </span>
              </h2>
              <div className="space-y-3">
                {contacts.map((c) => (
                  <SubmissionCard
                    key={c._id}
                    unread={isUnread(c)}
                    isTest={c.isTest}
                    toggling={togglingId === c._id}
                    onToggleRead={() => toggleRead('contact', c._id, isUnread(c))}
                  >
                    <p className="font-semibold text-[#0d1a4a]">
                      {c.name}
                      {c.subject && <span className="font-normal text-[#7b7263]"> — {c.subject}</span>}
                    </p>
                    <a
                      href={`mailto:${c.email}`}
                      className="mt-0.5 block text-xs text-[#7b7263] hover:text-[#d9a23c]"
                      title={c.email}
                    >
                      {maskEmail(c.email)}
                    </a>
                    <p className="mt-3 text-sm leading-relaxed text-[#524d43] whitespace-pre-wrap">
                      {c.message}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-3">
                        <a
                          href={submissionReplyMailto('contact', c)}
                          className="text-xs font-medium text-[#d9a23c] hover:underline"
                        >
                          Reply
                        </a>
                        <button
                          type="button"
                          onClick={() => void exportCsv('contact', [c._id])}
                          className="text-xs text-[#7b7263] hover:text-[#0d1a4a] transition-colors"
                        >
                          Export
                        </button>
                      </div>
                      {c.createdAt && (
                        <span className="text-xs text-[#b0a799]">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </SubmissionCard>
                ))}
                {contacts.length === 0 && (
                  <p className="rounded-xl border border-[#e4dcc9] bg-white px-5 py-10 text-center text-sm text-[#7b7263]">
                    No contact messages match your filters.
                  </p>
                )}
              </div>
            </section>
          )}

          {showAcademy && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#7b7263]">
                Academy Interest
                <span className="rounded-full border border-[#e4dcc9] bg-white px-2 py-0.5 text-[10px] font-normal text-[#0d1a4a]">
                  {academy.length}
                </span>
              </h2>
              <div className="space-y-3">
                {academy.map((a) => (
                  <SubmissionCard
                    key={a._id}
                    unread={isUnread(a)}
                    isTest={a.isTest}
                    toggling={togglingId === a._id}
                    onToggleRead={() => toggleRead('academy', a._id, isUnread(a))}
                  >
                    <p className="font-semibold text-[#0d1a4a]">{a.fullName}</p>
                    <a
                      href={`mailto:${a.email}`}
                      className="mt-0.5 block text-xs text-[#7b7263] hover:text-[#d9a23c]"
                      title={a.email}
                    >
                      {maskEmail(a.email)}
                    </a>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-3">
                        <a
                          href={submissionReplyMailto('academy', a)}
                          className="text-xs font-medium text-[#d9a23c] hover:underline"
                        >
                          Reply
                        </a>
                        <button
                          type="button"
                          onClick={() => void exportCsv('academy', [a._id])}
                          className="text-xs text-[#7b7263] hover:text-[#0d1a4a] transition-colors"
                        >
                          Export
                        </button>
                      </div>
                      {a.createdAt && (
                        <span className="text-xs text-[#b0a799]">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </SubmissionCard>
                ))}
                {academy.length === 0 && (
                  <p className="rounded-xl border border-[#e4dcc9] bg-white px-5 py-10 text-center text-sm text-[#7b7263]">
                    No academy interests match your filters.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </AdminShell>
  );
}
