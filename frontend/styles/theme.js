import { createStitches } from '@stitches/react';

export const { styled, css, globalCss, keyframes, getCssText, theme, createTheme, config } = createStitches({
  theme: {
    colors: {
      primary: '#3B82F6',
      primaryDark: '#2563EB',
      secondary: '#10B981',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#1F2937',
      textLight: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    },
    space: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '32px',
      8: '40px',
      9: '48px',
      10: '64px',
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
    },
    fonts: {
      sans: 'Roboto, sans-serif',
      serif: 'Libre Baskerville, serif',
      heading: 'Roboto Condensed, sans-serif',
    },
    radii: {
      sm: '4px',
      md: '6px',
      lg: '8px',
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
