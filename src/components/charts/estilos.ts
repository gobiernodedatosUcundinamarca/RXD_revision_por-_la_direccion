/**
 * Estilos compartidos por todas las gráficas (DRY — CLAUDE.md §6).
 *
 * Recharts necesita estilos en línea para tooltips y ejes, así que se definen
 * una sola vez aquí y siempre sobre tokens institucionales, nunca sobre HEX
 * sueltos (regla visual §1.7). Garantiza además tipografías, tamaños y
 * contrastes uniformes entre gráficas (regla dashboard §10–11).
 */

/** Tooltip de contraste alto sobre verde institucional oscuro. */
export const TOOLTIP = {
  contentStyle: {
    background: "var(--uc-green-dark)",
    border: "none",
    borderRadius: 9,
    color: "#fff",
    fontSize: 12,
    padding: "8px 11px",
    boxShadow: "var(--shadow-hover)",
  },
  labelStyle: { color: "#fff", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#fff" },
  cursor: { fill: "var(--uc-tint)" },
} as const;

/** Marcas de eje: tamaño legible y color de texto secundario. */
export const EJE = {
  tick: { fontSize: 11, fill: "var(--uc-text-secondary)" },
  axisLine: { stroke: "var(--uc-hairline-strong)" },
} as const;

/**
 * Rejilla discreta, solo horizontal, para no competir con los datos.
 *
 * Trazo **continuo** a propósito: una rejilla punteada añade ruido y se lee como
 * «proyección» o «umbral» cuando solo es una guía. El discontinuo se reserva
 * para las líneas de referencia, donde sí significa un umbral.
 */
export const REJILLA = {
  stroke: "var(--uc-hairline)",
} as const;

/** Opacidad de los elementos no seleccionados: atenuados pero visibles (§3). */
export const OPACIDAD_ATENUADA = 0.32;

/** Duración de las animaciones de entrada, unificada entre gráficas. */
export const ANIMACION_MS = 700;

export type FormaMarcador = "circulo" | "cuadrado" | "triangulo" | "rombo";

export interface EstiloSerie {
  color: string;
  /** Patrón de trazo SVG; `undefined` es línea continua. */
  trazo?: string;
  marcador: FormaMarcador;
  /** Mismo marcador como carácter, para leyendas y tooltips. */
  simbolo: string;
}

const ESTILOS_ANTERIORES: Omit<EstiloSerie, "color">[] = [
  { trazo: "7 4", marcador: "cuadrado", simbolo: "■" },
  { trazo: "2 4", marcador: "triangulo", simbolo: "▲" },
  { trazo: "10 3 2 3", marcador: "rombo", simbolo: "◆" },
];

/**
 * Estilo de una vigencia en las gráficas de evolución, definido una sola vez
 * para que cada vigencia se vea igual en todas las vistas (regla dashboard §10).
 *
 * La más reciente lleva el verde institucional y las anteriores el gris oscuro
 * neutro: la vista no pasa de un color principal (regla visual §1). Cada una
 * se distingue además por trazo y marcador, nunca solo por color (§10–11).
 *
 * @param vigencia Vigencia a dibujar.
 * @param todas Todas las vigencias del sistema (no solo las filtradas), para
 *   que el estilo de una vigencia no cambie al filtrar.
 */
export function estiloVigencia(vigencia: string, todas: string[]): EstiloSerie {
  const desdeLaMasReciente = [...todas].sort().reverse().indexOf(vigencia);
  if (desdeLaMasReciente <= 0) return { color: "var(--uc-green)", marcador: "circulo", simbolo: "●" };
  const estilo = ESTILOS_ANTERIORES[(desdeLaMasReciente - 1) % ESTILOS_ANTERIORES.length] ?? {
    marcador: "cuadrado",
    simbolo: "■",
  };
  return { color: "var(--uc-gray-dark)", ...estilo };
}
