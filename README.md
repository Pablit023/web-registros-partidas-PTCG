# 🃏 Registro de partidas PTCG

App web local para registrar y analizar tus partidas de **Pokémon TCG Live**: importas tu mazo, eliges tus premios al empezar, pegas el log al terminar y la app detecta contra qué mazo has jugado y te enseña tus porcentajes de victoria.

> [!NOTE]
> Todo se guarda en tu navegador (IndexedDB), sin cuenta ni conexión a internet. Activa **Ajustes > Guardar en el ordenador** para que además se guarde en el archivo `datos/partidas.json` del proyecto.

## 📑 Contenido

- **[Qué hace](#-qué-hace)**
- **[Cómo funciona una partida](#-cómo-funciona-una-partida)**
- **[Detección del mazo rival](#-detección-del-mazo-rival)**
- **[Tecnología](#-tecnología)**
- **[Puesta en marcha](#-puesta-en-marcha)**
- **[Tests y comprobaciones](#-tests-y-comprobaciones)**
- **[Estructura del proyecto](#-estructura-del-proyecto)**

## 📦 Qué hace

| Pantalla      | Para qué                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Historial     | Tus partidas normales (o las de torneo, o todas), con los Pokémon principales de tu mazo y del rival como iconos (los de Limitless), filtros por resultado y mazo rival y búsqueda por rival, mazo o notas |
| Nueva partida | Eliges el mazo (el actual por defecto) y tus 6 cartas de Premio                                                                                                                                            |
| Partida       | Pegas el log y se rellenan el resultado, el rival, su mazo, quién empezó, los turnos, cómo terminó y los premios que cogiste. Todo se puede corregir, y añadir notas y fecha                               |
| Estadísticas  | % de victorias total, en las últimas 10, contra cada mazo rival, con cada uno de tus mazos y según quién empieza, y cuántas detecciones no tuviste que corregir                                            |
| Torneos       | Creas un torneo y se activa el modo torneo: las partidas nuevas se guardan en él con su ronda. Cada torneo tiene su resultado y sus partidas                                                               |
| Mis mazos     | Importas la lista que exporta TCG Live (las cartas se traducen solas al español), guardas varios mazos, los editas y marcas uno como actual                                                                |
| Meta          | Los mazos populares con sus cartas clave y sus iconos, editables. Empieza con los 20 más jugados en Limitless TCG (noviembre de 2026)                                                                      |
| Ajustes       | Tu nombre en TCG Live, guardar en el ordenador y la copia de seguridad (descargar y restaurar un JSON)                                                                                                     |

## 🔄 Cómo funciona una partida

1. **Importa tu mazo** en _Mis mazos_: en TCG Live abre el mazo, pulsa _Exportar_ y pega el texto. TCG Live exporta los nombres en inglés y escribe el log en español, así que al guardar el mazo cada carta se traduce con [TCGdex](https://tcgdex.dev) por su expansión y número (las Energías básicas, sin conexión). Si alguna no se encuentra, o no tenías conexión, escribe su nombre en _Editar_ o pulsa _Traducir las que faltan_.
2. **Crea la partida** en _Nueva partida_ y pulsa las 6 cartas que han quedado como premios.
3. **Al terminar, pega el log** en la partida. Se lee solo al pegarlo (o con _Leer log_):
   - jugadores, quién empezó y número de turnos;
   - ganador y cómo terminó (premios, rendición, sin Pokémon, sin cartas);
   - las cartas que mostró el rival, y con ellas su mazo;
   - las cartas de Premio que fueron a tu mano, que se marcan como cogidas.
4. **Revisa y guarda.** Una partida sin resultado se queda _En curso_ hasta que lo tenga.

Tu nombre en el juego (por defecto `Pablolo23`) sirve para saber qué jugador del log eres tú. Cámbialo en _Ajustes_ si hace falta.

## 🏆 Modo torneo

1. En _Torneos_ crea el torneo con su nombre y fecha. Se activa el **modo torneo** y la barra lateral lo recuerda.
2. Las partidas que crees se guardan en ese torneo, con la ronda siguiente (cámbiala si juegas al mejor de 3). También puedes mover cualquier partida a un torneo, o sacarla, desde la propia partida.
3. Al acabar, pulsa _Terminar torneo_ y vuelves a las partidas normales.

El historial enseña por defecto las partidas normales; elige _Todas las de torneo_, _Todas las partidas_ o un torneo concreto en el primer filtro. Las estadísticas cuentan todas por defecto, y el mismo selector las separa.

## 🔍 Detección del mazo rival

Cada mazo del meta tiene unas **cartas clave con peso**: 3 para la carta principal, 2 para su línea evolutiva y 1 para cartas de apoyo. La app busca esas cartas entre las que el rival mostró en el log y elige el mazo con más peso visto (al menos un 25 %). Debajo del selector salen los mazos que encajan con su porcentaje, para corregirlo con un clic.

Los nombres se comparan sin acentos, mayúsculas, guiones ni dueño, así que `Zoroark ex` encuentra _Zoroark ex de N_ y _N's Zoroark ex_, y `Kangaskhan ex` encuentra _Mega-Kangaskhan ex_. Por eso conviene usar como cartas clave nombres de Pokémon, que casi siempre se escriben igual en español y en inglés.

Cuando salga un mazo nuevo, añádelo en _Meta_ con sus iconos: hasta 2 Pokémon en inglés, como los nombra Limitless (`dragapult`, `kangaskhan-mega`). Los iconos de tus mazos se eligen solos (los del mazo del meta que encaja o, si no, tu Pokémon ex con más copias) y se cambian en _Editar_. Las imágenes se cargan de Limitless: sin conexión se ve el nombre. Si borras un mazo del meta, sus partidas pasan a _Desconocido_.

## 💾 Guardar en el ordenador

Con el interruptor de _Ajustes > Guardar en el ordenador_ activado:

- Cada cambio se escribe, medio segundo después, en `datos/partidas.json` dentro de la carpeta del proyecto. La versión anterior queda en `datos/partidas.anterior.json`.
- Al abrir la app se cargan los datos de ese archivo, así que no dependen del navegador: en otro navegador, o después de borrar su historial, basta con activarlo otra vez.
- Si al activarlo ya hay datos en el archivo y en el navegador, la app pregunta cuáles quedarse.
- La barra lateral dice cuándo se guardó por última vez, o si no se pudo.

Lo escribe el propio servidor de Vite (`pnpm dev` o `pnpm preview`) en `/api/datos`, que solo escucha en este equipo. La carpeta `datos/` no se sube a Git. Para guardar el archivo en otro sitio, por ejemplo en una carpeta de OneDrive, arranca la app con la variable `PTCG_DATA_FILE`:

```powershell
$env:PTCG_DATA_FILE = "$HOME\OneDrive\partidas-ptcg.json"; pnpm dev
```

## 🧰 Tecnología

| Parte    | Con qué                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Interfaz | TypeScript, React 19, React Router y Vite                                                                                         |
| Datos    | IndexedDB con Dexie, con consultas en vivo (`dexie-react-hooks`), y un archivo JSON en el ordenador escrito por un plugin de Vite |
| Calidad  | Vitest, ESLint, Prettier y GitHub Actions                                                                                         |

La lectura del log, de los mazos, la detección y las estadísticas son funciones puras en `src/domain/`, sin React ni base de datos, y tienen sus tests al lado.

## ⚡ Puesta en marcha

Necesitas [Node.js 24](https://nodejs.org/) y [pnpm](https://pnpm.io/).

```powershell
pnpm install
pnpm dev
```

Se abre en <http://localhost:5173>. Para usarla sin el servidor de desarrollo:

```powershell
pnpm build
pnpm preview
```

> [!IMPORTANT]
> Sin _Guardar en el ordenador_, los datos van unidos a la dirección y al navegador: usa siempre el mismo puerto y el mismo navegador, o pasa tus datos con _Descargar copia_ y _Restaurar copia_.

## 🧪 Tests y comprobaciones

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Los tests del log usan un log real de ejemplo con el nombre del rival cambiado, en `src/domain/__fixtures__/`.

## 🗂️ Estructura del proyecto

```text
src/
├── domain/       # Lógica pura: lectura de log y mazos, detección, premios, estadísticas
├── data/         # Base de datos local (Dexie), copia de seguridad y hooks de lectura
├── components/   # Menú, selector de premios y piezas comunes
├── pages/        # Una pantalla por archivo
└── styles.css
server/           # Plugin de Vite que lee y escribe datos/partidas.json
```

## 🤝 Contribuir

Las convenciones de ramas, commits, pull requests, changelog y versiones están en [CONTRIBUTING.md](CONTRIBUTING.md).
