/**
 * @jest-environment node
 */
import {
  listChapters,
  getChapterBySlug,
  getChaptersDirectoryStats,
} from './chapters';

describe('Campus Chapters & Directory Engine', () => {
  it('lists all active campus chapters in Kogi State', async () => {
    const chapters = await listChapters();
    expect(chapters.length).toBeGreaterThanOrEqual(6);

    const campusCodes = chapters.map((c) => c.campusCode);
    expect(campusCodes).toContain('FULOKOJA');
    expect(campusCodes).toContain('PAAU');
    expect(campusCodes).toContain('CUSTECH');
    expect(campusCodes).toContain('KSUK');
    expect(campusCodes).toContain('SALEM');
    expect(campusCodes).toContain('ALBAYAN');

    for (const ch of chapters) {
      expect(ch.state).toBe('Kogi');
      expect(ch.slug).toBeDefined();
      expect(ch.name).toContain('Chapter');
      expect(ch.universityName).toBeDefined();
    }
  });

  it('filters chapters by search query', async () => {
    // Search by short code
    const fulokojaResults = await listChapters({ search: 'FULOKOJA' });
    expect(fulokojaResults.length).toBe(1);
    expect(fulokojaResults[0].campusCode).toBe('FULOKOJA');

    // Search by city/university name
    const anyigbaResults = await listChapters({ search: 'Anyigba' });
    expect(anyigbaResults.length).toBe(1);
    expect(anyigbaResults[0].campusCode).toBe('PAAU');

    // Search by state
    const kogiResults = await listChapters({ state: 'Kogi' });
    expect(kogiResults.length).toBeGreaterThanOrEqual(6);
  });

  it('retrieves full chapter details by slug with division distributions', async () => {
    const chapter = await getChapterBySlug('fulokoja');
    expect(chapter).not.toBeNull();
    expect(chapter?.slug).toBe('fulokoja');
    expect(chapter?.campusCode).toBe('FULOKOJA');
    expect(chapter?.universityShortName).toBe('FULOKOJA');
    expect(chapter?.divisionCounts).toBeDefined();
    expect(chapter?.divisionCounts.student_finance).toBeGreaterThanOrEqual(0);
    expect(chapter?.divisionCounts.student_enterprise).toBeGreaterThanOrEqual(0);
    expect(chapter?.divisionCounts.governance_records).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(chapter?.leads)).toBe(true);
  });

  it('returns null for an invalid or non-existent chapter slug', async () => {
    const nonExistent = await getChapterBySlug('non-existent-campus-chapter-999');
    expect(nonExistent).toBeNull();
  });

  it('computes directory overview statistics', async () => {
    const stats = await getChaptersDirectoryStats();
    expect(stats.chapterCount).toBeGreaterThanOrEqual(6);
    expect(stats.universityCount).toBeGreaterThanOrEqual(6);
    expect(stats.state).toBe('Kogi');
    expect(typeof stats.totalMembers).toBe('number');
  });
});
