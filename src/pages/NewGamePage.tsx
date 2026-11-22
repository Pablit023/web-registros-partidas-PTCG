import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PRIZE_COUNT, PrizePicker } from '../components/PrizePicker';
import { TournamentFields } from '../components/TournamentFields';
import { Empty, PageHeader, ResultPicker } from '../components/ui';
import { db, newId } from '../data/db';
import {
  useActiveTournament,
  useArchetypes,
  useCurrentDeck,
  useDecks,
  useGames,
} from '../data/hooks';
import { nextRound } from '../domain/tournaments';
import type { GameResult, PrizeCard } from '../domain/types';

/** Lo que se apunta a mano en una partida de torneo, que en físico no tiene log. */
interface QuickEntry {
  archetypeId: string | null;
  result: GameResult | null;
  wentFirst: boolean | null;
  opponentName: string;
  notes: string;
}

const EMPTY_ENTRY: QuickEntry = {
  archetypeId: null,
  result: null,
  wentFirst: null,
  opponentName: '',
  notes: '',
};

export function NewGamePage() {
  const decks = useDecks();
  const currentDeck = useCurrentDeck();
  const archetypes = useArchetypes();
  const navigate = useNavigate();
  const [chosenDeckId, setChosenDeckId] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<PrizeCard[]>([]);
  const [entry, setEntry] = useState<QuickEntry>(EMPTY_ENTRY);
  const games = useGames();
  const activeTournament = useActiveTournament();
  // undefined = lo que toque por defecto: el torneo activo y su ronda siguiente.
  const [tournamentChoice, setTournamentChoice] = useState<string | null | undefined>(undefined);
  const [roundChoice, setRoundChoice] = useState<number | null | undefined>(undefined);

  if (
    decks === undefined ||
    currentDeck === undefined ||
    games === undefined ||
    activeTournament === undefined
  )
    return null;
  if (decks.length === 0) {
    return (
      <>
        <PageHeader title="Nueva partida" />
        <Empty>
          Primero <Link to="/mazos">importa tu mazo</Link> desde TCG Live.
        </Empty>
      </>
    );
  }

  const deckId = chosenDeckId ?? currentDeck?.id ?? decks[0]?.id ?? '';
  const deck = decks.find((d) => d.id === deckId);
  const tournamentId =
    tournamentChoice === undefined ? (activeTournament?.id ?? null) : tournamentChoice;
  const round = tournamentId
    ? roundChoice === undefined
      ? nextRound(games, tournamentId)
      : roundChoice
    : null;
  // En un torneo se apunta el resultado aquí mismo; fuera de torneo, la partida se juega primero.
  const quick = tournamentId !== null;
  const finished = quick && entry.result !== null;

  async function save() {
    if (!deck) return;
    const id = newId();
    await db.games.add({
      id,
      playedAt: new Date().toISOString(),
      status: finished ? 'finished' : 'in_progress',
      deckId: deck.id,
      deckName: deck.name,
      prizes,
      result: quick ? entry.result : null,
      opponentName: quick ? entry.opponentName.trim() : '',
      archetypeId: quick ? entry.archetypeId : null,
      detectedArchetypeId: null,
      wentFirst: quick ? entry.wentFirst : null,
      turns: null,
      winReason: '',
      notes: quick ? entry.notes : '',
      log: '',
      opponentCards: [],
      tournamentId,
      round,
    });
    if (finished && tournamentId) {
      // Lista para la siguiente: vuelve al torneo, donde se ve la partida recién apuntada.
      navigate(`/torneos/${tournamentId}`);
    } else {
      navigate(`/partidas/${id}`);
    }
  }

  const prizePicker = deck && (
    <PrizePicker cards={deck.cards} prizes={prizes} onChange={setPrizes} />
  );

  return (
    <>
      <PageHeader title="Nueva partida">
        <button className="primary" disabled={!deck} onClick={() => void save()}>
          {finished
            ? 'Guardar partida'
            : quick || prizes.length === PRIZE_COUNT
              ? 'Empezar partida'
              : `Empezar con ${prizes.length}/${PRIZE_COUNT} premios`}
        </button>
      </PageHeader>
      {activeTournament && tournamentId === activeTournament.id && (
        <p className="tournament-banner">
          Modo torneo: esta partida se guarda en <strong>{activeTournament.name}</strong>, ronda{' '}
          {round ?? '—'}.
        </p>
      )}
      <section className="card form-grid">
        <label className="field">
          Mazo
          <select
            value={deckId}
            onChange={(e) => {
              setChosenDeckId(e.target.value);
              setPrizes([]);
            }}
          >
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.isCurrent ? ' (actual)' : ''}
              </option>
            ))}
          </select>
        </label>
        <TournamentFields
          tournamentId={tournamentId}
          round={round}
          onChange={(changes) => {
            setTournamentChoice(changes.tournamentId);
            setRoundChoice(changes.tournamentId === tournamentId ? changes.round : undefined);
          }}
        />
      </section>

      {quick ? (
        <>
          <section className="card">
            <h2>Partida</h2>
            <p className="muted">
              Elige el mazo del rival y el resultado; lo demás es opcional. Si la juegas en TCG
              Live, puedes empezarla sin resultado y pegar el log después.
            </p>
            <ResultPicker
              value={entry.result}
              onChange={(result) => setEntry({ ...entry, result })}
            />
            <div className="form-grid">
              <label className="field">
                Mazo rival
                <select
                  value={entry.archetypeId ?? ''}
                  onChange={(e) => setEntry({ ...entry, archetypeId: e.target.value || null })}
                >
                  <option value="">Desconocido</option>
                  {archetypes?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                ¿Quién empezó? (opcional)
                <select
                  value={entry.wentFirst === null ? '' : entry.wentFirst ? 'me' : 'rival'}
                  onChange={(e) =>
                    setEntry({
                      ...entry,
                      wentFirst: e.target.value === '' ? null : e.target.value === 'me',
                    })
                  }
                >
                  <option value="">Sin apuntar</option>
                  <option value="me">Yo</option>
                  <option value="rival">El rival</option>
                </select>
              </label>
              <label className="field">
                Nombre del rival (opcional)
                <input
                  value={entry.opponentName}
                  onChange={(e) => setEntry({ ...entry, opponentName: e.target.value })}
                />
              </label>
            </div>
            <label className="field">
              Notas (opcional)
              <textarea
                rows={2}
                value={entry.notes}
                onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
              />
            </label>
            <p className="muted">
              ¿El mazo del rival no está en la lista? Añádelo en <Link to="/meta">Meta</Link>.
            </p>
          </section>
          <details className="card collapsible">
            <summary>
              <h2>Premios (opcional)</h2>
            </summary>
            {prizePicker}
          </details>
        </>
      ) : (
        <section className="card">
          <h2>Tus 6 cartas de Premio</h2>
          <p className="muted">
            Pulsa las cartas que han quedado como premios. Al final, el log marcará las que cogiste
            y podrás corregirlas.
          </p>
          {prizePicker}
        </section>
      )}
    </>
  );
}
