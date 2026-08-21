'use client';

import { useCallback, useRef, useState } from 'react';
import { MEDIA_ALLOWED_TYPES, MEDIA_MAX_BYTES } from '@/lib/media/validation';

type UploadResult = {
  id: string;
  url: string;
  filename: string;
};

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    setError('');

    if (!MEDIA_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_ALLOWED_TYPES)[number])) {
      setError('Unsupported file type. Use JPEG, PNG, WebP, GIF, or SVG.');
      setUploading(false);
      return null;
    }

    if (file.size > MEDIA_MAX_BYTES) {
      setError('File is too large. Maximum size is 4MB.');
      setUploading(false);
      return null;
    }

    try {
      let token = csrfToken;
      if (!token) {
        const tokenResponse = await fetch('/api/admin/media?limit=1');
        token = tokenResponse.headers.get('x-csrf-token') ?? '';
        setCsrfToken(token);
      }
      if (!token) throw new Error('Security token unavailable. Please refresh and try again.');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed');
      }

      return data as UploadResult;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, [csrfToken]);

  const clearError = useCallback(() => setError(''), []);

  return { upload, uploading, error, clearError };
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
