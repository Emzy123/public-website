import { Metadata } from 'next';
import { listChapters, getChaptersDirectoryStats } from '@/lib/chapters/chapters';
import { ChaptersDirectoryClient } from '@/components/chapters/ChaptersDirectoryClient';

export const metadata: Metadata = {
  title: 'Campus Chapters Directory — Student Investment Network',
  description: 'Explore tertiary institution chapters of the Student Investment Network across Kogi State, Nigeria.',
};

export default async function ChaptersDirectoryPage() {
  const [chaptersList, stats] = await Promise.all([
    listChapters(),
    getChaptersDirectoryStats(),
  ]);

  return <ChaptersDirectoryClient initialChapters={chaptersList} stats={stats} />;
}
