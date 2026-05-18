import SetupPage from './pages/SetupPage';
import ReportPage from './pages/ReportPage';
import DeepAnalysisPage from './pages/DeepAnalysisPage';
import DefenceRoomPage from './pages/DefenceRoomPage';
import ShareableCardPage from './pages/ShareableCardPage';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Setup',
    path: '/',
    element: <SetupPage />,
    public: true,
  },
  {
    name: 'Report',
    path: '/report',
    element: <ReportPage />,
    public: true,
  },
  {
    name: 'Deep Analysis',
    path: '/analysis',
    element: <DeepAnalysisPage />,
    public: true,
  },
  {
    name: 'Defence Room',
    path: '/defence',
    element: <DefenceRoomPage />,
    public: true,
  },
  {
    name: 'Your Verdict',
    path: '/card/:id?',
    element: <ShareableCardPage />,
    public: true,
  },
];
