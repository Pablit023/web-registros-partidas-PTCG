import { useState } from 'react';
import { Link } from 'react-router';
import { ScopeSelect } from '../components/ScopeSelect';
import { Empty, PageHeader, WinRateBar } from '../components/ui';
import { useArchetypes, useGames } from '../data/hooks';
import {
  byArchetype,
  byDeck,
  byTurnOrder,
  detectionAccuracy,
  finishedGames,
  formatPercent,
  overall,
  type WinRate,
} from '../domain/stats';
import { type GameScope, gamesInScope } from '../domain/tournaments';

export function StatsPage() {
  const allGames = useGames();
  const archetypes = useArchetypes();
  // Las partidas de torneo cuentan en las estadísticas: por defecto se ven todas juntas.
  const [scope, setScope] = useState<GameScope>('all');
  if (allGames === undefined || archetypes === undefined) return null;

  const games = gamesInScope(allGames, scope);
  const header = (
    <PageHeader title="Estadísticas">
      <ScopeSelect value={scope} onChange={setScope} />
    </PageHeader>
  );
  const finished = finishedGames(games);
  if (finished.length === 0) {
    return (
      <>
        {header}
        <Empty>
          Las estadísticas salen de las partidas terminadas.{' '}
          <Link to="/partidas/nueva">Registra una</Link>.
        </Empty>
      </>
    );
  }

  const total = overall(games);
  const accuracy = detectionAccuracy(games);
  const last10 = finished.slice(0, 10);

  return (
    <>
      {header}
      <div className="tiles">
        <Tile label="Partidas" value={String(total.games)} />
        <Tile
          label="Victorias"
          value={formatPercent(total.winRate)}
          detail={`${total.wins}-${total.losses}${total.ties ? `-${total.ties}` : ''}`}
        />
        <Tile
          label="Últimas 10"
          value={`${last10.filter((g) => g.result === 'win').length}-${last10.filter((g) => g.result === 'loss').length}`}
          detail={last10
            .map((g) => (g.result === 'win' ? 'V' : g.result === 'loss' ? 'D' : 'E'))
            .join(' ')}
        />
        {accuracy.checked > 0 && (
          <Tile
            label="Detección acertada"
            value={formatPercent(accuracy.correct / accuracy.checked)}
            detail={`${accuracy.correct} de ${accuracy.checked} sin corregir`}
          />
        )}
      </div>
      <RateTable
        title="Contra cada mazo rival"
        first="Mazo rival"
        rates={byArchetype(games, archetypes)}
      />
      <RateTable title="Con cada uno de mis mazos" first="Mi mazo" rates={byDeck(games)} />
      <RateTable title="Según quién empieza" first="Turno" rates={byTurnOrder(games)} />
    </>
  );
}

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
      {detail && <span className="muted">{detail}</span>}
    </div>
  );
}

function RateTable({ title, first, rates }: { title: string; first: string; rates: WinRate[] }) {
  if (rates.length === 0) return null;
  return (
    <section className="card">
      <h2>{title}</h2>
      <table className="table">
        <thead>
          <tr>
            <th>{first}</th>
            <th className="num">Partidas</th>
            <th className="num">V-D-E</th>
            <th className="num">% victorias</th>
            <th className="bar-col" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate.key}>
              <td>{rate.label}</td>
              <td className="num">{rate.games}</td>
              <td className="num">
                {rate.wins}-{rate.losses}-{rate.ties}
              </td>
              <td className="num">{formatPercent(rate.winRate)}</td>
              <td className="bar-col">
                <WinRateBar value={rate.winRate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
