jest.mock('next/font/google', () => ({
  Sora: () => ({ variable: '--font-heading' }),
  Inter: () => ({ variable: '--font-body' }),
}));
jest.mock('@/app/globals.css', () => ({}));
jest.mock('@/components/layout/SiteChrome', () => ({ SiteChrome: () => null }));
jest.mock('@/components/analytics/AnalyticsScripts', () => ({ AnalyticsScripts: () => null }));
jest.mock('@/components/pwa/ServiceWorkerRegister', () => ({ ServiceWorkerRegister: () => null }));

jest.mock('@/lib/cms', () => ({
  getCmsContent: jest.fn().mockResolvedValue({
    pageSeo: {},
    seo: {
      defaultTitle: 'SINet — Business Ecosystem & Community',
      defaultDescription: "SINet connects entrepreneurs, students, and partners across Africa's key sectors.",
    },
  }),
}));

import fs from 'fs';
import path from 'path';
import { metadata } from '@/app/layout';
import { buildPageMetadata } from '@/lib/cms/metadata';

describe('Root & CMS Metadata Brand Assets (Step 8)', () => {
  it('points root layout openGraph to /og-image.png with 1200x630 dimensions', () => {
    expect(metadata.openGraph).toBeDefined();
    const ogImages = metadata.openGraph?.images as Array<{ url: string; width?: number; height?: number }>;
    expect(ogImages).toBeDefined();
    expect(ogImages[0].url).toBe('/og-image.png');
    expect(ogImages[0].width).toBe(1200);
    expect(ogImages[0].height).toBe(630);
  });

  it('points root layout twitter images to /og-image.png', () => {
    expect(metadata.twitter).toBeDefined();
    const twitterImages = metadata.twitter?.images as string[];
    expect(twitterImages).toContain('/og-image.png');
  });

  it('verifies canonical app icons exist in src/app with no duplicate files in public/', () => {
    // App router convention
    expect(fs.existsSync(path.resolve('src/app/favicon.ico'))).toBe(true);
    expect(fs.existsSync(path.resolve('src/app/icon.png'))).toBe(true);
    expect(fs.existsSync(path.resolve('src/app/apple-icon.png'))).toBe(true);

    // Duplicates removed from public/
    expect(fs.existsSync(path.resolve('public/icon.png'))).toBe(false);
    expect(fs.existsSync(path.resolve('public/apple-icon.png'))).toBe(false);
    expect(fs.existsSync(path.resolve('public/favicon.ico'))).toBe(false);

    // Manifest icons preserved in public/
    expect(fs.existsSync(path.resolve('public/manifest-icon-192.png'))).toBe(true);
    expect(fs.existsSync(path.resolve('public/manifest-icon-512.png'))).toBe(true);
  });

  it('includes /og-image.png in buildPageMetadata output', async () => {
    const pageMeta = await buildPageMetadata('home', {
      title: 'Home Test',
      description: 'Home Description',
    });
    expect(pageMeta.openGraph).toBeDefined();
    const ogImages = pageMeta.openGraph?.images as Array<{ url: string }>;
    expect(ogImages?.[0]?.url).toBe('/og-image.png');
  });
});
