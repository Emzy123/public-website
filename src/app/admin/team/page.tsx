'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@admin/components/AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '@admin/components/ui/AdminField';
import { ImageUploadField } from '@admin/components/ui/ImageUploadField';
import { useCmsEditor } from '@admin/hooks/useCmsEditor';
import { DEFAULT_ABOUT_TEAM } from '@admin/lib/cms/defaults/about-data';
import type { AboutContent, AboutTeamMember } from '@admin/types/content';

function emptyMember(): AboutTeamMember {
  return {
    id: `member-${Date.now()}`,
    photo: '',
    name: '',
    title: '',
    empire: '',
    empireEmoji: '',
    brief: '',
    quote: '',
    achievement: '',
    bio: '',
    hideContact: false,
  };
}

function MemberForm({
  member,
  onChange,
}: {
  member: AboutTeamMember;
  onChange: (next: AboutTeamMember) => void;
}) {
  const set = <K extends keyof AboutTeamMember>(key: K, value: AboutTeamMember[K]) => {
    onChange({ ...member, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <AdminField label="Full name">
          <AdminInput
            value={member.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Joy Ahoyiza Sule"
            required
          />
        </AdminField>
        <AdminField label="Title / role">
          <AdminInput
            value={member.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Technical Director"
          />
        </AdminField>
        <AdminField label="Empire / focus area">
          <AdminInput
            value={member.empire}
            onChange={(e) => set('empire', e.target.value)}
            placeholder="Tech & Innovation"
          />
        </AdminField>
        <AdminField label="Empire emoji" hint="Shown on the public About profile card">
          <AdminInput
            value={member.empireEmoji}
            onChange={(e) => set('empireEmoji', e.target.value)}
            placeholder="💻"
            maxLength={8}
          />
        </AdminField>
      </div>

      <ImageUploadField
        label="Photo"
        value={member.photo}
        onChange={(photo) => set('photo', photo)}
        previewClassName="h-40 w-40 bg-contain bg-no-repeat bg-center"
      />

      <AdminField label="Brief" hint="Short card summary on the About page">
        <AdminTextarea
          value={member.brief}
          onChange={(e) => set('brief', e.target.value)}
          rows={3}
          placeholder="One or two sentences for the team grid card"
        />
      </AdminField>

      <AdminField label="Quote">
        <AdminTextarea
          value={member.quote}
          onChange={(e) => set('quote', e.target.value)}
          rows={2}
          placeholder="Personal or professional quote"
        />
      </AdminField>

      <AdminField label="Achievement">
        <AdminTextarea
          value={member.achievement}
          onChange={(e) => set('achievement', e.target.value)}
          rows={2}
          placeholder="Notable achievement highlighted in the profile"
        />
      </AdminField>

      <AdminField label="Full bio">
        <AdminTextarea
          value={member.bio}
          onChange={(e) => set('bio', e.target.value)}
          rows={5}
          placeholder="Longer biography shown in the profile modal"
        />
      </AdminField>

      <label className="flex items-center gap-2 text-sm text-[#0d1a4a]">
        <input
          type="checkbox"
          checked={member.hideContact}
          onChange={(e) => set('hideContact', e.target.checked)}
          className="h-4 w-4 rounded border-[#d9d1bf] text-[#0d1a4a] focus:ring-[#d9a23c]"
        />
        Hide WhatsApp contact CTA on this profile
      </label>
    </div>
  );
}

export default function AdminTeamPage() {
  const {
    data,
    setData,
    meta,
    loading,
    saving,
    publishing,
    previewing,
    error,
    saved,
    published,
    isDirty,
    saveDraft,
    publish,
    openPreview,
  } = useCmsEditor('about');

  const about = data as AboutContent | null;
  const team = about?.team ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'view' | 'edit' | 'create'>('list');
  const [draft, setDraft] = useState<AboutTeamMember | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const selected = useMemo(
    () => team.find((m) => m.id === selectedId) ?? null,
    [team, selectedId]
  );

  const updateTeam = (nextTeam: AboutTeamMember[]) => {
    if (!about) return;
    setData({ ...about, team: nextTeam });
  };

  const openView = (member: AboutTeamMember) => {
    setSelectedId(member.id);
    setDraft(null);
    setMode('view');
    setFormError('');
    setConfirmRemoveId(null);
  };

  const openEdit = (member: AboutTeamMember) => {
    setSelectedId(member.id);
    setDraft({ ...member });
    setMode('edit');
    setFormError('');
    setConfirmRemoveId(null);
  };

  const openCreate = () => {
    const member = emptyMember();
    setSelectedId(member.id);
    setDraft(member);
    setMode('create');
    setFormError('');
    setConfirmRemoveId(null);
  };

  const backToList = () => {
    setMode('list');
    setSelectedId(null);
    setDraft(null);
    setFormError('');
    setConfirmRemoveId(null);
  };

  const saveMember = () => {
    if (!draft || !about) return;
    if (!draft.name.trim()) {
      setFormError('Name is required.');
      return;
    }

    if (mode === 'create') {
      updateTeam([...team, { ...draft, name: draft.name.trim() }]);
    } else {
      updateTeam(team.map((m) => (m.id === draft.id ? { ...draft, name: draft.name.trim() } : m)));
    }

    setSelectedId(draft.id);
    setDraft(null);
    setMode('view');
    setFormError('');
  };

  const removeMember = (id: string) => {
    updateTeam(team.filter((m) => m.id !== id));
    setConfirmRemoveId(null);
    if (selectedId === id) backToList();
  };

  const loadDefaults = () => {
    if (!about) return;
    if (team.length > 0 && !window.confirm('Replace the current team list with the built-in defaults?')) {
      return;
    }
    updateTeam(DEFAULT_ABOUT_TEAM.map((m) => ({ ...m })));
    backToList();
  };

  const statusLabel = saving
    ? 'Saving draft…'
    : publishing
      ? 'Publishing…'
      : previewing
        ? 'Opening preview…'
        : saved
          ? 'Draft saved'
          : published
            ? 'Published to live site'
            : isDirty
              ? 'Unsaved changes'
              : meta?.hasUnpublishedChanges
                ? 'Draft ready to publish'
                : 'Up to date';

  return (
    <AdminShell
      title="Leadership Team"
      description="Add, edit, and remove profiles shown on the public About page"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#7b7263]">
            {team.length} member{team.length === 1 ? '' : 's'}
            {team.length === 0 ? ' · empty list falls back to built-in defaults on the site' : ''}
          </p>
          <p className="mt-1 text-xs font-medium text-[#0d1a4a]">{statusLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void openPreview()}
            disabled={loading || previewing}
            className="rounded-lg border border-[#d9d1bf] bg-white px-3 py-2 text-sm font-medium text-[#0d1a4a] hover:bg-[#f6f2e8] disabled:opacity-50"
          >
            Preview About
          </button>
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={loading || saving || !isDirty}
            className="rounded-lg border border-[#0d1a4a] bg-white px-3 py-2 text-sm font-medium text-[#0d1a4a] hover:bg-[#f6f2e8] disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={loading || publishing || (!isDirty && !meta?.hasUnpublishedChanges)}
            className="rounded-lg bg-[#0d1a4a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1a2d66] disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      {(error || formError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError || error}
        </div>
      )}

      {loading || !about ? (
        <div className="rounded-xl border border-[#e4dcc9] bg-white p-10 text-center text-sm text-[#7b7263]">
          Loading team…
        </div>
      ) : mode === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-[#d9a23c] px-4 py-2.5 text-sm font-semibold text-[#0d1a4a] hover:bg-[#eccb7c]"
            >
              + Add team member
            </button>
            <button
              type="button"
              onClick={loadDefaults}
              className="rounded-lg border border-[#d9d1bf] bg-white px-4 py-2.5 text-sm font-medium text-[#0d1a4a] hover:bg-[#f6f2e8]"
            >
              {team.length === 0 ? 'Load default team' : 'Reset to defaults'}
            </button>
          </div>

          {team.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d9d1bf] bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-[#0d1a4a]">No custom team yet</p>
              <p className="mt-2 text-sm text-[#7b7263]">
                Add members here, or load the built-in leadership defaults used on the About page.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {team.map((member) => (
                <article
                  key={member.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-[#e4dcc9] bg-white shadow-sm"
                >
                  <div
                    className="h-44 bg-[#f6f2e8] bg-cover bg-center"
                    style={member.photo ? { backgroundImage: `url('${member.photo}')` } : undefined}
                    role="img"
                    aria-label={member.name || 'Team member photo'}
                  >
                    {!member.photo && (
                      <div className="flex h-full items-center justify-center text-4xl text-[#d9a23c]">
                        {(member.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-xs uppercase tracking-wider text-[#7b7263]">
                      {member.empireEmoji ? `${member.empireEmoji} ` : ''}
                      {member.empire || 'Leadership'}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-[#0d1a4a]">
                      {member.name || 'Untitled member'}
                    </h3>
                    <p className="text-sm text-[#5e574b]">{member.title || 'No title set'}</p>
                    {member.brief && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#7b7263]">{member.brief}</p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <button
                        type="button"
                        onClick={() => openView(member)}
                        className="rounded-lg border border-[#d9d1bf] px-3 py-1.5 text-xs font-medium text-[#0d1a4a] hover:bg-[#f6f2e8]"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="rounded-lg border border-[#0d1a4a] px-3 py-1.5 text-xs font-medium text-[#0d1a4a] hover:bg-[#f6f2e8]"
                      >
                        Edit
                      </button>
                      {confirmRemoveId === member.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Confirm remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#7b7263]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(member.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[#e4dcc9] bg-white p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e4dcc9] pb-4">
            <div>
              <button
                type="button"
                onClick={backToList}
                className="text-sm font-medium text-[#7b7263] hover:text-[#0d1a4a]"
              >
                ← Back to team list
              </button>
              <h2 className="mt-2 text-xl font-semibold text-[#0d1a4a]">
                {mode === 'create'
                  ? 'Add team member'
                  : mode === 'edit'
                    ? `Edit ${draft?.name || 'member'}`
                    : selected?.name || 'Team member'}
              </h2>
            </div>
            {mode === 'view' && selected && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="rounded-lg bg-[#0d1a4a] px-3 py-2 text-sm font-semibold text-white"
                >
                  Edit
                </button>
                {confirmRemoveId === selected.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => removeMember(selected.id)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Confirm remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(null)}
                      className="rounded-lg border border-[#d9d1bf] px-3 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(selected.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
            {(mode === 'edit' || mode === 'create') && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={backToList}
                  className="rounded-lg border border-[#d9d1bf] px-3 py-2 text-sm font-medium text-[#0d1a4a]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveMember}
                  className="rounded-lg bg-[#0d1a4a] px-3 py-2 text-sm font-semibold text-white"
                >
                  {mode === 'create' ? 'Add member' : 'Apply changes'}
                </button>
              </div>
            )}
          </div>

          {mode === 'view' && selected ? (
            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
              <div
                className="h-52 rounded-xl bg-[#f6f2e8] bg-cover bg-center"
                style={selected.photo ? { backgroundImage: `url('${selected.photo}')` } : undefined}
              />
              <div className="space-y-4 text-sm leading-6 text-[#5e574b]">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#7b7263]">
                    {selected.empireEmoji} {selected.empire}
                  </p>
                  <h3 className="text-2xl font-semibold text-[#0d1a4a]">{selected.name}</h3>
                  <p>{selected.title}</p>
                </div>
                {selected.brief && (
                  <div>
                    <p className="font-medium text-[#0d1a4a]">Brief</p>
                    <p>{selected.brief}</p>
                  </div>
                )}
                {selected.quote && (
                  <blockquote className="border-l-2 border-[#d9a23c] pl-4 italic">“{selected.quote}”</blockquote>
                )}
                {selected.achievement && (
                  <div>
                    <p className="font-medium text-[#0d1a4a]">Achievement</p>
                    <p>{selected.achievement}</p>
                  </div>
                )}
                {selected.bio && (
                  <div>
                    <p className="font-medium text-[#0d1a4a]">Bio</p>
                    <p className="whitespace-pre-wrap">{selected.bio}</p>
                  </div>
                )}
                <p className="text-xs text-[#7b7263]">
                  Contact CTA: {selected.hideContact ? 'Hidden' : 'Visible'}
                </p>
              </div>
            </div>
          ) : draft ? (
            <MemberForm member={draft} onChange={setDraft} />
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
