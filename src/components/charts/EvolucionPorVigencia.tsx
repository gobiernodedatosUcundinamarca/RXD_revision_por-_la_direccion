"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ReferenceLine,
} from "recharts";
import {
  ANIMACION_MS,
  EJE,
  OPACIDAD_ATENUADA,
  REJILLA,
  TOOLTIP,
  estiloVigencia,
  type FormaMarcador,
} from "./estilos";
import { LeyendaInteractiva } from "./LeyendaInteractiva";

export interface PuntoVigencia {
  /** Fecha ISO del corte: ordena el eje X. */
  corte: string;
  /** Etiqueta del eje X, ya formateada. */
  etiqueta: string;
  valor: number;
  /** OM evaluadas en ese corte: base del punto. */
  evaluadas: number;
  cumplidas: number;
}

export interface SerieVigenciaGrafica {
  vigencia: string;
  puntos: PuntoVigencia[];
}

interface EvolucionPorVigenciaProps {
  series: SerieVigenciaGrafica[];
  /** Todas las vigencias del sistema, para que el estilo de cada una sea estable. */
  vigencias: string[];
  /** Nombre de la magnitud, usado en el tooltip. */
  serie: string;
  /** Nombre del eje Y (regla dashboard §2). */
  ejeY: string;
  unidad?: string;
  meta?: { valor: number; label: string };
  /** Vigencia seleccionada en el filtro general, o `null`. */
  seleccionada?: string | null;
  onSelect?: (vigencia: string) => void;
}

type Fila = Record<string, string | number | undefined>;

/**
 * Geometría fija de la gráfica. Con el dominio del eje Y fijo en 0–100, la
 * posición vertical de cada punto se conoce de antemano, y con ella se pueden
 * colocar las etiquetas de fin de línea sin que se monten unas sobre otras.
 */
const ALTO = 280;
const MARGEN = { top: 30, right: 24, bottom: 4, left: 4 };
const ALTO_EJE_X = 30;
const ALTO_TRAZADO = ALTO - MARGEN.top - MARGEN.bottom - ALTO_EJE_X;
/** Alto de una línea de texto de etiqueta, en píxeles. */
const ALTO_TEXTO = 13;
/** Línea base de la etiqueta respecto al punto: encima (por defecto) o debajo. */
const ENCIMA = -10;
const DEBAJO = 17;

const yDeValor = (valor: number) => MARGEN.top + ((100 - valor) / 100) * ALTO_TRAZADO;

/**
 * Desplazamiento vertical (px) de la etiqueta de fin de cada línea respecto a
 * su posición por defecto (encima del último punto). Se colocan primero las
 * que terminan más a la derecha (la vigencia en curso) y, a igual corte, de
 * arriba abajo: si una choca con otra de un punto cercano (mismo corte o el
 * contiguo), pasa debajo de su punto y, si aún choca, baja una línea más.
 */
function desplazarEtiquetas(finales: { vigencia: string; indice: number; valor: number }[]): Map<string, number> {
  const colocadas: { indice: number; base: number }[] = [];
  const desplazamientos = new Map<string, number>();

  for (const final of [...finales].sort((a, b) => b.indice - a.indice || b.valor - a.valor)) {
    const y = yDeValor(final.valor);
    const vecinas = colocadas.filter((otra) => Math.abs(otra.indice - final.indice) <= 1);
    const choca = (base: number) => vecinas.some((otra) => Math.abs(otra.base - base) < ALTO_TEXTO);

    let base = y + ENCIMA;
    if (choca(base)) {
      base = y + DEBAJO;
      while (choca(base)) base += ALTO_TEXTO;
    }
    colocadas.push({ indice: final.indice, base });
    desplazamientos.set(final.vigencia, base - (y + ENCIMA));
  }
  return desplazamientos;
}

const claveEvaluadas = (vigencia: string) => `${vigencia}__evaluadas`;
const claveCumplidas = (vigencia: string) => `${vigencia}__cumplidas`;

/** Marcador de un punto, con la forma propia de su vigencia (§10–11: no solo color). */
function Marcador({ cx, cy, forma, color, r = 4 }: { cx: number; cy: number; forma: FormaMarcador; color: string; r?: number }) {
  if (forma === "cuadrado") return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={color} />;
  if (forma === "triangulo") {
    return <polygon points={`${cx},${cy - r - 1} ${cx - r - 1},${cy + r} ${cx + r + 1},${cy + r}`} fill={color} />;
  }
  if (forma === "rombo") {
    return <polygon points={`${cx},${cy - r - 1} ${cx + r + 1},${cy} ${cx},${cy + r + 1} ${cx - r - 1},${cy}`} fill={color} />;
  }
  return <circle cx={cx} cy={cy} r={r} fill={color} />;
}

/**
 * Evolución **por seguimiento** con una línea por vigencia: cada punto
 * promedia solo las OM evaluadas en ese corte (regla dashboard §1–3, §9–11).
 *
 * - Cada vigencia se distingue por color, trazo, marcador y su nombre al final
 *   de la línea; la leyenda lo repite con símbolo.
 * - La leyenda filtra por vigencia (con teclado, `aria-pressed`): las líneas
 *   no seleccionadas se atenúan pero siguen visibles (§3).
 * - El tooltip declara cuántas OM se evaluaron y cuántas quedaron cumplidas,
 *   porque el grupo evaluado cambia de un corte a otro.
 */
export function EvolucionPorVigencia({
  series,
  vigencias,
  serie,
  ejeY,
  unidad = "%",
  meta,
  seleccionada,
  onSelect,
}: EvolucionPorVigenciaProps) {
  // Una fila por corte con una columna por vigencia; memoizado para que
  // Recharts no reinicie la animación con cada clic de selección.
  const filas = useMemo(() => {
    const porCorte = new Map<string, Fila>();
    for (const { vigencia, puntos } of series) {
      for (const punto of puntos) {
        const fila = porCorte.get(punto.corte) ?? { corte: punto.corte, etiqueta: punto.etiqueta };
        fila[vigencia] = punto.valor;
        fila[claveEvaluadas(vigencia)] = punto.evaluadas;
        fila[claveCumplidas(vigencia)] = punto.cumplidas;
        porCorte.set(punto.corte, fila);
      }
    }
    return [...porCorte.values()].sort((a, b) => String(a.corte).localeCompare(String(b.corte)));
  }, [series]);

  /** Índice de la última fila con dato de cada vigencia: ahí va su nombre. */
  const ultimoIndice = useMemo(() => {
    const indices = new Map<string, number>();
    filas.forEach((fila, i) => {
      for (const { vigencia } of series) if (fila[vigencia] !== undefined) indices.set(vigencia, i);
    });
    return indices;
  }, [filas, series]);

  const desplazamientos = useMemo(
    () =>
      desplazarEtiquetas(
        series.flatMap(({ vigencia, puntos }) => {
          const indice = ultimoIndice.get(vigencia);
          const ultimo = puntos[puntos.length - 1];
          return indice === undefined || !ultimo ? [] : [{ vigencia, indice, valor: ultimo.valor }];
        }),
      ),
    [series, ultimoIndice],
  );

  const atenuada = (vigencia: string) => Boolean(seleccionada) && seleccionada !== vigencia;

  return (
    <div className="chart-wrap chart-linea">
      <ResponsiveContainer width="100%" height={ALTO}>
        <LineChart data={filas} margin={MARGEN}>
          <CartesianGrid stroke={REJILLA.stroke} vertical={false} />
          <XAxis
            dataKey="etiqueta"
            height={ALTO_EJE_X}
            tick={EJE.tick}
            axisLine={EJE.axisLine}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            tick={EJE.tick}
            axisLine={false}
            tickLine={false}
            unit={unidad}
            width={62}
            domain={[0, 100]}
            label={{ value: ejeY, angle: -90, position: "insideLeft", style: { ...EJE.tick, textAnchor: "middle" } }}
          />
          <Tooltip
            content={(props) => {
              const { active, label, payload } = props as unknown as {
                active?: boolean;
                label?: string;
                payload?: Array<{ dataKey?: string; value?: number; payload?: Fila }>;
              };
              if (!active || !payload?.length) return null;
              return (
                <div style={TOOLTIP.contentStyle}>
                  <p style={TOOLTIP.labelStyle}>{label}</p>
                  {payload.map((item) => {
                    const vigencia = String(item.dataKey);
                    const estilo = estiloVigencia(vigencia, vigencias);
                    return (
                      <p key={vigencia} style={TOOLTIP.itemStyle}>
                        {estilo.simbolo} Vigencia {vigencia}: {serie} {item.value}
                        {unidad} · {item.payload?.[claveEvaluadas(vigencia)]} evaluadas ·{" "}
                        {item.payload?.[claveCumplidas(vigencia)]} cumplidas
                      </p>
                    );
                  })}
                </div>
              );
            }}
          />
          {meta && (
            <ReferenceLine
              y={meta.valor}
              stroke="var(--uc-gold)"
              strokeDasharray="5 4"
              // A la izquierda: los finales de línea (y sus etiquetas) están a
              // la derecha, y el rótulo de la meta no debe competir con ellos.
              label={{
                value: meta.label,
                position: "insideTopLeft",
                style: { fill: "var(--uc-gold)", fontSize: 11, fontWeight: 600 },
              }}
            />
          )}
          {series.map(({ vigencia }) => {
            const estilo = estiloVigencia(vigencia, vigencias);
            const opacidad = atenuada(vigencia) ? OPACIDAD_ATENUADA : 1;
            const destacada = seleccionada === vigencia;
            return (
              <Line
                key={vigencia}
                type="monotone"
                dataKey={vigencia}
                name={`Vigencia ${vigencia}`}
                stroke={estilo.color}
                strokeDasharray={estilo.trazo}
                strokeWidth={destacada ? 3.5 : 2.25}
                strokeOpacity={opacidad}
                connectNulls
                isAnimationActive
                animationDuration={ANIMACION_MS}
                dot={(props: unknown) => {
                  const { cx, cy, index, value } = props as {
                    cx?: number;
                    cy?: number;
                    index?: number;
                    value?: number | null;
                  };
                  if (cx == null || cy == null || value == null) return <g key={`${vigencia}-${index}`} />;
                  return (
                    <g key={`${vigencia}-${index}`} opacity={opacidad}>
                      <Marcador cx={cx} cy={cy} forma={estilo.marcador} color={estilo.color} r={destacada ? 5 : 4} />
                    </g>
                  );
                }}
                activeDot={{ r: 6, fill: estilo.color }}
              >
                <LabelList
                  dataKey={vigencia}
                  content={(props) => {
                    const { index, x, y, value } = props as {
                      index?: number;
                      x?: number | string;
                      y?: number | string;
                      value?: number;
                    };
                    // Solo el último punto de cada línea lleva el nombre de la
                    // vigencia y su valor: identifica la serie sin depender del
                    // color. Crece hacia la izquierda (`end`) para no salirse por
                    // el borde derecho, y baja si choca con otra etiqueta.
                    if (index !== ultimoIndice.get(vigencia) || value == null) return null;
                    return (
                      <text
                        x={Number(x) + 4}
                        y={Number(y) + ENCIMA + (desplazamientos.get(vigencia) ?? 0)}
                        textAnchor="end"
                        opacity={opacidad}
                        style={{ fill: estilo.color, fontSize: 11, fontWeight: destacada ? 700 : 600 }}
                      >
                        {vigencia} · {value}
                        {unidad}
                      </text>
                    );
                  }}
                />
              </Line>
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      <LeyendaInteractiva
        items={series.map(({ vigencia, puntos }) => {
          const estilo = estiloVigencia(vigencia, vigencias);
          const ultimo = puntos[puntos.length - 1];
          return {
            clave: vigencia,
            label: `Vigencia ${vigencia}`,
            color: estilo.color,
            simbolo: estilo.simbolo,
            valor: ultimo ? `${ultimo.valor}${unidad} · ${ultimo.evaluadas} evaluadas` : "",
          };
        })}
        seleccionado={seleccionada ?? null}
        onSelect={onSelect}
        descripcion="Filtrar por vigencia"
      />
    </div>
  );
}
