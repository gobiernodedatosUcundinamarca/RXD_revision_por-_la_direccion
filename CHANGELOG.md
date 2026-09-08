# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado según
[SemVer](https://semver.org/lang/es/).

## [Sin publicar] — 2026-09-08

### Seguridad

- **Cabeceras de seguridad y CSP en `next.config.ts`** (`headers()` para `/:path*`):
  `Content-Security-Policy` acotada a `'self'` (la app no carga terceros ni hace `fetch` en
  runtime), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (desactiva cámara,
  micrófono, geolocalización y topics) y `Strict-Transport-Security`. Además
  `poweredByHeader: false`. La CSP mantiene `'unsafe-inline'` en `script-src` porque lo exige el
  payload RSC de Next; `'unsafe-eval'` y `ws:` solo se añaden en desarrollo (HMR). Justificación y
  alternativas en [ADR-0005](docs/adr/0005-cabeceras-de-seguridad-y-cadena-de-suministro.md).
- **Guarda de gestor de paquetes** (`preinstall: "npx only-allow pnpm"` en `package.json`,
  CLAUDE.md §3): un `npm install` o `yarn install` accidental ahora aborta con mensaje claro.
- **CI de verificación** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): en cada push/PR
  a `main` corre `pnpm audit --audit-level high`, `pnpm lint`, `pnpm typecheck` y `pnpm build` con
  `--frozen-lockfile`. Nuevo script `pnpm audit` como atajo local.

### Corregido

- **"Integrado" se queda solo en las menciones plurales/colectivas** ("sistemas integrados de
  gestión de la Universidad", "Todos los sistemas integrados de gestión"), no en el nombre propio de
  cada sistema individual. Revierte el nombre de SGC/SGA/SGAS a "Sistema de Gestión de..." (sin
  "Integrado") en `scripts/lib/dominio.mjs`, `Siglas.tsx` y donde ese nombre individual aparecía
  singular (título de la gráfica comparativa por sistema, su eje, y la nota al pie de Indicadores
  "cada sistema de gestión"). Dataset regenerado (mismos conteos).

- **`BarrasCategoria` (eje de categorías horizontal): las etiquetas largas ya no pierden nombres
  enteros.** El recorte a una sola línea (con «…») que arreglaba el solape de etiquetas cortaba, en
  responsables compuestos por varios nombres, uno o más nombres completos sin dejarlo evidente —
  solo aparecían al pasar el cursor. Ahora la etiqueta se reparte en hasta 4 líneas
  (`envolverEtiqueta`); cada fila de la gráfica crece al alto que exige su etiqueta más larga. Solo
  se recorta con «…» el puñado de redacciones que ni así caben (una, de 153 caracteres, sigue
  truncada — el texto íntegro está en la tabla debajo de la gráfica).

### Añadido

- **Diagrama de arquitectura interactivo** ([`docs/arquitectura-visual.html`](docs/arquitectura-visual.html),
  fuente versionada [`docs/arquitectura-visual.json`](docs/arquitectura-visual.json)): mapa de
  componentes y flujo — libros `.xlsx` → ETL → `om-rxd.json` → `lib/om/` → estado del tablero →
  componentes → App Router → navegador — con los límites «fuera del build», «aplicación Next.js» y
  «cabeceras + CSP». HTML autónomo con temas claro/oscuro, foco y exportación; generado con archify.
  Enlazado desde [`docs/arquitectura.md`](docs/arquitectura.md).

- **Estandarización de redacciones del campo `Responsable`** (`estandarizarResponsables`, nueva en
  `scripts/lib/dominio.mjs`, corre al final de `importar-om-rxd.mjs`). El texto libre tenía
  redacciones que solo diferían en mayúsculas, tildes o puntuación de cierre («SGA» / «SGA.» /
  «SGA-», «DIRECCIÓN DE SISTEMAS Y TECNOLOGÍA» vs «Dirección de Sistemas y Tecnología») — no
  responsables distintos, la misma redacción mal formateada. Se agrupan por una clave que ignora
  esas diferencias y se reescriben con la variante más «correctamente redactada» del grupo. No toca
  redacciones con palabras distintas (compuestos con integrantes distintos siguen siendo texto
  libre real). Dataset: 96 → **92 redacciones distintas** (7 registros reescritos). Documentado en
  [`docs/datos.md`](docs/datos.md#estandarización-de-redacciones-equivalentes).

- **Disclosure para las columnas del comparativo (`ColumnasComparativoInfo`)**: explica qué cuenta
  cada una de Cumplidas / Sin cerrar / Atención en la tabla de `/consolidado`, y que Atención es un
  subconjunto de Sin cerrar (lo que está en cero, no solo lo que va lento). `EscalaAvanceInfo` se
  refactorizó para compartir la base con un nuevo componente genérico `InfoDisclosure` (DRY).
- **Pantalla de carga institucional (`PantallaCarga`)**: el imagotipo vertical en el centro con un
  anillo giratorio alrededor. Se conecta a través de `src/app/loading.tsx` (raíz) y
  `src/app/temas/[temaId]/loading.tsx`, así que Next.js la muestra automáticamente en las
  transiciones de ruta sin invocarla a mano. La de `[temaId]` solo envuelve `children`: el menú
  lateral y el encabezado no parpadean al cambiar de vista. Respeta `prefers-reduced-motion`
  (el anillo queda como un arco estático, no oculto).

### Cambiado

- **«Sin seguimiento» se fusionó con «Sin avance».** Decisión de negocio: una OM que nunca fue
  calificada ahora cuenta como **Sin avance** (0 %) en todo el tablero — estado, filtro, leyenda,
  KPIs, indicadores y gráficas — en vez de un estado aparte. Afecta el cálculo, no solo la
  visualización: el **Avance promedio** ahora incluye a todas las OM (antes excluía las nunca
  calificadas). El campo `EstadoAvance` pierde el valor `"sin-seguimiento"`; `avanceDeOM` y
  `clasificacionFinal` ya no devuelven `null` — ver [`src/lib/om/avance.ts`](src/lib/om/avance.ts)
  y la actualización en [ADR-0004](docs/adr/0004-rampa-ordinal-de-avance.md). El concepto de
  «observación de un corte sin calificar» (por seguimiento individual, no por OM) no cambia — sigue
  visible en Datos/Seguimiento con su propia marca «Sin calificar».
  - Vista Indicadores: el indicador «Oportunidades sin ningún seguimiento» se fusionó dentro de
    «Oportunidades sin avance registrado».

### Quitado

- **KPI «Requieren atención»** de la cabecera de todos los tableros (`construirKPIs` y la vista
  `/consolidado`): quedan 3 indicadores en vez de 4.
- **Columna «Lectura» de la vista Indicadores** (el semáforo ✓/!/✕ En referencia / Atención / Fuera
  de referencia). Se quita también el cálculo que la alimentaba (`evaluarPorcentaje`,
  `evaluarConteo`, el tipo `EstadoIndicador` y el campo `estado` de `Indicador`) y la clase CSS
  `.estado-pill`, que quedaba sin otro uso. La tabla conserva `Valor`, `Referencia` y `Base de
  cálculo` — el umbral de lectura sigue visible, solo no se evalúa automáticamente en un semáforo.

### Añadido

- **`EscalaAvanceInfo`**: disclosure junto al filtro «Estado» con la tabla calificación → estado →
  % de avance (0 · 0.5 · 1 · 1.5 · 2 → Sin avance … Cumplida), y la aclaración de que el estado de
  una OM es su última calificación, no un promedio. `FilterConfig` gana un campo `ayuda` opcional
  para enganchar contenido así junto a cualquier filtro; `useTableroOM` lo usa para «Estado», lo que
  lo propaga a las 5 vistas del layout interno sin repetir el componente en cada una.

### Cambiado

- **`KPIRow` explica su propio cálculo.** Cada `KPI` admite ahora un campo `formula`, que se
  muestra siempre visible al pie de la tarjeta (no en tooltip) — trazabilidad del número sin salir
  del tablero.

### Corregido

- **Vista Responsables agrupaba por área canónica, no por responsable literal.** Su tabla y su
  gráfica contaban OM por área institucional reconocida (`avancePorArea`), así que un texto como
  «SG-SST/ALTA DIRECCIÓN» aparecía repartido en dos filas distintas en vez de una sola. Ahora agrupan
  por el **texto literal** del campo `Responsable` (`avancePorResponsable`, nueva función en
  `src/lib/om/metricas.ts`): una fila por redacción, cada OM cuenta una sola vez. La selección de un
  responsable es local a la vista — muestra sus OM en una card lateral — y ya no reutiliza el filtro
  global `area`, que sigue disponible como filtro cruzado en el resto del tablero (`ADR-0003`,
  actualizado).
- **Responsable mostrado como áreas derivadas en vez de texto literal.** Resumen (lista de rezago),
  Datos (fila de la tabla) y Seguimiento (detalle de la OM seleccionada) mostraban `om.areas.join(" · ")`
  junto a cada OM — las etiquetas de área que el ETL reconoce por patrones sobre el texto libre de
  `Responsable`, no el texto en sí. Si alguna parte del texto no coincidía con ninguno de los 26
  patrones, esa parte desaparecía de lo que se veía, dando la impresión de que el responsable estaba
  incompleto o «dividido». Las tres vistas ahora muestran `om.responsable` completo, tal como se
  registró. La vista Responsables no cambia: agrupar/contar por área sigue siendo su razón de ser
  (ADR-0003), y ya mostraba el texto literal en su card «tal como se registraron».
- **ETL — entregables propios bajo un mismo `PM N°` (SGA 2024).** El libro de SGA ya no combina
  celdas: reparte el seguimiento de una OM entre varias filas, cada una con su propio `ENTREGABLE`.
  El agrupador de `scripts/limpiar-excel.mjs` las fusionaba como si fueran continuación de una celda
  combinada, concatenando los entregables en un solo texto y conservando solo la clasificación de la
  primera fila del grupo. Ahora la agrupación exige que **ni la oportunidad ni el entregable** se
  contradigan; `scripts/importar-om-rxd.mjs` desambigua el `id` cuando ambos coinciden entre filas.
  Dataset regenerado: 149 → **162 OM**, 930 → **995 registros de seguimiento**
  ([`docs/datos.md`](docs/datos.md#un-pm-n-con-varios-entregables-propios-sin-celdas-combinadas)).

## [0.2.0] — 2026-08-13

Primer tablero con datos institucionales reales. Reemplaza los datos de demostración por el
seguimiento a Oportunidades de Mejora (OM) de la Revisión por la Dirección.

### Añadido

- **ETL de datos** sin dependencias externas: `scripts/importar-om-rxd.mjs` y `scripts/lib/xlsx.mjs`
  convierten `data/*.xlsx` en `src/data/om-rxd.json` (148 OM, 794 registros de seguimiento en 5
  sistemas de gestión). Nuevo script `pnpm datos:importar` ([ADR-0001](docs/adr/0001-fuente-de-datos-etl-excel-a-json.md)).
- **Capa de datos y métricas** `src/lib/om/`: acceso único al dataset (`dataset.ts`), escala
  institucional de avance 0–2 (`avance.ts`), agregaciones puras (`metricas.ts`) y modelo de filtros
  (`filtros.ts`).
- **Contexto de filtros compartido** (`FiltrosProvider`) montado sobre las vistas de cada tema: una
  selección hecha en una gráfica actualiza todo el tablero y se conserva al navegar entre vistas
  (regla dashboard §3–4).
- **Hook `useTableroOM`**, punto de entrada de datos de las vistas, con `omsIgnorando(campo)` para el
  filtrado cruzado y controles de filtro derivados de los datos reales.
- **Vista «Todos los sistemas de gestión»** (`/consolidado`): el estado vigente de **todos** los
  sistemas en un solo tablero — KPIs del portafolio completo, avance comparado por sistema,
  composición apilada por estado y tabla con el último corte, cierre, carga pendiente y variación de
  cada uno. Es ruta de primer nivel porque compara *entre* sistemas, mientras que el layout interno
  trabaja *dentro* de uno. Es la **acción principal de la portada** (botón sólido con halo pulsante,
  visible sin desplazarse) y está también en el menú lateral de cualquier tablero. La animación se
  detiene al pasar el cursor o al enfocar con teclado, y `prefers-reduced-motion` la desactiva por
  completo dejando el botón con relieve fijo.
- **Vista Responsables** (`/temas/:temaId/responsables`): avance y carga por área institucional
  ([ADR-0003](docs/adr/0003-vista-responsables.md)).
- **Componentes de gráfica**: `BarrasCategoria` (barras con clic-para-filtrar, vertical u
  horizontal) y `LeyendaInteractiva` (leyenda que filtra, accesible con teclado, cubriendo el hueco
  de Recharts cuyos segmentos no son focalizables).
- **Estados Cargando y Error en `ChartCard`**, que ya cubría Sin datos y Filtrada: la envoltura
  completa el contrato de la regla de dashboard §9 y §12.
- **Logotipo propio de cada sistema de gestión**: nuevo componente `LogoSistema` y los cinco
  archivos copiados de `imagenes/` a `public/brand/sistemas/`. Aparecen en la tarjeta de la portada
  y en el encabezado del layout interno, como identificador secundario junto al institucional.
- **Sello de Acreditación Institucional** (`SelloAcreditacion`) en la esquina superior derecha de
  todas las vistas y en el pie, con un destello metálico que lo recorre. El brillo se enmascara con
  la propia imagen (`mask-image`), así que solo cubre los píxeles opacos del sello y nunca se
  desborda sobre su fondo transparente; `prefers-reduced-motion` lo desactiva.
- **Pie institucional** (`PieInstitucional`), compartido por la portada y la vista consolidada:
  declara «Elaborado por: Gobierno de Datos» y «Fuente: Control Interno», junto a la fecha de la
  última importación de los libros.
- **Favicon**: el escudo institucional (`src/app/icon.png`) sustituye al icono por defecto de
  Next.js. Uso simbólico permitido por la regla visual §2.2; el identificador de la interfaz sigue
  siendo el imagotipo, nunca el escudo.
- Se oculta el indicador de desarrollo de Next.js (`devIndicators: false`), que se superponía sobre
  el menú lateral en desarrollo. Nunca formó parte del build de producción.
- **Documentación**: `docs/arquitectura.md`, `docs/datos.md`, `docs/componentes.md`, cuatro ADR y
  este changelog. README reescrito en español y solo con pnpm.
- **Pruebas de extremo a extremo** reescritas (14 casos): KPIs, filtros sincronizados, interacción
  de la leyenda como filtro, persistencia de filtros entre vistas, estado vacío, orden y despliegue
  de la tabla, y cronología de cortes.

### Corregido

- **El lector de `.xlsx` descartaba en silencio parte de cada fila.** La expresión que delimitaba
  una fila terminaba en el primer `/>`, que también cierra una celda vacía (`<c r="A5"/>`), de modo
  que todo lo que viniera después se perdía. Afectaba a las 18 hojas: **551 de 3 398 celdas con
  valor, el 16,2 %**. Tras corregirlo el dataset pasa de 148 a **149 OM** y de 794 a **930**
  registros de seguimiento; las 9 OM de SGA que figuraban «sin seguimiento» resultan tener todas su
  historial, y el avance promedio global pasa de 83,6 % a 84,2 %.
- **Identificadores de OM duplicados.** Un mismo `PM N°` puede amparar dos oportunidades distintas
  cuando la celda del número está combinada pero la del texto no (SGC 2022, PM 4). Ambas recibían el
  mismo `id`, y al usarse como `key` de React la tabla renderizaba filas fantasma. Ahora se
  desambiguan por el texto de la oportunidad y el importador lo avisa.
- Las pruebas de extremo a extremo derivan sus cifras del propio dataset en lugar de llevarlas
  escritas a mano, así que dejan de romperse al reimportar los libros. La prueba de ordenación
  comprueba monotonía en vez de comparar contra un array reordenado, que fallaba por los empates de
  un orden estable.

### Cambiado

- **El ETL pasa a dos pasos con un artefacto intermedio auditable**:
  `data/*.xlsx` → **`data-limpio/*.xlsx`** → `src/data/om-rxd.json`. El nuevo
  `scripts/limpiar-excel.mjs` concentra toda la interpretación de formato y escribe un libro por
  sistema —una hoja por vigencia, una fila por OM, sin celdas combinadas, filas vacías, hojas
  duplicadas ni totales—, con los encabezados de corte normalizados a fecha ISO. El importador,
  al recibir una tabla plana, se reduce a traducir columnas a campos. Nuevo escritor de `.xlsx` sin
  dependencias (`scripts/lib/xlsx-escribir.mjs`) y reglas de dominio compartidas
  (`scripts/lib/dominio.mjs`). Nuevo script `pnpm datos:limpiar`; `pnpm datos:importar` ejecuta
  ambos pasos. El dataset resultante es idéntico: 148 OM y 794 seguimientos.
- Los identificadores de las OM **sin `PM N°`** dejan de derivarse del número de fila —que cambiaba
  al insertar o quitar filas— y pasan a un sufijo estable derivado del texto de la oportunidad.
- **El importador ahora descombina las celdas y agrupa por `PM N°`.** Tres hojas (SGA 2024, SGSI
  2025 y SGC 2022) usan combinaciones verticales; en un `.xlsx` esas celdas guardan el valor solo en
  su esquina superior-izquierda. El lector lo replica en todo el rango y el importador consolida las
  filas consecutivas de una misma OM. El dataset resultante es idéntico al anterior —148 OM y 794
  seguimientos— porque hoy ninguna fila de continuación aporta datos; el cambio evita duplicar o
  perder registros si un libro futuro reparte el seguimiento entre varias filas, y avisa si ocurre.

- **Escala de color del avance rehecha como rampa ordinal de un solo tono**
  ([ADR-0004](docs/adr/0004-rampa-ordinal-de-avance.md)). La paleta categórica anterior falló la
  validación: «Avance parcial» y «Avance significativo» medían ΔE 5.8, indistinguibles incluso con
  visión de color completa. La nueva rampa deriva del verde institucional, con luminosidad monótona
  y los dos pasos oscuros en los tokens oficiales; «Sin seguimiento» queda fuera de la escala, en
  gris neutro.
- Correcciones derivadas de la revisión de visualización: el color viste la marca y no el texto
  (nuevo `EstadoTag`), rejillas continuas en lugar de punteadas, etiquetas directas solo en los
  puntos que cuentan la historia —no una sobre cada punto—, separación de 2 px entre segmentos del
  donut, y cifras destacadas con dígitos proporcionales en vez de `tabular-nums`.
- Dependencias actualizadas dentro de la misma versión mayor y `overrides` de pnpm para las
  transitivas con avisos de seguridad: `pnpm audit` queda sin vulnerabilidades conocidas.

- **Los temas del portal son ahora los sistemas de gestión** (`sgc`, `sga`, `sgsst`, `sgsi`,
  `sgas`), derivados del dataset ([ADR-0002](docs/adr/0002-temas-como-sistemas-de-gestion.md)). Las
  rutas `/temas/:temaId/...` cambian en consecuencia.
- Todas las vistas (Resumen, Indicadores, Datos, Seguimiento) reescritas sobre los datos reales.
- `FilterBar` pasa a ser un componente **controlado** por el contexto de filtros, para que los
  selectores y los clics en las gráficas escriban en el mismo estado y no se dupliquen los filtros.
- `KPIRow` deja de depender del módulo de datos de demostración y expone su propio tipo `KPI`, con
  variación respecto al corte anterior calculada sobre la serie real.
- `ViewHeader` muestra el corte de seguimiento vigente del sistema en lugar de un periodo fijo.
- Escala de color de estados unificada en `src/lib/om/avance.ts`: rampa ordinal dominada por los
  verdes institucionales, con oro como énfasis y gris neutro para la ausencia de avance.
- `pnpm-workspace.yaml`: se autorizan los scripts de instalación de `sharp` y `unrs-resolver`, que
  estaban sin decidir y bloqueaban la ejecución de cualquier script de `package.json`.

### Eliminado

- Datos de demostración `src/features/dashboard/dashboardData.ts`.
- Vista `reportes/` y su componente `ReportesView` ([ADR-0003](docs/adr/0003-vista-responsables.md)).
- `src/components/dashboard/filtros.ts`, cuyo constructor de filtros genéricos reemplaza
  `useTableroOM`.
- El ícono genérico de los temas (`Tema.icon`, el tipo `IconName` y los cinco glifos asociados):
  cada sistema se identifica ahora con su logotipo oficial.
- Estilos huérfanos en `globals.css` (hitos, tarjetas de reporte, métricas y barras de la versión
  anterior de las vistas).

## [0.1.0]

- Andamiaje inicial: layouts de portada e interno, identidad visual institucional, componentes de
  gráfica base y vistas con datos de demostración.
