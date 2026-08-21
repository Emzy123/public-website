'use client';

import React from 'react';

type Props = {
  label: string;
  children: React.ReactNode;
  hint?: string;
};

export function AdminField({ label, children, hint }: Props) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[#0d1a4a]">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[#7b7263]">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-[#d9d1bf] bg-white px-3 py-2.5 text-sm text-[#0d1a4a] placeholder:text-[#b0a799] focus:border-[#d9a23c] focus:outline-none focus:ring-2 focus:ring-[#d9a23c]/20 transition-colors';

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />;
}

export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} min-h-[80px] resize-y`} {...props} />;
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClass} {...props} />;
}
