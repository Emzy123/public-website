'use client';

import { useRouter } from 'next/navigation';

export function PreviewBanner() {
  const router = useRouter();

  const exitPreview = async () => {
    await fetch('/api/preview/disable', { method: 'POST' });
    router.refresh();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-[#0A2342] px-4 py-2 text-sm font-medium flex items-center justify-center gap-4 shadow-lg">
      <span>Preview mode — you are viewing unpublished draft content</span>
      <button
        type="button"
        onClick={exitPreview}
        className="px-3 py-1 rounded-md bg-[#0A2342] text-amber-400 text-xs font-semibold hover:bg-[#0A2342]/90 transition-colors"
      >
        Exit preview
      </button>
    </div>
  );
}
