/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogClient } from './AuditLogClient';

const logs = Array.from({ length: 30 }).map((_, i) => ({
  id: `log-${i}`,
  actorId: null,
  actorEmail: i % 2 === 0 ? 'admin@sinet.africa' : 'ops@sinet.africa',
  action: i % 3 === 0 ? 'application.approved' : 'link.updated',
  resource: 'application',
  resourceId: `res-${i}`,
  metadata: { n: i },
  ipAddress: '127.0.0.1',
  createdAt: new Date(Date.UTC(2026, 0, 1 + (i % 10))).toISOString(),
}));

describe('AuditLogClient filters and pagination (B3)', () => {
  it('filters by actor and paginates', () => {
    render(<AuditLogClient initialLogs={logs} />);

    expect(screen.getByTestId('audit-filters')).toBeInTheDocument();
    expect(screen.getByTestId('audit-pagination')).toBeInTheDocument();

    const actorSelect = screen.getByLabelText(/Actor/i);
    fireEvent.change(actorSelect, { target: { value: 'admin@sinet.africa' } });

    // 15 of 30 are admin@ — first page shows 25 max but filtered set is 15
    expect(screen.getByText(/Showing 1–15 of 15/)).toBeInTheDocument();
  });

  it('shows unavailable state without crashing (root cause of Something went wrong)', () => {
    render(<AuditLogClient initialLogs={[]} databaseUnavailable />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Temporarily Unavailable/i);
  });
});
