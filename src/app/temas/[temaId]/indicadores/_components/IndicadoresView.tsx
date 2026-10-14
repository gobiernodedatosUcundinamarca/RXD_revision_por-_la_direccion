"use client";

import { useMemo } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ChartCard } from "@/components/charts/ChartCard";
import { EvolucionPorVigencia } from "@/components/charts/EvolucionPorVigencia";
import { EstadoVacio } from "@/components/dashboard/EstadoVacio";
import { useTableroOM } from "@/features/dashboard/useTableroOM";
import { construirKPIs } from "@/features/dashboard/kpis";
import { seriesEvolucion, vigenciasDe } from "@/features/dashboard/evolucion";
import { EVOLUCION_CIERRE } from "@/lib/om/explicaciones";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";
import { construirIndicadores } from "../_lib/indicadores";

/**
 * Indicadores de gestión del seguimiento a OM, contrastados con umbrales de
 * lectura, más la evolución de la tasa de cierre (regla dashboard §5, §9–11).
 */
export function IndicadoresView({ temaId }: { temaId: string }) {
  const { todas, oms, omsIgnorando, filtros, activos, controles, fijar, alternar, limpiar } =
    useTableroOM(temaId);

  const kpis = useMemo(() => construirKPIs(oms, todas), [oms, todas]);
  const indicadores = useMemo(() => construirIndicadores(oms, todas), [oms, todas]);

  const seriesCierre = useMemo(
    () => seriesEvolucion(omsIgnorando("vigencia"), "tasaCierre"),
    [omsIgnorando],
  );
  const vigencias = useMemo(() => vigenciasDe(todas), [todas]);

  return (
    <DashboardShell
      kpis={kpis}
      filtros={controles}
      valores={filtros}
      onFilterChange={(campo, valor) => fijar(campo as never, valor)}
      onClearAll={limpiar}
    >
      <ChartCard
        title="Evolución de la tasa de cierre por seguimiento y vigencia"
        sub="Porcentaje de las OM evaluadas en cada corte que quedaron cumplidas (calificación 2) · una línea por vigencia"
        calculo={EVOLUCION_CIERRE}
        estado={seriesCierre.length === 0 ? "vacio" : "ok"}
        filtrada={activos}
        mensajeVacio="No existen cortes de seguimiento para los filtros seleccionados."
      >
        <EvolucionPorVigencia
          series={seriesCierre}
          vigencias={vigencias}
          serie="tasa de cierre"
          ejeY="OM cumplidas (%)"
          meta={{ valor: 80, label: "Referencia 80 %" }}
          seleccionada={filtros.vigencia || null}
          onSelect={(vigencia) => alternar("vigencia", vigencia)}
        />
      </ChartCard>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Indicadores de gestión del seguimiento</h3>
            <div className="card-sub">
              Calculados sobre las {oms.length} oportunidades de mejora seleccionadas · escala institucional 0–2
            </div>
          </div>
          {activos && <span className="filtered-badge">Filtrada</span>}
        </div>

        {oms.length === 0 ? (
          <EstadoVacio />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">
                Indicadores de gestión con su valor, referencia de lectura y base de cálculo
              </caption>
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
                  <th scope="col" className="num">
                    Valor
                  </th>
                  <th scope="col" className="num">
                    Referencia
                  </th>
                  <th scope="col">Base de cálculo</th>
                </tr>
              </thead>
              <tbody>
                {indicadores.map((indicador) => (
                  <tr key={indicador.id}>
                    <th scope="row" className="celda-nombre">
                      {indicador.nombre}
                      <AyudaCalculo cifra={indicador.nombre} texto={indicador.formula} />
                    </th>
                    <td className="num destacado">{indicador.valor}</td>
                    <td className="num">{indicador.referencia}</td>
                    <td className="celda-base">{indicador.base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="nota-pie">
          Las referencias son umbrales de lectura definidos para este tablero con el fin de priorizar
          la atención; no sustituyen las metas institucionales aprobadas para cada sistema de
          gestión.
        </p>
      </div>
    </DashboardShell>
  );
}
