import type { OportunidadMejora } from "@/types";
import type { KPI } from "@/components/dashboard/KPIRow";
import { formatearPorcentaje } from "@/lib/om/avance";
import { resumen, serieAvancePorCorte, variacionUltimoCorte } from "@/lib/om/metricas";
import { AVANCE_PROMEDIO, TASA_CIERRE, TOTAL_OM, VARIACION_ESTADO } from "@/lib/om/explicaciones";

/**
 * Indicadores clave del tablero de OM (regla dashboard §5).
 *
 * Se construyen una sola vez y los comparten todas las vistas, de modo que la
 * cabecera cuente siempre la misma historia (DRY — CLAUDE.md §6). Responden a
 * los filtros porque se calculan sobre el conjunto ya filtrado.
 */

/** Traduce una variación en puntos porcentuales a la señal visual del KPI. */
function delta(variacion: number | null, positivoEsMejor = true): KPI["delta"] {
  if (variacion === null) return undefined;
  const signo = variacion > 0 ? "+" : "";
  const etiqueta = `${signo}${variacion} pp vs corte anterior`;
  if (variacion === 0) return { label: "sin cambio vs corte anterior", direccion: "neutro" };
  const mejora = positivoEsMejor ? variacion > 0 : variacion < 0;
  return { label: etiqueta, direccion: mejora ? "sube" : "baja" };
}

/**
 * @param oms Conjunto ya filtrado que alimenta la vista.
 * @param todas Universo del sistema, para declarar la base cuando hay filtros.
 */
export function construirKPIs(oms: OportunidadMejora[], todas: OportunidadMejora[]): KPI[] {
  const datos = resumen(oms);
  const serie = serieAvancePorCorte(oms);
  const filtrado = oms.length !== todas.length;

  return [
    {
      label: "Oportunidades de mejora",
      value: datos.total.toLocaleString("es-CO"),
      nota: filtrado
        ? `de ${todas.length} en el sistema`
        : `vigencias ${datos.vigencias.join(", ") || "sin registro"}`,
      formula: TOTAL_OM,
    },
    {
      label: "Tasa de cierre vigente",
      value: formatearPorcentaje(datos.tasaCierre, 0),
      delta: delta(variacionUltimoCorte(serie, "tasaCierre")),
      nota: `${datos.cumplidas} de ${datos.total} cumplidas`,
      formula: `${TASA_CIERRE} Variación: ${VARIACION_ESTADO}`,
    },
    {
      label: "Avance promedio vigente",
      value: formatearPorcentaje(datos.avancePromedio, 0),
      delta: delta(variacionUltimoCorte(serie, "avance")),
      nota: "Escala institucional 0–2 en %",
      formula: `${AVANCE_PROMEDIO} Variación: ${VARIACION_ESTADO}`,
    },
  ];
}
