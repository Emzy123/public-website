/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusPill } from './Badge';

describe('StatusPill component', () => {
  it('normalises and styles both "auto-closed" and "auto_closed" identically', () => {
    const { container: dashContainer } = render(<StatusPill status="auto-closed" />);
    const { container: underscoreContainer } = render(<StatusPill status="auto_closed" />);

    // Both should display warning variant
    expect(dashContainer.firstChild).toHaveClass('bg-amber-50');
    expect(underscoreContainer.firstChild).toHaveClass('bg-amber-50');
  });

  it('renders "full" as error variant', () => {
    const { container } = render(<StatusPill status="full" />);
    expect(container.firstChild).toHaveClass('bg-rose-50');
  });

  it('renders "expired" as warning variant', () => {
    const { container } = render(<StatusPill status="expired" />);
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });

  it('renders "open" as success variant', () => {
    const { container } = render(<StatusPill status="open" />);
    expect(container.firstChild).toHaveClass('bg-emerald-50');
  });

  it('renders "closed" as neutral variant', () => {
    const { container } = render(<StatusPill status="closed" />);
    expect(container.firstChild).toHaveClass('bg-slate-100');
  });
});
