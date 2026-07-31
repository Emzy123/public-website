'use client';

import React from 'react';
import type { HeroSlide } from '@admin/types/content';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';
import { ImageUploadField } from '../ui/ImageUploadField';

export function HeroEditor({
  slides,
  onChange,
}: {
  slides: HeroSlide[];
  onChange: (slides: HeroSlide[]) => void;
}) {
  const update = (index: number, patch: Partial<HeroSlide>) => {
    const next = [...slides];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addSlide = () => {
    const id = `slide-${Date.now()}`;
    onChange([
      ...slides,
      {
        id,
        bgUrl: '',
        badge: 'NEW',
        headline: 'Headline',
        headlineAccent: 'Accent',
        subheadline: 'Subheadline text',
        cta: { label: 'Primary CTA', href: '/' },
        ctaSecondary: { label: 'Secondary CTA', href: '/' },
        enabled: true,
        sortOrder: slides.length,
      },
    ]);
  };

  const removeSlide = (index: number) => {
    onChange(slides.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, dir: -1 | 1) => {
    const next = [...slides];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, sortOrder: i })));
  };

  return (
    <div className="space-y-6">
      {slides.map((slide, i) => (
        <AdminCard key={slide.id} title={`Slide ${i + 1}: ${slide.headline}`}>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => moveSlide(i, -1)} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">↑</button>
            <button type="button" onClick={() => moveSlide(i, 1)} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">↓</button>
            <label className="flex items-center gap-2 text-xs text-slate-400 ml-auto">
              <input type="checkbox" checked={slide.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} />
              Enabled
            </label>
            <button type="button" onClick={() => removeSlide(i)} className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300">Remove</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <ImageUploadField
              label="Background Image"
              value={slide.bgUrl}
              onChange={(bgUrl) => update(i, { bgUrl })}
            />
            <AdminField label="Badge">
              <AdminInput value={slide.badge} onChange={(e) => update(i, { badge: e.target.value })} />
            </AdminField>
            <AdminField label="Headline">
              <AdminInput value={slide.headline} onChange={(e) => update(i, { headline: e.target.value })} />
            </AdminField>
            <AdminField label="Headline Accent (gold text)">
              <AdminInput value={slide.headlineAccent} onChange={(e) => update(i, { headlineAccent: e.target.value })} />
            </AdminField>
            <AdminField label="Subheadline" hint="Full width">
              <AdminTextarea value={slide.subheadline} onChange={(e) => update(i, { subheadline: e.target.value })} className="md:col-span-2" />
            </AdminField>
            <AdminField label="Primary CTA Label">
              <AdminInput value={slide.cta.label} onChange={(e) => update(i, { cta: { ...slide.cta, label: e.target.value } })} />
            </AdminField>
            <AdminField label="Primary CTA Link">
              <AdminInput value={slide.cta.href} onChange={(e) => update(i, { cta: { ...slide.cta, href: e.target.value } })} />
            </AdminField>
            <AdminField label="Secondary CTA Label">
              <AdminInput value={slide.ctaSecondary.label} onChange={(e) => update(i, { ctaSecondary: { ...slide.ctaSecondary, label: e.target.value } })} />
            </AdminField>
            <AdminField label="Secondary CTA Link">
              <AdminInput value={slide.ctaSecondary.href} onChange={(e) => update(i, { ctaSecondary: { ...slide.ctaSecondary, href: e.target.value } })} />
            </AdminField>
          </div>
        </AdminCard>
      ))}

      <button type="button" onClick={addSlide} className="w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:border-[#D4AF37] hover:text-[#D4AF37] text-sm">
        + Add Slide
      </button>
    </div>
  );
}
