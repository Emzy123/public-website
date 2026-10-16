/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/blueprint',
        destination: '/sectors',
        permanent: true,
      },
      {
        source: '/empires',
        destination: '/sectors',
        permanent: true,
      },
      {
        source: '/impact',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/waitlist',
        destination: '/membership',
        permanent: true,
      },
      {
        source: '/connect',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/join/student-network',
        destination: '/join?role=community-member',
        permanent: false,
      },
      {
        source: '/join/campus-ambassadors-2026',
        destination: '/join?role=ambassador',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
