import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Empty,
  formatDate,
  fromLocalInput,
  PageHeader,
  ResultPicker,
  ResultBadge,
  toLocalInput,
} from '../components/ui';
import { TournamentFields } from '../components/TournamentFields';
import { db } from '../data/db';
import { PrizePicker } from '../components/PrizePicker';
import { useArchetypes, useDecks, useGame, usePlayerName } from '../data/hooks';
import { logNameOf } from '../domain/cardNames';
import { detectArchetype, scoreArchetypes } from '../domain/detection';
import { parseGameLog, type ParsedLog } from '../domain/logParser';
import { markTakenPrizes, PRIZE_COUNT } from '../domain/prizes';
import { formatPercent } from '../domain/stats';
import type { Archetype, Game } from '../domain/types';

export function GamePage() {
  const { id } = useParams();
  const game = useGame(id);
  const archetypes = useArchetypes();

  if (game === undefined || archetypes === undefined) return null;
  if (game === null) {
    return (
      <>
        <PageHeader title="Partida" />
        <Empty>
          Esta partida no existe. <Link to="/">Volver al historial</Link>
        </Empty>
      </>
    );
  }
  return <GameEditor key={game.id} game={game} archetypes={archetypes} />;
}

const WIN_REASONS = [
  'Premios',
  'Rendición',
  'Sin Pokémon en juego',
  'Sin cartas en la baraja',
  'Tiempo',
];

function GameEditor({ game, archetypes }: { game: Game; archetypes: Archetype[] }) {
  const navigate = useNavigate();
  const playerName = usePlayerName();
  const decks = useDecks();
  const deck = decks?.find((d) => d.id === game.deckId);
  const [draft, setDraft] = useState<Game>(game);
  const [parsed, setParsed] = useState<ParsedLog | null>(null);
  const [unmatchedPrizes, setUnmatchedPrizes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const update = (changes: Partial<Game>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setSaved(false);
  };

  const candidates = useMemo(
    () => scoreArchetypes(draft.opponentCards, archetypes).slice(0, 4),
    [draft.opponentCards, archetypes],
  );

  function readLog(log: string) {
    const result = parseGameLog(log, playerName);
    const detected = detectArchetype(result.opponentCards, archetypes);
    const marked = markTakenPrizes(draft.prizes, result.myPrizeCards);
    setParsed(result);
    setUnmatchedPrizes(marked.unmatched);
    update({
      log,
      opponentName: result.opponent ?? draft.opponentName,
      result: result.result ?? draft.result,
      wentFirst: result.wentFirst ?? draft.wentFirst,
      turns: result.turns > 0 ? result.turns : draft.turns,
      winReason: result.winReason || draft.winReason,
      opponentCards: result.opponentCards,
      detectedArchetypeId: detected?.archetype.id ?? null,
      archetypeId: detected?.archetype.id ?? draft.archetypeId,
      prizes: marked.prizes,
    });
  }

  async function save() {
    const finished: Game = { ...draft, status: draft.result ? 'finished' : 'in_progress' };
    await db.games.put(finished);
    setDraft(finished);
    setSaved(true);
  }

  async function remove() {
    if (!window.confirm('¿Borrar esta partida? No se puede deshacer.')) return;
    await db.games.delete(game.id);
    navigate('/');
  }

  const takenCount = draft.prizes.filter((p) => p.taken).length;

  return (
    <>
      <PageHeader title={`${draft.deckName || 'Partida'} · ${formatDate(draft.playedAt)}`}>
        <ResultBadge result={draft.status === 'finished' ? draft.result : null} />
        <button className="danger" onClick={() => void remove()}>
          Borrar
        </button>
        <button className="primary" onClick={() => void save()}>
          {draft.result ? 'Guardar partida' : 'Guardar en curso'}
        </button>
      </PageHeader>
      {saved && <p className="ok">Partida guardada.</p>}

      {(draft.prizes.length > 0 || deck) && (
        <section className="card">
          <h2>
            Premios{' '}
            <span className="muted">
              ({takenCount} de {PRIZE_COUNT} cogidos)
            </span>
          </h2>
          <p className="muted">
            Pulsa un premio para marcarlo o desmarcarlo como cogido.
            {draft.prizes.length < PRIZE_COUNT &&
              ' Los que falten se rellenan con los que el log diga que cogiste, o añádelos abajo.'}
          </p>
          <div className="prize-slots">
            {draft.prizes.map((prize, i) => (
              <button
                key={i}
                className={prize.taken ? 'prize-slot filled taken' : 'prize-slot filled'}
                aria-pressed={prize.taken}
                onClick={() =>
                  update({
                    prizes: draft.prizes.map((p, j) => (j === i ? { ...p, taken: !p.taken } : p)),
                  })
                }
              >
                <span>{logNameOf(prize)}</span>
                <span className="remove">{prize.taken ? '✓' : ''}</span>
              </button>
            ))}
            {Array.from({ length: Math.max(0, PRIZE_COUNT - draft.prizes.length) }, (_, i) => (
              <div key={`hueco-${i}`} className="prize-slot">
                Premio {draft.prizes.length + i + 1}
              </div>
            ))}
          </div>
          {deck && draft.prizes.length < PRIZE_COUNT && (
            <details className="collapsible add-prizes">
              <summary>
                <h3>Añadir los premios que faltan</h3>
              </summary>
              <PrizePicker
                cards={deck.cards}
                prizes={draft.prizes}
                onChange={(prizes) => update({ prizes })}
                hideSlots
              />
            </details>
          )}
          {unmatchedPrizes.length > 0 && (
            <p className="warning">
              El log dice que cogiste {unmatchedPrizes.join(', ')}, que no estaba entre los premios
              elegidos.
            </p>
          )}
        </section>
      )}

      {/* En un torneo en físico no hay log: se queda plegado y es opcional. */}
      <details className="card collapsible" open={!draft.tournamentId || draft.log !== ''}>
        <summary>
          <h2>Log de la partida{draft.tournamentId ? ' (opcional)' : ''}</h2>
        </summary>
        <p className="muted">
          En TCG Live, al terminar, copia el log y pégalo aquí. Se lee solo al pegarlo.
        </p>
        <textarea
          rows={draft.log ? 8 : 5}
          value={draft.log}
          placeholder="Preparación&#10;Pablolo23 ha robado 7 cartas de la mano inicial..."
          onChange={(e) => update({ log: e.target.value })}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (draft.log.trim() === '' && text.trim() !== '') {
              e.preventDefault();
              readLog(text);
            }
          }}
        />
        <div className="form-actions">
          <span className="muted">
            {parsed && `${parsed.turns} turnos · ${parsed.opponentCards.length} cartas del rival`}
          </span>
          <button disabled={draft.log.trim() === ''} onClick={() => readLog(draft.log)}>
            Leer log
          </button>
        </div>
        {parsed?.warnings.map((w) => (
          <p key={w} className="warning">
            {w}
          </p>
        ))}
      </details>

      <section className="card">
        <h2>Resultado</h2>
        <ResultPicker value={draft.result} onChange={(result) => update({ result })} />

        <div className="form-grid">
          <label className="field">
            Mazo rival
            <select
              value={draft.archetypeId ?? ''}
              onChange={(e) => update({ archetypeId: e.target.value || null })}
            >
              <option value="">Desconocido</option>
              {archetypes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Nombre del rival
            <input
              value={draft.opponentName}
              onChange={(e) => update({ opponentName: e.target.value })}
            />
          </label>
          <label className="field">
            ¿Quién empezó?
            <select
              value={draft.wentFirst === null ? '' : draft.wentFirst ? 'me' : 'rival'}
              onChange={(e) =>
                update({ wentFirst: e.target.value === '' ? null : e.target.value === 'me' })
              }
            >
              <option value="">Sin saber</option>
              <option value="me">Yo</option>
              <option value="rival">El rival</option>
            </select>
          </label>
          <label className="field">
            Turnos
            <input
              type="number"
              min={0}
              value={draft.turns ?? ''}
              onChange={(e) =>
                update({ turns: e.target.value === '' ? null : Number(e.target.value) })
              }
            />
          </label>
          <label className="field">
            Cómo terminó
            <input
              list="win-reasons"
              value={draft.winReason}
              onChange={(e) => update({ winReason: e.target.value })}
            />
            <datalist id="win-reasons">
              {WIN_REASONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </label>
          <label className="field">
            Fecha
            <input
              type="datetime-local"
              value={toLocalInput(draft.playedAt)}
              onChange={(e) =>
                e.target.value && update({ playedAt: fromLocalInput(e.target.value) })
              }
            />
          </label>
          <TournamentFields
            tournamentId={draft.tournamentId ?? null}
            round={draft.round ?? null}
            onChange={update}
          />
        </div>

        {candidates.length > 0 && (
          <div className="candidates">
            <span className="muted">Mazos que encajan con lo que jugó el rival:</span>
            {candidates.map((c) => (
              <button
                key={c.archetype.id}
                className={draft.archetypeId === c.archetype.id ? 'chip selected' : 'chip'}
                onClick={() => update({ archetypeId: c.archetype.id })}
                title={`Cartas clave vistas: ${c.matched.join(', ')}`}
              >
                {c.archetype.name} · {formatPercent(c.score)}
              </button>
            ))}
          </div>
        )}
        {draft.log && candidates.length === 0 && (
          <p className="muted">
            Ninguna carta del rival coincide con los mazos del <Link to="/meta">meta</Link>. Elige
            el mazo a mano o añade el suyo.
          </p>
        )}

        <label className="field">
          Notas
          <textarea
            rows={3}
            value={draft.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Qué salió bien, qué cambiarías..."
          />
        </label>
      </section>

      {draft.opponentCards.length > 0 && (
        <section className="card">
          <h2>Cartas que mostró el rival</h2>
          <div className="chips">
            {draft.opponentCards.map((card) => (
              <span key={card} className="chip static">
                {card}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
