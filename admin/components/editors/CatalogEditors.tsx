'use client';

import type {
  CatalogPillar,
  PartnerItem,
  PartnersPageContent,
  ProductItem,
  ProductsPageContent,
} from '@admin/types/content';
import { PILLAR_LABELS } from '@/lib/types/membership';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';
import { ImageUploadField } from '../ui/ImageUploadField';

const PILLAR_OPTIONS: { value: CatalogPillar; label: string }[] = [
  { value: 'agriculture', label: PILLAR_LABELS.agriculture },
  { value: 'trade-distribution', label: PILLAR_LABELS['trade-distribution'] },
  { value: 'real-estate', label: PILLAR_LABELS['real-estate'] },
  { value: 'general', label: 'General' },
];

function HeroFields({
  hero,
  onChange,
}: {
  hero: ProductsPageContent['hero'];
  onChange: (hero: ProductsPageContent['hero']) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AdminField label="Eyebrow">
        <AdminInput value={hero.badge} onChange={(e) => onChange({ ...hero, badge: e.target.value })} />
      </AdminField>
      <AdminField label="Title">
        <AdminInput value={hero.title} onChange={(e) => onChange({ ...hero, title: e.target.value })} />
      </AdminField>
      <AdminField label="Subtitle">
        <AdminTextarea value={hero.subtitle} onChange={(e) => onChange({ ...hero, subtitle: e.target.value })} />
      </AdminField>
    </div>
  );
}

function newProduct(sortOrder: number): ProductItem {
  return {
    id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    body: '',
    pillar: 'general',
    imageUrl: '',
    href: '',
    available: true,
    sortOrder,
  };
}

function newPartner(sortOrder: number): PartnerItem {
  return {
    id: `partner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    body: '',
    pillar: 'general',
    logoUrl: '',
    href: '',
    sortOrder,
  };
}

export function ProductsPageEditor({
  data,
  onChange,
}: {
  data: ProductsPageContent;
  onChange: (d: ProductsPageContent) => void;
}) {
  const sorted = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder);

  const update = (id: string, patch: Partial<ProductItem>) => {
    onChange({ ...data, items: data.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  };

  return (
    <div className="space-y-6">
      <AdminCard title="Page intro">
        <HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} />
      </AdminCard>
      <AdminCard title="Products">
        <button
          type="button"
          onClick={() => onChange({ ...data, items: [...data.items, newProduct(data.items.length)] })}
          className="mb-4 rounded-lg bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] hover:bg-[#eccb7c]"
        >
          + Add product
        </button>
        <div className="space-y-4">
          {sorted.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#e4dcc9] bg-[#f9f7f2] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-[#0d1a4a]">
                  <input type="checkbox" checked={item.available} onChange={(e) => update(item.id, { available: e.target.checked })} />
                  Visible on public products page
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, items: data.items.filter((p) => p.id !== item.id) })}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Title">
                  <AdminInput value={item.title} onChange={(e) => update(item.id, { title: e.target.value })} />
                </AdminField>
                <AdminField label="Pillar">
                  <select
                    value={item.pillar}
                    onChange={(e) => update(item.id, { pillar: e.target.value as CatalogPillar })}
                    className="w-full rounded-lg border border-[#e4dcc9] bg-white px-3 py-2 text-sm"
                  >
                    {PILLAR_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="Description">
                  <AdminTextarea value={item.body} onChange={(e) => update(item.id, { body: e.target.value })} />
                </AdminField>
                <AdminField label="Link">
                  <AdminInput value={item.href} onChange={(e) => update(item.id, { href: e.target.value })} placeholder="/sectors#agriculture" />
                </AdminField>
                <div className="md:col-span-2">
                  <ImageUploadField label="Image" value={item.imageUrl} onChange={(imageUrl) => update(item.id, { imageUrl })} previewClassName="h-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

export function PartnersPageEditor({
  data,
  onChange,
}: {
  data: PartnersPageContent;
  onChange: (d: PartnersPageContent) => void;
}) {
  const sorted = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder);

  const update = (id: string, patch: Partial<PartnerItem>) => {
    onChange({ ...data, items: data.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  };

  return (
    <div className="space-y-6">
      <AdminCard title="Page intro">
        <HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} />
      </AdminCard>
      <AdminCard title="Partners">
        <button
          type="button"
          onClick={() => onChange({ ...data, items: [...data.items, newPartner(data.items.length)] })}
          className="mb-4 rounded-lg bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] hover:bg-[#eccb7c]"
        >
          + Add partner
        </button>
        <div className="space-y-4">
          {sorted.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#e4dcc9] bg-[#f9f7f2] p-4">
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onChange({ ...data, items: data.items.filter((p) => p.id !== item.id) })}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Name">
                  <AdminInput value={item.name} onChange={(e) => update(item.id, { name: e.target.value })} />
                </AdminField>
                <AdminField label="Pillar">
                  <select
                    value={item.pillar}
                    onChange={(e) => update(item.id, { pillar: e.target.value as CatalogPillar })}
                    className="w-full rounded-lg border border-[#e4dcc9] bg-white px-3 py-2 text-sm"
                  >
                    {PILLAR_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="Description">
                  <AdminTextarea value={item.body} onChange={(e) => update(item.id, { body: e.target.value })} />
                </AdminField>
                <AdminField label="Website / link">
                  <AdminInput value={item.href} onChange={(e) => update(item.id, { href: e.target.value })} />
                </AdminField>
                <div className="md:col-span-2">
                  <ImageUploadField label="Logo" value={item.logoUrl} onChange={(logoUrl) => update(item.id, { logoUrl })} previewClassName="h-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
      <AdminCard title="Partnership CTA">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Title">
            <AdminInput value={data.ctaTitle} onChange={(e) => onChange({ ...data, ctaTitle: e.target.value })} />
          </AdminField>
          <AdminField label="Button label">
            <AdminInput value={data.ctaLabel} onChange={(e) => onChange({ ...data, ctaLabel: e.target.value })} />
          </AdminField>
          <AdminField label="Body">
            <AdminTextarea value={data.ctaBody} onChange={(e) => onChange({ ...data, ctaBody: e.target.value })} />
          </AdminField>
          <AdminField label="Button link">
            <AdminInput value={data.ctaHref} onChange={(e) => onChange({ ...data, ctaHref: e.target.value })} />
          </AdminField>
        </div>
      </AdminCard>
    </div>
  );
}
