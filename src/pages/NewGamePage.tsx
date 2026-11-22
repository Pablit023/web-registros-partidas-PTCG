import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PRIZE_COUNT, PrizePicker } from '../components/PrizePicker';
import { TournamentFields } from '../components/TournamentFields';
import { Empty, PageHeader } from '../components/ui';
import { db, newId } from '../data/db';
import { useActiveTournament, useCurrentDeck, useDecks, useGames } from '../data/hooks';
import { nextRound } from '../domain/tournaments';
import type { PrizeCard } from '../domain/types';

export function NewGamePage() {
  const decks = useDecks();
  const currentDeck = useCurrentDeck();
  const navigate = useNavigate();
  const [chosenDeckId, setChosenDeckId] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<PrizeCard[]>([]);
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

  async function start() {
    if (!deck) return;
    const id = newId();
    await db.games.add({
      id,
      playedAt: new Date().toISOString(),
      status: 'in_progress',
      deckId: deck.id,
      deckName: deck.name,
      prizes,
      result: null,
      opponentName: '',
      archetypeId: null,
      detectedArchetypeId: null,
      wentFirst: null,
      turns: null,
      winReason: '',
      notes: '',
      log: '',
      opponentCards: [],
      tournamentId,
      round,
    });
    navigate(`/partidas/${id}`);
  }

  return (
    <>
      <PageHeader title="Nueva partida">
        <button className="primary" disabled={!deck} onClick={() => void start()}>
          {prizes.length === PRIZE_COUNT
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
      <section className="card">
        <h2>Tus 6 cartas de Premio</h2>
        <p className="muted">
          Pulsa las cartas que han quedado como premios. Al final, el log marcará las que cogiste y
          podrás corregirlas.
        </p>
        {deck && <PrizePicker cards={deck.cards} prizes={prizes} onChange={setPrizes} />}
      </section>
    </>
  );
}
