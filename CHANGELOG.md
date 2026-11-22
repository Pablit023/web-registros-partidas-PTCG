# Changelog

Los cambios importantes del proyecto se apuntan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto sigue
[Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Las cartas de un mazo importado se traducen al español con TCGdex, por su expansión y número, para que coincidan con el log: los premios se marcan solos aunque TCG Live exporte el mazo en inglés. Las Energías básicas se traducen sin conexión, y lo que no se encuentre se puede escribir a mano.
- Editar un mazo guardado: su nombre, su lista y el nombre en español de cada carta, con un botón para traducir las que faltan.

- Opción _Guardar en el ordenador_ en Ajustes: con ella activada, cada cambio se guarda en `datos/partidas.json` dentro del proyecto (o en la ruta de `PTCG_DATA_FILE`), con la versión anterior en `datos/partidas.anterior.json`, y al abrir la app se cargan los datos de ese archivo. La barra lateral dice cuándo se guardó por última vez o si falló.

## [0.0.1] - 2026-11-22

### Added

- Importar mazos con el texto que exporta Pokémon TCG Live, en español o en inglés, guardar varios y marcar uno como actual.
- Crear una partida eligiendo las 6 cartas de Premio del mazo, y marcar después cuáles se cogieron.
- Leer el log de la partida en español: jugadores, quién empezó, turnos, ganador, cómo terminó, cartas que mostró el rival y premios que fueron a tu mano, que se marcan solos.
- Detectar el mazo rival por las cartas clave de cada mazo del meta, con los candidatos y su porcentaje para corregirlo.
- Lista de mazos del meta editable, con los 20 más jugados en Limitless TCG (noviembre de 2026) como punto de partida.
- Historial con filtros y búsqueda, y estadísticas de victorias por mazo rival, por mazo propio y según quién empieza.
- Copia de seguridad: descargar y restaurar todos los datos en un JSON.

[Unreleased]: https://github.com/Pablit023/web-registros-partidas-PTCG/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/Pablit023/web-registros-partidas-PTCG/releases/tag/v0.0.1
