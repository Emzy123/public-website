import React from 'react';

export interface PageHeaderProps {
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  badge,
  title,
  subtitle,
  action,
  breadcrumb,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`border-b border-slate-200/80 bg-white px-4 py-8 sm:px-6 md:py-12 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {breadcrumb && <div className="mb-3 text-xs text-slate-500">{breadcrumb}</div>}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {badge && <div className="mb-2">{badge}</div>}
            <h1 className="font-editorial text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
