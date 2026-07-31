'use client';

import React, { useState } from 'react';
import { AdminField, AdminTextarea } from './AdminField';
import { CmsMarkdown } from '@/components/cms/CmsMarkdown';

type AdminMarkdownFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
};

export function AdminMarkdownField({ label, value, onChange, hint, rows = 5 }: AdminMarkdownFieldProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  return (
    <AdminField
      label={label}
      hint={hint ?? 'Supports **bold**, lists, and [links](url). Leave blank lines between paragraphs.'}
    >
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`px-2 py-1 rounded text-xs ${mode === 'edit' ? 'bg-[#D4AF37] text-[#0A2342]' : 'text-slate-400 hover:text-white'}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-2 py-1 rounded text-xs ${mode === 'preview' ? 'bg-[#D4AF37] text-[#0A2342]' : 'text-slate-400 hover:text-white'}`}
        >
          Preview
        </button>
      </div>

      {mode === 'edit' ? (
        <AdminTextarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
          {value.trim() ? <CmsMarkdown content={value} /> : <p className="text-slate-500 italic">Nothing to preview</p>}
        </div>
      )}
    </AdminField>
  );
}
