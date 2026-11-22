# Descripción

Qué cambia y por qué, en pocas líneas.

## Tipo de cambio

- [ ] Nueva funcionalidad
- [ ] Corrección de un fallo
- [ ] Refactorización
- [ ] Documentación
- [ ] Tests
- [ ] Mantenimiento

## Issue relacionada

Closes #XX

## Cambios

-

## Cómo se ha probado

Tests automáticos y pruebas a mano. Si cambia una pantalla, añade una captura en un bloque
`<details>`.

## Riesgos

Qué podría romperse (por ejemplo, un cambio en la base de datos local que necesite migración).
"Ninguno" si no hay.

## Checklist

- [ ] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` pasan.
- [ ] `CHANGELOG.md` tiene una entrada en `[Unreleased]`, o el cambio no se nota al usar la app.
- [ ] El README está al día si cambia lo que describe.
- [ ] El PR solo tiene cambios de esta tarea.
