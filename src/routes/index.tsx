import { createBrowserRouter, RouterProvider, useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { LandingPage } from '../pages/LandingPage'
import { Sidebar } from '../components/layout/Sidebar'
import { AuthLayoutWrapper } from '../components/layout/AuthLayoutWrapper'
import { TrackingPage } from '../pages/TrackingPage'
// import { MonitoringPage } from '../pages/MonitoringPage'
import { DataPage } from '../pages/DataPage'
import { ReportPage } from '../pages/ReportPage'
import { SimulationPage } from '../pages/SimulationPage'
import { VisualizationPage } from '../pages/VisualizationPage'
import { RealtimeSimulationPage } from '../pages/RealtimeSimulationPage/RealtimeSimulationPage.tsx'
import RegisterOrderPage from '../pages/RegisterOrderPage/RegisterOrderPage'
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage'
import { ErrorBoundary } from '../components/ErrorBoundary'

function AnimatedOutlet() {
  const location = useLocation()
  const element = useOutlet()

  return (
    <AnimatePresence mode="wait" initial={false}>
      {element && <div key={location.pathname}>{element}</div>}
    </AnimatePresence>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage />, errorElement: <ErrorBoundary /> },
  {
    element: <AuthLayoutWrapper />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/envios',
    element: <Sidebar />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <TrackingPage /> },
      { path: 'registrar', element: <RegisterOrderPage /> },
      // { path: ':id/editar', element: <EditOrderPage /> },
    ],
  },
  {
    path: '/planificacion',
    element: <Sidebar />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <SimulationPage /> }],
  },
  {
    path: '/simulacion/tiempo-real',
    element: <Sidebar />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <RealtimeSimulationPage /> }],
  },
  {
    path: '/simulacion/semanal',
    element: <Sidebar />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <VisualizationPage simulationType="weekly" /> }],
  },
  {
    path: '/simulacion/colapso',
    element: <Sidebar />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <VisualizationPage simulationType="collapse" /> }],
  },
  {
    path: '/datos',
    element: <Sidebar />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <DataPage /> }],
  },
  {
    path: '/reportes',
    element: <Sidebar />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <ReportPage /> }],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

