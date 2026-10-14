---
paths:
  - ".claude/**"
  - "package.json"
  - "pnpm-workspace.yaml"
  - "docs/adr/**"
---

# Regla de mantenimiento de reglas

## 1. Propósito

Que `.claude/CLAUDE.md` y `.claude/rules/` **describan siempre el proyecto real** y sigan siendo **cortos**: se leen en cada sesión y cada línea cuesta tokens.

## 2. Cambio sustancial (disparador)

Es sustancial cualquier cambio que:

- agregue, elimine o renombre una **vista, ruta o layout**;
- incorpore o cambie una **dependencia, librería o versión mayor** (incluidos pnpm y Next.js);
- cambie la **fuente de datos**, el ETL o una **métrica**;
- modifique la **estructura de carpetas** o la ubicación de un componente general;
- origine un **ADR**;
- repita **la misma decisión o corrección 2+ veces** (convención no escrita);
- **contradiga** algo dicho en una regla o en el CLAUDE.md.

## 3. Qué hacer

Al cerrar un cambio sustancial, en el **mismo cambio**:

1. Revisar las reglas del ámbito tocado (tabla §8 del CLAUDE.md) y el CLAUDE.md.
2. **Actualizar** lo que quedó desactualizado o **proponer una regla nueva** si aparece un ámbito sin cubrir.
3. Editar reglas o CLAUDE.md **pide confirmación** (`permissions.ask`): proponer el texto y explicar por qué.
4. Registrar en `CHANGELOG.md` (*Cambiado*) cuando cambie una regla.

Si no hay nada que actualizar, decirlo en una línea al cerrar.

## 4. Límites de tamaño

| Archivo | Máximo orientativo |
|---|---|
| `.claude/CLAUDE.md` | ~10 KB / 130 líneas |
| Cada regla | ~6 KB / 120 líneas |

Al acercarse al límite se **condensa**: viñetas en vez de prosa, tablas para datos, enlaces en vez de copias.

## 5. Cómo escribir una regla

- Una regla = **un ámbito**; si se solapa con otra, se enlaza.
- Solo lo que **no se deduce del código**: decisiones, prohibiciones, criterios. Valores que viven en el código (tokens, versiones, rutas) se **enlazan**, no se copian.
- Vive en `.claude/rules/`, nombre `REGLA_<AMBITO>.md`, secciones numeradas `## N.`, cierre con **Instrucción para Claude** y/o **Criterios de aceptación**.
- Lleva frontmatter **`paths:`** con los globs de los archivos de su ámbito, para cargarse solo cuando se tocan. Sin `paths` se carga en **cada sesión**: reservarlo para lo imprescindible y breve. En los globs, `[temaId]` es una clase de caracteres: usar `*` (`src/app/temas/*/layout.tsx`).
- Un procedimiento de varios pasos que se repite no es una regla: es una **skill** (`.claude/skills/<nombre>/SKILL.md`).
- Toda regla nueva se agrega a la tabla §8 del CLAUDE.md.

## 6. Numeración estable

El código y los ADR citan secciones (`regla dashboard §12`, `CLAUDE.md §6`). **No renumerar** sin buscar las citas (`git grep "§"`) y actualizarlas en el mismo cambio; preferir agregar secciones al final o subsecciones (`§2.7`).

## 7. Prohibiciones

Reglas que contradigan el código vigente; duplicar contenido entre reglas o con `docs/`; dejar ejemplos obsoletos (rutas, vistas o archivos que ya no existen); crecer sin condensar.

## 8. Criterios de aceptación

Ninguna regla describe algo que ya no existe · cada ámbito tiene un único dueño · tamaños dentro de §4 · citas `§N` válidas.
