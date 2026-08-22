'use client';

import { useMemo, useState } from 'react';
import type { GalleryContent, GalleryItem, GalleryPillar } from '@admin/types/content';
import { PILLAR_LABELS, PILLARS, type Pillar } from '@/lib/types/membership';
import { useImageUpload, useMultiImageFileInput } from '@admin/hooks/useImageUpload';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';
import { ImageUploadField } from '../ui/ImageUploadField';

const PILLAR_OPTIONS: { value: GalleryPillar; label: string }[] = PILLARS.map((p) => ({
  value: p as GalleryPillar,
  label: PILLAR_LABELS[p as Pillar],
}));

function newItem(pillar: GalleryPillar, sortOrder: number, imageUrl = '', caption = ''): GalleryItem {
  return {
    id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pillar,
    imageUrl,
    caption,
    sortOrder,
  };
}

export function GalleryEditor({ data, onChange }: { data: GalleryContent; onChange: (d: GalleryContent) => void }) {
  const [pillarFilter, setPillarFilter] = useState<GalleryPillar | 'all'>('all');
  const [uploadPillar, setUploadPillar] = useState<GalleryPillar>('agriculture');
  const { uploadMany, uploading, progress, error: uploadError, clearError } = useImageUpload();

  const visibleItems = useMemo(() => {
    const sorted = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder);
    if (pillarFilter === 'all') return sorted;
    return sorted.filter((item) => item.pillar === pillarFilter);
  }, [data.items, pillarFilter]);

  const updateItem = (id: string, patch: Partial<GalleryItem>) => {
    onChange({
      ...data,
      items: data.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, items: data.items.filter((item) => item.id !== id) });
  };

  const addItem = () => {
    const pillar = pillarFilter === 'all' ? uploadPillar : pillarFilter;
    const sortOrder = data.items.length;
    onChange({ ...data, items: [...data.items, newItem(pillar, sortOrder)] });
  };

  const handleMultiUpload = async (files: File[]) => {
    clearError();
    const pillar = pillarFilter === 'all' ? uploadPillar : pillarFilter;
    const results = await uploadMany(files);
    if (results.length === 0) return;

    const startOrder = data.items.length;
    const added = results.map((result, index) =>
      newItem(pillar, startOrder + index, result.url, result.filename.replace(/\.[^.]+$/, ''))
    );
    onChange({ ...data, items: [...data.items, ...added] });
  };

  const { open: openMultiUpload, inputProps: multiInputProps } = useMultiImageFileInput(handleMultiUpload);

  const moveItem = (id: string, direction: -1 | 1) => {
    const sorted = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange({
      ...data,
      items: reordered.map((item, i) => ({ ...item, sortOrder: i })),
    });
  };

  return (
    <div className="space-y-6">
      <AdminCard title="Page intro">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Eyebrow">
            <AdminInput
              value={data.hero.badge}
              onChange={(e) => onChange({ ...data, hero: { ...data.hero, badge: e.target.value } })}
            />
          </AdminField>
          <AdminField label="Title">
            <AdminInput
              value={data.hero.title}
              onChange={(e) => onChange({ ...data, hero: { ...data.hero, title: e.target.value } })}
            />
          </AdminField>
          <AdminField label="Subtitle">
            <AdminTextarea
              value={data.hero.subtitle}
              onChange={(e) => onChange({ ...data, hero: { ...data.hero, subtitle: e.target.value } })}
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="Gallery images">
        <p className="mb-4 text-sm text-[#7b7263]">
          Every upload must be tagged to a pillar. Use the tabs below to manage each pillar independently, or upload many images at once.
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          <PillarTab active={pillarFilter === 'all'} onClick={() => setPillarFilter('all')}>
            All ({data.items.length})
          </PillarTab>
          {PILLAR_OPTIONS.map(({ value, label }) => (
            <PillarTab key={value} active={pillarFilter === value} onClick={() => setPillarFilter(value)}>
              {label} ({data.items.filter((i) => i.pillar === value).length})
            </PillarTab>
          ))}
        </div>

        <div className="mb-6 rounded-xl border border-[#e4dcc9] bg-[#f9f7f2] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7263]">Upload multiple images</p>
          <div className="flex flex-wrap items-end gap-3">
            {pillarFilter === 'all' && (
              <label className="block min-w-[200px]">
                <span className="mb-1.5 block text-sm font-medium text-[#0d1a4a]">Pillar for this batch</span>
                <select
                  value={uploadPillar}
                  onChange={(e) => setUploadPillar(e.target.value as GalleryPillar)}
                  className="w-full rounded-lg border border-[#e4dcc9] bg-white px-3 py-2 text-sm"
                  disabled={uploading}
                >
                  {PILLAR_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={openMultiUpload}
              disabled={uploading}
              className="rounded-lg bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] hover:bg-[#eccb7c] disabled:opacity-50"
            >
              {uploading && progress
                ? `Uploading ${progress.done}/${progress.total}…`
                : uploading
                  ? 'Uploading…'
                  : 'Choose multiple images'}
            </button>
            <button
              type="button"
              onClick={addItem}
              disabled={uploading}
              className="rounded-lg border border-[#d9d1bf] px-4 py-2 text-sm font-medium text-[#0d1a4a] hover:bg-white disabled:opacity-50"
            >
              + Add empty slot
            </button>
            <input {...multiInputProps} />
          </div>
          <p className="mt-2 text-xs text-[#7b7263]">
            {pillarFilter === 'all'
              ? `Selected files will be tagged as ${PILLAR_LABELS[uploadPillar]}. Max 4MB each.`
              : `Selected files will be tagged as ${PILLAR_LABELS[pillarFilter as Pillar]}. Max 4MB each.`}
          </p>
          {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
        </div>

        {visibleItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#e4dcc9] bg-[#f9f7f2] px-4 py-8 text-center text-sm text-[#7b7263]">
            No images{pillarFilter !== 'all' ? ` for ${PILLAR_LABELS[pillarFilter as Pillar]}` : ''} yet. Upload above.
          </p>
        ) : (
          <div className="space-y-4">
            {visibleItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#e4dcc9] bg-[#f9f7f2] p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#d9711b]">
                    {PILLAR_LABELS[item.pillar as Pillar]}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moveItem(item.id, -1)} className="text-xs text-[#7b7263] hover:text-[#0d1a4a]">↑</button>
                    <button type="button" onClick={() => moveItem(item.id, 1)} className="text-xs text-[#7b7263] hover:text-[#0d1a4a]">↓</button>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-red-600 hover:underline">Remove</button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <AdminField label="Pillar (required)">
                    <select
                      value={item.pillar}
                      onChange={(e) => updateItem(item.id, { pillar: e.target.value as GalleryPillar })}
                      className="w-full rounded-lg border border-[#e4dcc9] bg-white px-3 py-2 text-sm"
                    >
                      {PILLAR_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Caption">
                    <AdminInput
                      value={item.caption}
                      onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                      placeholder="Brief description of what this shows"
                    />
                  </AdminField>
                  <div className="lg:col-span-2">
                    <ImageUploadField
                      label="Image"
                      value={item.imageUrl}
                      onChange={(imageUrl) => updateItem(item.id, { imageUrl })}
                      previewClassName="h-48"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function PillarTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'border-[#0d1a4a] bg-[#0d1a4a] text-white' : 'border-[#e4dcc9] text-[#7b7263] hover:border-[#0d1a4a]'
      }`}
    >
      {children}
    </button>
  );
}
