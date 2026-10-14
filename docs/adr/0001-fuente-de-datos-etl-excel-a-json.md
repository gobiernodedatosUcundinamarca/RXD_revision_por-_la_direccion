# ADR-0001 — Fuente de datos: ETL de Excel a JSON versionado

**Estado:** Aceptada · 2026-08-13

## Contexto

Los datos del tablero son cinco libros `.xlsx` de seguimiento a Oportunidades de Mejora que la
institución mantiene manualmente en [`data/`](../../data/). Son hojas heterogéneas: número variable
de columnas de seguimiento, encabezados con el nombre del evaluador incrustado, fechas en cuatro
formatos distintos, hojas duplicadas y filas de totales.

La aplicación necesita un modelo estable y tipado, y la [regla de layouts](../../.claude/rules/REGLA_GENERAL_LAYOUTS_APLICACION.md)
junto con CLAUDE.md §6 exigen que la interfaz dependa de una **abstracción** de datos y no de un
origen concreto.

## Decisión

Un **ETL previo al build** convierte los libros en un dataset tipado y versionado en git:

```
data/*.xlsx  --(pnpm datos:importar)-->  src/data/om-rxd.json  -->  src/lib/om/
```

El importador ([`scripts/importar-om-rxd.mjs`](../../scripts/importar-om-rxd.mjs)) **no usa
dependencias externas**: [`scripts/lib/xlsx.mjs`](../../scripts/lib/xlsx.mjs) descomprime el ZIP del
`.xlsx` con `node:zlib` y lee el XML de las hojas.

La interfaz nunca lee el JSON directamente: pasa por `src/lib/om/dataset.ts`, punto de acceso único.

## Alternativas consideradas

- **Leer los `.xlsx` en tiempo de ejecución con una librería (`xlsx`, `exceljs`).** Descartada:
  suma una dependencia pesada al árbol del proyecto —contra la exigencia de mantener `pnpm audit` en
  verde con el mínimo de superficie— y repetiría en cada arranque un trabajo cuyo resultado solo
  cambia cuando llegan libros nuevos.
- **Transcribir los datos a mano a TypeScript.** Descartada: 148 OM y 794 registros de seguimiento
  se desincronizarían con el origen al primer corte nuevo, y el error de transcripción sería
  invisible.
- **Base de datos o API.** Descartada por ahora: no existe backend, y el volumen no lo justifica.
  La capa `src/lib/om/dataset.ts` deja esa puerta abierta sin tocar la interfaz.

## Consecuencias

- Actualizar datos es reemplazar los `.xlsx` y ejecutar `pnpm datos:importar`; el script informa lo
  que leyó y avisa de hojas duplicadas o cortes con fecha ininterpretable.
- El dataset generado se versiona: los cambios entre cortes quedan visibles en el diff.
- El JSON (≈360 KB) viaja al cliente porque las vistas son componentes de cliente. Aceptable a esta
  escala; si crece, el camino es mover la agregación a componentes de servidor.
- Las reglas de normalización (fechas, áreas, hojas duplicadas) viven en un solo archivo auditable,
  documentado en [datos.md](../datos.md).
