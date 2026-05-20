import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Nav } from './components/Nav';
import { ErrorBoundary } from './components/Shared';
import { useAuth } from './contexts/AuthContext';

import { LoginPage }              from './pages/LoginPage';
import { DashboardPage }          from './pages/DashboardPage';
import { AlarmsPage }             from './pages/AlarmsPage';
import { AssetsPage }             from './pages/AssetsPage';
import { AssetDetailPage }        from './pages/AssetDetailPage';
import { ReportsPage }            from './pages/ReportsPage';
import { SettingsPage }           from './pages/SettingsPage';
import { WorkOrderSuccessPage }   from './pages/WorkOrderSuccessPage';

// Lazy-loaded heavier pages
import { MapPage }                from './pages/MapPage';
import { VibrationAnalysisPage }  from './pages/VibrationAnalysisPage';
import { AddAssetPage }           from './pages/AddAssetPage';

/** Wraps protected routes — redirects to / if not authenticated */
function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },

  {
    element: <ProtectedLayout />,
    children: [
      { path: '/dashboard',                          element: <DashboardPage /> },
      { path: '/map',                                element: <MapPage /> },
      { path: '/alarms',                             element: <AlarmsPage /> },
      { path: '/assets',                             element: <AssetsPage /> },
      { path: '/assets/new',                         element: <AddAssetPage /> },
      { path: '/assets/:assetId',                    element: <AssetDetailPage /> },
      { path: '/assets/:assetId/vibration',          element: <VibrationAnalysisPage /> },
      { path: '/reports',                            element: <ReportsPage /> },
      { path: '/settings',                           element: <SettingsPage /> },
      { path: '/work-orders/:woNumber',              element: <WorkOrderSuccessPage /> },
      { path: '*',                                   element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
