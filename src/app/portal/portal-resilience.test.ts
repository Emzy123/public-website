/**
 * @jest-environment node
 *
 * Resilience tests ensuring PortalPage never 500s when getMemberCredential throws or times out.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import * as sessionModule from '@/lib/auth/session';
import * as memberIdModule from '@/lib/members/member-id';
import * as pulseModule from '@/lib/pulse/pulse';
import * as gamificationModule from '@/lib/members/gamification';
import * as dbModule from '@/lib/db';
import PortalPage from './page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/lib/db/mongodb', () => ({
  getMongoDb: jest.fn().mockResolvedValue(null),
}));

describe('/portal failure-mode resilience', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(dbModule, 'isPostgresConfigured').mockReturnValue(true);
    jest.spyOn(pulseModule, 'getWeeklyPulseFeed').mockResolvedValue({
      weekNumber: 48,
      year: 2026,
      tasks: [],
    });
    jest.spyOn(gamificationModule, 'getMemberBadgesShowcase').mockResolvedValue([]);
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'usr-resilience-001',
      email: 'resilience@uni.edu.ng',
      roles: ['member'],
      chapterIds: [],
      is2faAuthenticated: true,
      lastActive: Math.floor(Date.now() / 1000),
    });
  });

  it('renders Digital ID card without verification link or QR (no 500) when getMemberCredential throws', async () => {
    jest
      .spyOn(memberIdModule, 'getMemberCredential')
      .mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

    const jsx = await PortalPage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain('Digital Member ID');
    expect(html).not.toContain('Verify Online');
    expect(html).not.toContain('href="/verify/');
    expect(html).not.toContain('alt="QR Code');
    expect(html).toContain('Status:');
  });

  it('renders Digital ID card without verification link or QR (no 500) when getMemberCredential times out', async () => {
    jest
      .spyOn(memberIdModule, 'getMemberCredential')
      .mockRejectedValue(Object.assign(new Error('Query timeout exceeded'), { code: 'ETIMEDOUT' }));

    const jsx = await PortalPage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain('Digital Member ID');
    expect(html).not.toContain('Verify Online');
    expect(html).not.toContain('href="/verify/');
    expect(html).not.toContain('alt="QR Code');
  });
});
