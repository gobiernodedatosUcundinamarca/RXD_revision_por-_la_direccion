import { AyudaCalculo } from "@/components/ui/AyudaCalculo";

/** Indicador clave de la cabecera del tablero (regla dashboard §5). */
export interface KPI {
  label: string;
  /** Valor ya formateado (con `%` o separadores de miles cuando corresponda). */
  value: string;
  /** Variación respecto al corte anterior (§5: «↑/↓ con color»). */
  delta?: { label: string; direccion: "sube" | "baja" | "neutro" };
  /** Meta, base de cálculo o aclaración de lectura. */
  nota?: string;
  /** Cómo se calcula el indicador: se muestra en el ícono «!» de la etiqueta. */
  formula?: string;
}

const FLECHA = { sube: "↑", baja: "↓", neutro: "→" } as const;

/**
 * Fila de indicadores clave. Abre todos los tableros; normalmente se usa a
 * través de `DashboardShell` (regla dashboard §5, §7).
 *
 * La variación se señala con flecha **y** color, nunca solo con color
 * (regla dashboard §8–9, §11).
 */
export function KPIRow({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="kpi-row">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="kpi">
          <div className="k-label">
            {kpi.label}
            {kpi.formula && <AyudaCalculo cifra={kpi.label} texto={kpi.formula} />}
          </div>
          <div className="k-val">{kpi.value}</div>
          {kpi.delta && (
            <div className={`k-delta ${kpi.delta.direccion}`}>
              <span aria-hidden="true">{FLECHA[kpi.delta.direccion]}</span>
              {kpi.delta.label}
            </div>
          )}
          {kpi.nota && <div className="k-nota">{kpi.nota}</div>}
        </div>
      ))}
    </div>
  );
}
