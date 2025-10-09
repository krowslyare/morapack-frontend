export const theme = {
  colors: {
    background: '#1A1A1A',
    surface: '#2C2C2C',
    primary: '#00C896',
    textPrimary: '#FFFFFF',
    textSecondary: '#A9A9A9',
    border: '#444444',
    error: '#D32F2F',
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
} as const

export type AppTheme = typeof theme


