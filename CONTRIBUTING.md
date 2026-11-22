# Contribuir

Cómo se trabaja en este repositorio.

## Ramas

`main` siempre funciona. Cada cambio va en su propia rama y entra en `main` con un pull request:

| Tipo          | Rama                                  |
| ------------- | ------------------------------------- |
| Funcionalidad | `feature/<issue>-<descripcion-corta>` |
| Corrección    | `fix/<issue>-<descripcion-corta>`     |
| Documentación | `docs/<issue>-<descripcion-corta>`    |
| Mantenimiento | `chore/<descripcion-corta>`           |

## Commits

Se siguen los [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/), en inglés y
en presente: `feat(web): show the win rate against each deck`. Tipos: `feat`, `fix`, `docs`,
`test`, `refactor`, `chore`. El ámbito, entre paréntesis, es la parte que cambia: `domain`, `data`
o `web`.

## Pull requests

- Rellena la plantilla: qué cambia, por qué, cómo se ha probado y qué riesgos tiene.
- Antes de pedir revisión pasan `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y
  `pnpm build`, y la CI en verde.
- Un pull request trata una sola cosa.

## Changelog

Todo cambio que se note al usar la app añade una línea en `CHANGELOG.md`, en `[Unreleased]`,
siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## Versiones

Se sigue [Semantic Versioning](https://semver.org/lang/es/), y **cada pull request sube la versión
de parche**: el primero fue la 0.0.1, el sexto la 0.0.6. En el propio pull request, la sección
`[Unreleased]` del changelog pasa a llamarse como la versión nueva, con su fecha, y se actualiza
`version` en `package.json`. Al fusionarlo se crea la etiqueta `vX.Y.Z` en `main`.
