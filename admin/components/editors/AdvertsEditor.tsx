'use client';

import type { AdvertItem, AdvertsContent } from '@admin/types/content';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';
import { ImageUploadField } from '../ui/ImageUploadField';

function newAdvert(sortOrder: number): AdvertItem {
  return {
    id: `advert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    eyebrow: 'Special event',
    body: '',
    imageUrl: '',
    ctaLabel: 'Learn more',
    ctaHref: '/contact',
    enabled: false,
    showModal: true,
    dismissalDays: 7,
    startsAt: '',
    endsAt: '',
    sortOrder,
  };
}

export function AdvertsEditor({ data, onChange }: { data: AdvertsContent; onChange: (d: AdvertsContent) => void }) {
  const sorted = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder);

  const update = (id: string, patch: Partial<AdvertItem>) => {
    onChange({
      items: data.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const remove = (id: string) => {
    onChange({ items: data.items.filter((item) => item.id !== id) });
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = sorted.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ items: next.map((item, i) => ({ ...item, sortOrder: i })) });
  };

  return (
    <div className="space-y-6">
      <AdminCard title="How this appears on the site">
        <p className="text-sm leading-6 text-[#7b7263]">
          Enabled adverts appear as a <strong className="text-[#0d1a4a]">sticky spotlight strip under the header</strong> on
          every public page. When a flyer image is set and &quot;Show flyer modal&quot; is on, visitors also see a prominent
          dismissible flyer lightbox on first visit — ideal for special events and activities.
        </p>
        <p className="mt-3 text-sm leading-6 text-[#7b7263]">
          Open <strong className="text-[#0d1a4a]">registration links</strong> from Link Management also appear here
          automatically as &quot;Applications open&quot; spotlights with an Apply now button — you do not need to recreate them
          as flyers unless you want a custom poster.
        </p>
        <button
          type="button"
          onClick={() => onChange({ items: [...data.items, newAdvert(data.items.length)] })}
          className="mt-4 rounded-lg bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] hover:bg-[#eccb7c]"
        >
          + Add advert / flyer
        </button>
      </AdminCard>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#e4dcc9] bg-[#f9f7f2] px-4 py-10 text-center text-sm text-[#7b7263]">
          No adverts yet. Add one for a launch, meetup, campaign, or special activity.
        </p>
      ) : (
        sorted.map((item) => (
          <AdminCard
            key={item.id}
            title={item.title || 'Untitled advert'}
            actions={
              <div className="flex gap-2">
                <button type="button" onClick={() => move(item.id, -1)} className="text-xs text-[#7b7263] hover:text-[#0d1a4a]">↑</button>
                <button type="button" onClick={() => move(item.id, 1)} className="text-xs text-[#7b7263] hover:text-[#0d1a4a]">↓</button>
                <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-600 hover:underline">Remove</button>
              </div>
            }
          >
            <div className="mb-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-[#0d1a4a]">
                <input type="checkbox" checked={item.enabled} onChange={(e) => update(item.id, { enabled: e.target.checked })} />
                Enabled (live when published)
              </label>
              <label className="flex items-center gap-2 text-sm text-[#0d1a4a]">
                <input type="checkbox" checked={item.showModal} onChange={(e) => update(item.id, { showModal: e.target.checked })} />
                Show flyer modal
              </label>
            </div>
            {item.showModal && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>⚠ Financial promotions notice:</strong> If this flyer contains investment-related claims or
                financial offers, it must be reviewed and approved by legal before enabling. Showing unapproved
                financial promotions may be unlawful.
              </div>
            )}
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm text-[#0d1a4a]" htmlFor={`dismissal-${item.id}`}>
                Dismissal period (days):
              </label>
              <input
                id={`dismissal-${item.id}`}
                type="number"
                min={0}
                max={365}
                value={item.dismissalDays ?? 7}
                onChange={(e) => update(item.id, { dismissalDays: Math.max(0, Number(e.target.value)) })}
                className="w-20 rounded border border-[#d9d1bf] px-2 py-1 text-sm text-[#0d1a4a]"
              />
              <span className="text-xs text-[#7b7263]">Set to 0 to re-show on every visit.</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Eyebrow">
                <AdminInput value={item.eyebrow} onChange={(e) => update(item.id, { eyebrow: e.target.value })} placeholder="Special event" />
              </AdminField>
              <AdminField label="Title">
                <AdminInput value={item.title} onChange={(e) => update(item.id, { title: e.target.value })} placeholder="Campus meetup · Saturday" />
              </AdminField>
              <AdminField label="Short message">
                <AdminTextarea value={item.body} onChange={(e) => update(item.id, { body: e.target.value })} placeholder="One or two lines shown in the spotlight strip" />
              </AdminField>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="CTA label">
                  <AdminInput value={item.ctaLabel} onChange={(e) => update(item.id, { ctaLabel: e.target.value })} />
                </AdminField>
                <AdminField label="CTA link">
                  <AdminInput value={item.ctaHref} onChange={(e) => update(item.id, { ctaHref: e.target.value })} placeholder="/contact" />
                </AdminField>
                <AdminField label="Starts (optional)">
                  <AdminInput type="date" value={item.startsAt.slice(0, 10)} onChange={(e) => update(item.id, { startsAt: e.target.value })} />
                </AdminField>
                <AdminField label="Ends (optional)">
                  <AdminInput type="date" value={item.endsAt.slice(0, 10)} onChange={(e) => update(item.id, { endsAt: e.target.value })} />
                </AdminField>
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="Flyer / poster image"
                  value={item.imageUrl}
                  onChange={(imageUrl) => update(item.id, { imageUrl })}
                  previewClassName="h-64"
                />
              </div>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
}
