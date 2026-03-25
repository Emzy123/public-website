import React from 'react';
import type { Metadata } from 'next';
import { WaitlistForm } from '@/components/forms/WaitlistForm';

export const metadata: Metadata = {
  title: 'Join the Waitlist | SINet',
  description: 'Apply to join the SINet Pan-African investment platform waitlist.',
  openGraph: {
    title: 'Join the Waitlist | SINet',
    description: 'Apply to join the SINet Pan-African investment platform waitlist.',
  }
};

export default function WaitlistPage() {
  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Secure Your Early Access</h1>
          <p className="text-lg text-slate-600">
            Tell us about your investment goals and secure your prioritized spot on the SINet waitlist.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <WaitlistForm />
        </div>
      </div>
    </div>
  );
}
