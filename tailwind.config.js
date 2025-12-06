/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf7ff',
          100: '#f3ebff',
          200: '#e8d9ff',
          300: '#d4bcff',
          400: '#bb94ff',
          500: '#a166ff',
          600: '#8b3dff',
          700: '#7c2dff',
          800: '#6d1fff',
          900: '#5a0fcf',
          950: '#3f0a8f',
        },
        mauve: {
          50: '#fdf8ff',
          100: '#f8ebff',
          200: '#f0d6ff',
          300: '#e4b5ff',
          400: '#d289ff',
          500: '#bc57ff',
          600: '#a32fff',
          700: '#8a14ff',
          800: '#7208d6',
          900: '#5f0bb2',
          950: '#3f0373',
        },
        shadow: {
          50: '#f8f7ff',
          100: '#efecff',
          200: '#e1dcff',
          300: '#ccc1ff',
          400: '#b39dff',
          500: '#9a75ff',
          600: '#8651ff',
          700: '#7737ff',
          800: '#6623dd',
          900: '#541db7',
          950: '#321085',
        },
        dark: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b2bac9',
          400: '#8895ab',
          500: '#68768f',
          600: '#525e75',
          700: '#434c5f',
          800: '#2a2d3a',
          900: '#1a1d26',
          950: '#0f111a',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(139, 61, 255, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(139, 61, 255, 0.5)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'mauve-glow': '0 0 20px rgba(188, 87, 255, 0.3)',
        'mauve-glow-strong': '0 0 30px rgba(188, 87, 255, 0.5)',
      },
      borderRadius: {
        'glass': '16px',
      },
      aspectRatio: {
        'square': '1 / 1',
      }
    },
  },
  plugins: [],
};