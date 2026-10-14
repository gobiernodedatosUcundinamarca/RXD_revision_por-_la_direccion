# Regla de diseño para vistas de dashboard

> **Obligatorio:** leer completa antes de crear o modificar cualquier gráfica, `ChartCard` o vista que integre una. Ante la duda sobre un criterio, se relee la sección.

## 1. Títulos

Visible, arriba, descriptivo; nada de "Gráfica 1", "Resultados" o "Datos". Indicar cuando aplique variable, periodo, unidad y población. Ej.: `Avance por vigencia — corte 30-sep-2026 (%)`.

## 2. Etiquetas de datos

- Cada elemento muestra su valor: etiqueta visible, tooltip o leyenda (esta última si hay varias series/categorías).
- Ejes con nombre; porcentajes con `%`; separador de miles.
- Sin etiquetas superpuestas ni cortadas; si no caben, tooltip.

## 3. Interacción como filtro

- Barra, punto, segmento o ítem de leyenda seleccionable filtra el resto del dashboard (KPIs, gráficas, tablas), solo si hay relación lógica.
- Lo seleccionado queda destacado; lo demás baja opacidad pero sigue visible.
- El filtro activo se muestra en texto (`Filtro activo: SGC`).

## 4. Comportamiento de los filtros

- Selección simple o múltiple según la lógica; botón visible para **limpiar**.
- Sincronizados con los filtros generales, sin duplicados; actualización inmediata.
- Sin resultados → estado vacío informativo (`No existen datos para los filtros seleccionados.`).

## 5. KPIs (recomendados)

Arriba, antes del detalle; 3–6 tarjetas con nombre, valor grande, variación (↑/↓ con algo más que color) y meta opcional. Responden a los filtros generales. 4 columnas escritorio · 2 tableta · 1 móvil.

## 6. Filtros de contexto (opcionales)

Barra bajo el título (periodo, ubicación, categoría) solo si aportan valor. Afectan todo a la vez, sin recarga; filtros activos como chips; botón "Limpiar filtros".

## 7. Layout

Cuadrícula consistente: KPIs → filtros → detalle. Nada cortado, desbordado ni con scroll horizontal; altura mínima legible; gráficas relacionadas juntas; separación uniforme.

## 8. Responsive

- **Escritorio:** 2–3 columnas; muchas categorías o tablas → ancho completo.
- **Tableta:** 1–2 columnas; leyenda debajo si hace falta.
- **Móvil:** 1 columna a ancho completo; títulos sin truncar; etiquetas largas abreviadas o en tooltip; todo funciona con **toque**.

## 9. Estados

**Cargando** (indicador/esqueleto) · **Sin datos** (mensaje) · **Error** (mensaje + reintentar) · **Filtrada** (indicador visible) · **Seleccionada** (resalte evidente y accesible).

## 10. Consistencia visual

Mismo color para la misma categoría en todo el dashboard; contraste suficiente; **el color nunca es el único recurso** de selección o estado; tipografía, bordes y espaciados uniformes. En este proyecto la escala de estados vive solo en `src/lib/om/avance.ts`.

## 11. Accesibilidad

Interactivos accesibles por teclado (Recharts no lo es: usar `LeyendaInteractiva` o el selector equivalente). Selección marcada con 2+ recursos (color, borde, ícono, texto, opacidad). Tooltips con contraste; tamaños legibles.

## 12. Mínimo obligatorio para integrar una gráfica

1. Título descriptivo.
2. Etiquetas/ejes/tooltips para interpretar valores.
3. Leyenda si hay varias series.
4. Responsive en el layout.
5. Estados de carga, error y sin datos.
6. Integración con filtros generales.
7. Interacción como filtro si es seleccionable.
8. Opción de limpiar la selección.
9. Filtros activos visibles.
10. Actualización correcta de las visualizaciones relacionadas.
