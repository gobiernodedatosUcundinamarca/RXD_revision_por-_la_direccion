import type { OportunidadMejora } from "@/types";
import type { SerieVigenciaGrafica } from "@/components/charts/EvolucionPorVigencia";
import { formatearFecha } from "@/lib/om/avance";
import { seriesPorSeguimiento } from "@/lib/om/metricas";

/**
 * Series de evolución por seguimiento listas para `EvolucionPorVigencia`
 * (Resumen, Seguimiento e Indicadores comparten esta traducción — DRY).
 *
 * @param campo Magnitud de cada punto: avance promedio o tasa de cierre de las
 *   OM evaluadas en el corte.
 */
export function seriesEvolucion(
  oms: OportunidadMejora[],
  campo: "avance" | "tasaCierre",
): SerieVigenciaGrafica[] {
  return seriesPorSeguimiento(oms).map(({ vigencia, puntos }) => ({
    vigencia,
    puntos: puntos.map((punto) => ({
      corte: punto.corte,
      etiqueta: formatearFecha(punto.corte),
      valor: punto[campo],
      evaluadas: punto.evaluadas,
      cumplidas: punto.cumplidas,
    })),
  }));
}

/** Vigencias del sistema completo, para que el estilo de cada una no cambie al filtrar. */
export const vigenciasDe = (oms: OportunidadMejora[]): string[] =>
  [...new Set(oms.map((om) => om.vigencia))].sort();
