/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Header } from './Header';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('Header component signed-in and signed-out states (Step 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders signed-out state: "Sign in" and "Get Notified" buttons', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/applications') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ active: false }) });
      }
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ authenticated: false }) });
      }
      return Promise.resolve({ ok: false });
    });

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.getByText('Get Notified')).toBeInTheDocument();
    });

    expect(screen.queryByText('Portal')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('renders signed-in state: real name and account dropdown with Portal and Sign out', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/applications') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ active: false }) });
      }
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              authenticated: true,
              user: {
                email: 'ada@example.com',
                profile: { fullName: 'Ada Lovelace' },
              },
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });

    // "Sign in" and "Get Notified" should no longer appear on desktop
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    expect(screen.queryByText('Get Notified')).not.toBeInTheDocument();

    // Open account dropdown
    const accountButton = screen.getByText('Ada Lovelace');
    fireEvent.click(accountButton);

    expect(screen.getByRole('menuitem', { name: 'Portal' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('uses neutral "Account" label when member has no real name, never email handle', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/applications') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ active: false }) });
      }
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              authenticated: true,
              user: {
                email: 'testuser@sinet.africa',
                profile: null,
              },
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    // Must never render email handle "testuser" as name
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });
});
