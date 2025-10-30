import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { LandingPage } from '../pages/LandingPage'
import { Sidebar } from '../components/layout/Sidebar'
import { TrackingPage } from '../pages/TrackingPage'
// import { MonitoringPage } from '../pages/MonitoringPage'
import { DataPage } from '../pages/DataPage'
import { ReportPage } from '../pages/ReportPage'
import { SimulationPage } from '../pages/SimulationPage'
import { VisualizationPage } from '../pages/VisualizationPage'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/envios',
    element: <Sidebar />,
    children: [{ index: true, element: <TrackingPage /> }],
  },
  {
    path: '/planificacion',
    element: <Sidebar />,
    children: [{ index: true, element: <SimulationPage /> }],
  },
  {
    path: '/simulacion/tiempo-real',
    element: <Sidebar />,
    children: [{ index: true, element: <VisualizationPage simulationType="day-to-day" /> }],
  },
  {
    path: '/simulacion/semanal',
    element: <Sidebar />,
    children: [{ index: true, element: <VisualizationPage simulationType="weekly" /> }],
  },
  {
    path: '/simulacion/colapso',
    element: <Sidebar />,
    children: [{ index: true, element: <VisualizationPage simulationType="collapse" /> }],
  },
  {
    path: '/datos',
    element: <Sidebar />,
    children: [{ index: true, element: <DataPage /> }],
  },
  {
    path: '/reportes',
    element: <Sidebar />,
    children: [{ index: true, element: <ReportPage /> }],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
