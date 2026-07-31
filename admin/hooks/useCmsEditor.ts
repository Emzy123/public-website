'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CmsAdminMeta } from '@admin/lib/cms/repository';
import type { CmsKey } from '@admin/types/content';
import { contentDiffers } from '@admin/lib/cms/diff';

type EditorMeta = CmsAdminMeta & { previewPath: string };

export function useCmsEditor<K extends CmsKey>(key: K) {
  const [data, setData] = useState<unknown>(null);
  const [meta, setMeta] = useState<EditorMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const savedSnapshot = useRef<unknown>(null);

  const isDirty = data !== null && savedSnapshot.current !== null && contentDiffers(data, savedSnapshot.current);

  const applyResponse = useCallback((json: { data: unknown; meta?: CmsAdminMeta; previewPath?: string }) => {
    setData(json.data);
    savedSnapshot.current = json.data;
    if (json.meta) {
      setMeta({
        ...json.meta,
        previewPath: json.previewPath ?? meta?.previewPath ?? '/',
      });
    }
  }, [meta?.previewPath]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/${key}`);
      if (!res.ok) throw new Error('Failed to load content');
      const json = await res.json();
      applyResponse(json);
      if (json.previewPath) {
        setMeta((prev) => ({
          ...(json.meta ?? prev ?? { hasDraft: false, hasUnpublishedChanges: false }),
          previewPath: json.previewPath,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [applyResponse, key]);

  useEffect(() => {
    load();
  }, [load]);

  const saveDraft = async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/content/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Failed to save draft');
      applyResponse(json);
      if (json.meta || json.previewPath) {
        setMeta({
          ...(json.meta ?? {}),
          previewPath: json.previewPath ?? meta?.previewPath ?? '/',
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    setPublished(false);
    try {
      if (isDirty) {
        const saved = await saveDraft();
        if (!saved) return;
      }

      const res = await fetch(`/api/admin/content/${key}/publish`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Failed to publish');

      applyResponse(json);
      if (json.meta || json.previewPath) {
        setMeta({
          ...(json.meta ?? {}),
          previewPath: json.previewPath ?? meta?.previewPath ?? '/',
        });
      }
      setPublished(true);
      setTimeout(() => setPublished(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const openPreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      if (isDirty) {
        const res = await fetch(`/api/admin/content/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? 'Failed to save draft before preview');
        applyResponse(json);
        if (json.meta) {
          setMeta((prev) => ({
            ...(prev ?? { previewPath: json.previewPath ?? '/' }),
            ...json.meta,
            previewPath: json.previewPath ?? prev?.previewPath ?? '/',
          }));
        }
      }

      const enable = await fetch('/api/admin/preview/enable', { method: 'POST' });
      if (!enable.ok) throw new Error('Failed to enable preview mode');

      const path = meta?.previewPath ?? '/';
      window.open(path, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  return {
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
    reload: load,
  };
}
