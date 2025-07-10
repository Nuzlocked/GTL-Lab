/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gtl-bg': '#1a1a1a',
        'gtl-surface': '#2d3748',
        'gtl-surface-glass': 'rgba(45, 55, 72, 0.6)',
        'gtl-surface-light': '#374151',
        'gtl-surface-dark': '#1f2937',
        'gtl-primary': '#4299e1',
        'gtl-primary-hover': '#3182ce',
        'gtl-text': '#f7fafc',
        'gtl-text-dim': '#a0aec0',
        'gtl-border': '#4a5568',
        'gtl-cell-border': '#000000',
        'gtl-header': '#2d3748',
        'gtl-row-even': '#374151',
        'gtl-row-odd': '#2d3748',
        'gtl-uniform-bg': '#393e42',
      },
      fontFamily: {
        'sans': ['Arial', 'sans-serif'],
      },
      boxShadow: {
        '3d-dark': 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
      },
      backdropBlur: {
        'xl': '24px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 