import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { db } from '../data/db';
import { startDiskSync, stopDiskSync, useDiskStatus } from '../data/diskSync';
import { useActiveTournament } from '../data/hooks';

const LINKS = [
  { to: '/', label: 'Historial', end: true },
  { to: '/partidas/nueva', label: 'Nueva partida' },
  { to: '/torneos', label: 'Torneos' },
  { to: '/estadisticas', label: 'Estadísticas' },
  { to: '/mazos', label: 'Mis mazos' },
  { to: '/meta', label: 'Meta' },
  { to: '/ajustes', label: 'Ajustes' },
];

export function Layout() {
  const saveToDisk = useLiveQuery(async () => (await db.settings.get('settings'))?.saveToDisk);

  useEffect(() => {
    if (!saveToDisk) return;
    void startDiskSync();
    return stopDiskSync;
  }, [saveToDisk]);

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Principal">
        <div className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>Registro PTCG</span>
        </div>
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className="nav-link">
            {link.label}
          </NavLink>
        ))}
        <ActiveTournament />
        <DiskIndicator />
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

const timeFormat = new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' });

function DiskIndicator() {
  const status = useDiskStatus();
  if (status.state === 'off') return null;
  const text = {
    loading: 'Cargando del ordenador…',
    saving: 'Guardando en el ordenador…',
    saved:
      status.state === 'saved' ? `Guardado en el ordenador · ${timeFormat.format(status.at)}` : '',
    error: 'No se pudo guardar en el ordenador',
  }[status.state];
  return (
    <Link
      to="/ajustes"
      className={status.state === 'error' ? 'disk-status error' : 'disk-status'}
      title={status.state === 'error' ? status.message : undefined}
      role="status"
    >
      {text}
    </Link>
  );
}

/** Recordatorio del modo torneo en la barra lateral, con enlace al torneo. */
function ActiveTournament() {
  const tournament = useActiveTournament();
  if (!tournament) return null;
  return (
    <Link to={`/torneos/${tournament.id}`} className="tournament-mode">
      <span className="tournament-mode-label">Modo torneo</span>
      <span>{tournament.name}</span>
    </Link>
  );
}
