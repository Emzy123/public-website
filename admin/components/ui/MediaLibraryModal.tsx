'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { MediaListItem } from '@/lib/media/gridfs';

type MediaLibraryModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function MediaLibraryModal({ open, onClose, onSelect }: MediaLibraryModalProps) {
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/media?limit=100');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Failed to load media');
      setItems(json.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Media library</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <p className="text-slate-400 text-sm">Loading…</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p className="text-slate-500 text-sm">No uploads yet. Use Upload image on any CMS field first.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.url);
                  onClose();
                }}
                className="group rounded-lg border border-slate-700 overflow-hidden text-left hover:border-[#D4AF37] transition-colors"
              >
                <div
                  className="h-24 bg-slate-950 bg-cover bg-center"
                  style={{ backgroundImage: `url('${item.url}')` }}
                />
                <div className="p-2">
                  <p className="text-xs text-white truncate">{item.filename}</p>
                  <p className="text-[10px] text-slate-500 truncate">{item.uploadedBy ?? 'upload'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
