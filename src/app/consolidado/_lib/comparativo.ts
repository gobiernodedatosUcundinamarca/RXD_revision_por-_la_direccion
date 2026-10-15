import type { EstadoAvance, OportunidadMejora } from "@/types";
import { SISTEMAS, ultimoCorte } from "@/lib/om/dataset";
import { ESTADOS, avancePromedio, estadoDeOM } from "@/lib/om/avance";
import {
  distribucionPorEstado,
  resumen,
  serieAvancePorCorte,
  variacionUltimoCorte,
  type SegmentoEstado,
} from "@/lib/om/metricas";

/**
 * Métricas comparativas **entre** sistemas de gestión, para la vista
 * consolidada. Vive colocado en la vista porque solo ella las usa (regla
 * scaffolding §3.2); si otra vista las necesitara, se promueven a `src/lib/om/`.
 *
 * A diferencia del resto del tablero, aquí la dimensión de análisis es el
 * propio sistema: cada fila resume el estado de un sistema **en su último
 * corte**, que no es el mismo día para todos.
 */

export interface FilaSistema {
  id: string;
  sigla: string;
  nombre: string;
  /** Fecha del corte más reciente de ESE sistema (difiere entre sistemas). */
  ultimoCorte: string | null;
  total: number;
  cumplidas: number;
  sinCerrar: number;
  /** Avance promedio (0–100) según la última calificación de cada OM. */
  avance: number | null;
  tasaCierre: number | null;
  /** Variación del avance frente al corte anterior, en puntos porcentuales. */
  variacion: number | null;
  distribucion: SegmentoEstado[];
  vigencias: string[];
}

/** Filtra por vigencia; la cadena vacía no restringe nada. */
function porVigencia(oms: OportunidadMejora[], vigencia: string): OportunidadMejora[] {
  return vigencia ? oms.filter((om) => om.vigencia === vigencia) : oms;
}

/** Una fila por sistema, en orden descendente de avance. */
export function compararSistemas(vigencia = ""): FilaSistema[] {
  return SISTEMAS.map((sistema) => {
    const oms = porVigencia(sistema.oms, vigencia);
    const datos = resumen(oms);
    const serie = serieAvancePorCorte(oms);

    return {
      id: sistema.id,
      sigla: sistema.sigla,
      nombre: sistema.nombre,
      ultimoCorte: ultimoCorte(oms),
      total: datos.total,
      cumplidas: datos.cumplidas,
      sinCerrar: datos.total - datos.cumplidas,
      avance: datos.avancePromedio,
      tasaCierre: datos.tasaCierre,
      variacion: variacionUltimoCorte(serie, "avance"),
      distribucion: distribucionPorEstado(oms),
      vigencias: datos.vigencias,
    };
  })
    .filter((fila) => fila.total > 0)
    .sort((a, b) => (b.avance ?? -1) - (a.avance ?? -1));
}

export interface TotalesGlobales {
  sistemas: number;
  total: number;
  cumplidas: number;
  tasaCierre: number | null;
  avance: number | null;
  /** Corte más reciente de todo el portafolio. */
  ultimoCorte: string | null;
}

/** Cifras del portafolio completo, sumando todos los sistemas. */
export function totalesGlobales(vigencia = ""): TotalesGlobales {
  const todas = SISTEMAS.flatMap((sistema) => porVigencia(sistema.oms, vigencia));
  const datos = resumen(todas);

  return {
    sistemas: compararSistemas(vigencia).length,
    total: datos.total,
    cumplidas: datos.cumplidas,
    tasaCierre: datos.tasaCierre,
    avance: avancePromedio(todas),
    ultimoCorte: datos.ultimoCorte,
  };
}

/** Vigencias presentes en cualquier sistema, en orden cronológico. */
export function vigenciasGlobales(): string[] {
  const vigencias = new Set<string>();
  for (const sistema of SISTEMAS) for (const om of sistema.oms) vigencias.add(om.vigencia);
  return [...vigencias].sort();
}

/** Estados presentes en algún sistema, en el orden de la escala. */
export function estadosPresentes(vigencia = ""): EstadoAvance[] {
  const presentes = new Set<EstadoAvance>();
  for (const sistema of SISTEMAS) {
    for (const om of porVigencia(sistema.oms, vigencia)) presentes.add(estadoDeOM(om));
  }
  return ESTADOS.filter((estado) => presentes.has(estado.id)).map((estado) => estado.id);
}

/**
 * Composición por estado de cada sistema, en el formato de fila que consume la
 * gráfica apilada: una clave por estado con su número de OM.
 */
export function composicionApilada(
  filas: FilaSistema[],
): Array<Record<string, string | number>> {
  return filas.map((fila) => {
    const punto: Record<string, string | number> = { sistema: fila.sigla, total: fila.total };
    for (const segmento of fila.distribucion) punto[segmento.estado] = segmento.value;
    return punto;
  });
}
