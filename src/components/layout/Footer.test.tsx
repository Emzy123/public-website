import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component Tagline and Brand Presentation (Step 7)', () => {
  it('renders official tagline "Building Africa\'s Future Systems" by default', () => {
    render(<Footer />);
    expect(screen.getByText(/Building Africa's Future Systems/i)).toBeInTheDocument();
  });

  it('replaces legacy "Build Africa\'s future." if provided via CMS settings', () => {
    const legacySettings = {
      footer: {
        brandCopy: "Build Africa's future. A business ecosystem built on agriculture, trade & distribution, and real estate.",
        columns: [],
      },
    } as any;

    render(<Footer settings={legacySettings} />);
    expect(screen.getByText(/Building Africa's Future Systems/i)).toBeInTheDocument();
    expect(screen.queryByText(/Build Africa's future\./i)).not.toBeInTheDocument();
  });

  it('renders the SINet logo lockup with alt text', () => {
    render(<Footer />);
    const logoImg = screen.getByAltText('SINet');
    expect(logoImg).toBeInTheDocument();
  });
});
