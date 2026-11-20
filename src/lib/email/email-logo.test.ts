import { getLogoAssetUrl } from '@/components/brand/Logo';
import {
  applicationReceivedHtml,
  applicationApprovedHtml,
  applicationDeclinedHtml,
  newsletterWelcomeHtml,
} from './templates';

describe('Email Logo Brand Compliance (Fix 9)', () => {
  it('returns an absolute https://www.sinet.africa URL for lockup-dark in emails', () => {
    const url = getLogoAssetUrl('lockup', 'dark', { absolute: true });
    expect(url).toBe('https://www.sinet.africa/brand/sinet-lockup-dark.png');
    expect(url.startsWith('https://www.sinet.africa/')).toBe(true);
    expect(url).not.toContain('@2x');
    expect(url).not.toContain('transparent');
  });

  it('renders dark lockup on a dark header cell in applicationReceivedHtml', () => {
    const html = applicationReceivedHtml({
      name: 'Amara Okafor',
      role: 'Campus Ambassador',
      applicationId: 'app-test-123',
    });

    const expectedLogoUrl = 'https://www.sinet.africa/brand/sinet-lockup-dark.png';
    expect(html).toContain(expectedLogoUrl);

    // Verify dark header cell surrounds the logo
    // Dark navy #0d1a4a
    expect(html).toMatch(/<td style="background:#0d1a4a;[^"]*">\s*<a[^>]*>\s*<img src="https:\/\/www\.sinet\.africa\/brand\/sinet-lockup-dark\.png"/);
  });

  it('renders dark lockup on a dark header cell in applicationApprovedHtml', () => {
    const html = applicationApprovedHtml({
      name: 'Amara Okafor',
      role: 'Campus Ambassador',
    });

    expect(html).toContain('https://www.sinet.africa/brand/sinet-lockup-dark.png');
    expect(html).toMatch(/<td style="background:#0d1a4a;[^"]*">\s*<a[^>]*>\s*<img src="https:\/\/www\.sinet\.africa\/brand\/sinet-lockup-dark\.png"/);
  });

  it('renders dark lockup on a dark header cell in applicationDeclinedHtml', () => {
    const html = applicationDeclinedHtml({
      name: 'Amara Okafor',
    });

    expect(html).toContain('https://www.sinet.africa/brand/sinet-lockup-dark.png');
    expect(html).toMatch(/<td style="background:#0d1a4a;[^"]*">\s*<a[^>]*>\s*<img src="https:\/\/www\.sinet\.africa\/brand\/sinet-lockup-dark\.png"/);
  });

  it('renders dark lockup on a dark header cell in newsletterWelcomeHtml', () => {
    const html = newsletterWelcomeHtml({
      name: 'Amara',
    });

    expect(html).toContain('https://www.sinet.africa/brand/sinet-lockup-dark.png');
    expect(html).toMatch(/<td style="background:#0d1a4a;[^"]*">\s*<a[^>]*>\s*<img src="https:\/\/www\.sinet\.africa\/brand\/sinet-lockup-dark\.png"/);
  });
});
