import type { ReactNode } from "react";
import { EstadoVacio } from "@/components/dashboard/EstadoVacio";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";

/** Estados obligatorios de toda gráfica (regla dashboard §9). */
export type EstadoGrafica = "ok" | "cargando" | "error" | "vacio";

interface ChartCardProps {
  /** Título descriptivo, obligatorio (regla dashboard §1). */
  title: string;
  /** Variable, periodo, unidad o población — cuando el título solo no baste (§1). */
  sub?: string;
  /** Cómo se calculan los valores de la gráfica: ícono «!» junto al título. */
  calculo?: string;
  /** Estado de la gráfica; por defecto se pinta el contenido (§9). */
  estado?: EstadoGrafica;
  /** Indica que la gráfica muestra una selección activa (§9 «Filtrada»). */
  filtrada?: boolean;
  /** Mensaje del estado «Sin datos» cuando el filtro no deja registros (§4). */
  mensajeVacio?: string;
  /** Acción de reintento del estado «Error» (§9). */
  onReintentar?: () => void;
  /** Ocupa dos columnas de la cuadrícula: para gráficas con muchas categorías (§8). */
  ancha?: boolean;
  children: ReactNode;
}

/**
 * Envoltura obligatoria de toda gráfica (regla dashboard §12; CLAUDE.md §5.3).
 *
 * Centraliza el contrato que ninguna gráfica puede incumplir: título, subtítulo,
 * distintivo de «filtrada» y los estados Cargando / Sin datos / Error. El
 * contenido (Recharts, tabla, lista) lo aporta cada gráfica, que así solo se
 * ocupa de pintar (SOLID «S»).
 *
 * @example
 * <ChartCard
 *   title="Avance promedio por vigencia de la RXD"
 *   sub="Escala 0–2 expresada en % · 2022–2025"
 *   estado={barras.length === 0 ? "vacio" : "ok"}
 *   filtrada={hayFiltros}
 * >
 *   <BarrasCategoria data={barras} />
 * </ChartCard>
 */
export function ChartCard({
  title,
  sub,
  calculo,
  estado = "ok",
  filtrada,
  mensajeVacio,
  onReintentar,
  ancha,
  children,
}: ChartCardProps) {
  return (
    <div className={`card${ancha ? " card-ancha" : ""}`}>
      <div className="card-head">
        <div>
          <div className="card-titulo">
            <h3>{title}</h3>
            {calculo && <AyudaCalculo cifra={title} texto={calculo} />}
          </div>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
        {filtrada && estado === "ok" && (
          <span className="filtered-badge">
            <span aria-hidden="true">⛃</span> Filtrada
          </span>
        )}
      </div>

      {estado === "cargando" && (
        <div className="chart-skeleton" role="status" aria-live="polite">
          <span className="sr-only">Cargando datos de la gráfica…</span>
          <div className="sk-barra" />
          <div className="sk-barra" />
          <div className="sk-barra" />
        </div>
      )}

      {estado === "error" && (
        <div className="chart-error" role="alert">
          <div className="ce-ic" aria-hidden="true">
            !
          </div>
          <p>No fue posible cargar los datos de esta gráfica.</p>
          {onReintentar && (
            <button type="button" className="filter-clear" onClick={onReintentar}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {estado === "vacio" && <EstadoVacio mensaje={mensajeVacio} />}

      {estado === "ok" && children}
    </div>
  );
}
