# Regla de documentación y su actualización

## 1. Propósito

La documentación es parte del entregable: **un cambio sin su documentación actualizada está incompleto** y no se fusiona.

## 2. Principios (docs-as-code)

En el repo, en Markdown y español; se actualiza **en el mismo cambio**; **una fuente de verdad por tema: enlazar, no duplicar**; comandos siempre con **pnpm**; breve y orientada a la acción.

## 3. Qué documentar y dónde

| Documento | Contenido |
|---|---|
| `README.md` | Qué es, requisitos, arranque con pnpm, scripts, enlaces. Público. |
| `.claude/CLAUDE.md` | Guía maestra **mínima** para Claude (se carga en cada sesión). |
| `.claude/reglas/` | Reglas de diseño, organización y proceso. |
| `docs/arquitectura.md` · `docs/datos.md` · `docs/componentes.md` | Capas y flujo · modelo y métricas · catálogo de componentes. |
| `docs/adr/NNNN-*.md` | Decisiones técnicas (inmutables). |
| `CHANGELOG.md` | Historial (Keep a Changelog + SemVer). |
| TSDoc en el código | Componentes, hooks, utilidades y tipos exportados. |

## 4. Estructura de `docs/`

La de la tabla anterior; un documento nuevo se agrega solo si no encaja en uno existente, y se enlaza desde el README.

## 5. README

Descripción, stack, requisitos (Node LTS, Corepack, pnpm), arranque solo con pnpm, scripts, estructura resumida y enlaces a `docs/`, `.claude/reglas/` y `.claude/CLAUDE.md`. No duplica el CLAUDE.md.

## 6. Código

TSDoc en todo lo exportado (props con propósito; ejemplo de uso en los reutilizables). Los comentarios explican el **porqué**. Documentar contratos estables, no detalles volátiles.

## 7. ADR

Uno por decisión arquitectónica, numerado. Formato: **Contexto → Decisión → Alternativas → Consecuencias → Estado** (`Aceptada` / `Reemplazada por ADR-XXXX`). Nunca se borran ni reescriben.

## 8. CHANGELOG

Keep a Changelog + SemVer. Categorías: Añadido, Cambiado, Corregido, Eliminado, Seguridad (+ Datos en este proyecto). Dependencias y parches de seguridad → *Seguridad*.

## 9. Disparadores

| Cambio | Actualizar |
|---|---|
| Componente, ruta, layout o vista | `docs/` + TSDoc |
| Stack, versiones o comandos | README + CLAUDE.md |
| Datos, ETL o métricas | `docs/datos.md` |
| Tokens, logo o tipografía | regla visual §2.7 / §1.8 |
| Decisión arquitectónica | ADR nuevo |
| Seguridad o dependencias | CHANGELOG (*Seguridad*) |
| Cambio sustancial | [regla de mantenimiento de reglas](REGLA_MANTENIMIENTO_DE_REGLAS.md) |

## 10. CLAUDE.md

Refleja la estructura, stack y reglas vigentes, pero **solo lo imprescindible**: el detalle se enlaza. Toda regla nueva se registra en su tabla §8.

## 11. Estilo

Encabezados jerárquicos, tablas para datos tabulares, bloques de código con lenguaje, **enlaces relativos**, diagramas en código (mermaid/ASCII) antes que capturas.

## 12. Prohibiciones

Docs desactualizadas o duplicadas; otro idioma (salvo identificadores); npm/yarn en ejemplos; borrar ADR o CHANGELOG; secretos o datos sensibles.

## 13. Instrucción para Claude

Al cerrar un cambio: actualizar docs afectadas, ADR si hubo decisión, CHANGELOG si aplica, verificar enlaces y, si fue sustancial, revisar las reglas.

## 14. Criterios de aceptación

Código con su documentación al día · README arranca solo con pnpm · CLAUDE.md vigente y breve · decisiones con ADR · sin duplicados · enlaces válidos.
