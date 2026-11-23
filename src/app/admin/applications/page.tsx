import { Suspense } from 'react';
import ApplicationsPageInner from './ApplicationsPageInner';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#7b7263]">Loading applications…</div>}>
      <ApplicationsPageInner />
    </Suspense>
  );
}
