import { useMemo, useState } from 'react';
import { CATEGORY_LABEL, Empty, PageHeader } from '../components/ui';
import { db, newId, setCurrentDeck } from '../data/db';
import { useDecks } from '../data/hooks';
import { parseDeckList } from '../domain/deckParser';
import type { Deck } from '../domain/types';

export function DecksPage() {
  const decks = useDecks();
  const [openId, setOpenId] = useState<string | null>(null);

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
                <button
                  className="link"
                  onClick={() => setOpenId(openId === deck.id ? null : deck.id)}
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
                <button onClick={() => void renameDeck(deck)}>Renombrar</button>
                <button className="danger" onClick={() => void deleteDeck(deck)}>
                  Borrar
                </button>
              </div>
              {openId === deck.id && <DeckCards deck={deck} />}
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
  const parsed = useMemo(() => parseDeckList(text), [text]);

  async function save() {
    const id = newId();
    await db.decks.add({
      id,
      name: name.trim() || guessDeckName(parsed.cards.map((c) => c.name)),
      cards: parsed.cards,
      isCurrent: false,
      createdAt: new Date().toISOString(),
      rawText: text,
    });
    if (makeCurrent || isFirst) await setCurrentDeck(id);
    setName('');
    setText('');
  }

  return (
    <section className="card">
      <h2>Importar mazo</h2>
      <p className="muted">
        En TCG Live abre el mazo, pulsa <strong>Exportar</strong> y pega aquí el texto copiado.
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
          disabled={parsed.cards.length === 0}
          onClick={() => void save()}
        >
          Guardar mazo
        </button>
      </div>
    </section>
  );
}

function DeckCards({ deck }: { deck: Deck }) {
  return (
    <div className="deck-cards">
      {(['pokemon', 'trainer', 'energy'] as const).map((category) => {
        const cards = deck.cards.filter((card) => card.category === category);
        if (cards.length === 0) return null;
        return (
          <div key={category}>
            <h3>
              {CATEGORY_LABEL[category]} ({cards.reduce((sum, card) => sum + card.count, 0)})
            </h3>
            <ul>
              {cards.map((card) => (
                <li key={`${card.name}-${card.set}-${card.number}`}>
                  {card.count} {card.name}{' '}
                  <span className="muted">
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

async function renameDeck(deck: Deck) {
  const name = window.prompt('Nuevo nombre del mazo', deck.name)?.trim();
  if (name) await db.decks.update(deck.id, { name });
}

async function deleteDeck(deck: Deck) {
  if (!window.confirm(`¿Borrar el mazo "${deck.name}"? Sus partidas se conservan.`)) return;
  await db.decks.delete(deck.id);
  if (deck.isCurrent) {
    const next = await db.decks.toCollection().first();
    if (next) await setCurrentDeck(next.id);
  }
}
