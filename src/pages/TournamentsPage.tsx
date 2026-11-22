import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Empty, formatDate, fromLocalInput, PageHeader, toLocalInput } from '../components/ui';
import { finishTournament, resumeTournament, startTournament } from '../data/db';
import { useActiveTournament, useGames, useTournaments } from '../data/hooks';
import { formatPercent, overall } from '../domain/stats';
import { gamesInScope } from '../domain/tournaments';

export function TournamentsPage() {
  const tournaments = useTournaments();
  const games = useGames();
  const active = useActiveTournament();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => toLocalInput(new Date().toISOString()));

  const records = useMemo(
    () =>
      new Map(
        (tournaments ?? []).map((t) => [
          t.id,
          overall(gamesInScope(games ?? [], { tournamentId: t.id })),
        ]),
      ),
    [tournaments, games],
  );

  if (tournaments === undefined || games === undefined) return null;

  async function create() {
    const id = await startTournament(name.trim(), fromLocalInput(date));
    setName('');
    navigate(`/torneos/${id}`);
  }

  return (
    <>
      <PageHeader title="Torneos" />
      <section className="card">
        <h2>Nuevo torneo</h2>
        <p className="muted">
          Al crearlo se activa el <strong>modo torneo</strong>: las partidas nuevas se guardan en
          él, con su ronda, hasta que lo termines. Se ven aparte en el historial, pero siguen
          contando en las estadísticas.
        </p>
        <div className="form-grid">
          <label className="field">
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Liga local de diciembre"
            />
          </label>
          <label className="field">
            Fecha
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </label>
        </div>
        <div className="form-actions start">
          <button className="primary" disabled={name.trim() === ''} onClick={() => void create()}>
            Empezar torneo
          </button>
          {active && (
            <span className="muted">
              Ahora mismo estás en <Link to={`/torneos/${active.id}`}>{active.name}</Link>: se
              terminará el modo torneo de ese.
            </span>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Tus torneos</h2>
        {tournaments.length === 0 ? (
          <Empty>Todavía no has jugado ningún torneo.</Empty>
        ) : (
          <table className="table games">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Fecha</th>
                <th className="num">Partidas</th>
                <th className="num">V-D-E</th>
                <th className="num">% victorias</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => {
                const record = records.get(t.id);
                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/torneos/${t.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/torneos/${t.id}`)}
                    tabIndex={0}
                  >
                    <td>
                      <strong>{t.name}</strong>
                    </td>
                    <td>{formatDate(t.startedAt)}</td>
                    <td className="num">{record?.games ?? 0}</td>
                    <td className="num">
                      {record ? `${record.wins}-${record.losses}-${record.ties}` : '0-0-0'}
                    </td>
                    <td className="num">
                      {record && record.games > 0 ? formatPercent(record.winRate) : '—'}
                    </td>
                    <td>
                      {active?.id === t.id ? (
                        <span className="badge badge-current">Activo</span>
                      ) : t.finishedAt ? (
                        <span className="muted">Terminado</span>
                      ) : (
                        <span className="muted">Sin terminar</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {active?.id === t.id ? (
                        <button onClick={() => void finishTournament(t.id)}>Terminar</button>
                      ) : (
                        <button onClick={() => void resumeTournament(t.id)}>Activar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
