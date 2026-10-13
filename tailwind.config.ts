import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './admin/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'gold-main': '#D9A23C',
        'gold-light': '#ECCB7C',
        'gold-dark': '#B77D21',
        sinet: {
          blue: '#0D1A4A',
          navy: '#0D1A4A',
          'blue-light': '#16296B',
          gold: '#D9A23C',
          'gold-light': '#ECCB7C',
          ivory: '#F6F2E8',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'Iowan Old Style', 'Baskerville', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'gold-pulse': 'goldPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'slide-left': 'slideInLeft 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212,175,55,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #D4AF37 100%)',
        'navy-gradient': 'linear-gradient(135deg, #0A2342 0%, #1E3A5F 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
