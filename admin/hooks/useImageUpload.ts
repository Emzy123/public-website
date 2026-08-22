'use client';

import { useCallback, useRef, useState } from 'react';
import { MEDIA_ALLOWED_TYPES, MEDIA_MAX_BYTES } from '@/lib/media/validation';

type UploadResult = {
  id: string;
  url: string;
  filename: string;
};

function validateFile(file: File): string | null {
  if (!MEDIA_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_ALLOWED_TYPES)[number])) {
    return `"${file.name}" has an unsupported type. Use JPEG, PNG, WebP, GIF, or SVG.`;
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return `"${file.name}" is too large. Maximum size is 4MB.`;
  }
  return null;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [csrfToken, setCsrfToken] = useState('');

  const ensureToken = useCallback(async () => {
    if (csrfToken) return csrfToken;
    const tokenResponse = await fetch('/api/admin/media?limit=1');
    const token = tokenResponse.headers.get('x-csrf-token') ?? '';
    setCsrfToken(token);
    return token;
  }, [csrfToken]);

  const uploadOne = useCallback(async (file: File, token: string): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'x-csrf-token': token },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Failed to upload ${file.name}`);
    return data as UploadResult;
  }, []);

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    setError('');
    setProgress(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setUploading(false);
      return null;
    }

    try {
      const token = await ensureToken();
      if (!token) throw new Error('Security token unavailable. Please refresh and try again.');
      return await uploadOne(file, token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, [ensureToken, uploadOne]);

  const uploadMany = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    setUploading(true);
    setError('');
    setProgress({ done: 0, total: files.length });

    const results: UploadResult[] = [];
    const failures: string[] = [];

    try {
      const token = await ensureToken();
      if (!token) throw new Error('Security token unavailable. Please refresh and try again.');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);
        if (validationError) {
          failures.push(validationError);
          setProgress({ done: i + 1, total: files.length });
          continue;
        }
        try {
          results.push(await uploadOne(file, token));
        } catch (e) {
          failures.push(e instanceof Error ? e.message : `Failed to upload ${file.name}`);
        }
        setProgress({ done: i + 1, total: files.length });
      }

      if (failures.length > 0) {
        setError(
          results.length > 0
            ? `${results.length} uploaded. ${failures.length} failed: ${failures[0]}`
            : failures[0]
        );
      }

      return results;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      return results;
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [ensureToken, uploadOne]);

  const clearError = useCallback(() => setError(''), []);

  return { upload, uploadMany, uploading, progress, error, clearError };
}

export function useImageFileInput(onFile: (file: File) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => inputRef.current?.click();

  const inputProps = {
    ref: inputRef,
    type: 'file' as const,
    accept: MEDIA_ALLOWED_TYPES.join(','),
    className: 'hidden' as const,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) onFile(file);
      event.target.value = '';
    },
  };

  return { open, inputProps };
}

export function useMultiImageFileInput(onFiles: (files: File[]) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => inputRef.current?.click();

  const inputProps = {
    ref: inputRef,
    type: 'file' as const,
    accept: MEDIA_ALLOWED_TYPES.join(','),
    multiple: true as const,
    className: 'hidden' as const,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length > 0) onFiles(files);
      event.target.value = '';
    },
  };

  return { open, inputProps };
}
