import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChaptersDirectoryClient } from './ChaptersDirectoryClient';
import { FALLBACK_KOGI_CHAPTERS } from '@/lib/chapters/chapters';

describe('Chapter Join Link Routing', () => {
  it('routes every chapter join button through /join?role=community-member&chapter=<slug>', () => {
    render(
      <ChaptersDirectoryClient
        initialChapters={FALLBACK_KOGI_CHAPTERS}
        stats={{
          chapterCount: FALLBACK_KOGI_CHAPTERS.length,
          universityCount: FALLBACK_KOGI_CHAPTERS.length,
          totalMembers: 0,
          state: 'Kogi',
        }}
      />
    );

    const joinLinks = screen.getAllByRole('link', { name: /^Join$/i });
    expect(joinLinks.length).toBe(FALLBACK_KOGI_CHAPTERS.length);

    joinLinks.forEach((link, idx) => {
      const chapter = FALLBACK_KOGI_CHAPTERS[idx];
      expect(link).toHaveAttribute(
        'href',
        `/join?role=community-member&chapter=${chapter.slug}`
      );
      // Ensure no legacy broken campaign path is used
      expect(link.getAttribute('href')).not.toContain('/join/student-network');
      expect(link.getAttribute('href')).not.toContain('/join/campus-ambassadors-2026');
    });
  });
});
