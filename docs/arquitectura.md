# Arquitectura

Visión general de capas y flujo de datos. El detalle del origen y las métricas está en
[datos.md](datos.md); el catálogo de componentes, en [componentes.md](componentes.md).

> **Diagrama interactivo:** [`arquitectura-visual.html`](arquitectura-visual.html) — mapa de
> componentes, límites (ETL fuera del build · aplicación Next.js · cabeceras/CSP) y flujo, con
> temas claro/oscuro, foco y exportación. Fuente versionada:
> [`arquitectura-visual.json`](arquitectura-visual.json); se regenera con
> `archify deliver architecture docs/arquitectura-visual.json docs/arquitectura-visual.html`.

---

## 1. Flujo de datos

```
data/*.xlsx                    Libros de seguimiento (fuente de verdad)
      │  pnpm datos:importar   ETL sin dependencias (scripts/)
      ▼
src/data/om-rxd.json           Dataset tipado y versionado
      ▼
src/lib/om/                    Capa de acceso a datos + métricas puras
      │  dataset.ts    · punto de acceso único
      │  avance.ts     · escala 0–2, estados, formato
      │  metricas.ts   · agregaciones (series, distribuciones, resúmenes)
      │  filtros.ts    · modelo de filtros y su aplicación
      ▼
src/features/dashboard/        Estado del tablero (React)
      │  FiltrosProvider · contexto de filtros compartido
      │  useTableroOM    · datos + filtros + controles para las vistas
      │  kpis.ts         · indicadores clave comunes
      ▼
src/app/temas/[temaId]/<vista> Vistas (presentación)
```

La regla que sostiene el diseño es la **inversión de dependencias** (CLAUDE.md §6): las vistas
dependen de `useTableroOM` y de `src/lib/om/`, nunca del JSON ni de un `fetch`. Cambiar el origen a
una API, a Power BI o a una base de datos solo exige reescribir `src/lib/om/dataset.ts`.

---

## 2. Rutas y layouts

Los dos layouts de la [regla de layouts](../.claude/reglas/REGLA_GENERAL_LAYOUTS_APLICACION.md) se
implementan con layouts anidados del App Router:

```
src/app/
├── layout.tsx                     Raíz: Montserrat, tokens, metadatos
├── page.tsx                       Redirige a /temas
├── consolidado/                   Comparación entre TODOS los sistemas
│   ├── page.tsx
│   ├── _lib/comparativo.ts        Métricas cuya dimensión es el sistema
│   └── _components/
└── temas/
    ├── page.tsx                   Layout 1 — Portada de sistemas de gestión
    └── [temaId]/
        ├── layout.tsx             Layout 2 — Sidebar + FiltrosProvider
        ├── page.tsx               Redirige a /resumen
        ├── resumen/               Panorama: evolución, composición, rezago
        ├── indicadores/           Indicadores de gestión vs. referencias
        ├── responsables/          Desempeño por área institucional
        ├── datos/                 Tabla auditable de todas las OM
        └── seguimiento/           Cronología de cortes e historial por OM
```

**Por qué `/consolidado` es una ruta de primer nivel y no una sexta vista.** El layout interno está
construido para trabajar *dentro* de un sistema: su menú lateral y su contexto de filtros están
ligados a un `temaId`. La vista consolidada compara **entre** sistemas, así que su dimensión de
análisis es el propio sistema y no cabe bajo `[temaId]`. Conserva la cabecera institucional de la
portada, tiene su propio filtro de vigencia y se alcanza desde la portada y desde el menú lateral de
cualquier tablero.

Cada vista es una **carpeta física independiente** con su `page.tsx` y su `_components/`, según la
[regla de scaffolding](../.claude/reglas/REGLA_SCAFFOLDING_ORGANIZACION_POR_VISTAS.md) §4. No existe
un parámetro dinámico `[vista]` que resuelva varias vistas con condicionales.

`VistaShell` envuelve toda página del layout interno: valida el tema, arma el encabezado con el
corte vigente y el lienzo. `DashboardShell` impone el orden de lectura de todo tablero: KPIs →
filtros → detalle (regla dashboard §5–7).

---

## 3. Estado de filtros

`FiltrosProvider` se monta en `app/temas/[temaId]/layout.tsx`, **por encima de las vistas**. De ahí
se derivan tres propiedades exigidas por la regla de dashboard §3–4:

1. Una selección hecha en una gráfica actualiza KPIs, gráficas y tablas de la vista.
2. La selección **se conserva al navegar** entre vistas del mismo tema.
3. Los controles de la barra de filtros y los clics sobre las gráficas escriben en **el mismo
   estado**, de modo que no se generan filtros duplicados.

El modelo tiene tres dimensiones: `vigencia`, `estado` y `area`.

### Filtrado cruzado

Una gráfica que filtra por una dimensión **no se filtra a sí misma por ella**: si lo hiciera
quedaría reducida a la categoría elegida y perdería el contexto sobre el que se hizo la selección.
`useTableroOM` expone `omsIgnorando(campo)` para eso: el donut de estados lo usa con `"estado"`, las
barras de vigencia con `"vigencia"` y las de área con `"area"`.

---

## 4. Gráficas

Toda gráfica se envuelve en `ChartCard`, que centraliza el contrato de la regla de dashboard §12:
título, subtítulo, distintivo de «Filtrada» y los estados **Cargando / Sin datos / Error**. Los
componentes de gráfica solo pintan (SOLID «S»).

Los segmentos y barras de Recharts no son focalizables con teclado. `LeyendaInteractiva` cubre ese
hueco: ofrece el mismo filtro como botones accesibles, con `aria-pressed`, color, símbolo y marca de
verificación —nunca solo color (regla dashboard §8–9, §11). Cuando una gráfica tiene demasiadas
categorías para una leyenda útil, la vía por teclado es el selector equivalente de la barra de
filtros.

---

## 5. Identidad visual

Los tokens institucionales viven en `src/app/globals.css` y son la única fuente de color y
tipografía (regla visual §1.7). La escala de estados de avance se define **una sola vez** en
`src/lib/om/avance.ts` (`ESTADOS`), con color y símbolo por estado, de modo que una categoría tiene
el mismo color en todas las gráficas del tablero (regla dashboard §10).

El avance es una **magnitud ordenada**, no una identidad, así que su escala es una **rampa
secuencial de un solo tono** derivada del verde institucional, con luminosidad monótona de claro a
oscuro. Una paleta categórica aquí sería incorrecta —y de hecho la primera versión medía ΔE 5.8
entre dos de sus verdes, indistinguibles incluso con visión de color completa
([ADR-0004](adr/0004-rampa-ordinal-de-avance.md)):

| Calificación | Estado | Token |
|---:|---|---|
| 0 | Sin avance | `--uc-avance-0` |
| 0.5 | Avance mínimo | `--uc-avance-1` |
| 1 | Avance parcial | `--uc-avance-2` |
| 1.5 | Avance significativo | `--uc-avance-3` *(= `--uc-green`)* |
| 2 | Cumplida | `--uc-avance-4` *(= `--uc-green-dark`)* |

`--uc-avance-nd` (neutro, fuera de la rampa) ya no marca un estado de OM: queda solo para la
observación de un corte puntual sin calificación numérica (`colorClasificacion`/`simboloClasificacion`
en [Datos](../src/app/temas/[temaId]/datos) y [Seguimiento](../src/app/temas/[temaId]/seguimiento)).
Una OM sin ninguna calificación cuenta como **Sin avance** (ver [datos.md §4](datos.md#estado-vigente-de-una-om)).

Reglas que se derivan de esa elección y que toda gráfica nueva debe respetar:

- **El color viste la marca, nunca el texto.** Los pasos claros no alcanzan contraste de texto
  legible; el distintivo de estado (`EstadoTag`) lleva punto de color, símbolo y etiqueta en tinta.
- **El símbolo crece con el avance** (`○ ◔ ◑ ◕ ●`): la categoría se distingue sin depender del color.
- **Rejillas y ejes son continuos**; el trazo discontinuo se reserva a las líneas de referencia,
  donde sí significa un umbral.
- **Etiquetas directas selectivas**: se rotulan los extremos y el máximo de una serie, no cada punto.
- **Barras de una sola serie llevan un solo tono**; la magnitud la da su longitud, no el color.

Al modificar la escala hay que **re-validarla con el script de la metodología de visualización**
(modo `--ordinal`) antes de fusionar: monotonía de L, ΔL ≥ 0.06, contraste del extremo claro y tono
único.

---

## 6. Decisiones registradas

- [ADR-0001](adr/0001-fuente-de-datos-etl-excel-a-json.md) — ETL de Excel a JSON versionado
- [ADR-0002](adr/0002-temas-como-sistemas-de-gestion.md) — Los temas son los sistemas de gestión
- [ADR-0003](adr/0003-vista-responsables.md) — Vista Responsables en lugar de Reportes
- [ADR-0004](adr/0004-rampa-ordinal-de-avance.md) — Rampa ordinal de un solo tono para el avance
