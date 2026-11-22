import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PRIZE_COUNT, PrizePicker } from '../components/PrizePicker';
import { Empty, PageHeader } from '../components/ui';
import { db, newId } from '../data/db';
import { useCurrentDeck, useDecks } from '../data/hooks';
import type { PrizeCard } from '../domain/types';

export function NewGamePage() {
  const decks = useDecks();
  const currentDeck = useCurrentDeck();
  const navigate = useNavigate();
  const [chosenDeckId, setChosenDeckId] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<PrizeCard[]>([]);

  if (decks === undefined || currentDeck === undefined) return null;
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
      <section className="card">
        <label className="field inline">
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
