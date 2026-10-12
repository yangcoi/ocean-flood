import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        flood: {
          0: 'var(--flood-level-0-normal)',
          1: 'var(--flood-level-1-watch)',
          2: 'var(--flood-level-2-warning)',
          3: 'var(--flood-level-3-critical)',
        },
        surface: {
          light: 'var(--surface-canvas-light)',
          dark: 'var(--surface-canvas-dark)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      minHeight: {
        touch: 'var(--touch-target-min)',
        'wet-cta': 'var(--touch-target-wet-cta)',
      },
      minWidth: {
        touch: 'var(--touch-target-min)',
      },
      borderRadius: {
        sheet: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
