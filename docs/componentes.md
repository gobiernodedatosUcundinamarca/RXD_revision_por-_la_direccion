# Catálogo de componentes

Componentes **generales** (reutilizables o transversales). Lo específico de una vista vive en el
`_components/` de esa vista y se promueve aquí solo cuando una segunda vista lo necesita
([regla de scaffolding](../.claude/rules/REGLA_SCAFFOLDING_ORGANIZACION_POR_VISTAS.md) §5).

Cada componente lleva su TSDoc con props y ejemplo de uso; aquí se documenta el **para qué**.

---

## Identidad — `src/components/brand/`

| Componente | Uso |
|---|---|
| `LogoUcundinamarca` | Único punto por el que se inserta el imagotipo institucional. Variante (`horizontal`/`vertical`), tono según fondo y `alt` fijo. Nadie debe usar un `<img>` de logo suelto (regla visual §2). |
| `LogoSistema` | Logotipo del sistema de gestión (`sgc`, `sga`, `sgsst`, `sgsi`, `sgas`), desde `/public/brand/sistemas/<id>.png`. Identificador **secundario**: acompaña al institucional, no lo sustituye. Se usa en la tarjeta de la portada y en el encabezado del layout interno. Estos logotipos llevan el nombre del sistema dentro del arte, así que no se reducen por debajo de ~58 px de alto (regla visual §2.5). |
| `SelloAcreditacion` | Sello de Acreditación Institucional de Alta Calidad, en la esquina superior derecha de todas las vistas y en el pie. Lo recorre un destello metálico **enmascarado con la propia imagen** (`mask-image`), de modo que solo cubre los píxeles opacos del sello. El sello no se altera: el brillo es una capa aparte, decorativa y sin interacción (§2.4). |

## Layout — `src/components/layout/`

| Componente | Uso |
|---|---|
| `Sidebar` | Menú lateral fijo, no colapsable. Registra las cinco vistas; la activa se marca con fondo, barra indicadora y peso tipográfico —no solo color. |
| `ViewHeader` | Encabezado del layout interno: miga de pan, título y corte de seguimiento vigente. |
| `VistaShell` | Envoltura de toda página del layout interno: valida el tema, arma encabezado y lienzo. Exporta `VistaPageProps`. |
| `PieInstitucional` | Pie común a la portada y a la vista consolidada. Declara la procedencia del tablero —elaborado por Gobierno de Datos, fuente Control Interno— y la fecha de la última importación de los libros. |
| `PantallaCarga` | Pantalla de carga: el imagotipo (vertical, monocromático) en el centro con un anillo que gira alrededor. La usan `src/app/loading.tsx` (raíz) y `src/app/temas/[temaId]/loading.tsx` — Next.js la muestra solo mientras se resuelve la ruta, sin invocarla a mano. La de `[temaId]` envuelve únicamente `children`, así que el menú lateral y el encabezado no desaparecen al cambiar de vista (regla layouts §11). Con `prefers-reduced-motion` el anillo queda estático, no oculto. |

## Tablero — `src/components/dashboard/`

| Componente | Uso |
|---|---|
| `DashboardShell` | Impone el orden de lectura de todo tablero: KPIs → filtros → detalle (regla dashboard §5–7). |
| `KPIRow` | Fila de indicadores clave (3 por tablero). La variación se señala con flecha **y** color. Cada `KPI` trae su `formula` (cómo se calculó), que se muestra en el ícono «!» junto a la etiqueta (`AyudaCalculo`). Tipo `KPI` exportado. |
| `AyudaCalculo` (`src/components/ui/`) | Ícono «!» que explica cómo se calcula una cifra. Se abre con hover, foco de teclado o toque y se cierra con Escape, al salir o al desplazar. El texto está siempre enlazado por `aria-describedby`, y el globo usa posición fija para que no lo recorten las tablas con scroll. Los textos salen de `src/lib/om/explicaciones.ts`, la fuente única de cómo se calcula cada cifra. Lo usan los KPI, `ChartCard` (prop `calculo`), los encabezados de tablas, los indicadores y la portada. |
| `FilterBar` | Barra de filtros **controlada**: el estado vive en `FiltrosProvider`. Chips de filtros activos, cada uno removible, y «Limpiar filtros». Cada `FilterConfig` admite `ayuda` (nodo opcional junto a la etiqueta). |
| `InfoDisclosure` | Base genérica de disclosure informativo (`<details>` con «ⓘ + resumen» y panel). No se usa directo en las vistas; lo envuelven `EscalaAvanceInfo` y `ColumnasComparativoInfo`. |
| `EscalaAvanceInfo` | `InfoDisclosure` con la tabla calificación → estado → % de avance. Se engancha como `ayuda` del filtro «Estado» en `useTableroOM`, así que aparece en las 5 vistas del layout interno sin repetirse. |
| `ColumnasComparativoInfo` | `InfoDisclosure` que explica las columnas Cumplidas / Sin cerrar de la tabla comparativa de `/consolidado` y cómo se relacionan (Sin cerrar = total − cumplidas). |
| `EstadoTag` | Distintivo del estado de avance: punto de color, símbolo que crece con el avance y etiqueta **en tinta**. El color viste la marca, nunca el texto. |
| `EstadoVacio` | Estado «Sin datos» cuando un filtro no deja registros (regla dashboard §4). |

## Gráficas — `src/components/charts/`

| Componente | Uso |
|---|---|
| `ChartCard` | **Envoltura obligatoria de toda gráfica.** Título, subtítulo, distintivo «Filtrada» y los estados Cargando / Sin datos / Error (regla dashboard §9, §12). La prop `calculo` añade el ícono «!» que explica cómo se calculan los valores. |
| `EvolucionPorVigencia` | Evolución **por seguimiento**: una línea por vigencia y, en cada corte, solo las OM evaluadas ese día ([ADR-0007](adr/0007-evolucion-por-seguimiento.md)). Cada vigencia se distingue por color, trazo, marcador y su nombre al final de la línea. El tooltip declara evaluadas y cumplidas, y la leyenda filtra por vigencia (atenúa las demás). La alimenta `seriesEvolucion` (`src/features/dashboard/evolucion.ts`). |
| `DonutChart` | Composición por categoría con clic-para-filtrar. El segmento activo se resalta con borde y los demás bajan de opacidad sin desaparecer. |
| `BarrasCategoria` | Barras por categoría con clic-para-filtrar, en orientación vertical u horizontal (esta última para etiquetas largas). |
| `LeyendaInteractiva` | Leyenda que además filtra, **accesible con teclado**. Cubre el hueco de Recharts, cuyos segmentos y barras no son focalizables. |
| `estilos.ts` | Tooltip, ejes, rejilla, opacidad y duración de animación compartidos. Recharts exige estilos en línea; aquí se definen una vez y siempre sobre tokens. También `estiloVigencia`: la vigencia más reciente va en verde institucional y las anteriores en gris oscuro, cada una con su trazo y marcador. |

### Contrato de una gráfica nueva

1. Envolverla en `ChartCard` con título descriptivo y subtítulo que declare variable, periodo o unidad,
   y con `calculo` tomado de `src/lib/om/explicaciones.ts` (si el cálculo es nuevo, se redacta allí).
2. Pasar `estado="vacio"` cuando el filtro no deje datos, y `filtrada` cuando haya selección activa.
3. Tomar los colores de `ESTADOS` (`src/lib/om/avance.ts`) o de los tokens; nunca un HEX suelto.
   Si se introduce una escala nueva, **validarla con el script** de la metodología de visualización
   antes de fusionar (ver [arquitectura §5](arquitectura.md#5-identidad-visual)).
4. Si sus elementos son seleccionables, conectarlos a `alternar(campo, valor)` del tablero y
   acompañarlos de `LeyendaInteractiva` o de un selector equivalente en la barra de filtros.
5. Señalar la selección con **más de un recurso**: color, borde, opacidad, símbolo, `aria-pressed`.
6. El color va en la marca; los valores y etiquetas, en tinta de texto.
7. Rejilla y ejes continuos; etiquetas directas solo en los puntos que cuentan la historia.

## UI — `src/components/ui/`

| Componente | Uso |
|---|---|
| `Icon` | Set institucional de línea (24×24, `stroke=currentColor`). Iconos de sistemas de gestión y de navegación. |

---

## Estado y datos — `src/features/`

| Módulo | Uso |
|---|---|
| `dashboard/FiltrosProvider` | Contexto de filtros compartido por todas las vistas de un tema. Expone `fijar`, `alternar` (para clics en gráficas) y `limpiar`. |
| `dashboard/useTableroOM` | Punto de entrada de datos de las vistas: conjunto filtrado, `omsIgnorando(campo)` para el filtrado cruzado y los controles de filtro derivados de los datos reales. |
| `dashboard/kpis` | Construye los KPIs comunes del tablero sobre el conjunto ya filtrado. |
| `temas/temas` | Registro de temas, derivado del dataset. Añadir un sistema es añadir su libro y su presentación aquí. |
| `temas/TarjetaTema` | Tarjeta de la portada, idéntica para todos los temas. |

## Métricas — `src/lib/om/`

Ver [datos.md §4](datos.md#4-métricas-derivadas). Son funciones puras, sin React: las vistas las
consumen, no las reimplementan.
