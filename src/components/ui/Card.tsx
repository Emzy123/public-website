import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
}
