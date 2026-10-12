import React from 'react';
import { WaitlistForm } from '@/components/forms/WaitlistForm';
import { CmsMarkdown } from '@/components/cms/CmsMarkdown';
import { getCmsContent } from '@/lib/cms';
import { buildPageMetadata } from '@/lib/cms/metadata';

export async function generateMetadata() {
  return buildPageMetadata('waitlist', {
    title: 'Join the Waitlist | SINet',
    // TODO-VERIFY: CEO approval needed for ecosystem wording vs investment platform
    description: 'Apply to join the SINet Pan-African ecosystem waitlist.',
  });
}

import { getMongoDb } from '@/lib/db/mongodb';

export default async function WaitlistPage() {
  const content = await getCmsContent('waitlist-page');

  let waitlistCount = 0;
  try {
    const db = await getMongoDb();
    waitlistCount = await db.collection('waitlistSubmissions').countDocuments();
  } catch (err) {
    console.error('Failed to load waitlist count:', err);
  }

  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{content.title}</h1>
          <div className="text-lg text-slate-600">
            <CmsMarkdown content={content.subtitle} />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {waitlistCount > 0 && (
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-800 text-sm font-semibold shadow-sm">
                🔥 Join <strong className="text-blue-900 font-extrabold">{waitlistCount}</strong> forward-thinking investors on the waitlist
              </span>
            </div>
          )}
          <WaitlistForm />
        </div>
      </div>
    </div>
  );
}
