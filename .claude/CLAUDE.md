# CLAUDE.md

> **Idioma:** español en respuestas, documentación y nombres (identificadores de código en inglés técnico cuando aporte claridad).
> Este archivo se carga en cada sesión: **solo lo esencial**. El detalle vive en [`reglas/`](reglas/) y [`../docs/`](../docs/) — leer la regla que corresponda antes de tocar su ámbito (§8).

## 1. Qué es

Frontend web (Next.js) de la **Universidad de Cundinamarca** para el seguimiento a las **Oportunidades de Mejora (OM)** de la **Revisión por la Dirección (RXD)**. Cada **tema** es un sistema de gestión (SGC, SGA, SG-SST, SGSI, SGAS).

- Una OM tiene **vigencia** (año del ciclo de RXD), responsable, entregable y fecha de entrega.
- Acumula **seguimientos**: observación + **calificación** en una **fecha de corte**. Escala **0 · 0.5 · 1 · 1.5 · 2** (2 = cumplida); avance = `calificación / 2 × 100`.
- **Estado vigente** = última calificación; las anteriores son historial.
- Fuente de verdad: libros de [`data/`](../data/) → `pnpm datos:importar` → `src/data/om-rxd.json`. Modelo y métricas: [`docs/datos.md`](../docs/datos.md).

Dos layouts ([regla de layouts](reglas/REGLA_GENERAL_LAYOUTS_APLICACION.md)): **portada** `/temas` y **layout interno** `/temas/:temaId/:vista`. Además, `/consolidado` (comparación **entre** sistemas, ruta de primer nivel).

## 2. Stack y seguridad

Next.js (App Router) · React · TypeScript `strict` · Tailwind + tokens institucionales · Recharts · Playwright · Node LTS. Versiones exactas: [`package.json`](../package.json).

- **Regla dura: pnpm, Next.js (framework) y React siempre en su última versión estable y con soporte de seguridad**; lo mismo para el resto de dependencias. Antes de fijar o subir versiones: `pnpm outdated` y `pnpm audit`, revisando breaking changes. No fusionar con vulnerabilidades altas/críticas (CI lo verifica).
- Sin secretos en el cliente (nada de `NEXT_PUBLIC_` salvo dato público). Cabeceras de seguridad en `next.config.ts`; validar entrada en toda frontera. Preferir Server Components.

## 3. Gestor de paquetes: SOLO pnpm

Prohibidos `npm`, `yarn` y `npx` (bloqueados en [`settings.json`](settings.json); única excepción: el guard `preinstall: npx only-allow pnpm`). Único lockfile: `pnpm-lock.yaml`. pnpm en su **última versión estable** (fijada en `packageManager`; actualizar con `corepack use pnpm@latest`). `packageManager`/`engines` en `package.json`, `engine-strict=true` en `.npmrc`, `corepack enable`.

## 4. Comandos

```bash
pnpm install | dev | build | start | lint | typecheck | audit | outdated
pnpm test                 # Playwright (e2e/) — un test: pnpm test <ruta> o -g "<nombre>"
pnpm datos:importar       # data/*.xlsx → src/data/om-rxd.json
```

## 5. Arquitectura

### 5.1 Rutas (App Router)

```
src/app/
├── layout.tsx            # raíz: Montserrat, tokens, providers
├── consolidado/          # /consolidado — entre sistemas
└── temas/
    ├── page.tsx          # portada
    └── [temaId]/
        ├── layout.tsx    # Sidebar fijo + encabezado + FiltrosProvider
        └── resumen/ · indicadores/ · responsables/ · datos/ · seguimiento/
```

- **Una carpeta física por vista**; prohibido `[vista]` dinámico. El tema viaja por la **ruta**.
- `reportes/` fue reemplazada por `responsables/` ([ADR-0003](../docs/adr/0003-vista-responsables.md)).

### 5.2 Carpetas y colocación

`components/{ui,brand,layout,dashboard,charts}` (general) · `features/{temas,dashboard}` · `lib/om/` (datos y métricas) · `types/` · `scripts/` (ETL).

- **Específico de una vista → `_components/` de esa vista. Usado en 2+ vistas → se *mueve* a `components/`** (nunca se copia). Detalle: [regla de scaffolding](reglas/REGLA_SCAFFOLDING_ORGANIZACION_POR_VISTAS.md).
- **Capa de datos:** la UI depende de `src/lib/om/` y `useTableroOM`, nunca del JSON ni de un `fetch`. Cambiar la fuente solo toca `src/lib/om/dataset.ts` ([ADR-0001](../docs/adr/0001-fuente-de-datos-etl-excel-a-json.md)).

### 5.3 Gráficas

**Antes de crear o modificar una gráfica, leer completa la [regla de dashboard](reglas/regla_diseno_dashboard.md).**

- Toda gráfica va dentro de **`ChartCard`** (título, ejes/tooltip, leyenda, responsive, estados Cargando/Sin datos/Error/Filtrada/Seleccionada, filtro).
- Filtros en `features/dashboard/FiltrosProvider` (montado en el layout del tema): la selección sincroniza todo y persiste entre vistas.
- Recharts no es focalizable: acompañar con `LeyendaInteractiva` (`aria-pressed`) o el selector de la barra de filtros.
- Una gráfica no se filtra a sí misma: `omsIgnorando(campo)`.
- Escala de estados (color + símbolo) **solo** en `src/lib/om/avance.ts`. Selección nunca solo por color.

Catálogo: [`docs/componentes.md`](../docs/componentes.md).

## 6. DRY + SOLID (requisito de aceptación)

- **DRY:** una fuente de verdad para color, tipografía y logo (tokens en `src/app/globals.css`); **cero HEX sueltos** si existe token. Componentes reutilizables para lo repetible.
- **S:** presentación separada de la obtención de datos. **O:** temas y vistas se agregan por **registro** (`features/temas/temas.ts`) sin tocar la arquitectura. **L:** gráficas intercambiables vía `ChartProps`. **I:** props pequeñas y enfocadas. **D:** la UI depende de abstracciones (`lib/om`, hooks), no de un origen concreto.

## 7. Identidad visual

Reglas completas y mapeo de recursos (`.claude/lmagenes/`, `imagenes/` → `public/brand/`): [regla visual](reglas/REGLAS_VISUALES_UCUNDINAMARCA.md). Lo imprescindible:

- Logo **solo** con `LogoUcundinamarca`; logos de sistema **solo** con `LogoSistema` (≥ 58 px de alto). Nunca `<img>` suelto.
- Identificador principal: **imagotipo horizontal**; el **escudo** no es logo operativo (solo favicon/simbólico).
- Predominio `--uc-green` / `--uc-green-dark`; amarillo/oro para énfasis; máx. 1 principal + 2 complementarios por vista; solo los 4 degradados oficiales.
- Tipografía **Montserrat** (`next/font/google`); **prohibido Inter** como principal.

## 8. Reglas — cuándo leer cada una

| Regla | Leer antes de… |
|---|---|
| [Visual](reglas/REGLAS_VISUALES_UCUNDINAMARCA.md) | tocar color, logo, tipografía o `public/brand/` |
| [Dashboard](reglas/regla_diseno_dashboard.md) | crear/modificar gráficas, KPIs o filtros |
| [Layouts](reglas/REGLA_GENERAL_LAYOUTS_APLICACION.md) | tocar portada, Sidebar, encabezado o navegación |
| [Scaffolding](reglas/REGLA_SCAFFOLDING_ORGANIZACION_POR_VISTAS.md) | crear vistas o decidir dónde vive un componente |
| [Documentación](reglas/REGLA_DOCUMENTACION_Y_ACTUALIZACION.md) | cerrar cualquier cambio (docs en el mismo cambio) |
| [Control de versiones](reglas/REGLA_CONTROL_DE_VERSIONES.md) | `git commit`, `push` o cualquier operación sobre el historial |
| [Mantenimiento de reglas](reglas/REGLA_MANTENIMIENTO_DE_REGLAS.md) | cerrar un **cambio sustancial** (ver abajo) |

**Cambio sustancial** (nueva vista/ruta, dependencia o librería, fuente de datos, estructura de carpetas, ADR, convención repetida o algo que contradiga una regla): al terminar, **revisar si alguna regla o este archivo quedó desactualizado y proponer la actualización o una regla nueva**. Las secciones `§N` se citan desde el código: no renumerar sin actualizar las citas.

## 9. Checklist de cierre

- [ ] Dos layouts respetados; menú lateral no duplicado.
- [ ] Tokens institucionales, Montserrat, logos vía componente.
- [ ] Gráficas cumplen dashboard §12; selección con más de un recurso (no solo color).
- [ ] Responsive escritorio/tableta/móvil, sin hamburguesa en escritorio.
- [ ] Colocación correcta (`_components/` vs `components/`), nada duplicado.
- [ ] Documentación (y ADR/CHANGELOG si aplica) en el mismo cambio; reglas al día si fue sustancial.
- [ ] `pnpm lint`, `pnpm typecheck` y `pnpm audit` en verde.
