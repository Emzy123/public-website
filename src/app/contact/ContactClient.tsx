'use client';

import React from 'react';
import { ContactForm } from '@/components/forms/ContactForm';
import { CmsMarkdown } from '@/components/cms/CmsMarkdown';
import type { ContactPageContent, SiteSettings } from '@admin/types/content';

const SOCIAL_ICONS = [
  { key: 'x' as const, label: 'X', hrefKey: 'x' as const },
  { key: 'linkedin' as const, label: 'In', hrefKey: 'linkedin' as const },
  { key: 'facebook' as const, label: 'Fb', hrefKey: 'facebook' as const },
];

export default function ContactClient({
  content,
  contact,
  social,
}: {
  content: ContactPageContent;
  contact: SiteSettings['contact'];
  social: SiteSettings['social'];
}) {
  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-1/3">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">{content.title}</h1>
            <div className="text-lg text-slate-600 mb-10 leading-relaxed">
              <CmsMarkdown content={content.subtitle} />
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {content.emailLabel}
                </h3>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-xl font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  {contact.email}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {content.connectLabel}
                </h3>
                <div className="flex gap-4 mt-3">
                  {SOCIAL_ICONS.filter((s) => social[s.hrefKey]).map((s) => (
                    <a
                      key={s.key}
                      href={social[s.hrefKey]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-colors"
                      aria-label={s.label}
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
