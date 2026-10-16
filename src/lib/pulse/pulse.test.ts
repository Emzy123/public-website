/**
 * @jest-environment node
 */
import { getWeeklyPulseFeed, recordMemberWeeklyCheckIn, checkAnnouncementRisk } from './pulse';
import { db } from '@/lib/db';
import { users, notifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Weekly Pulse Engine', () => {
  it('runs checkAdvertRisk on pulse announcements and emits warning on risk without gating', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Risky announcement
    const risky = checkAnnouncementRisk({
      title: 'Partner Program with 40% Return',
      body: 'Check out the details',
    });
    expect(risky.hasRisk).toBe(true);
    expect(risky.matchedTerms).toContain('40%');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Compliance Warning] Pulse announcement "Partner Program with 40% Return"')
    );

    // Clean announcement
    const clean = checkAnnouncementRisk({
      title: 'Weekly Executive Chapter Sync',
      body: 'Campus representatives meeting on Friday at 4pm',
    });
    expect(clean.hasRisk).toBe(false);

    consoleWarnSpy.mockRestore();
  });

  it('returns active weekly pulse feed with week number and tasks', async () => {
    const feed = await getWeeklyPulseFeed();
    expect(feed.weekNumber).toBeGreaterThan(0);
    expect(feed.year).toBeGreaterThanOrEqual(2026);
    expect(feed.tasks.length).toBeGreaterThanOrEqual(3);

    const categories = feed.tasks.map((t) => t.category);
    expect(categories).toContain('finance_brief');
    expect(categories).toContain('enterprise_sprint');
    expect(categories).toContain('chapter_sync');

    for (const task of feed.tasks) {
      expect(task.title).toBeDefined();
      expect(task.summary).toBeDefined();
      expect(task.actionText).toBeDefined();
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
