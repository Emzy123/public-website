'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@admin/components/AdminShell';
import {
  exportSingleAcademyCsv,
  exportSingleContactCsv,
  exportSubmissionsCsv,
  isUnread,
  submissionReplyMailto,
  type AcademySubmission,
  type ContactSubmission,
  type SubmissionCounts,
  type SubmissionType,
} from '@admin/lib/submissions';

type StatusFilter = 'all' | 'unread' | 'read';
type TypeFilter = 'all' | SubmissionType;

function FilterButton({
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
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-medium'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function SubmissionCard({
  unread,
  onToggleRead,
  toggling,
  children,
}: {
  unread: boolean;
  onToggleRead: () => void;
  toggling: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`p-4 rounded-lg border text-sm transition-colors ${
        unread
          ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5'
          : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        {unread && (
          <span className="shrink-0 text-[10px uppercase tracking-wider font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded">
            New
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onToggleRead}
          disabled={toggling}
          className="text-xs text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          {unread ? 'Mark read' : 'Mark unread'}
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search.trim()) params.set('q', search.trim());

    try {
      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load submissions');
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setAcademy(data.academy ?? []);
      setCounts(data.counts ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(loadSubmissions, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadSubmissions, search]);

  const toggleRead = async (type: SubmissionType, id: string, read: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, read }),
      });
      if (!res.ok) throw new Error('Update failed');

      const patchContact = (read: boolean) => (item: ContactSubmission): ContactSubmission =>
        item._id === id ? { ...item, readAt: read ? new Date().toISOString() : undefined } : item;

      const patchAcademy = (read: boolean) => (item: AcademySubmission): AcademySubmission =>
        item._id === id ? { ...item, readAt: read ? new Date().toISOString() : undefined } : item;

      if (type === 'contact') {
        setContacts((prev) => prev.map(patchContact(read)));
      } else {
        setAcademy((prev) => prev.map(patchAcademy(read)));
      }

      setCounts((prev) => {
        if (!prev) return prev;
        const key = type === 'contact' ? 'contacts' : 'academy';
        const delta = read ? -1 : 1;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            unread: Math.max(0, prev[key].unread + delta),
          },
        };
      });
    } catch {
      setError('Failed to update submission');
    } finally {
      setTogglingId(null);
    }
  };

  const unreadTotal = useMemo(
    () => (counts ? counts.contacts.unread + counts.academy.unread : 0),
    [counts]
  );

  const showContacts = typeFilter === 'all' || typeFilter === 'contact';
  const showAcademy = typeFilter === 'all' || typeFilter === 'academy';

  return (
    <AdminShell
      title="Form Submissions"
      description={
        counts
          ? `${counts.contacts.total} contact · ${counts.academy.total} academy · ${unreadTotal} unread`
          : 'Contact and academy interest messages from the public site'
      }
      actions={
        <button
          type="button"
          onClick={() => exportSubmissionsCsv(contacts, academy)}
          disabled={loading || (contacts.length === 0 && academy.length === 0)}
          className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 transition-colors"
        >
          Export CSV
        </button>
      }
    >
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center gap-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, subject…"
          className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
        />

        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
          <FilterButton active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All</FilterButton>
          <FilterButton active={typeFilter === 'contact'} onClick={() => setTypeFilter('contact')}>Contact</FilterButton>
          <FilterButton active={typeFilter === 'academy'} onClick={() => setTypeFilter('academy')}>Academy</FilterButton>
        </div>

        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800">
          <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All status</FilterButton>
          <FilterButton active={statusFilter === 'unread'} onClick={() => setStatusFilter('unread')}>
            Unread{counts ? ` (${unreadTotal})` : ''}
          </FilterButton>
          <FilterButton active={statusFilter === 'read'} onClick={() => setStatusFilter('read')}>Read</FilterButton>
        </div>
      </div>

      {loading && <p className="text-slate-400 mb-4">Loading…</p>}

      <div className={`grid gap-8 ${showContacts && showAcademy ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {showContacts && (
          <section>
            <h2 className="text-lg font-semibold text-[#D4AF37] mb-4">
              Contact Messages ({contacts.length})
            </h2>
            <div className="space-y-3">
              {contacts.map((c) => (
                <SubmissionCard
                  key={c._id}
                  unread={isUnread(c)}
                  toggling={togglingId === c._id}
                  onToggleRead={() => toggleRead('contact', c._id, isUnread(c))}
                >
                  <div className="font-medium text-white">{c.name} — {c.subject}</div>
                  <a href={`mailto:${c.email}`} className="text-slate-400 hover:text-[#D4AF37]">{c.email}</a>
                  <p className="text-slate-300 mt-2 whitespace-pre-wrap">{c.message}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <a
                      href={submissionReplyMailto('contact', c)}
                      className="text-xs text-[#D4AF37] hover:underline"
                    >
                      Reply
                    </a>
                    <button
                      type="button"
                      onClick={() => exportSingleContactCsv(c)}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                  {c.createdAt && (
                    <div className="text-xs text-slate-500 mt-2">{new Date(c.createdAt).toLocaleString()}</div>
                  )}
                </SubmissionCard>
              ))}
              {!loading && contacts.length === 0 && (
                <p className="text-slate-500 text-sm">No contact messages match your filters.</p>
              )}
            </div>
          </section>
        )}

        {showAcademy && (
          <section>
            <h2 className="text-lg font-semibold text-[#D4AF37] mb-4">
              Academy Interests ({academy.length})
            </h2>
            <div className="space-y-3">
              {academy.map((a) => (
                <SubmissionCard
                  key={a._id}
                  unread={isUnread(a)}
                  toggling={togglingId === a._id}
                  onToggleRead={() => toggleRead('academy', a._id, isUnread(a))}
                >
                  <div className="font-medium text-white">{a.fullName}</div>
                  <a href={`mailto:${a.email}`} className="text-slate-400 hover:text-[#D4AF37]">{a.email}</a>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <a
                      href={submissionReplyMailto('academy', a)}
                      className="text-xs text-[#D4AF37] hover:underline"
                    >
                      Reply
                    </a>
                    <button
                      type="button"
                      onClick={() => exportSingleAcademyCsv(a)}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                  {a.createdAt && (
                    <div className="text-xs text-slate-500 mt-2">{new Date(a.createdAt).toLocaleString()}</div>
                  )}
                </SubmissionCard>
              ))}
              {!loading && academy.length === 0 && (
                <p className="text-slate-500 text-sm">No academy interests match your filters.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
