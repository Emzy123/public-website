import React from 'react';
import type { Metadata } from 'next';
import { ContactForm } from '@/components/forms/ContactForm';
import { socialLinks } from '@/lib/social';

export const metadata: Metadata = {
  title: 'Contact Us | SINet',
  description: 'Get in touch with the SINet team for inquiries, partnerships, or support.',
  openGraph: {
    title: 'Contact Us | SINet',
    description: 'Get in touch with the SINet team for inquiries, partnerships, or support.',
  }
};

export default function ContactPage() {
  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12">
          
          <div className="w-full lg:w-1/3">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">Get in Touch</h1>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Have questions about the platform, our investment empires, or partnership opportunities? We're here to help.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Email Us</h3>
                <a href="mailto:contact@sinet.africa" className="text-xl font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  contact@sinet.africa
                </a>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Connect</h3>
                <div className="flex gap-4 mt-3">
                  <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-colors" aria-label="X">
                    X
                  </a>
                  <a href={socialLinks.linkedIn} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-colors" aria-label="LinkedIn">
                    In
                  </a>
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-colors" aria-label="Facebook">
                    Fb
                  </a>
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
