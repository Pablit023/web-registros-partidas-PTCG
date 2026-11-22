# Changelog

Los cambios importantes del proyecto se apuntan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto sigue
[Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Importar mazos con el texto que exporta Pokémon TCG Live, en español o en inglés, guardar varios y marcar uno como actual.
- Crear una partida eligiendo las 6 cartas de Premio del mazo, y marcar después cuáles se cogieron.
- Leer el log de la partida en español: jugadores, quién empezó, turnos, ganador, cómo terminó, cartas que mostró el rival y premios que fueron a tu mano, que se marcan solos.
- Detectar el mazo rival por las cartas clave de cada mazo del meta, con los candidatos y su porcentaje para corregirlo.
- Lista de mazos del meta editable, con los 20 más jugados en Limitless TCG (noviembre de 2026) como punto de partida.
- Historial con filtros y búsqueda, y estadísticas de victorias por mazo rival, por mazo propio y según quién empieza.
- Copia de seguridad: descargar y restaurar todos los datos en un JSON.
