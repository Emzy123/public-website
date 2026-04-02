'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
  currentPath: string;
}

export function MobileDrawer({ isOpen, onClose, links, currentPath }: MobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-4/5 max-w-sm bg-[#0A1A2F] h-full shadow-2xl flex flex-col pt-20 px-6 transform animate-fade-in-up">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-300 hover:text-white"
          aria-label="Close menu"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <nav className="flex flex-col gap-6 mt-8">
          {links.map(link => (
            <Link 
              key={link.href} 
              href={link.href}
              onClick={onClose}
              className={`text-xl font-medium ${currentPath === link.href ? 'text-white' : 'text-slate-300'}`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/connect" onClick={onClose} className="mt-4">
            <button className="w-full bg-[#D4AF37] text-[#0A2342] rounded-md px-6 py-3 font-bold shadow-md">
              Connect With Us
            </button>
          </Link>
        </nav>
      </div>
    </div>
  );
}
