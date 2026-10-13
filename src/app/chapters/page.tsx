import { Metadata } from 'next';
import {
  listChapters,
  getChaptersDirectoryStats,
  FALLBACK_KOGI_CHAPTERS,
} from '@/lib/chapters/chapters';
import { ChaptersDirectoryClient } from '@/components/chapters/ChaptersDirectoryClient';
import { FEATURE_FLAGS } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Campus Chapters Directory — SINet',
  description:
    'Explore tertiary institution chapters of SINet across Kogi State, Nigeria.',
};

export const dynamic = 'force-dynamic';

export default async function ChaptersDirectoryPage() {
  try {
    const [chaptersList, stats] = await Promise.all([
      listChapters(),
      getChaptersDirectoryStats(),
    ]);

    return <ChaptersDirectoryClient initialChapters={chaptersList} stats={stats} showMemberCounts={FEATURE_FLAGS.showMemberCounts} />;
  } catch (error) {
    console.warn('[Chapters Directory Page] Rendering fallback chapters list:', error);
    return (
      <ChaptersDirectoryClient
        initialChapters={FALLBACK_KOGI_CHAPTERS}
        stats={{
          chapterCount: FALLBACK_KOGI_CHAPTERS.length,
          universityCount: FALLBACK_KOGI_CHAPTERS.length,
          totalMembers: 0,
          state: 'Kogi',
        }}
        showMemberCounts={FEATURE_FLAGS.showMemberCounts}
      />
    );
  }
}
