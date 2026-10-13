import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AdvertSpotlight } from './AdvertSpotlight';
import type { AdvertItem } from '@admin/types/content';

let currentPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

const mockAdvert: AdvertItem = {
  id: 'adv-1',
  title: 'Investment Flyer 2026',
  eyebrow: 'Legal Notice',
  body: 'Sample approved body text for modal testing.',
  imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
  ctaLabel: 'Learn more',
  ctaHref: '/about',
  enabled: true,
  showModal: true,
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
  dismissalDays: 7,
};

describe('AdvertSpotlight Flyer Modal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    currentPathname = '/';
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders modal dialog on first visit after initial timer', () => {
    render(<AdvertSpotlight adverts={[mockAdvert]} />);

    act(() => {
      jest.advanceTimersByTime(700);
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Investment Flyer 2026');
  });

  it('stays dismissed after dismissal and navigation/re-render within TTL', () => {
    const { unmount } = render(<AdvertSpotlight adverts={[mockAdvert]} />);

    act(() => {
      jest.advanceTimersByTime(700);
    });

    const closeBtn = screen.getByText('Continue browsing');
    fireEvent.click(closeBtn);
    unmount();

    // Navigate to /about
    currentPathname = '/about';
    render(<AdvertSpotlight adverts={[mockAdvert]} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reappears after TTL expires', () => {
    // Dismiss today
    const now = Date.now();
    jest.setSystemTime(now);

    const { unmount } = render(<AdvertSpotlight adverts={[mockAdvert]} />);

    act(() => {
      jest.advanceTimersByTime(700);
    });

    const closeBtn = screen.getByText('Continue browsing');
    fireEvent.click(closeBtn);
    unmount();

    // Fast-forward past TTL (8 days later)
    jest.setSystemTime(now + 8 * 24 * 60 * 60 * 1000);

    render(<AdvertSpotlight adverts={[mockAdvert]} />);

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each([
    ['/join'],
    ['/join/campus-ambassadors'],
    ['/sign-in'],
    ['/portal'],
    ['/admin'],
    ['/admin/audit'],
  ])('never renders modal on excluded path: %s', (path) => {
    currentPathname = path;
    render(<AdvertSpotlight adverts={[mockAdvert]} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
