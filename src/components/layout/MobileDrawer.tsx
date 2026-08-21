'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface MobileDrawerProps { isOpen: boolean; onClose: () => void; links: { label: string; href: string }[]; currentPath: string }

export function MobileDrawer({ isOpen, onClose, links, currentPath }: MobileDrawerProps) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Site navigation">
    <button className="absolute inset-0 cursor-default bg-[#0d1a4a]/45" onClick={onClose} aria-label="Close menu" />
    <div className="relative h-full w-full max-w-sm overflow-auto bg-[#f6f2e8] px-7 py-8 shadow-2xl">
      <div className="mb-8 flex items-center justify-between"><span className="font-editorial text-3xl font-semibold text-[#0d1a4a]">SINet<span className="text-[#d9711b]">.</span></span><button onClick={onClose} className="flex h-11 w-11 items-center justify-center text-2xl text-[#0d1a4a]" aria-label="Close menu">×</button></div>
      <div className="mb-6 flex flex-col gap-3">
        <Link href="/start-investing" onClick={onClose} className="flex min-h-[48px] items-center justify-center bg-[#0d1a4a] px-5 text-sm font-bold text-white">Start Investing</Link>
        <Link href="/get-involved" onClick={onClose} className="flex min-h-[48px] items-center justify-center border border-[#0d1a4a] px-5 text-sm font-bold text-[#0d1a4a]">Get Involved</Link>
      </div>
      <nav className="flex flex-col border-t border-[#0d1a4a]/15">{links.map((link) => <Link key={link.label} href={link.href} onClick={onClose} className={`flex min-h-[48px] items-center border-b border-[#0d1a4a]/15 text-lg ${currentPath === link.href ? 'font-semibold text-[#d9711b]' : 'text-[#0d1a4a]'}`}>{link.label}</Link>)}</nav>
    </div>
  </div>;
}
