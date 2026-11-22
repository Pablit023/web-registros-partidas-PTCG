import { NavLink, Outlet } from 'react-router';

const LINKS = [
  { to: '/', label: 'Historial', end: true },
  { to: '/partidas/nueva', label: 'Nueva partida' },
  { to: '/estadisticas', label: 'Estadísticas' },
  { to: '/mazos', label: 'Mis mazos' },
  { to: '/meta', label: 'Meta' },
  { to: '/ajustes', label: 'Ajustes' },
];

export function Layout() {
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
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
