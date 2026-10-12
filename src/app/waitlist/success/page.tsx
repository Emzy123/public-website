import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Success | SINet',
};

export default function SuccessPage() {
  const websiteUrl = 'https://www.sinet.africa';
  // TODO-VERIFY: CEO approval needed for share text wording
  const shareText = "I just joined the waitlist for SINet, the premier Pan-African business ecosystem! Build Africa's future with me.";

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <div className="w-24 h-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-8 animate-fade-in-up">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          You're on the list!
        </h1>
        <p className="text-lg text-slate-600 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Thank you for joining the SINet waitlist. We will notify you as soon as early access opens. Spread the word and help us build Africa's future.
        </p>

        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-bold text-slate-900 mb-6">Share with your network</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + websiteUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#25D366] text-white font-medium hover:opacity-90 transition-opacity"
            >
              WhatsApp
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(websiteUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-black text-white font-medium hover:opacity-90 transition-opacity"
            >
              X / Twitter
            </a>
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#1877F2] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Facebook
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(websiteUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#0A66C2] text-white font-medium hover:opacity-90 transition-opacity"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link href="/" className="text-blue-600 font-medium hover:underline">
            &larr; Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
