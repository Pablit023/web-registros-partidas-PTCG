import { memo, useState } from 'react';
import { pokemonIconUrl } from '../domain/pokemonIcons';

/**
 * Los iconos de los Pokémon de un mazo, con su nombre al pasar el ratón. Si no hay iconos, o no se
 * puede cargar ninguno (por ejemplo, sin conexión), se muestra el nombre.
 */
export const DeckIcons = memo(function DeckIcons({
  icons,
  label,
}: {
  icons: string[];
  label: string;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const shown = icons.filter((icon) => !failed.includes(icon));
  if (shown.length === 0) return <span>{label}</span>;
  return (
    <span className="deck-icons" title={label}>
      {shown.map((icon) => (
        <img
          key={icon}
          src={pokemonIconUrl(icon)}
          alt=""
          width={30}
          height={30}
          loading="lazy"
          onError={() => setFailed((current) => [...current, icon])}
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
});
