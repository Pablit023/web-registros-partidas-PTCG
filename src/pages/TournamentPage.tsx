import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { GamesTable } from '../components/GamesTable';
import { Empty, formatDate, PageHeader } from '../components/ui';
import { db, deleteTournament, finishTournament, resumeTournament } from '../data/db';
import { useActiveTournament, useGames, useTournament } from '../data/hooks';
import { formatPercent, overall } from '../domain/stats';
import { gamesInScope } from '../domain/tournaments';
import type { Tournament } from '../domain/types';

export function TournamentPage() {
  const { id } = useParams();
  const tournament = useTournament(id);
  if (tournament === undefined) return null;
  if (tournament === null) {
    return (
      <>
        <PageHeader title="Torneo" />
        <Empty>
          Este torneo no existe. <Link to="/torneos">Volver a los torneos</Link>
        </Empty>
      </>
    );
  }
  return <TournamentDetail key={tournament.id} tournament={tournament} />;
}

function TournamentDetail({ tournament }: { tournament: Tournament }) {
  const games = useGames();
  const active = useActiveTournament();
  const navigate = useNavigate();
  const [name, setName] = useState(tournament.name);
  const [notes, setNotes] = useState(tournament.notes);
  const isActive = active?.id === tournament.id;
  // Un torneo terminado no enseña el formulario de nombre y notas hasta pulsar "Editar".
  const finished = Boolean(tournament.finishedAt) && !isActive;
  const [editing, setEditing] = useState(false);
  const showForm = !finished || editing;

  if (games === undefined) return null;
  const own = gamesInScope(games, { tournamentId: tournament.id }).sort(
    (a, b) => (a.round ?? 0) - (b.round ?? 0) || a.playedAt.localeCompare(b.playedAt),
  );
  const record = overall(own);
  const dirty = name !== tournament.name || notes !== tournament.notes;

  async function remove() {
    const warning = own.length > 0 ? ` Sus ${own.length} partidas pasarán a ser normales.` : '';
    if (!window.confirm(`¿Borrar el torneo "${tournament.name}"?${warning}`)) return;
    await deleteTournament(tournament.id);
    navigate('/torneos');
  }

  return (
    <>
      <PageHeader title={tournament.name}>
        {isActive ? (
          <span className="badge badge-current">Modo torneo activo</span>
        ) : (
          tournament.finishedAt && <span className="muted">Terminado</span>
        )}
        {finished && (
          <button
            aria-pressed={editing}
            onClick={() => {
              // Al cerrar sin guardar se descartan los cambios.
              setName(tournament.name);
              setNotes(tournament.notes);
              setEditing(!editing);
            }}
          >
            {editing ? 'Cerrar edición' : 'Editar'}
          </button>
        )}
        <button className="danger" onClick={() => void remove()}>
          Borrar
        </button>
        {isActive ? (
          <button onClick={() => void finishTournament(tournament.id)}>Terminar torneo</button>
        ) : (
          <button onClick={() => void resumeTournament(tournament.id)}>Activar</button>
        )}
        {isActive && (
          <Link className="button primary" to="/partidas/nueva">
            Nueva partida
          </Link>
        )}
      </PageHeader>

      <div className="tiles">
        <div className="tile">
          <span className="tile-label">Resultado</span>
          <span className="tile-value">
            {record.wins}-{record.losses}
            {record.ties > 0 ? `-${record.ties}` : ''}
          </span>
          <span className="muted">{formatDate(tournament.startedAt)}</span>
        </div>
        <div className="tile">
          <span className="tile-label">Victorias</span>
          <span className="tile-value">
            {record.games > 0 ? formatPercent(record.winRate) : '—'}
          </span>
          <span className="muted">{own.length} partidas</span>
        </div>
      </div>

      <section className="card">
        <h2>Partidas</h2>
        {own.length === 0 ? (
          <Empty>
            Aún no hay partidas.{' '}
            {isActive
              ? 'Las que crees ahora se guardarán aquí.'
              : 'Activa el torneo para jugarlas.'}
          </Empty>
        ) : (
          <GamesTable games={own} showRound />
        )}
      </section>

      {!showForm && tournament.notes.trim() !== '' && (
        <section className="card">
          <h2>Notas</h2>
          <p className="notes">{tournament.notes}</p>
        </section>
      )}

      {showForm && (
        <section className="card">
          <label className="field">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            Notas
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Formato, número de jugadores, puesto final..."
            />
          </label>
          <div className="form-actions">
            <span />
            <button
              className="primary"
              disabled={!dirty}
              onClick={() =>
                void db.tournaments
                  .update(tournament.id, { name: name.trim() || tournament.name, notes })
                  .then(() => setEditing(false))
              }
            >
              Guardar
            </button>
          </div>
        </section>
      )}
    </>
  );
}
