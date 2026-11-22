// Piezas pequeñas que se repiten en varias pantallas.

import type { ReactNode } from 'react';
import type { CardCategory, GameResult } from '../domain/types';

export const CATEGORY_LABEL: Record<CardCategory, string> = {
  pokemon: 'Pokémon',
  trainer: 'Entrenador',
  energy: 'Energía',
};

export const RESULT_LABEL: Record<GameResult, string> = {
  win: 'Victoria',
  loss: 'Derrota',
  tie: 'Empate',
};

export function ResultBadge({ result }: { result: GameResult | null }) {
  if (result === null) return <span className="badge badge-pending">En curso</span>;
  return <span className={`badge badge-${result}`}>{RESULT_LABEL[result]}</span>;
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function WinRateBar({ value }: { value: number }) {
  return (
    <div className="bar" aria-hidden="true">
      <div className="bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** Convierte una fecha ISO al valor de un <input type="datetime-local">, en hora local. */
export function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
