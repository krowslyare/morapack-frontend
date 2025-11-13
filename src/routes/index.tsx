import { createBrowserRouter, RouterProvider, useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { LandingPage } from '../pages/LandingPage'
import { ProtectedLayout } from '../components/layout/ProtectedLayout'
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
import { PlanificacionPage } from '../pages/PlanificacionPage'
import { DailySimulationPage } from '../pages/DailySimulationPage'
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
  {
    element: <AuthLayoutWrapper />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/envios',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <TrackingPage /> },
      { path: 'registrar', element: <RegisterOrderPage /> },
      // { path: ':id/editar', element: <EditOrderPage /> },
    ],
  },
  {
    path: '/planificacion',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <PlanificacionPage /> }],
  },
  {
    path: '/simulacion/diaria',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <DailySimulationPage /> }],
  },
  /*{
    //path: '/simulacion/tiempo-real',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <RealtimeSimulationPage /> }],
  },*/
  {
    path: '/simulacion/semanal',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <VisualizationPage simulationType="weekly" /> }],
  },
  {
    path: '/simulacion/colapso',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <VisualizationPage simulationType="collapse" /> }],
  },
  {
    path: '/datos',
    element: <ProtectedLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <DataPage /> }],
  },
  {
    path: '/reportes',
    element: <ProtectedLayout />,
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

