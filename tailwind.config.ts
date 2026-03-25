import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'gold-main': 'var(--gold-main)',
        sinet: {
          blue: '#0A2342',
          navy: '#08182f',
          'blue-light': '#1E3A5F',
          gold: '#D4AF37',
          'gold-light': '#F4D03F',
          ivory: '#F8F4E9',
        },
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
