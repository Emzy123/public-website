import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, error, className = '', disabled, ...props }, ref) => {
    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-brand-accent focus:ring-brand-accent/20 disabled:cursor-not-allowed"
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={id} className="font-medium text-brand-ink cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-slate-500 mt-0.5">{description}</p>}
            {error && <p className="text-rose-600 mt-1 font-medium">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
