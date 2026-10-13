# ADR-0006 — Actualizaciones incrementales de datos (solo cortes nuevos)

**Estado:** Aceptada · 2026-10-13

## Contexto

Hasta ahora la fuente de verdad era un libro por sistema en [`data/`](../../data/), con una hoja por
vigencia (2022–2025). El 2026-10-13 llegó un libro distinto,
`data/13-10-2026/SISTEMAS INTEGRADOS DE GESTION.xlsx`: **un solo libro con una hoja por sistema** y
solo la vigencia 2025 (`SGC 2025`, `SGA 2025`, `SGAS 2025`, `SGSI`, `SST` — las dos últimas sin año
en el nombre).

Reemplazar los libros base por este perdería las vigencias 2022–2024. La instrucción fue explícita:
**no reemplazar, solo actualizar con las fechas de corte que aún no estén registradas.**

## Decisión

- Los libros base de `data/` siguen siendo la base, sin cambios.
- Cada subcarpeta fechada `data/<dd-mm-aaaa>/` es una **actualización**. `limpiar-excel.mjs` las
  aplica después de la base, en orden cronológico.
- Cada hoja de actualización se asigna a un sistema por su **nombre de hoja** (`patronHoja` en
  [`scripts/lib/dominio.mjs`](../../scripts/lib/dominio.mjs)) y a una hoja base por **coincidencia de
  OM** (`PM N°` + texto de la oportunidad). Así se resuelven también las hojas sin año en el nombre.
- Solo se **agregan** los cortes cuya fecha no existe en la hoja base. Nada registrado se modifica,
  no se agregan ni quitan OM.
- Todo lo que contradice lo ya registrado (otra observación u otra calificación en un corte que ya
  existe, OM que no casan, OM ausentes) se **reporta por consola** y no se aplica.
- `normalizarFecha` acepta abreviaturas de mes (`30 SEP 2026`), que aparecían por primera vez en un
  encabezado de corte.

## Alternativas consideradas

- **Reemplazar los libros base por el consolidado.** Descartada: pierde las vigencias 2022–2024 y
  contradice la instrucción.
- **Sobrescribir los cortes existentes con lo del libro nuevo.** Descartada: el libro nuevo es una
  actualización, no una corrección. Las diferencias se reportan para que se revisen a mano.

## Consecuencias

- Para cargar un nuevo seguimiento basta con dejar el libro en `data/<dd-mm-aaaa>/` y ejecutar
  `pnpm datos:importar`.
- Si una actualización corrige un corte ya registrado, el cambio **no** entra solo: hay que corregir
  el libro base o decidir otra regla. La consola lo avisa.
- Una OM nueva en una actualización no entra solo: se avisa como «no coincide».
