"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ChartCard } from "@/components/charts/ChartCard";
import { BarrasCategoria } from "@/components/charts/BarrasCategoria";
import { EstadoTag } from "@/components/dashboard/EstadoTag";
import { EstadoVacio } from "@/components/dashboard/EstadoVacio";
import { useTableroOM } from "@/features/dashboard/useTableroOM";
import { construirKPIs } from "@/features/dashboard/kpis";
import { avanceDeOM, colorEstado, entregaLegible, etiquetaEstado, simboloEstado } from "@/lib/om/avance";
import { avancePorResponsable } from "@/lib/om/metricas";
import { estadoDeOM } from "@/lib/om/avance";
import { AVANCE_POR_RESPONSABLE, CUMPLIDAS, SIN_CERRAR } from "@/lib/om/explicaciones";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";

/** Responsables mostrados en la gráfica; el resto queda disponible en la tabla. */
const MAX_RESPONSABLES_GRAFICA = 12;

/**
 * Desempeño del seguimiento por responsable, agrupado por el **texto literal**
 * del campo «Responsable» tal como se registró — no por las áreas canónicas que
 * el ETL reconoce en él. Cada OM cuenta en un solo grupo, así que la tabla es
 * una partición completa del conjunto (a diferencia de una agrupación por área,
 * donde una OM con varios responsables contaría en más de una fila).
 *
 * La selección de un responsable es **local a esta vista**: no forma parte del
 * filtro global (`FiltrosOM`) porque el texto libre tiene demasiadas variantes
 * para servir como dimensión compartida con el resto del tablero.
 */
export function ResponsablesView({ temaId }: { temaId: string }) {
  const { todas, oms, filtros, activos, controles, fijar, limpiar } = useTableroOM(temaId);

  const kpis = useMemo(() => construirKPIs(oms, todas), [oms, todas]);

  const responsables = useMemo(() => avancePorResponsable(oms), [oms]);
  /** La gráfica muestra solo una parte de los responsables. */
  const recortada = responsables.length > MAX_RESPONSABLES_GRAFICA;

  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const alternarSeleccion = (clave: string) =>
    setSeleccionado((actual) => (actual === clave ? null : clave));

  // Referencia estable: si el array se recreara en cada render, Recharts
  // reiniciaría la animación de entrada con cada clic de selección.
  const responsablesGrafica = useMemo(
    () =>
      responsables.slice(0, MAX_RESPONSABLES_GRAFICA).map((responsable) => ({
        clave: responsable.clave,
        etiqueta: responsable.clave,
        valor: responsable.avance,
        detalle: `${responsable.cumplidas} de ${responsable.total} cumplidas`,
      })),
    [responsables],
  );

  const omsDelSeleccionado = useMemo(
    () => (seleccionado ? oms.filter((om) => (om.responsable || "Sin registrar") === seleccionado) : []),
    [oms, seleccionado],
  );

  return (
    <DashboardShell
      kpis={kpis}
      filtros={controles}
      valores={filtros}
      onFilterChange={(campo, valor) => fijar(campo as never, valor)}
      onClearAll={limpiar}
    >
      <ChartCard
        title={
          recortada
            ? `Avance promedio por responsable — los ${MAX_RESPONSABLES_GRAFICA} con mayor carga de ${responsables.length}`
            : `Avance promedio por responsable — ${responsables.length === 1 ? "el único registrado" : `los ${responsables.length}`}`
        }
        sub={
          recortada
            ? "Texto tal como se registró, sin dividir · se eligen los de más OM y se ordenan de mayor a menor avance · clic en una barra para ver su detalle"
            : "Texto tal como se registró, sin dividir · ordenados de mayor a menor avance · clic en una barra para ver su detalle"
        }
        calculo={AVANCE_POR_RESPONSABLE}
        estado={responsablesGrafica.length === 0 ? "vacio" : "ok"}
        // Se marca filtrada tanto por los filtros generales, que cambian las
        // barras, como por la selección de un responsable, que las resalta.
        filtrada={activos || Boolean(seleccionado)}
        ancha
      >
        <BarrasCategoria
          data={responsablesGrafica}
          orientacion="horizontal"
          seleccionado={seleccionado}
          onSelect={alternarSeleccion}
          ejeValor="Eje horizontal: avance promedio (%). Eje vertical: responsable, tal como se registró."
        />
      </ChartCard>

      <div className="grid-2a">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Carga y avance por responsable</h3>
              <div className="card-sub">
                Una fila por cada redacción distinta de «Responsable»; cada OM cuenta en una sola fila
              </div>
            </div>
            {activos && <span className="filtered-badge">Filtrada</span>}
          </div>

          {responsables.length === 0 ? (
            <EstadoVacio />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">
                  Responsables con su número de OM, cumplidas, pendientes y avance promedio
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Responsable</th>
                    <th scope="col" className="num">
                      OM
                    </th>
                    <th scope="col" className="num">
                      Cumplidas
                      <AyudaCalculo cifra="Cumplidas" texto={CUMPLIDAS} />
                    </th>
                    <th scope="col" className="num">
                      Sin cerrar
                      <AyudaCalculo cifra="Sin cerrar" texto={SIN_CERRAR} />
                    </th>
                    <th scope="col" className="pct">
                      Avance
                      <AyudaCalculo cifra="Avance" texto={AVANCE_POR_RESPONSABLE} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {responsables.map((responsable) => {
                    const activa = seleccionado === responsable.clave;
                    return (
                      <tr key={responsable.clave} className={activa ? "fila-activa" : undefined}>
                        <th scope="row" className="celda-nombre">
                          <button
                            type="button"
                            className="celda-filtro"
                            aria-pressed={activa}
                            onClick={() => alternarSeleccion(responsable.clave)}
                          >
                            {activa && <span aria-hidden="true">✓ </span>}
                            {responsable.clave}
                          </button>
                        </th>
                        <td className="num">{responsable.total}</td>
                        <td className="num">{responsable.cumplidas}</td>
                        <td className="num">{responsable.sinCerrar}</td>
                        <td className="pct pct-green">{responsable.avance}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Oportunidades de mejora del responsable seleccionado</h3>
              <div className="card-sub">
                {seleccionado
                  ? `${omsDelSeleccionado.length} OM a cargo de «${seleccionado}»`
                  : "Selecciona un responsable en la gráfica o la tabla"}
              </div>
            </div>
          </div>

          {!seleccionado ? (
            <EstadoVacio mensaje="Ningún responsable seleccionado todavía." />
          ) : omsDelSeleccionado.length === 0 ? (
            <EstadoVacio />
          ) : (
            <ul className="om-lista om-lista-compacta">
              {omsDelSeleccionado.map((om) => {
                const estado = estadoDeOM(om);
                const avance = avanceDeOM(om);
                return (
                  <li key={om.id} className="om-item">
                    <div className="om-item-head">
                      <span className="om-ref">
                        {om.vigencia}
                        {om.numero !== null ? ` · PM ${om.numero}` : ""}
                      </span>
                      <EstadoTag
                        color={colorEstado(estado)}
                        simbolo={simboloEstado(estado)}
                        label={`${etiquetaEstado(estado)} · ${avance}%`}
                      />
                    </div>
                    <p className="om-titulo">{om.oportunidad}</p>
                    <p className="om-meta">Entrega comprometida: {entregaLegible(om)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
