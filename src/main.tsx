import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Layout } from './components/Layout';
import { DecksPage } from './pages/DecksPage';
import { GamePage } from './pages/GamePage';
import { HistoryPage } from './pages/HistoryPage';
import { MetaPage } from './pages/MetaPage';
import { NewGamePage } from './pages/NewGamePage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import './styles.css';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HistoryPage /> },
      { path: '/partidas/nueva', element: <NewGamePage /> },
      { path: '/partidas/:id', element: <GamePage /> },
      { path: '/mazos', element: <DecksPage /> },
      { path: '/meta', element: <MetaPage /> },
      { path: '/estadisticas', element: <StatsPage /> },
      { path: '/ajustes', element: <SettingsPage /> },
    ],
  },
]);

const root = document.getElementById('root');
if (!root) throw new Error('Falta el elemento #root en index.html');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
