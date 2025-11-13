import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'styled-components'
import { ToastContainer } from 'react-toastify'
import { GlobalStyles } from './styles/GlobalStyles'
import { theme } from './styles/theme'
import { AppRouter } from './routes'
import 'react-toastify/dist/ReactToastify.css'
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
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
