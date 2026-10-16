/**
 * @jest-environment node
 *
 * Pure unit tests for checkAnnouncementRisk — no database required.
 * Keeps the compliance check testable in CI even when Postgres is offline.
 */
import { checkAnnouncementRisk } from './pulse';

describe('checkAnnouncementRisk (pure, no DB)', () => {
  it('returns hasRisk: true and logs a warning for announcements with financial risk terms', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = checkAnnouncementRisk({
      title: 'Partner Program with 40% Return',
      body: 'Check out the details',
    });

    expect(result.hasRisk).toBe(true);
    expect(result.matchedTerms).toContain('40%');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[Compliance Warning] Pulse announcement "Partner Program with 40% Return"'
      )
    );

    consoleWarnSpy.mockRestore();
  });

  it('returns hasRisk: false for a clean announcement', () => {
    const result = checkAnnouncementRisk({
      title: 'Weekly Executive Chapter Sync',
      body: 'Campus representatives meeting on Friday at 4pm',
    });
    expect(result.hasRisk).toBe(false);
    expect(result.matchedTerms).toHaveLength(0);
    expect(result.matchedFields).toHaveLength(0);
  });

  it('does not flag "Learn more", "heroic", "Android app", or "return to dashboard"', () => {
    for (const text of ['Learn more about us', 'heroic efforts', 'Android app download', 'return to dashboard']) {
      const result = checkAnnouncementRisk({ title: text });
      expect(result.hasRisk).toBe(false);
    }
  });

  it('flags financial promotion terms: "earn monthly", "ROI", "15% returns", "guaranteed", "invest now", "only 5 slots left"', () => {
    const cases = [
      { title: 'Earn monthly with SINet' },
      { title: 'Target ROI for partners' },
      { title: '15% returns this cycle' },
      { title: 'Guaranteed profit distributions' },
      { title: 'Invest now in agribusiness' },
      { title: 'Only 5 slots left for this cycle' },
    ];
    for (const item of cases) {
      const result = checkAnnouncementRisk(item);
      expect(result.hasRisk).toBe(true);
    }
  });

  it('flags announcements with imageUrl set (imageRisk path)', () => {
    const result = checkAnnouncementRisk({
      title: 'Campus Flyer',
      body: 'See you there!',
      imageUrl: '/images/flyers/campus-event.png',
    });
    // imageUrl alone doesn't trigger imageRisk (no flyerImage/showModal path)
    // but body/title should be checked — no financial terms here, so no risk
    expect(result.imageRisk).toBe(false);
    expect(result.hasRisk).toBe(false);
  });

  it('does not warn when no risk is found', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    checkAnnouncementRisk({ title: 'Welcome new members!', body: 'Glad to have you.' });
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});
