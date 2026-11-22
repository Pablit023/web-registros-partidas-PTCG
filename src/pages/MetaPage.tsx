import { useState } from 'react';
import { Empty, PageHeader } from '../components/ui';
import { db, newId } from '../data/db';
import { useArchetypes } from '../data/hooks';
import { DeckIcons } from '../components/DeckIcons';
import { formatKeyCards, parseKeyCards } from '../domain/keyCards';
import { parseIcons } from '../domain/pokemonIcons';
import { META_SEED } from '../domain/metaSeed';
import type { Archetype } from '../domain/types';

export function MetaPage() {
  const archetypes = useArchetypes();
  const [filter, setFilter] = useState('');
  if (archetypes === undefined) return null;

  const missingSeed = META_SEED.filter(
    (seed) => !archetypes.some((a) => a.name.toLowerCase() === seed.name.toLowerCase()),
  );
  const shown = archetypes.filter((a) =>
    a.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  async function add() {
    await db.archetypes.add({ id: newId(), name: 'Nuevo mazo', keyCards: [] });
    setFilter('Nuevo mazo');
  }

  async function restoreSeed() {
    await db.archetypes.bulkAdd(missingSeed.map((seed) => ({ ...seed, id: newId() })));
  }

  return (
    <>
      <PageHeader title="Mazos del meta">
        {missingSeed.length > 0 && (
          <button onClick={() => void restoreSeed()}>
            Recuperar {missingSeed.length} mazos de la lista inicial
          </button>
        )}
        <button className="primary" onClick={() => void add()}>
          Añadir mazo
        </button>
      </PageHeader>
      <p className="muted">
        La detección busca en el log las <strong>cartas clave</strong> de cada mazo. Escribe una por
        línea con su peso delante: 3 para la carta principal, 2 para su línea evolutiva, 1 para
        cartas de apoyo. Usa el nombre del Pokémon sin dueño (&quot;Zoroark ex&quot; encuentra
        &quot;Zoroark ex de N&quot;). Los <strong>iconos</strong> son hasta 2 Pokémon en inglés,
        como en Limitless: &quot;dragapult&quot; o &quot;kangaskhan-mega&quot;. Lista inicial basada
        en Limitless TCG, noviembre de 2026.
      </p>
      <input
        className="search"
        type="search"
        placeholder="Buscar mazo"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {shown.length === 0 && <Empty>No hay mazos con ese nombre.</Empty>}
      <div className="meta-grid">
        {shown.map((archetype) => (
          <ArchetypeCard key={archetype.id} archetype={archetype} />
        ))}
      </div>
    </>
  );
}

function ArchetypeCard({ archetype }: { archetype: Archetype }) {
  const [name, setName] = useState(archetype.name);
  const [cardsText, setCardsText] = useState(formatKeyCards(archetype.keyCards));
  const savedIcons = (archetype.icons ?? []).join(', ');
  const [iconsText, setIconsText] = useState(savedIcons);
  const dirty =
    name !== archetype.name ||
    cardsText !== formatKeyCards(archetype.keyCards) ||
    iconsText !== savedIcons;

  async function save() {
    const keyCards = parseKeyCards(cardsText);
    const icons = parseIcons(iconsText);
    await db.archetypes.update(archetype.id, {
      name: name.trim() || archetype.name,
      keyCards,
      icons,
    });
    setCardsText(formatKeyCards(keyCards));
    setIconsText(icons.join(', '));
  }

  async function remove() {
    const games = await db.games.where('archetypeId').equals(archetype.id).count();
    const warning = games > 0 ? ` Sus ${games} partidas pasarán a "Desconocido".` : '';
    if (!window.confirm(`¿Borrar "${archetype.name}"?${warning}`)) return;
    await db.transaction('rw', db.archetypes, db.games, async () => {
      await db.games.where('archetypeId').equals(archetype.id).modify({ archetypeId: null });
      await db.archetypes.delete(archetype.id);
    });
  }

  return (
    <section className="card archetype">
      <div className="archetype-head">
        <DeckIcons icons={parseIcons(iconsText)} label="" />
        <input
          className="archetype-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Nombre del mazo"
        />
      </div>
      <input
        value={iconsText}
        onChange={(e) => setIconsText(e.target.value)}
        aria-label="Iconos"
        placeholder="Iconos: dragapult, dusknoir"
        title="Hasta 2 Pokémon en inglés, separados por comas"
      />
      <textarea
        rows={Math.max(3, cardsText.split('\n').length)}
        value={cardsText}
        onChange={(e) => setCardsText(e.target.value)}
        aria-label="Cartas clave"
        placeholder={'3 Dragapult ex\n2 Drakloak'}
      />
      <div className="form-actions">
        <button className="danger" onClick={() => void remove()}>
          Borrar
        </button>
        <button className="primary" disabled={!dirty} onClick={() => void save()}>
          Guardar
        </button>
      </div>
    </section>
  );
}
