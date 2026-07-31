import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { SiteSettings } from '@admin/types/content';
import { DEFAULT_SITE_SETTINGS } from '@admin/lib/cms/defaults';
import { CmsMarkdown } from '@/components/cms/CmsMarkdown';

type FooterProps = {
  settings?: SiteSettings;
};

export function Footer({ settings = DEFAULT_SITE_SETTINGS }: FooterProps) {
  const { contact, social, footer: footerCopy } = settings;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050D1A] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1">
          <Link href="/" className="inline-block mb-4">
            <Image
              src={settings.footerLogoUrl || settings.logoUrl || "/images/logo-primary.svg"}
              alt="SINet Logo"
              width={140}
              height={44}
              className="object-contain h-11 w-auto"
            />
          </Link>
          <div className="text-sm leading-relaxed text-slate-400 mb-6">
            <CmsMarkdown content={footerCopy.brandCopy} />
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'WhatsApp', href: social.whatsapp, icon: 'W' },
              { label: 'Instagram', href: social.instagram, icon: 'IG' },
              { label: 'LinkedIn', href: social.linkedin, icon: 'In' },
              { label: 'X', href: social.x, icon: 'X' },
              { label: 'Facebook', href: social.facebook, icon: 'Fb' },
            ]
              .filter((s) => s.href)
              .map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-[#D4AF37] hover:text-[#0A2342] hover:border-[#D4AF37] transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
          </div>
        </div>

        {footerCopy.columns.map((column) => (
          <div key={column.title}>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">{column.title}</h4>
            <ul className="space-y-3 text-sm">
              {column.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[#D4AF37] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">WhatsApp</p>
              <a
                href={contact.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] hover:text-[#F4D03F] font-medium transition-colors"
              >
                {contact.whatsappDisplay}
              </a>
            </li>
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Call</p>
              <a href={contact.phone} className="hover:text-white transition-colors">
                {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Email</p>
              <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                {contact.email}
              </a>
            </li>
            <li>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Location</p>
              <span>{contact.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} SINet. All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/privacy" className="hover:text-[#D4AF37] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/terms" className="hover:text-[#D4AF37] transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-700">·</span>
            <p>Building Africa&apos;s next generation of owners.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
