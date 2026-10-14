# Regla de control de versiones

## 1. Propósito

> **Nada sale del equipo sin que la persona responsable lo autorice.** Publicar es difícilmente reversible.

## 2. Confirmación obligatoria

**Siempre** se pide confirmación antes de cualquier comando que modifique el historial o el remoto; una aprobación anterior no vale para la siguiente. Mecanizado en `permissions.ask` de [`settings.json`](../settings.json): `git push/commit/remote/merge/rebase/reset/revert/cherry-pick/tag/rm/clean/restore/checkout/switch/stash/filter-branch` y `gh pr/repo/release`.

Sin confirmación (solo lectura): `git status/log/diff/show/fetch`, `git branch -vv`, `git remote -v`.

**Prohibido:** `push --force` (o `--force-with-lease`) sobre `main` sin autorización explícita para esa operación; reescribir historial publicado; commitear o publicar como efecto secundario de otra tarea.

## 3. Antes de publicar

En verde: `pnpm typecheck && pnpm lint && pnpm build && pnpm test && pnpm audit`. Si algo falla o un dato está incompleto, **se dice** en lugar de publicar.

## 4. Commits

- **Temáticos**: uno resuelve una cosa; un cambio grande se reparte.
- **En español**, imperativo, explicando el **porqué** (el diff ya dice el qué).
- Una corrección incluye su **alcance medido** (registros, porcentaje).
- **Autoría única** del responsable: sin `Co-Authored-By` ni menciones a herramientas (`attribution` vacío en `settings.json`).

## 5. Qué se versiona

**Sí:** código, documentación, `data/` (fuente de verdad) y `src/data/om-rxd.json`. **No:** `data-limpio/`, `test-results/`, `playwright-report/`, dependencias, `~$*.xlsx`. Ante datos personales o sensibles, **preguntar antes**.

## 6. Remoto

Un único `origin`; cambiar su URL requiere confirmación. Si se renombra el repo en GitHub, actualizar el remoto local.

## 7. Criterios de aceptación

Ninguna publicación sin confirmación inmediata · `permissions.ask` cubre §2 · historial legible por propósito · lo publicado está verificado o sus límites declarados.
