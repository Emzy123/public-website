import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SINet',
    short_name: 'SINet',
    description:
      'Student ecosystem for finance, enterprise, and governance across Nigerian universities.',
    start_url: '/portal',
    display: 'standalone',
    background_color: '#071026',
    theme_color: '#052e16',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
