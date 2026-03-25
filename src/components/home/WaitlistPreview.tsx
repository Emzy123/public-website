import React from 'react';
import { EmailCapture } from '../forms/EmailCapture';

export function WaitlistPreview() {
  return (
    <section className="py-24 bg-blue-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-blue-100">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Build Africa's Future?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of visionary investors, builders, and learners. Secure your early access to the SINet platform today.
          </p>
          <EmailCapture />
          <p className="text-xs text-slate-400 mt-4">
            By joining, you agree to receive communications from SINet. We respect your privacy.
          </p>
        </div>
      </div>
    </section>
  );
}
