import React from 'react';

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  optional?: boolean;
  help?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  required,
  optional,
  help,
  error,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-bold text-brand-ink">
            {label}
            {required && <span className="text-rose-600 ml-0.5">*</span>}
          </label>
          {optional && <span className="text-[11px] text-slate-400">Optional</span>}
        </div>
      )}

      {children}

      {error ? (
        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      ) : help ? (
        <p className="text-[11px] text-slate-500">{help}</p>
      ) : null}
    </div>
  );
}
