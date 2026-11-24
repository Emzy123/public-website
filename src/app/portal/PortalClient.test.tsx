/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortalClient } from './PortalClient';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const baseUser = {
  id: 'usr_test_1',
  email: 'ada@example.com',
  phone: '+2348012345678',
  roles: ['member'],
  is2faAuthenticated: true,
  profile: {
    fullName: 'Ada Lovelace',
    avatarUrl: null,
    bio: 'Test bio',
    programme: 'Undergraduate Member',
    level: '300',
    division: 'student_finance',
    status: 'active',
    referralCode: 'SIN-UEPX3B',
    profileCompletenessPct: 85,
  },
  memberId: 'SIN-UEPX3B',
  memberCard: {
    fullName: 'Ada Lovelace',
    avatarUrl: null,
    memberId: 'SIN-UEPX3B',
    campusCode: 'FULOKOJA',
    chapterName: 'Federal University Lokoja Chapter',
    universityName: 'Federal University Lokoja',
    division: 'student_finance',
    programme: 'Undergraduate Member',
    level: '300',
    status: 'active',
    tierSummaryLine: 'Undergraduate • Student Finance • FULOKOJA',
    issuedAt: new Date('2026-01-01').toISOString(),
    verificationUrl: 'https://www.sinet.africa/verify/SIN-UEPX3B?sig=abc',
    qrDataUrl: 'data:image/png;base64,mock',
  },
  chapter: {
    id: 'ch-1',
    name: 'FULOKOJA Chapter',
    slug: 'fulokoja',
    universityName: 'Federal University Lokoja',
  },
  tierSummary: {
    tier: 'Undergraduate',
    division: 'Student Finance',
    chapter: 'FULOKOJA',
    summaryLine: 'Undergraduate • Student Finance • FULOKOJA',
  },
  badges: [],
};

describe('PortalClient rendering and data integrity (Steps 2, 3, 4, 6)', () => {
  it('renders greeting with member real name and consistent tier line', () => {
    render(<PortalClient user={baseUser} pulseFeed={{ weekNumber: 47, year: 2026, tasks: [] }} />);

    expect(screen.getByText('Welcome, Ada Lovelace')).toBeInTheDocument();
    // Welcome subtitle and ID card both show the exact same consistent tier summary line
    expect(screen.getAllByText('Undergraduate • Student Finance • FULOKOJA')).toHaveLength(2);
  });

  it('renders neutral greeting when real name is absent, never email handle', () => {
    const userWithoutName = {
      ...baseUser,
      profile: {
        ...baseUser.profile,
        fullName: '',
      },
    };

    render(<PortalClient user={userWithoutName} pulseFeed={{ weekNumber: 47, year: 2026, tasks: [] }} />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome, ada/i)).not.toBeInTheDocument();
  });

  it('renders Digital ID card with typed status label and no (ActiveL) typo', () => {
    const userWithActiveLevel = {
      ...baseUser,
      memberCard: {
        ...baseUser.memberCard,
        level: 'Active', // legacy level value that caused (ActiveL)
        status: 'active',
        tierSummaryLine: 'Undergraduate • Student Finance • FULOKOJA',
      },
    };

    render(<PortalClient user={userWithActiveLevel} pulseFeed={{ weekNumber: 47, year: 2026, tasks: [] }} />);

    expect(screen.queryByText(/\(ActiveL\)/i)).not.toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('hides Weekly Pulse section when pulseFeed.tasks is empty', () => {
    render(<PortalClient user={baseUser} pulseFeed={{ weekNumber: 47, year: 2026, tasks: [] }} />);

    expect(screen.queryByText('Weekly Network Pulse')).not.toBeInTheDocument();
  });

  it('hides Badges showcase when user has no badges (prevents 0 / 0 Unlocked)', () => {
    render(<PortalClient user={{ ...baseUser, badges: [] }} pulseFeed={{ weekNumber: 47, year: 2026, tasks: [] }} />);

    expect(screen.queryByText('Achievement Badges Showcase')).not.toBeInTheDocument();
    expect(screen.queryByText(/0 \/ 0 Unlocked/i)).not.toBeInTheDocument();
  });

  it('does NOT render misleading "Offline Ready" badge on portal', () => {
    render(<PortalClient user={baseUser} pulseFeed={{ weekNumber: 47, year: 2026, tasks: [] }} />);

    expect(screen.queryByText('Offline Ready')).not.toBeInTheDocument();
  });

  it('renders working Save Pass button', () => {
    render(<PortalClient user={baseUser} pulseFeed={{ weekNumber: 47, year: 2026, tasks: [] }} />);

    expect(screen.getByRole('button', { name: /Save Pass/i })).toBeInTheDocument();
  });
});
