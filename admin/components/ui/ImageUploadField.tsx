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
              className="px-3 py-2 rounded-lg bg-[#D4AF37] text-[#0A2342] text-sm font-semibold hover:bg-[#F4D03F] disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="px-3 py-2 rounded-lg border border-slate-600 text-sm text-slate-200 hover:border-slate-400 transition-colors"
            >
              Pick from library
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white transition-colors"
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

          {error && <p className="text-xs text-red-400">{error}</p>}

          {value && (
            <div
              className={`rounded-lg border border-slate-700 bg-slate-950 bg-cover bg-center ${previewClassName}`}
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
