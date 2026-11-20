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
        brand: {
          canvas: '#FBF7EE',
          'canvas-subtle': '#F4EEDB',
          sand: '#F6F2E8',
          'sand-dark': '#EEE6D0',
          ink: '#071026',
          'ink-navy': '#0D1A4A',
          'ink-muted': '#554E43',
          accent: '#D97706',
          'accent-hover': '#B45309',
          gold: '#D9A23C',
          'gold-light': '#ECCB7C',
          'gold-dark': '#B77D21',
          success: '#10B981',
          'success-bg': '#ECFDF5',
          error: '#EF4444',
          'error-bg': '#FEF2F2',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          info: '#2563EB',
          'info-bg': '#EFF6FF',
        },
        sinet: {
          // Brand foundation primitives (agent/brand-foundation)
          ink: '#0A0A0F',
          black: '#000000',
          navy: '#1B234C',
          'blue-700': '#022892',
          'blue-600': '#143DB1', // primary
          'blue-500': '#2153D2',
          'gold-700': '#A06E1B',
          'gold-500': '#E0A92E', // accent
          'gold-300': '#EDB944',
          cream: '#DBD1A5',
          // Existing keys retained for backwards compatibility
          blue: '#0D1A4A',
          'blue-light': '#16296B',
          gold: '#D9A23C',
          'gold-light': '#ECCB7C',
          ivory: '#F6F2E8',
        },
        // Semantic aliases
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          'text-on-light': 'var(--color-accent-text-on-light)',
        },
        border: 'var(--color-border)',
        'focus-ring': 'var(--color-focus-ring)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      borderRadius: {
        none: '0',
        xs: '0.125rem',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        'brand-sm': '0 1px 2px 0 rgba(10, 10, 15, 0.05)',
        'brand-md': '0 4px 6px -1px rgba(10, 10, 15, 0.1), 0 2px 4px -2px rgba(10, 10, 15, 0.1)',
        'brand-lg': '0 10px 15px -3px rgba(10, 10, 15, 0.1), 0 4px 6px -4px rgba(10, 10, 15, 0.1)',
        'brand-xl': '0 20px 25px -5px rgba(10, 10, 15, 0.1), 0 8px 10px -6px rgba(10, 10, 15, 0.1)',
        'gold-glow': '0 0 24px -4px rgba(224, 169, 46, 0.35)',
        'blue-glow': '0 0 24px -4px rgba(20, 61, 177, 0.35)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      fontFamily: {
        editorial: ['Fraunces', 'Iowan Old Style', 'Baskerville', 'Georgia', 'serif'],
        heading: ['Fraunces', 'Iowan Old Style', 'Baskerville', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'SFMono-Regular', 'Consolas', 'monospace'],
        data: ['"IBM Plex Mono"', 'SFMono-Regular', 'Consolas', 'monospace'],
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
