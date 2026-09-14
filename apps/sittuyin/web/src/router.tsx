import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './components/AppShell';
import { AboutPage } from './pages/AboutPage';
import { ComputerGamePage } from './pages/ComputerGamePage';
import { DesignPage } from './DesignPage';
import { HomePage } from './pages/HomePage';
import { LocalGamePage } from './pages/LocalGamePage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'play/local', element: <LocalGamePage /> },
      { path: 'play/computer', element: <ComputerGamePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'design', element: <DesignPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
