'use client';

import React from 'react';
import type { HomeContent } from '@admin/types/content';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';

function ListEditor({
  items,
  onChange,
  fields,
}: {
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
  fields: { key: string; label: string; multiline?: boolean }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          {fields.map((f) => (
            <AdminField key={f.key} label={f.label}>
              {f.multiline ? (
                <AdminTextarea
                  value={item[f.key] ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], [f.key]: e.target.value };
                    onChange(next);
                  }}
                />
              ) : (
                <AdminInput
                  value={item[f.key] ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], [f.key]: e.target.value };
                    onChange(next);
                  }}
                />
              )}
            </AdminField>
          ))}
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-red-400">Remove</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, '']))])}
        className="text-xs text-[#D4AF37]"
      >
        + Add item
      </button>
    </div>
  );
}

export function HomeEditor({ data, onChange }: { data: HomeContent; onChange: (d: HomeContent) => void }) {
  const set = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-6">
      <AdminCard title="Strategic Quote Strip">
        <AdminField label="Quote text">
          <AdminTextarea value={data.strategicQuote} onChange={(e) => set('strategicQuote', e.target.value)} />
        </AdminField>
      </AdminCard>

      <AdminCard title="Our Impact">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <AdminField label="Eyebrow"><AdminInput value={data.ourImpact.eyebrow} onChange={(e) => set('ourImpact', { ...data.ourImpact, eyebrow: e.target.value })} /></AdminField>
          <AdminField label="Title"><AdminInput value={data.ourImpact.title} onChange={(e) => set('ourImpact', { ...data.ourImpact, title: e.target.value })} /></AdminField>
          <AdminField label="Subtitle"><AdminTextarea value={data.ourImpact.subtitle} onChange={(e) => set('ourImpact', { ...data.ourImpact, subtitle: e.target.value })} /></AdminField>
          <AdminField label="Tagline"><AdminTextarea value={data.ourImpact.tagline} onChange={(e) => set('ourImpact', { ...data.ourImpact, tagline: e.target.value })} /></AdminField>
        </div>
        <p className="text-sm text-slate-400 mb-2">Impact stats</p>
        <ListEditor
          items={data.ourImpact.stats as unknown as Record<string, string>[]}
          onChange={(stats) => set('ourImpact', { ...data.ourImpact, stats: stats as unknown as HomeContent['ourImpact']['stats'] })}
          fields={[{ key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }, { key: 'sub', label: 'Subtext' }]}
        />
        <p className="text-sm text-slate-400 mb-2 mt-4">Bullet points</p>
        <StringListEditor items={data.ourImpact.bullets} onChange={(bullets) => set('ourImpact', { ...data.ourImpact, bullets })} />
      </AdminCard>

      <AdminCard title="What We Do">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <AdminField label="Eyebrow"><AdminInput value={data.whatWeDo.eyebrow} onChange={(e) => set('whatWeDo', { ...data.whatWeDo, eyebrow: e.target.value })} /></AdminField>
          <AdminField label="Title"><AdminInput value={data.whatWeDo.title} onChange={(e) => set('whatWeDo', { ...data.whatWeDo, title: e.target.value })} /></AdminField>
          <AdminField label="Subtitle"><AdminTextarea value={data.whatWeDo.subtitle} onChange={(e) => set('whatWeDo', { ...data.whatWeDo, subtitle: e.target.value })} /></AdminField>
          <AdminField label="Footer note"><AdminInput value={data.whatWeDo.footerNote} onChange={(e) => set('whatWeDo', { ...data.whatWeDo, footerNote: e.target.value })} /></AdminField>
        </div>
        <ListEditor
          items={data.whatWeDo.sectors.map((s) => ({ ...s, badge: s.badge ?? '' })) as unknown as Record<string, string>[]}
          onChange={(sectors) =>
            set('whatWeDo', {
              ...data.whatWeDo,
              sectors: sectors.map((s) => ({ icon: s.icon, title: s.title, badge: s.badge || null, href: s.href })),
            })
          }
          fields={[{ key: 'icon', label: 'Icon (emoji)' }, { key: 'title', label: 'Title' }, { key: 'badge', label: 'Badge (optional)' }, { key: 'href', label: 'Link' }]}
        />
      </AdminCard>

      <AdminCard title="Stats Bar">
        <ListEditor
          items={data.statsBar.stats as unknown as Record<string, string>[]}
          onChange={(stats) => set('statsBar', { ...data.statsBar, stats: stats as unknown as HomeContent['statsBar']['stats'] })}
          fields={[{ key: 'prefix', label: 'Prefix' }, { key: 'value', label: 'Value' }, { key: 'suffix', label: 'Suffix' }, { key: 'label', label: 'Label' }]}
        />
        <AdminField label="Status line"><AdminInput value={data.statsBar.statusLine} onChange={(e) => set('statsBar', { ...data.statsBar, statusLine: e.target.value })} /></AdminField>
      </AdminCard>

      <AdminCard title="Flywheel">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <AdminField label="Eyebrow"><AdminInput value={data.flywheel.eyebrow} onChange={(e) => set('flywheel', { ...data.flywheel, eyebrow: e.target.value })} /></AdminField>
          <AdminField label="Title"><AdminInput value={data.flywheel.title} onChange={(e) => set('flywheel', { ...data.flywheel, title: e.target.value })} /></AdminField>
          <AdminField label="Subtitle"><AdminTextarea value={data.flywheel.subtitle} onChange={(e) => set('flywheel', { ...data.flywheel, subtitle: e.target.value })} /></AdminField>
        </div>
        <ListEditor
          items={data.flywheel.nodes as unknown as Record<string, string>[]}
          onChange={(nodes) => set('flywheel', { ...data.flywheel, nodes: nodes as unknown as HomeContent['flywheel']['nodes'] })}
          fields={[{ key: 'icon', label: 'Icon' }, { key: 'label', label: 'Label' }, { key: 'sub', label: 'Subtext' }, { key: 'href', label: 'Link' }, { key: 'color', label: 'Color (hex)' }]}
        />
      </AdminCard>

      <AdminCard title="Empire Preview Cards">
        <ListEditor
          items={data.empirePreview.empires as unknown as Record<string, string>[]}
          onChange={(empires) =>
            set('empirePreview', {
              ...data.empirePreview,
              empires: empires.map((e) => ({
                ...e,
                status: e.status as 'active' | 'building' | 'vision',
              })) as unknown as HomeContent['empirePreview']['empires'],
            })
          }
          fields={[
            { key: 'emoji', label: 'Emoji' }, { key: 'name', label: 'Name' }, { key: 'teaser', label: 'Teaser', multiline: true },
            { key: 'status', label: 'Status (active/building/vision)' }, { key: 'statusLabel', label: 'Status label' }, { key: 'href', label: 'Link' },
          ]}
        />
      </AdminCard>

      <AdminCard title="Testimonials">
        <ListEditor
          items={data.testimonials.items as unknown as Record<string, string>[]}
          onChange={(items) => set('testimonials', { ...data.testimonials, items: items as unknown as HomeContent['testimonials']['items'] })}
          fields={[{ key: 'quote', label: 'Quote', multiline: true }, { key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }]}
        />
      </AdminCard>

      <AdminCard title="Home CTA">
        <div className="grid md:grid-cols-2 gap-4">
          <AdminField label="Title"><AdminInput value={data.homeCta.title} onChange={(e) => set('homeCta', { ...data.homeCta, title: e.target.value })} /></AdminField>
          <AdminField label="Subtitle"><AdminTextarea value={data.homeCta.subtitle} onChange={(e) => set('homeCta', { ...data.homeCta, subtitle: e.target.value })} /></AdminField>
          <AdminField label="WhatsApp URL"><AdminInput value={data.homeCta.whatsappUrl} onChange={(e) => set('homeCta', { ...data.homeCta, whatsappUrl: e.target.value })} /></AdminField>
          <AdminField label="WhatsApp label"><AdminInput value={data.homeCta.whatsappLabel} onChange={(e) => set('homeCta', { ...data.homeCta, whatsappLabel: e.target.value })} /></AdminField>
        </div>
      </AdminCard>
    </div>
  );
}

function StringListEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <AdminInput className="flex-1" value={item} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-red-400 px-2">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])} className="text-xs text-[#D4AF37]">+ Add</button>
    </div>
  );
}
