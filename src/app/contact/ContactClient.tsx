'use client';

import React from 'react';
import { ContactForm } from '@/components/forms/ContactForm';
import { CmsMarkdown } from '@/components/cms/CmsMarkdown';
import type { ContactPageContent, SiteSettings } from '@admin/types/content';

import { SocialLinksBar } from '@/components/common/SocialIcons';
import { CONTACT_EMAIL } from '@/lib/site-config';

export default function ContactClient({
  content,
  contact,
  social,
}: {
  content: ContactPageContent;
  contact: SiteSettings['contact'];
  social: SiteSettings['social'];
}) {
  const displayEmail = contact?.email || CONTACT_EMAIL;
  const customSocial = {
    x: social?.x,
    linkedin: social?.linkedin,
    facebook: social?.facebook,
    instagram: social?.instagram,
    whatsapp: social?.whatsapp,
  };

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
                  href={`mailto:${displayEmail}`}
                  className="text-xl font-medium text-[#0d1a4a] hover:text-[#d9711b] hover:underline transition-colors"
                >
                  {displayEmail}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {content.connectLabel}
                </h3>
                <div className="mt-3">
                  <SocialLinksBar
                    className="flex flex-wrap gap-3"
                    linkClassName="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 hover:bg-[#0d1a4a] hover:text-[#eccb7c] transition-colors"
                    customLinks={customSocial}
                  />
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
