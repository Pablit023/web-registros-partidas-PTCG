import { useTournaments } from '../data/hooks';

/** Torneo y ronda de una partida. Sin torneo, es una partida normal. */
export function TournamentFields({
  tournamentId,
  round,
  onChange,
}: {
  tournamentId: string | null;
  round: number | null;
  onChange: (changes: { tournamentId: string | null; round: number | null }) => void;
}) {
  const tournaments = useTournaments();
  return (
    <>
      <label className="field">
        Torneo
        <select
          value={tournamentId ?? ''}
          onChange={(e) =>
            onChange({ tournamentId: e.target.value || null, round: e.target.value ? round : null })
          }
        >
          <option value="">Ninguno (partida normal)</option>
          {tournaments?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.finishedAt ? ' (terminado)' : ''}
            </option>
          ))}
        </select>
      </label>
      {tournamentId && (
        <label className="field">
          Ronda
          <input
            type="number"
            min={1}
            value={round ?? ''}
            onChange={(e) =>
              onChange({
                tournamentId,
                round: e.target.value === '' ? null : Math.max(1, Number(e.target.value)),
              })
            }
          />
        </label>
      )}
    </>
  );
}
