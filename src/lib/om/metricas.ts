import type { Clasificacion, EstadoAvance, OportunidadMejora } from "@/types";
import {
  CLASIFICACION_MAXIMA,
  ESTADOS,
  avanceDeOM,
  avancePromedio,
  estadoDeOM,
  ultimoSeguimientoCalificado,
} from "./avance";
import { ultimoCorte } from "./dataset";

/**
 * Agregaciones puras sobre las OM. Son funciones sin estado ni dependencia de
 * React: las vistas solo las consumen (SOLID «S» — la gráfica pinta, no calcula
 * de dónde salen los datos).
 */

export interface ResumenOM {
  total: number;
  cumplidas: number;
  enGestion: number;
  /** Calificación vigente en 0, incluyendo las OM que nunca fueron calificadas. */
  sinAvance: number;
  /** Porcentaje de OM cumplidas sobre el total. */
  tasaCierre: number | null;
  /** Avance promedio (0–100) de las OM calificadas. */
  avancePromedio: number | null;
  /** OM con fecha comprometida ya vencida y aún sin cerrar. */
  vencidas: number;
  /** OM cuya fecha de entrega es texto libre y no se puede evaluar. */
  sinFechaEvaluable: number;
  vigencias: string[];
  cortes: string[];
  ultimoCorte: string | null;
}

/**
 * ¿La OM incumplió su fecha comprometida?
 *
 * Se compara contra la fecha del último corte de seguimiento (no contra «hoy»):
 * es el momento en que la institución evaluó por última vez el estado, así que
 * es la referencia honesta para afirmar un incumplimiento. Las OM cuya fecha de
 * entrega se registró como texto libre («Inmediato», «IPA 2025») no se evalúan.
 */
export function estaVencida(om: OportunidadMejora, referencia: string | null): boolean {
  if (!referencia || !om.fechaEntrega) return false;
  return om.fechaEntrega < referencia && estadoDeOM(om) !== "cumplida";
}

/**
 * @param referencia Fecha contra la que se evalúa el vencimiento. Por defecto,
 *   el último corte del propio conjunto; con filtros activos conviene pasar el
 *   del sistema completo para que el filtro no cambie si una OM está vencida.
 */
export function resumen(oms: OportunidadMejora[], referencia: string | null = ultimoCorte(oms)): ResumenOM {
  const estados = oms.map(estadoDeOM);
  const cuenta = (predicado: (estado: EstadoAvance) => boolean) => estados.filter(predicado).length;
  const cumplidas = cuenta((estado) => estado === "cumplida");

  return {
    total: oms.length,
    cumplidas,
    enGestion: cuenta((estado) =>
      estado === "avance-minimo" || estado === "avance-parcial" || estado === "avance-significativo",
    ),
    sinAvance: cuenta((estado) => estado === "sin-avance"),
    tasaCierre: oms.length === 0 ? null : (cumplidas / oms.length) * 100,
    avancePromedio: avancePromedio(oms),
    vencidas: oms.filter((om) => estaVencida(om, referencia)).length,
    sinFechaEvaluable: oms.filter((om) => !om.fechaEntrega).length,
    vigencias: [...new Set(oms.map((om) => om.vigencia))].sort(),
    cortes: cortesDe(oms),
    ultimoCorte: ultimoCorte(oms),
  };
}

/** Fechas de corte distintas presentes en un conjunto de OM, en orden cronológico. */
export function cortesDe(oms: OportunidadMejora[]): string[] {
  const cortes = new Set<string>();
  for (const om of oms) for (const seguimiento of om.seguimientos) cortes.add(seguimiento.corte);
  return [...cortes].sort();
}

/**
 * Clasificación vigente de una OM **a una fecha de corte dada**: la última
 * calificación registrada en ese corte o antes. Devuelve `null` si en esa fecha
 * la OM aún no había sido calificada.
 */
export function clasificacionEnCorte(om: OportunidadMejora, corte: string): Clasificacion | null {
  let vigente: Clasificacion | null = null;
  for (const seguimiento of om.seguimientos) {
    if (seguimiento.corte > corte) break;
    if (seguimiento.clasificacion !== null) vigente = seguimiento.clasificacion;
  }
  return vigente;
}

export interface PuntoAvance {
  corte: string;
  /** Avance promedio del portafolio a esa fecha (0–100). */
  avance: number;
  /** Tasa de cierre a esa fecha (0–100). */
  tasaCierre: number;
  /** OM ya calificadas a esa fecha: base sobre la que se calcula el punto. */
  base: number;
  cumplidas: number;
}

/**
 * Estado vigente del portafolio corte a corte (lectura **acumulada**).
 *
 * Cada punto es una foto: para cada OM se toma su última calificación en ese
 * corte o antes, no solo lo que se calificó ese día. Ya **no** alimenta las
 * gráficas de evolución (ver `seriesPorSeguimiento`): solo la variación «vs
 * corte anterior» de los KPI y del consolidado, que comparan el estado vigente
 * de las mismas OM, igual que el valor del KPI.
 */
export function serieAvancePorCorte(oms: OportunidadMejora[]): PuntoAvance[] {
  return cortesDe(oms)
    .map((corte) => {
      const vigentes = oms
        .map((om) => clasificacionEnCorte(om, corte))
        .filter((clasificacion): clasificacion is Clasificacion => clasificacion !== null);

      if (vigentes.length === 0) return null;

      const suma = vigentes.reduce<number>((total, clasificacion) => total + clasificacion, 0);
      const cumplidas = vigentes.filter((clasificacion) => clasificacion === CLASIFICACION_MAXIMA).length;

      return {
        corte,
        avance: Number((((suma / vigentes.length) / CLASIFICACION_MAXIMA) * 100).toFixed(1)),
        tasaCierre: Number(((cumplidas / vigentes.length) * 100).toFixed(1)),
        base: vigentes.length,
        cumplidas,
      };
    })
    .filter((punto): punto is PuntoAvance => punto !== null);
}

/**
 * Calificación que recibió una OM **en ese corte exacto**, o `null` si no se
 * evaluó ese día. Si el libro repite la fecha del corte (dos columnas «30 ABRIL
 * 2026»), vale la última: es la columna más reciente.
 */
export function calificacionDelCorte(om: OportunidadMejora, corte: string): Clasificacion | null {
  let calificacion: Clasificacion | null = null;
  for (const seguimiento of om.seguimientos) {
    if (seguimiento.corte === corte && seguimiento.clasificacion !== null) {
      calificacion = seguimiento.clasificacion;
    }
  }
  return calificacion;
}

/** Última calificación de una OM **antes** de un corte (excluido), o `null`. */
function calificacionPrevia(om: OportunidadMejora, corte: string): Clasificacion | null {
  let previa: { corte: string; clasificacion: Clasificacion } | null = null;
  for (const seguimiento of om.seguimientos) {
    if (seguimiento.clasificacion === null || seguimiento.corte >= corte) continue;
    if (!previa || seguimiento.corte >= previa.corte) {
      previa = { corte: seguimiento.corte, clasificacion: seguimiento.clasificacion };
    }
  }
  return previa?.clasificacion ?? null;
}

const promedioPorcentual = (calificaciones: Clasificacion[]): number =>
  Number(
    ((calificaciones.reduce<number>((suma, c) => suma + c, 0) / calificaciones.length / CLASIFICACION_MAXIMA) * 100).toFixed(1),
  );

export interface PuntoSeguimiento {
  corte: string;
  /** Avance promedio (0–100) de las OM evaluadas en ese corte. */
  avance: number;
  /** Porcentaje de las evaluadas que quedaron cumplidas (calificación 2). */
  tasaCierre: number;
  /** OM evaluadas (con calificación) en ese corte: base del punto. */
  evaluadas: number;
  cumplidas: number;
}

export interface SerieVigencia {
  vigencia: string;
  puntos: PuntoSeguimiento[];
}

/**
 * Evolución **por seguimiento**: una serie por vigencia y, en cada corte, solo
 * las OM evaluadas ese día. Reproduce la fila de promedios de cada hoja del
 * libro de seguimiento.
 *
 * Se separa por vigencia porque cada ciclo de RXD se evalúa en fechas propias:
 * mezclarlos en una sola línea haría subir o bajar el promedio por cambiar el
 * grupo evaluado (14 OM en junio, 4 en septiembre), no por avance real
 * ([ADR-0007](../../../docs/adr/0007-evolucion-por-seguimiento.md)).
 */
export function seriesPorSeguimiento(oms: OportunidadMejora[]): SerieVigencia[] {
  const vigencias = [...new Set(oms.map((om) => om.vigencia))].sort();

  return vigencias
    .map((vigencia) => {
      const delCiclo = oms.filter((om) => om.vigencia === vigencia);
      const puntos = cortesDe(delCiclo)
        .map((corte) => {
          const evaluadas = delCiclo
            .map((om) => calificacionDelCorte(om, corte))
            .filter((c): c is Clasificacion => c !== null);
          if (evaluadas.length === 0) return null;
          const cumplidas = evaluadas.filter((c) => c === CLASIFICACION_MAXIMA).length;
          return {
            corte,
            avance: promedioPorcentual(evaluadas),
            tasaCierre: Number(((cumplidas / evaluadas.length) * 100).toFixed(1)),
            evaluadas: evaluadas.length,
            cumplidas,
          };
        })
        .filter((punto): punto is PuntoSeguimiento => punto !== null);
      return { vigencia, puntos };
    })
    .filter((serie) => serie.puntos.length > 0);
}

/** Variación entre los dos últimos cortes de una serie, en puntos porcentuales. */
export function variacionUltimoCorte(
  serie: PuntoAvance[],
  campo: "avance" | "tasaCierre",
): number | null {
  if (serie.length < 2) return null;
  const ultimo = serie[serie.length - 1];
  const previo = serie[serie.length - 2];
  if (!ultimo || !previo) return null;
  return Number((ultimo[campo] - previo[campo]).toFixed(1));
}

export interface SegmentoEstado {
  estado: EstadoAvance;
  clave: string;
  name: string;
  value: number;
  color: string;
}

/** Distribución de las OM por estado vigente; omite los estados sin registros. */
export function distribucionPorEstado(oms: OportunidadMejora[]): SegmentoEstado[] {
  const conteo = new Map<EstadoAvance, number>();
  for (const om of oms) {
    const estado = estadoDeOM(om);
    conteo.set(estado, (conteo.get(estado) ?? 0) + 1);
  }

  return ESTADOS.filter((estado) => (conteo.get(estado.id) ?? 0) > 0).map((estado) => ({
    estado: estado.id,
    clave: estado.id,
    name: estado.label,
    value: conteo.get(estado.id) ?? 0,
    color: estado.color,
  }));
}

export interface AgrupacionAvance {
  /** Valor de la dimensión (vigencia o área) — actúa también como filtro. */
  clave: string;
  total: number;
  cumplidas: number;
  sinCerrar: number;
  avance: number;
}

function agrupar(
  oms: OportunidadMejora[],
  clavesDe: (om: OportunidadMejora) => string[],
): AgrupacionAvance[] {
  const grupos = new Map<string, { total: number; cumplidas: number; avances: number[] }>();

  for (const om of oms) {
    const avance = avanceDeOM(om);
    const cumplida = estadoDeOM(om) === "cumplida";
    for (const clave of clavesDe(om)) {
      const grupo = grupos.get(clave) ?? { total: 0, cumplidas: 0, avances: [] };
      grupo.total += 1;
      if (cumplida) grupo.cumplidas += 1;
      grupo.avances.push(avance);
      grupos.set(clave, grupo);
    }
  }

  return [...grupos.entries()].map(([clave, { total, cumplidas, avances }]) => ({
    clave,
    total,
    cumplidas,
    sinCerrar: total - cumplidas,
    avance:
      avances.length === 0
        ? 0
        : Number((avances.reduce((suma, valor) => suma + valor, 0) / avances.length).toFixed(1)),
  }));
}

/** Avance por vigencia del ciclo de RXD, en orden cronológico. */
export function avancePorVigencia(oms: OportunidadMejora[]): AgrupacionAvance[] {
  return agrupar(oms, (om) => [om.vigencia]).sort((a, b) => a.clave.localeCompare(b.clave));
}

/**
 * Avance por responsable, agrupando por el **texto literal** tal como se
 * registró — no por las áreas canónicas que el ETL reconoce en él (`om.areas`,
 * usadas solo para el filtro global). Cada OM cuenta en un solo grupo, así que
 * la suma de `total` es una partición completa del conjunto.
 */
export function avancePorResponsable(oms: OportunidadMejora[], limite?: number): AgrupacionAvance[] {
  const responsables = agrupar(oms, (om) => [om.responsable || "Sin registrar"]).sort(
    (a, b) => b.total - a.total || a.clave.localeCompare(b.clave, "es"),
  );
  return limite ? responsables.slice(0, limite) : responsables;
}

export interface HitoCorte extends PuntoSeguimiento {
  /** Vigencias a las que pertenecen las OM evaluadas en el corte. */
  vigencias: string[];
  funcionarios: string[];
  /**
   * Cambio del avance de **las mismas OM** frente a su calificación anterior,
   * en puntos porcentuales. `null` si ninguna tenía calificación previa
   * (primera evaluación).
   */
  variacion: number | null;
}

/**
 * Cortes de seguimiento como hitos, del más reciente al más antiguo. Cada hito
 * describe solo lo evaluado ese día, y su variación compara esas mismas OM con
 * su calificación anterior, para no confundir avance con cambio de población.
 */
export function hitosPorCorte(oms: OportunidadMejora[]): HitoCorte[] {
  return cortesDe(oms)
    .map((corte) => {
      const evaluadas = oms.filter((om) => calificacionDelCorte(om, corte) !== null);
      if (evaluadas.length === 0) return null;

      const actuales = evaluadas.map((om) => calificacionDelCorte(om, corte) as Clasificacion);
      const cumplidas = actuales.filter((c) => c === CLASIFICACION_MAXIMA).length;

      const pares = evaluadas
        .map((om) => ({ antes: calificacionPrevia(om, corte), ahora: calificacionDelCorte(om, corte) as Clasificacion }))
        .filter((par): par is { antes: Clasificacion; ahora: Clasificacion } => par.antes !== null);

      const funcionarios = new Set<string>();
      for (const om of evaluadas) {
        for (const seguimiento of om.seguimientos) {
          if (seguimiento.corte === corte) funcionarios.add(seguimiento.funcionario);
        }
      }

      return {
        corte,
        avance: promedioPorcentual(actuales),
        tasaCierre: Number(((cumplidas / actuales.length) * 100).toFixed(1)),
        evaluadas: actuales.length,
        cumplidas,
        vigencias: [...new Set(evaluadas.map((om) => om.vigencia))].sort(),
        funcionarios: [...funcionarios],
        variacion:
          pares.length === 0
            ? null
            : Number(
                (promedioPorcentual(pares.map((p) => p.ahora)) - promedioPorcentual(pares.map((p) => p.antes))).toFixed(1),
              ),
      };
    })
    .filter((hito): hito is HitoCorte => hito !== null)
    .reverse();
}

/**
 * OM ordenadas por prioridad de atención: primero las más rezagadas y, a
 * igualdad de avance, las de vigencia más antigua.
 */
export function ordenarPorRezago(oms: OportunidadMejora[]): OportunidadMejora[] {
  return [...oms].sort((a, b) => {
    const avanceA = avanceDeOM(a);
    const avanceB = avanceDeOM(b);
    if (avanceA !== avanceB) return avanceA - avanceB;
    return a.vigencia.localeCompare(b.vigencia);
  });
}

/** Última observación registrada para una OM (la de su corte más reciente). */
export function ultimaObservacion(om: OportunidadMejora): string {
  const seguimiento = ultimoSeguimientoCalificado(om) ?? om.seguimientos[om.seguimientos.length - 1];
  return seguimiento?.observacion ?? "";
}
