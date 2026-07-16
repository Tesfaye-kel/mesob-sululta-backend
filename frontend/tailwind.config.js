/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MESOB / Ethiopian Government Brand Colors
        brand: {
          green:  { DEFAULT: '#1A6B3C', light: '#2E9B5F', dark: '#0F4A2A', 50: '#E8F5EE', 100: '#C3E6D0', 200: '#8DCBA8', 300: '#57B082', 400: '#2E9B5F', 500: '#1A6B3C', 600: '#145530', 700: '#0F4A2A', 800: '#0A3620', 900: '#062215' },
          gold:   { DEFAULT: '#C8961E', light: '#F0B429', dark: '#9A7115', 50: '#FDF6E3', 100: '#FAEABB', 200: '#F5D47A', 300: '#F0BE39', 400: '#F0B429', 500: '#C8961E', 600: '#9A7115', 700: '#7A590F', 800: '#5C4309', 900: '#3D2C05' },
          red:    { DEFAULT: '#B91C1C', light: '#DC2626', dark: '#7F1D1D', 50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D' },
          blue:   { DEFAULT: '#1565C0', light: '#1E88E5', dark: '#0D47A1', 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#2196F3', 600: '#1E88E5', 700: '#1565C0', 800: '#0D47A1', 900: '#082B6B' },
        },
        // Semantic
        primary: {
          DEFAULT: '#1A6B3C',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#C8961E',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#1565C0',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#B91C1C',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#1A6B3C',
        background: '#FFFFFF',
        foreground: '#0F172A',
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        amharic: ['Noto Sans Ethiopic', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-hover': '0 10px 30px -5px rgba(0,0,0,.12), 0 4px 6px -2px rgba(0,0,0,.05)',
        'gov': '0 4px 20px rgba(26,107,60,.15)',
        'nav': '0 2px 8px rgba(0,0,0,.08)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.5s ease-out forwards',
        'counter': 'counter 2s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gov-gradient': 'linear-gradient(135deg, #1A6B3C 0%, #1565C0 100%)',
        'hero-gradient': 'linear-gradient(135deg, rgba(26,107,60,0.92) 0%, rgba(21,101,192,0.88) 100%)',
        'card-gradient': 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      },
    },
  },
  plugins: [],
}
