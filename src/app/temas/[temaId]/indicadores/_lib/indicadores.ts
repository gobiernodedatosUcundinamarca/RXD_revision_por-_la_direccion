import type { OportunidadMejora } from "@/types";
import { estadoDeOM, formatearFecha, formatearPorcentaje } from "@/lib/om/avance";
import { ultimoCorte } from "@/lib/om/dataset";
import { resumen } from "@/lib/om/metricas";
import {
  ATENCION,
  AVANCE_PROMEDIO,
  CORTES_REGISTRADOS,
  COBERTURA,
  HEREDADAS,
  TASA_CIERRE,
  VENCIDA,
} from "@/lib/om/explicaciones";

/**
 * Cálculo de los indicadores de gestión de la vista Indicadores.
 *
 * Vive colocado dentro de la vista porque solo esta lo usa (regla scaffolding
 * §3.2). Si otra vista llegara a necesitarlo, se promueve a `src/lib/om/`.
 */

export interface Indicador {
  id: string;
  nombre: string;
  /** Valor ya formateado para mostrar. */
  valor: string;
  /** Umbral de lectura con el que se contrasta el valor. */
  referencia: string;
  /** Población sobre la que se calcula: hace auditable el indicador. */
  base: string;
  /** Cómo se calcula: se muestra en el ícono «!» del nombre. */
  formula: string;
}

/**
 * Construye la batería de indicadores sobre el conjunto de OM ya filtrado.
 *
 * Las referencias son **umbrales de lectura** definidos para este tablero, no
 * metas institucionales aprobadas: sirven para ordenar la atención, y la vista
 * lo declara explícitamente.
 *
 * @param oms Conjunto ya filtrado.
 * @param todas Universo del sistema: fija la vigencia más reciente y el último
 *   corte, para que un filtro no cambie qué OM son heredadas o vencidas.
 */
export function construirIndicadores(oms: OportunidadMejora[], todas: OportunidadMejora[]): Indicador[] {
  const corteDelSistema = ultimoCorte(todas);
  const datos = resumen(oms, corteDelSistema);
  const total = datos.total;

  const conSeguimiento = oms.filter((om) =>
    om.seguimientos.some((seguimiento) => seguimiento.clasificacion !== null),
  ).length;
  const cobertura = total === 0 ? null : (conSeguimiento / total) * 100;

  const vigenciaActual = [...new Set(todas.map((om) => om.vigencia))].sort().at(-1);
  const heredadas = oms.filter(
    (om) => vigenciaActual !== undefined && om.vigencia < vigenciaActual && estadoDeOM(om) !== "cumplida",
  ).length;

  const conFechaEvaluable = total - datos.sinFechaEvaluable;

  return [
    {
      id: "tasa-cierre",
      nombre: "Tasa de cierre de oportunidades de mejora",
      valor: formatearPorcentaje(datos.tasaCierre, 1),
      referencia: "≥ 80 %",
      base: `${datos.cumplidas} cumplidas de ${total}`,
      formula: TASA_CIERRE,
    },
    {
      id: "avance-promedio",
      nombre: "Avance promedio del portafolio",
      valor: formatearPorcentaje(datos.avancePromedio, 1),
      referencia: "≥ 80 %",
      base: `${total} OM (una OM nunca calificada promedia como 0 %)`,
      formula: AVANCE_PROMEDIO,
    },
    {
      id: "cobertura-seguimiento",
      nombre: "Cobertura de seguimiento",
      valor: formatearPorcentaje(cobertura, 1),
      referencia: "100 %",
      base: `${conSeguimiento} de ${total} con al menos un corte calificado`,
      formula: COBERTURA,
    },
    {
      id: "sin-avance",
      nombre: "Oportunidades sin avance registrado",
      valor: String(datos.sinAvance),
      referencia: "0",
      base: "Calificación vigente igual a 0 en la escala institucional (incluye las nunca calificadas)",
      formula: ATENCION,
    },
    {
      id: "vencidas",
      nombre: "Entrega comprometida vencida y sin cierre",
      valor: String(datos.vencidas),
      referencia: "0",
      base:
        conFechaEvaluable > 0
          ? `${conFechaEvaluable} OM con fecha evaluable · ${datos.sinFechaEvaluable} con compromiso en texto libre · referencia: corte del ${formatearFecha(corteDelSistema)}`
          : "Ninguna OM registra una fecha de entrega evaluable",
      formula: VENCIDA,
    },
    {
      id: "heredadas",
      nombre: "Oportunidades de vigencias anteriores aún sin cerrar",
      valor: String(heredadas),
      referencia: "0",
      base: vigenciaActual
        ? `Vigencias anteriores a ${vigenciaActual}`
        : "Sin vigencias registradas",
      formula: HEREDADAS,
    },
    {
      id: "cortes",
      nombre: "Cortes de seguimiento registrados",
      valor: String(datos.cortes.length),
      referencia: "Informativo",
      base:
        datos.cortes.length > 0
          ? `Del ${formatearFecha(datos.cortes[0] ?? null)} al ${formatearFecha(datos.ultimoCorte)}`
          : "Sin cortes",
      formula: CORTES_REGISTRADOS,
    },
  ];
}
