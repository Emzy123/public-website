'use client';

import React, { useState } from 'react';
import { AdminField, AdminInput } from './AdminField';
import { useImageFileInput, useImageUpload } from '@admin/hooks/useImageUpload';
import { MediaLibraryModal } from './MediaLibraryModal';

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  previewClassName?: string;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  previewClassName = 'h-32',
}: ImageUploadFieldProps) {
  const { upload, uploading, error, clearError } = useImageUpload();
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleFile = async (file: File) => {
    clearError();
    const result = await upload(file);
    if (result?.url) onChange(result.url);
  };

  const { open, inputProps } = useImageFileInput(handleFile);

  return (
    <>
      <AdminField
        label={label}
        hint={hint ?? 'Upload an image, pick from the library, or paste an external URL. Max 4MB (JPEG, PNG, WebP, GIF, SVG).'}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={open}
              disabled={uploading}
              className="rounded-lg bg-[#d9a23c] px-3 py-2 text-sm font-semibold text-[#0d1a4a] hover:bg-[#eccb7c] disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="rounded-lg border border-[#d9d1bf] px-3 py-2 text-sm font-medium text-[#0d1a4a] hover:bg-[#f6f2e8] transition-colors"
            >
              Pick from library
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-lg border border-[#d9d1bf] px-3 py-2 text-sm text-[#7b7263] hover:text-[#0d1a4a] transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <input {...inputProps} />

          <AdminInput
            value={value}
            onChange={(e) => {
              clearError();
              onChange(e.target.value);
            }}
            placeholder="https://… or /api/media/…"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          {value && (
            <div
              className={`rounded-lg border border-[#e4dcc9] bg-[#f6f2e8] bg-cover bg-center ${previewClassName}`}
              style={{ backgroundImage: `url('${value}')` }}
              role="img"
              aria-label={`${label} preview`}
            />
          )}
        </div>
      </AdminField>

      <MediaLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} onSelect={onChange} />
    </>
  );
}
