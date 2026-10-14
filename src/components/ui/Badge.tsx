import React from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'accent' | 'navy';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({
  variant = 'neutral',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { pill: string; dot: string }> = {
    neutral: {
      pill: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    success: {
      pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    warning: {
      pill: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    error: {
      pill: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },
    accent: {
      pill: 'bg-amber-100 text-amber-900 border-amber-300',
      dot: 'bg-amber-600',
    },
    navy: {
      pill: 'bg-brand-ink/10 text-brand-ink border-brand-ink/20',
      dot: 'bg-brand-ink',
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style.pill} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {children}
    </span>
  );
}

/**
 * Standard Status vocabulary mapping as required in 4.3:
 * - pending / under review (amber)
 * - approved / published / active (green)
 * - rejected / closed / archived (slate / red)
 */
export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/[\s-]/g, '_');

  if (['approved', 'active', 'published', 'verified', 'open'].includes(normalized)) {
    return (
      <Badge variant="success" dot>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  }

  if (['pending', 'in_review', 'under_review', 'submitted', 'reviewing'].includes(normalized)) {
    return (
      <Badge variant="warning" dot>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  }

  if (['rejected', 'declined', 'failed'].includes(normalized)) {
    return (
      <Badge variant="error" dot>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" dot>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
