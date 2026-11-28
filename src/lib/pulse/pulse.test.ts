/**
 * @jest-environment node
 *
 * DB-backed tests for the weekly pulse engine.
 * Pure risk-check tests live in announcement-risk.test.ts (no DB required).
 */
import { getWeeklyPulseFeed, recordMemberWeeklyCheckIn } from './pulse';
import { db } from '@/lib/db';
import { users, notifications, announcements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Weekly Pulse Engine (DB-backed)', () => {
  it('returns active weekly pulse feed sourced from approved announcements only (no seeded tasks)', async () => {
    const testTitle = `Pulse Test Update ${Date.now()}`;
    const [author] = await db
      .insert(users)
      .values({
        email: `pulse-author-${Date.now()}@fulokoja.edu.ng`,
        phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      })
      .returning();

    const [inserted] = await db
      .insert(announcements)
      .values({
        authorId: author.id,
        title: testTitle,
        body: 'Test announcement body for pulse feed verification.',
        isApproved: true,
        chapterId: null,
      })
      .returning();

    try {
      const feed = await getWeeklyPulseFeed();
      expect(feed.weekNumber).toBeGreaterThan(0);
      expect(feed.year).toBeGreaterThanOrEqual(2026);
      expect(Array.isArray(feed.tasks)).toBe(true);

      const titles = feed.tasks.map((t) => t.title);
      expect(titles).toContain(testTitle);
      // Seed content must never be included
      expect(titles.join(' ')).not.toContain('NGX Equities & CBN Inflation Briefing');
      expect(titles.join(' ')).not.toContain('Campus Food & Logistics Opportunity Mapping');
      expect(titles.join(' ')).not.toContain('Kogi Campuses Executive Chapter Sync');

      for (const task of feed.tasks) {
        expect(task.title).toBeDefined();
        expect(task.summary).toBeDefined();
        expect(task.actionText).toBeDefined();
      }
    } finally {
      await db.delete(announcements).where(eq(announcements.id, inserted.id));
      await db.delete(users).where(eq(users.id, author.id));
    }
  });

  it('records weekly member check-in and creates an in-portal notification', async () => {
    const uniquePhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
    const [user] = await db
      .insert(users)
      .values({ email: `pulse-test-${Date.now()}@fulokoja.edu.ng`, phone: uniquePhone })
      .returning();

    const result = await recordMemberWeeklyCheckIn(user.id);
    expect(result.success).toBe(true);
    expect(result.message).toContain('check-in recorded');

    // Notification check
    const userNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id));
    expect(userNotifs.length).toBe(1);
    expect(userNotifs[0].title).toContain('Weekly Pulse Check-In Confirmed');
  });
});
