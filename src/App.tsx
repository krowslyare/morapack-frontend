import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'styled-components'
import { GlobalStyles } from './styles/GlobalStyles'
import { theme } from './styles/theme'
import { AppRouter } from './routes'
import { useInitializeAuth } from './hooks/useInitializeAuth'

const queryClient = new QueryClient()

function AppContent() {
  useInitializeAuth()
  return <AppRouter />
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
