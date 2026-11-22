import { useMemo, useState } from 'react';
import { DeckIcons } from '../components/DeckIcons';
import { CATEGORY_LABEL, Empty, PageHeader } from '../components/ui';
import { translateDeckCards, type TranslationResult } from '../data/cardTranslation';
import { db, newId, setCurrentDeck } from '../data/db';
import { useArchetypes, useDecks } from '../data/hooks';
import { cardKey, logNameOf } from '../domain/cardNames';
import { parseDeckList } from '../domain/deckParser';
import { guessDeckIcons, parseIcons } from '../domain/pokemonIcons';
import type { Deck, DeckCard } from '../domain/types';

const CATEGORIES = ['pokemon', 'trainer', 'energy'] as const;

export function DecksPage() {
  const decks = useDecks();
  const archetypes = useArchetypes();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Mis mazos" />
      <ImportDeck isFirst={decks?.length === 0} />
      <section className="card">
        <h2>Mazos guardados</h2>
        {decks?.length === 0 && <Empty>Todavía no has importado ningún mazo.</Empty>}
        <ul className="deck-list">
          {decks?.map((deck) => (
            <li key={deck.id} className={deck.isCurrent ? 'deck-row current' : 'deck-row'}>
              <div className="deck-row-main">
                <DeckIcons
                  icons={
                    deck.icons?.length ? deck.icons : guessDeckIcons(deck.cards, archetypes ?? [])
                  }
                  label=""
                />
                <button
                  className="link"
                  onClick={() => {
                    setOpenId(openId === deck.id ? null : deck.id);
                    setEditingId(null);
                  }}
                >
                  {deck.name}
                </button>
                {deck.isCurrent && <span className="badge badge-current">Actual</span>}
                <span className="muted">
                  {deck.cards.reduce((sum, card) => sum + card.count, 0)} cartas
                </span>
              </div>
              <div className="row-actions">
                {!deck.isCurrent && (
                  <button onClick={() => void setCurrentDeck(deck.id)}>Marcar como actual</button>
                )}
                <button
                  onClick={() => {
                    setEditingId(editingId === deck.id ? null : deck.id);
                    setOpenId(null);
                  }}
                >
                  Editar
                </button>
                <button className="danger" onClick={() => void deleteDeck(deck)}>
                  Borrar
                </button>
              </div>
              {openId === deck.id && <DeckCards deck={deck} />}
              {editingId === deck.id && (
                <DeckEditor deck={deck} onClose={() => setEditingId(null)} />
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function ImportDeck({ isFirst }: { isFirst: boolean }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastImport, setLastImport] = useState<TranslationResult | null>(null);
  const parsed = useMemo(() => parseDeckList(text), [text]);

  async function save() {
    setSaving(true);
    const translation = await translateDeckCards(parsed.cards);
    const id = newId();
    await db.decks.add({
      id,
      name: name.trim() || guessDeckName(parsed.cards.map((c) => c.name)),
      cards: translation.cards,
      isCurrent: false,
      createdAt: new Date().toISOString(),
      rawText: text,
    });
    if (makeCurrent || isFirst) await setCurrentDeck(id);
    setName('');
    setText('');
    setLastImport(translation);
    setSaving(false);
  }

  return (
    <section className="card">
      <h2>Importar mazo</h2>
      <p className="muted">
        En TCG Live abre el mazo, pulsa <strong>Exportar</strong> y pega aquí el texto copiado. Al
        guardarlo, los nombres se traducen al español para que coincidan con el log.
      </p>
      <label className="field">
        Nombre del mazo
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dragapult ex" />
      </label>
      <label className="field">
        Lista
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Pokémon: 13\n4 Dreepy TWM 128\n...'}
        />
      </label>
      {text.trim() !== '' && (
        <p className={parsed.warnings.length > 0 ? 'warning' : 'ok'}>
          {parsed.cards.length} cartas distintas, {parsed.total} en total.
          {parsed.warnings.slice(0, 3).map((w) => (
            <span key={w} className="block">
              {w}
            </span>
          ))}
        </p>
      )}
      <div className="form-actions">
        <label className="check">
          <input
            type="checkbox"
            checked={makeCurrent}
            onChange={(e) => setMakeCurrent(e.target.checked)}
          />
          Marcar como mazo actual
        </label>
        <button
          className="primary"
          disabled={parsed.cards.length === 0 || saving}
          onClick={() => void save()}
        >
          {saving ? 'Traduciendo…' : 'Guardar mazo'}
        </button>
      </div>
      {lastImport && <TranslationSummary result={lastImport} />}
    </section>
  );
}

function DeckCards({ deck }: { deck: Deck }) {
  return (
    <div className="deck-cards">
      {CATEGORIES.map((category) => {
        const cards = deck.cards.filter((card) => card.category === category);
        if (cards.length === 0) return null;
        return (
          <div key={category}>
            <h3>
              {CATEGORY_LABEL[category]} ({cards.reduce((sum, card) => sum + card.count, 0)})
            </h3>
            <ul>
              {cards.map((card) => (
                <li key={cardKey(card)}>
                  {card.count} {logNameOf(card)}{' '}
                  <span className="muted">
                    {card.logName && card.logName !== card.name ? `${card.name} · ` : ''}
                    {card.set} {card.number}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Sin nombre, el mazo se llama como su primer Pokémon ex o, si no tiene, su primer Pokémon. */
function guessDeckName(names: string[]): string {
  return names.find((name) => / ex$/i.test(name)) ?? names[0] ?? 'Mazo sin nombre';
}

function TranslationSummary({ result }: { result: TranslationResult }) {
  if (result.error) {
    return (
      <p className="warning">
        {result.error} El mazo se ha guardado; tradúcelo luego desde <strong>Editar</strong>.
      </p>
    );
  }
  if (result.missing.length === 0) {
    return <p className="ok">Todas las cartas tienen su nombre en español.</p>;
  }
  return (
    <p className="warning">
      Sin traducción: {result.missing.join(', ')}. Escríbelas a mano en <strong>Editar</strong> si
      en el log salen con otro nombre.
    </p>
  );
}

/** Cambia el nombre, la lista y el nombre en español de cada carta de un mazo ya guardado. */
function DeckEditor({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const [name, setName] = useState(deck.name);
  const [iconsText, setIconsText] = useState((deck.icons ?? []).join(', '));
  const [text, setText] = useState(deck.rawText || formatDeckList(deck.cards));
  const [translations, setTranslations] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      deck.cards.filter((c) => c.logName).map((c) => [cardKey(c), c.logName ?? '']),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<TranslationResult | null>(null);
  const parsed = useMemo(() => parseDeckList(text), [text]);

  const withTranslations = (cards: DeckCard[]): DeckCard[] =>
    cards.map((card) => {
      const logName = translations[cardKey(card)]?.trim();
      const { logName: _old, ...rest } = card;
      void _old;
      return logName ? { ...rest, logName } : rest;
    });

  async function translate() {
    setBusy(true);
    const result = await translateDeckCards(withTranslations(parsed.cards));
    setTranslations((current) => {
      const next = { ...current };
      for (const card of result.cards) {
        if (card.logName && !next[cardKey(card)]?.trim()) next[cardKey(card)] = card.logName;
      }
      return next;
    });
    setMessage(result);
    setBusy(false);
  }

  async function save() {
    await db.decks.update(deck.id, {
      name: name.trim() || deck.name,
      icons: parseIcons(iconsText),
      cards: withTranslations(parsed.cards),
      rawText: text,
    });
    onClose();
  }

  return (
    <div className="deck-editor">
      <label className="field">
        Nombre del mazo
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        Iconos del historial: hasta 2 Pokémon en inglés, separados por comas. Vacío para elegirlos
        solos
        <input
          value={iconsText}
          onChange={(e) => setIconsText(e.target.value)}
          placeholder="dragapult, dusknoir"
        />
      </label>
      <label className="field">
        Lista: pega una exportación nueva o cambia las cantidades
        <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <p className={parsed.warnings.length > 0 ? 'warning' : 'muted'}>
        {parsed.cards.length} cartas distintas, {parsed.total} en total.
        {parsed.warnings.slice(0, 3).map((w) => (
          <span key={w} className="block">
            {w}
          </span>
        ))}
      </p>

      <h3>Nombre de cada carta en el log</h3>
      <table className="table translations">
        <thead>
          <tr>
            <th>Carta del mazo</th>
            <th>Nombre en el log (español)</th>
          </tr>
        </thead>
        <tbody>
          {parsed.cards.map((card) => (
            <tr key={cardKey(card)}>
              <td>
                {card.count} {card.name}{' '}
                <span className="muted">
                  {card.set} {card.number}
                </span>
              </td>
              <td>
                <input
                  value={translations[cardKey(card)] ?? ''}
                  placeholder={card.name}
                  aria-label={`Nombre en el log de ${card.name}`}
                  onChange={(e) =>
                    setTranslations((current) => ({ ...current, [cardKey(card)]: e.target.value }))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <TranslationSummary result={message} />}

      <div className="form-actions">
        <button disabled={busy || parsed.cards.length === 0} onClick={() => void translate()}>
          {busy ? 'Traduciendo…' : 'Traducir las que faltan'}
        </button>
        <div className="row-actions">
          <button onClick={onClose}>Cancelar</button>
          <button
            className="primary"
            disabled={parsed.cards.length === 0}
            onClick={() => void save()}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

/** La lista en el formato de TCG Live, para los mazos guardados sin el texto original. */
function formatDeckList(cards: DeckCard[]): string {
  const titles = { pokemon: 'Pokémon', trainer: 'Trainer', energy: 'Energy' };
  return CATEGORIES.map((category) => {
    const group = cards.filter((c) => c.category === category);
    if (group.length === 0) return '';
    const total = group.reduce((sum, c) => sum + c.count, 0);
    const lines = group.map((c) => `${c.count} ${c.name} ${c.set} ${c.number}`.trim());
    return [`${titles[category]}: ${total}`, ...lines].join('\n');
  })
    .filter(Boolean)
    .join('\n\n');
}

async function deleteDeck(deck: Deck) {
  if (!window.confirm(`¿Borrar el mazo "${deck.name}"? Sus partidas se conservan.`)) return;
  await db.decks.delete(deck.id);
  if (deck.isCurrent) {
    const next = await db.decks.toCollection().first();
    if (next) await setCurrentDeck(next.id);
  }
}
