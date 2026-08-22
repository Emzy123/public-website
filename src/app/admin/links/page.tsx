'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell, AdminCard } from '@admin/components/AdminShell';
import { APPLICATION_ROLES, ROLE_LABELS, type ApplicationRole, type RegistrationLink } from '@/lib/types/membership';

const STATUS_CLASSES: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-[#f6f2e8] text-[#7b7263] border-[#e4dcc9]',
  'auto-closed': 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function RegistrationLinksPage() {
  const [links, setLinks] = useState<RegistrationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<RegistrationLink | null>(null);
  const [detail, setDetail] = useState<{ applications: unknown[]; waitlist: { email: string; capturedAt: string }[] } | null>(null);

  const [form, setForm] = useState({
    name: '',
    roles: ['volunteer', 'community-member', 'ambassador', 'staff', 'partnership-interest'] as ApplicationRole[],
    expiresAt: '',
    quota: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/registration-links');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load links');
      setLinks(data.links || []);
      setCsrfToken(res.headers.get('x-csrf-token') || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadDetail = async (link: RegistrationLink) => {
    setSelected(link);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/registration-links/${link.slug}`);
      const data = await res.json();
      if (res.ok) setDetail({ applications: data.applications || [], waitlist: data.waitlist || [] });
    } catch { /* ignore */ }
  };

  const createLink = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/registration-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({
          name: form.name,
          roles: form.roles,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          quota: form.quota ? Number(form.quota) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create link');
      setShowForm(false);
      setForm({ name: '', roles: ['volunteer', 'community-member', 'ambassador', 'staff', 'partnership-interest'], expiresAt: '', quota: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create link');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (link: RegistrationLink, isOpen: boolean) => {
    try {
      const res = await fetch('/api/admin/registration-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ id: link._id, isOpen }),
      });
      if (!res.ok) throw new Error('Unable to update link');
      await load();
      if (selected?._id === link._id) {
        const updated = await fetch(`/api/admin/registration-links/${link.slug}`).then((r) => r.json());
        if (updated.link) setSelected(updated.link);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update link');
    }
  };

  const toggleRole = (role: ApplicationRole) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  };

  return (
    <AdminShell title="Link Management" description="Create and control campaign registration links">
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-6 flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-[#0d1a4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2d66]">
          {showForm ? 'Cancel' : '+ Create Link'}
        </button>
      </div>

      {showForm && (
        <AdminCard title="New Registration Link" className="mb-6">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-[#7b7263]">Internal name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lagos Volunteer Drive — Aug 2026" className="w-full rounded-lg border border-[#e4dcc9] px-3 py-2 text-sm" />
            </label>
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase text-[#7b7263]">Role scope</span>
              <div className="flex flex-wrap gap-2">
                {APPLICATION_ROLES.map((role) => (
                  <button key={role} type="button" onClick={() => toggleRole(role)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${form.roles.includes(role) ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white' : 'border-[#e4dcc9] text-[#7b7263]'}`}>
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-[#7b7263]">Optional expiry</span>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full rounded-lg border border-[#e4dcc9] px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-[#7b7263]">Optional quota</span>
                <input type="number" min={1} value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} placeholder="Max applications" className="w-full rounded-lg border border-[#e4dcc9] px-3 py-2 text-sm" />
              </label>
            </div>
            <button onClick={createLink} disabled={creating || !form.name.trim() || form.roles.length === 0} className="rounded-lg bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] disabled:opacity-50">
              {creating ? 'Creating…' : 'Create & Generate URL'}
            </button>
          </div>
        </AdminCard>
      )}

      <div className={`grid gap-5 ${selected ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        <div className="rounded-xl border border-[#e4dcc9] bg-white overflow-hidden">
          {loading ? (
            <p className="py-16 text-center text-sm text-[#7b7263]">Loading…</p>
          ) : links.length === 0 ? (
            <p className="py-16 text-center text-sm text-[#7b7263]">No registration links yet.</p>
          ) : (
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-[#e4dcc9] bg-[#f9f7f2]">
                <tr>
                  {['Name', 'Scope', 'Status', 'Applications', 'Created', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae0]">
                {links.map((link) => (
                  <tr key={link._id} onClick={() => loadDetail(link)} className={`cursor-pointer hover:bg-[#f9f7f2] ${selected?._id === link._id ? 'bg-[#fdf8ef]' : ''}`}>
                    <td className="px-5 py-4 font-semibold text-[#0d1a4a]">{link.name}</td>
                    <td className="px-5 py-4 text-xs text-[#7b7263]">{link.roles.map((r) => ROLE_LABELS[r]).join(', ')}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLASSES[link.status] || STATUS_CLASSES.closed}`}>{link.status}</span>
                    </td>
                    <td className="px-5 py-4">{link.applicationCount}{link.quota ? ` / ${link.quota}` : ''}</td>
                    <td className="px-5 py-4 text-xs text-[#7b7263]">{new Date(link.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-xs text-[#d9a23c]">Details →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="space-y-4">
            <AdminCard title={selected.name}>
              <p className="mb-2 text-xs text-[#7b7263]">Shareable URL</p>
              <code className="block break-all rounded bg-[#f6f2e8] p-2 text-xs">{`/join/${selected.slug}`}</code>
              <div className="mt-4 flex gap-2">
                {selected.isOpen ? (
                  <button onClick={() => toggleLink(selected, false)} className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Close Now</button>
                ) : (
                  <button onClick={() => toggleLink(selected, true)} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Reopen</button>
                )}
              </div>
              <Link href={`/join/${selected.slug}`} target="_blank" className="mt-3 block text-center text-xs font-semibold text-[#d9a23c] hover:underline">Preview public page →</Link>
            </AdminCard>
            {detail && (
              <>
                <AdminCard title={`Applications (${detail.applications.length})`}>
                  {detail.applications.length === 0 ? (
                    <p className="text-xs text-[#7b7263]">No applications through this link yet.</p>
                  ) : (
                    <Link href={`/admin/applications?linkId=${selected._id}`} className="text-sm font-semibold text-[#d9a23c] hover:underline">View in Applications →</Link>
                  )}
                </AdminCard>
                <AdminCard title={`Waitlist (${detail.waitlist.length})`}>
                  {detail.waitlist.length === 0 ? (
                    <p className="text-xs text-[#7b7263]">No waitlist emails yet.</p>
                  ) : (
                    <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                      {detail.waitlist.map((entry, i) => (
                        <li key={i} className="flex justify-between border-b border-[#f0eae0] py-1">
                          <span>{entry.email}</span>
                          <span className="text-[#7b7263]">{new Date(entry.capturedAt).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </AdminCard>
              </>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
