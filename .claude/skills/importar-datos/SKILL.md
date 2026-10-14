---
name: importar-datos
description: Incorpora un libro nuevo de seguimiento de OM de la RXD (data/<dd-mm-aaaa>/*.xlsx) al dataset del tablero, verifica que solo entren cortes nuevos, mide el alcance y actualiza docs y CHANGELOG. Usar cuando llegue un Excel nuevo de seguimiento, cuando se pida "actualizar/importar los datos" o tras corregir reglas de cortes en scripts/lib/dominio.mjs.
argument-hint: "[carpeta data/<dd-mm-aaaa>]"
---

# Importar datos de seguimiento

Contexto obligatorio: [ADR-0006](../../../docs/adr/0006-actualizaciones-incrementales-de-datos.md) y [`docs/datos.md`](../../../docs/datos.md) §1–2. Una actualización **solo agrega cortes nuevos**; nada registrado cambia sin una regla explícita.

## 1. Ubicar el libro

- Va en `data/<dd-mm-aaaa>/` (fecha de **recepción**). Nunca reemplazar ni editar los libros base de `data/` ni el Excel recibido.
- `data/consolidado/` es derivado: no es fuente.

## 2. Guardar el "antes"

```bash
git show HEAD:src/data/om-rxd.json > "<scratchpad>/om-rxd.antes.json"
```

## 3. Ejecutar el ETL

```bash
pnpm datos:importar
```

Leer **todos** los avisos `!`: diferencias no aplicadas, OM que no coinciden, OM ausentes, cortes descartados o corregidos.

## 4. Revisar las fechas de corte

Señales de un rótulo mal puesto: fecha futura respecto a la recepción, fuera de orden cronológico, o dos columnas con la misma fecha en una vigencia. Si hay una:

- Proponer una regla en `CORTES_DESCARTADOS` o `CORTES_CORREGIDOS` ([`scripts/lib/dominio.mjs`](../../../scripts/lib/dominio.mjs)), **acotada por ocurrencia, origen (base/actualización) y vigencia**, para no tocar otras vigencias.
- Confirmarla con la persona antes de aplicarla y volver al paso 3.

## 5. Medir el alcance

```bash
node .claude/skills/importar-datos/comparar-dataset.mjs "<scratchpad>/om-rxd.antes.json" src/data/om-rxd.json
```

- Debe terminar en `✓ Lo ya registrado queda idéntico`. Si sale `⚠`, cada caso necesita una regla explícita y una justificación.
- Contrastar el avance por sistema y vigencia con la fila de promedios del libro cuando exista.

## 6. Documentar en el mismo cambio

- `docs/datos.md` §1: fila en la tabla de actualizaciones (carpeta, libro, aporte) y, si hubo reglas de cortes, la fila de §2.
- `CHANGELOG.md`, sección **Datos**: cortes nuevos por sistema, registros antes → después y diferencias **no aplicadas** (con OM y corte).
- Si los datos cambiaron, avisar que `data/consolidado/OM_RXD_consolidado.xlsx` queda desactualizado y ofrecer regenerarlo (no hay script versionado).

## 7. Verificar y proponer el commit

```bash
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

Mensaje en español, del tipo `datos: corte del <fecha> desde <libro>`, con el **alcance medido** del paso 5 y las diferencias no aplicadas. Commit y push solo con confirmación ([control de versiones](../../rules/REGLA_CONTROL_DE_VERSIONES.md)).
