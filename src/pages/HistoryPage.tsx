import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { GamesTable } from '../components/GamesTable';
import { Empty, PageHeader } from '../components/ui';
import { useArchetypes, useGames } from '../data/hooks';
import { formatPercent, overall } from '../domain/stats';
import type { GameResult } from '../domain/types';

type ResultFilter = 'all' | GameResult | 'in_progress';

export function HistoryPage() {
  const games = useGames();
  const archetypes = useArchetypes();
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (games ?? []).filter((game) => {
      if (resultFilter === 'in_progress' && game.status !== 'in_progress') return false;
      if (resultFilter !== 'all' && resultFilter !== 'in_progress' && game.result !== resultFilter)
        return false;
      if (archetypeFilter === 'unknown' && game.archetypeId !== null) return false;
      if (archetypeFilter && archetypeFilter !== 'unknown' && game.archetypeId !== archetypeFilter)
        return false;
      if (
        query &&
        ![game.opponentName, game.deckName, game.notes].some((t) => t.toLowerCase().includes(query))
      )
        return false;
      return true;
    });
  }, [games, resultFilter, archetypeFilter, search]);

  if (games === undefined) return null;
  const total = overall(filtered);

  return (
    <>
      <PageHeader title="Historial">
        <Link className="button primary" to="/partidas/nueva">
          Nueva partida
        </Link>
      </PageHeader>

      {games.length === 0 ? (
        <Empty>
          Aún no hay partidas. Importa tu mazo en <Link to="/mazos">Mis mazos</Link> y crea la
          primera.
        </Empty>
      ) : (
        <>
          <div className="filters">
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
              aria-label="Filtrar por resultado"
            >
              <option value="all">Todos los resultados</option>
              <option value="win">Victorias</option>
              <option value="loss">Derrotas</option>
              <option value="tie">Empates</option>
              <option value="in_progress">En curso</option>
            </select>
            <select
              value={archetypeFilter}
              onChange={(e) => setArchetypeFilter(e.target.value)}
              aria-label="Filtrar por mazo rival"
            >
              <option value="">Todos los mazos rivales</option>
              <option value="unknown">Desconocido</option>
              {archetypes?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Buscar rival, mazo o notas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="muted">
              {filtered.length} partidas · {total.wins}-{total.losses}
              {total.ties > 0 ? `-${total.ties}` : ''}
              {total.games > 0 && ` · ${formatPercent(total.winRate)} victorias`}
            </span>
          </div>

          <GamesTable games={filtered} />
          {filtered.length === 0 && <Empty>Ninguna partida cumple los filtros.</Empty>}
        </>
      )}
    </>
  );
}
