'use client';

import { useState } from 'react';
import type { AdvertItem, AdvertsContent } from '@admin/types/content';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';
import { ImageUploadField } from '../ui/ImageUploadField';
import { checkAdvertRisk } from '@/lib/compliance/risk-check';

function newAdvert(sortOrder: number): AdvertItem {
  return {
    id: `advert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    eyebrow: 'Special event',
    body: '',
    imageUrl: '',
    flyerImage: '',
    imageAlt: '',
    ctaLabel: 'Learn more',
    ctaHref: '/contact',
    enabled: false,
    showModal: false,
    dismissalDays: 7,
    startsAt: '',
    endsAt: '',
    sortOrder,
    legalApproval: false,
  };
}

export function AdvertsEditor({ data, onChange }: { data: AdvertsContent; onChange: (d: AdvertsContent) => void }) {
  const sorted = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder);
  const [approvalLoading, setApprovalLoading] = useState<Record<string, boolean>>({});

  const update = (id: string, patch: Partial<AdvertItem>) => {
    onChange({
      items: data.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };

        // If content is modified after legal approval, revoke approval locally and re-lock Enabled.
        // Server PUT is the authoritative validator and recomputes the content hash from stored content.
        if (item.legalApproval) {
          const contentChanged =
            patch.title !== undefined ||
            patch.body !== undefined ||
            patch.ctaLabel !== undefined ||
            patch.ctaHref !== undefined ||
            patch.imageUrl !== undefined ||
            patch.flyerImage !== undefined ||
            patch.imageAlt !== undefined ||
            patch.showModal !== undefined;

          if (contentChanged) {
            updated.legalApproval = false;
            updated.legalApprovedBy = undefined;
            updated.legalApprovedAt = undefined;
            updated.enabled = false;
          }
        }
        return updated;
      }),
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

  const handleLegalApprovalToggle = async (item: AdvertItem, approved: boolean) => {
    setApprovalLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      // Fetch fresh CSRF token
      let csrfToken = '';
      try {
        const tokenRes = await fetch('/api/admin/content/adverts');
        csrfToken = tokenRes.headers.get('x-csrf-token') || '';
      } catch {
        /* proceed */
      }

      const res = await fetch('/api/admin/content/adverts/legal-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({
          advertId: item.id,
          title: item.title,
          body: item.body,
          ctaLabel: item.ctaLabel,
          ctaHref: item.ctaHref,
          imageUrl: item.imageUrl,
          flyerImage: item.flyerImage,
          imageAlt: item.imageAlt,
          showModal: item.showModal,
          approved,
        }),
      });

      const json = await res.json().catch(() => ({}));

      update(item.id, {
        legalApproval: approved,
        legalApprovedAt: approved ? json.legalApprovedAt : undefined,
        legalApprovedBy: approved ? json.legalApprovedBy : undefined,
        // If revoking approval, disable the advert immediately
        ...(approved ? {} : { enabled: false }),
      });
    } catch (err) {
      console.error('Failed to update legal approval state:', err);
      // Fallback update in local state
      update(item.id, {
        legalApproval: approved,
        legalApprovedAt: approved ? new Date().toISOString() : undefined,
        ...(approved ? {} : { enabled: false }),
      });
    } finally {
      setApprovalLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard title="How this appears on the site">
        <p className="text-sm leading-6 text-[#7b7263]">
          Enabled adverts appear as a <strong className="text-[#0d1a4a]">sticky spotlight strip under the header</strong> on
          public marketing pages. Adverts and flyers are strictly suppressed on authentication pages, dashboard/portal workspaces,
          the admin console, application forms (/join), and credential verification (/verify).
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
        sorted.map((item) => {
          const risk = checkAdvertRisk(item);
          const requiresLegal = risk.hasRisk;
          const isApproved = Boolean(item.legalApproval);
          const isEnabledDisabled = requiresLegal && !isApproved;

          return (
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
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <label
                  className={`flex items-center gap-2 text-sm ${
                    isEnabledDisabled
                      ? 'cursor-not-allowed opacity-60 text-slate-500'
                      : 'cursor-pointer text-[#0d1a4a]'
                  }`}
                  title={
                    isEnabledDisabled
                      ? 'Legal approval must be obtained before enabling an advert with financial claims or image content'
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    checked={item.enabled && !isEnabledDisabled}
                    disabled={isEnabledDisabled}
                    onChange={(e) => update(item.id, { enabled: e.target.checked })}
                  />
                  <span>Enabled (live when published)</span>
                  {isEnabledDisabled && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-300">
                      Locked — Legal Approval Required
                    </span>
                  )}
                </label>
                <label className="flex items-center gap-2 text-sm text-[#0d1a4a] cursor-pointer">
                  <input type="checkbox" checked={item.showModal} onChange={(e) => update(item.id, { showModal: e.target.checked })} />
                  <span>Show flyer modal</span>
                </label>
              </div>

              {/* Compliance Warning & Legal Approval Gate */}
              {requiresLegal && (
                <div
                  data-testid={`legal-warning-${item.id}`}
                  className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl leading-none text-amber-600" aria-hidden="true">⚠</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-900 text-base">
                        {risk.imageRisk && !risk.matchedTerms.some((t) => t !== "Image content can't be auto-checked.")
                          ? 'Image Compliance Notice — Legal Approval Required'
                          : 'Compliance Warning — Legal Approval Required'}
                      </p>
                      <p className="mt-1 text-amber-800 leading-relaxed">
                        This advert requires legal approval{' '}
                        <span className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900">
                          {risk.matchedTerms.join(', ')}
                        </span>{' '}
                        in field(s): <span className="font-semibold">{risk.matchedFields.join(', ')}</span>.
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        {risk.imageRisk
                          ? "Image content can't be auto-checked by text scanning. Any advert with a flyer image or modal promo requires explicit legal sign-off before being enabled."
                          : 'Under regulatory compliance standards, adverts containing return, profit, or investment claims cannot be enabled on the website without explicit legal sign-off.'}
                      </p>

                      <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <label className="flex items-center gap-2.5 font-bold text-amber-950 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isApproved}
                            disabled={approvalLoading[item.id]}
                            onChange={(e) => handleLegalApprovalToggle(item, e.target.checked)}
                            className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                          />
                          <span>Legal approval obtained</span>
                        </label>
                        {isApproved ? (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-1 rounded inline-flex items-center gap-1">
                            ✓ Approved{item.legalApprovedBy ? ` by ${item.legalApprovedBy}` : ''}{item.legalApprovedAt ? ` on ${new Date(item.legalApprovedAt).toLocaleDateString()}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-800">
                            Required to enable this advert
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {item.showModal && !requiresLegal && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <strong>⚠ Flyer modal notice:</strong> Ensure flyer poster image and message adhere to SINet
                  editorial guidelines. Modals open once per visitor per dismissal period.
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
                <div className="md:col-span-2 space-y-4">
                  <ImageUploadField
                    label="Flyer / poster image"
                    value={item.flyerImage || item.imageUrl}
                    onChange={(url) => update(item.id, { flyerImage: url, imageUrl: url })}
                    previewClassName="h-64"
                  />
                  <AdminField label="Flyer image alt text (for accessibility & compliance binding)">
                    <AdminInput
                      value={item.imageAlt || ''}
                      onChange={(e) => update(item.id, { imageAlt: e.target.value })}
                      placeholder="Descriptive alt text for the flyer"
                    />
                  </AdminField>
                </div>
              </div>
            </AdminCard>
          );
        })
      )}
    </div>
  );
}
