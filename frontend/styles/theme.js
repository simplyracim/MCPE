import { createStitches } from '@stitches/react'

// Radix UI color palette
const colors = {
  // Primary
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Accent
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Destructive
  destructive: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Gray
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Success
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    900: '#14532d',
  },
  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    900: '#78350f',
  },
  // Error
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    900: '#7f1d1d',
  },
}

export const { styled, css, globalCss, keyframes, getCssText, theme, createTheme, config } = createStitches({
  theme: {
    colors: {
      // Base colors
      ...colors,
      
      // Semantic colors
      background: '$gray50',
      foreground: '$gray900',
      
      primary: '$primary500',
      'primary-foreground': 'white',
      
      secondary: '$gray100',
      'secondary-foreground': '$gray900',
      
      accent: '$accent500',
      'accent-foreground': 'white',
      
      destructive: '$destructive500',
      'destructive-foreground': 'white',
      
      muted: '$gray100',
      'muted-foreground': '$gray500',
      
      border: '$gray200',
      input: '$gray200',
      ring: '$primary500',
      
      success: '$success500',
      'success-foreground': 'white',
      
      warning: '$warning500',
      'warning-foreground': '$gray900',
      
      error: '$error500',
      'error-foreground': 'white',
      
      // Alias for compatibility
      text: '$gray900',
      'text-light': '$gray500',
      surface: 'white',
    },
    space: {
      0: '0px',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    fonts: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    radii: {
      none: '0px',
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
  },
  media: {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
  },
});

// Global styles
export const globalStyles = globalCss({
  '*': { 
    margin: 0, 
    padding: 0, 
    boxSizing: 'border-box' 
  },
  'html, body': { 
    fontFamily: '$sans',
    backgroundColor: '$background',
    color: '$text',
    lineHeight: 1.5,
    height: '100%',
    margin: 0,
    padding: 0,
  },
  '#app': {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  a: { 
    color: 'inherit',
    textDecoration: 'none',
  },
  'button, input, textarea, select': {
    font: 'inherit',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  button: {
    fontFamily: 'inherit',
  },
});
