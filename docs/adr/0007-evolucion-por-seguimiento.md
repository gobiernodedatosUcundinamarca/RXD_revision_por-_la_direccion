# ADR-0007 — Evolución por seguimiento y por vigencia

**Estado:** Aceptada · 2026-10-13 · Reemplaza la «lectura acumulada» de las gráficas de evolución
descrita antes en [datos.md](../datos.md)

## Contexto

Las gráficas de evolución mostraban una sola línea con la **lectura acumulada**: en cada corte, cada
OM aportaba su última calificación conocida, aunque no se hubiera evaluado ese día.

Al cargar el corte del 30-sep-2026, SGSI no cuadraba con el libro. En ese corte solo se evaluaron
**4** OM (vigencia 2025, 87,5 %), pero la web lo calculaba sobre **14**, porque arrastraba las 10 de
2023 y 2024 con su calificación de junio. El libro, en cambio, promedia en cada hoja (vigencia) solo
lo evaluado en cada corte.

Desde el equipo responsable de los datos se pidió evaluar **por cada seguimiento**: en cada corte,
solo las tareas evaluadas en él.

## Decisión

- Las gráficas de evolución usan `seriesPorSeguimiento` (`src/lib/om/metricas.ts`): **una línea
  por vigencia** y, en cada corte, el promedio y la tasa de cierre de **solo las OM evaluadas** ese
  día. Cada línea equivale a la fila de promedios de su hoja en el libro.
- Cada punto declara cuántas OM se evaluaron y cuántas quedaron cumplidas.
- Los hitos de la vista Seguimiento cuentan solo lo evaluado en el corte. Su variación compara esas
  mismas OM con su calificación anterior.
- La lectura acumulada (`serieAvancePorCorte`) se conserva **solo** para la variación de los KPI y
  del consolidado. Esos indicadores miden el estado vigente de cada OM, así que su variación debe
  comparar el estado vigente de las mismas OM.
- Nuevo componente `EvolucionPorVigencia`, que sustituye a `TrendLineChart` (eliminado, sin otros
  usos). La vigencia más reciente va en verde institucional y las anteriores en gris oscuro, cada
  una con su trazo y marcador: un solo color principal (regla visual §1) y nunca solo color para
  distinguir (regla dashboard §10–11). Su leyenda filtra por vigencia.

## Alternativas consideradas

- **Una sola línea con solo las OM evaluadas en cada corte.** Descartada: el grupo evaluado cambia
  de un corte a otro (SGSI: 10 → 7 → 3 → 10 → 14 → 14 → 4), y la línea subiría y bajaría por quién
  se evaluó, no por avance real.
- **Mantener la lectura acumulada.** Descartada: no coincide con el libro y hace pasar el arrastre
  por seguimiento.

## Consecuencias

- La web coincide con la fila de promedios de cada hoja del libro.
- Las gráficas de evolución tienen varias líneas cuando el sistema tiene varias vigencias. La
  leyenda permite aislar una.
- El valor de los KPI no cambia. Su variación sigue midiendo el cambio del estado vigente.
