import { Suspense } from 'react';
import ApplicationsPageInner from './ApplicationsPageInner';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#7b7263]">Loading applications…</div>}>
      <ApplicationsPageInner />
    </Suspense>
  );
}
