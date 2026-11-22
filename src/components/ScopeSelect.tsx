import { useTournaments } from '../data/hooks';
import { type GameScope, scopeFromValue, scopeToValue } from '../domain/tournaments';

/** Elige qué partidas mirar: todas, las normales, las de torneo o las de un torneo. */
export function ScopeSelect({
  value,
  onChange,
}: {
  value: GameScope;
  onChange: (scope: GameScope) => void;
}) {
  const tournaments = useTournaments();
  return (
    <select
      value={scopeToValue(value)}
      onChange={(e) => onChange(scopeFromValue(e.target.value))}
      aria-label="Qué partidas mostrar"
    >
      <option value="casual">Partidas normales</option>
      <option value="tournaments">Todas las de torneo</option>
      <option value="all">Todas las partidas</option>
      {tournaments && tournaments.length > 0 && (
        <optgroup label="Torneos">
          {tournaments.map((t) => (
            <option key={t.id} value={scopeToValue({ tournamentId: t.id })}>
              {t.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
