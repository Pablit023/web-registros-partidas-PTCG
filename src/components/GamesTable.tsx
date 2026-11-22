import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useArchetypes, useDecks } from '../data/hooks';
import { guessDeckIcons } from '../domain/pokemonIcons';
import type { Game } from '../domain/types';
import { DeckIcons } from './DeckIcons';
import { formatDate, ResultBadge } from './ui';

/** La tabla de partidas del historial: cada fila abre la partida. */
export function GamesTable({ games }: { games: Game[] }) {
  const navigate = useNavigate();
  const archetypes = useArchetypes();
  const decks = useDecks();

  const archetypeById = useMemo(() => new Map(archetypes?.map((a) => [a.id, a])), [archetypes]);
  const deckIcons = useMemo(
    () =>
      new Map(
        decks?.map((deck) => [
          deck.id,
          deck.icons?.length ? deck.icons : guessDeckIcons(deck.cards, archetypes ?? []),
        ]),
      ),
    [decks, archetypes],
  );

  return (
    <table className="table games">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Resultado</th>
          <th>Mi mazo</th>
          <th>Mazo rival</th>
          <th>Rival</th>
          <th>Turno</th>
          <th>Turnos</th>
          <th>Premios</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game) => {
          const archetype = game.archetypeId ? archetypeById.get(game.archetypeId) : undefined;
          return (
            <tr
              key={game.id}
              onClick={() => navigate(`/partidas/${game.id}`)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/partidas/${game.id}`)}
            >
              <td>{formatDate(game.playedAt)}</td>
              <td>
                <ResultBadge result={game.status === 'finished' ? game.result : null} />
              </td>
              <td>
                <DeckIcons
                  icons={(game.deckId && deckIcons.get(game.deckId)) || []}
                  label={game.deckName}
                />
              </td>
              <td>
                <DeckIcons
                  icons={archetype?.icons ?? []}
                  label={archetype?.name ?? 'Desconocido'}
                />
              </td>
              <td>{game.opponentName || '—'}</td>
              <td>{game.wentFirst === null ? '—' : game.wentFirst ? '1.º' : '2.º'}</td>
              <td>{game.turns ?? '—'}</td>
              <td>
                {game.prizes.length > 0
                  ? `${game.prizes.filter((p) => p.taken).length}/${game.prizes.length}`
                  : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
