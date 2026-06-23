import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0b2d4e',
        accent: '#d4935c',
        'mc-blue': '#2563eb',
        'mc-green': '#2f9470',
        'mc-cyan': '#3b9fc5',
        'mc-red': '#cc5b68',
        bg: '#f3f5f8',
        paper: '#ffffff',
        line: '#e2e8f0',
        muted: '#6b7c93',
        ink: '#172033',
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,45,78,.04), 0 3px 12px rgba(11,45,78,.06)',
      },
    },
  },
  plugins: [],
}

export default config
