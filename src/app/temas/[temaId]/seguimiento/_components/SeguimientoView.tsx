"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ChartCard } from "@/components/charts/ChartCard";
import { EvolucionPorVigencia } from "@/components/charts/EvolucionPorVigencia";
import { EstadoVacio } from "@/components/dashboard/EstadoVacio";
import { EstadoTag } from "@/components/dashboard/EstadoTag";
import { useTableroOM } from "@/features/dashboard/useTableroOM";
import { construirKPIs } from "@/features/dashboard/kpis";
import { seriesEvolucion, vigenciasDe } from "@/features/dashboard/evolucion";
import {
  colorClasificacion,
  colorEstado,
  entregaLegible,
  estadoDeOM,
  etiquetaEstado,
  formatearFecha,
  simboloClasificacion,
  simboloEstado,
} from "@/lib/om/avance";
import { hitosPorCorte, ordenarPorRezago } from "@/lib/om/metricas";
import { ESTADO_OM, EVOLUCION_AVANCE, HITOS_CORTE } from "@/lib/om/explicaciones";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";

/**
 * Cronología del seguimiento: qué se evaluó en cada corte y cómo evolucionó
 * cada oportunidad de mejora a lo largo de ellos.
 */
export function SeguimientoView({ temaId }: { temaId: string }) {
  const { todas, oms, omsIgnorando, filtros, activos, controles, fijar, alternar, limpiar } =
    useTableroOM(temaId);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const kpis = useMemo(() => construirKPIs(oms, todas), [oms, todas]);
  const hitos = useMemo(() => hitosPorCorte(oms), [oms]);

  const series = useMemo(() => seriesEvolucion(omsIgnorando("vigencia"), "avance"), [omsIgnorando]);
  const vigencias = useMemo(() => vigenciasDe(todas), [todas]);

  // Se prioriza lo rezagado: es donde el historial de cortes aporta más.
  const rezagadas = useMemo(() => ordenarPorRezago(oms), [oms]);
  const detalle = useMemo(
    () => rezagadas.find((om) => om.id === seleccionada) ?? rezagadas[0],
    [rezagadas, seleccionada],
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
        title="Avance en cada corte de seguimiento, por vigencia"
        sub="Avance promedio de las OM evaluadas en cada corte · una línea por vigencia · escala 0–2 en %"
        calculo={EVOLUCION_AVANCE}
        estado={series.length === 0 ? "vacio" : "ok"}
        filtrada={activos}
        mensajeVacio="No existen cortes de seguimiento para los filtros seleccionados."
        ancha
      >
        <EvolucionPorVigencia
          series={series}
          vigencias={vigencias}
          serie="avance"
          ejeY="Avance (%)"
          seleccionada={filtros.vigencia || null}
          onSelect={(vigencia) => alternar("vigencia", vigencia)}
        />
      </ChartCard>

      <div className="grid-2a">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-titulo">
                <h3>Cortes de seguimiento</h3>
                <AyudaCalculo cifra="Cortes de seguimiento" texto={HITOS_CORTE} />
              </div>
              <div className="card-sub">
                Del más reciente al más antiguo · cada corte cuenta solo las OM evaluadas ese día; la
                variación compara esas mismas OM con su calificación anterior
              </div>
            </div>
            {activos && <span className="filtered-badge">Filtrada</span>}
          </div>

          {hitos.length === 0 ? (
            <EstadoVacio />
          ) : (
            <ol className="cortes">
              {hitos.map((hito) => (
                <li key={hito.corte} className="corte">
                  <div className="corte-marca" aria-hidden="true">
                    <span className="corte-punto" />
                  </div>
                  <div className="corte-cuerpo">
                    <div className="corte-head">
                      <b>{formatearFecha(hito.corte)}</b>
                      <span className={`corte-var ${variacionClase(hito.variacion)}`}>
                        {hito.variacion === null
                          ? "Primera evaluación"
                          : `${hito.variacion > 0 ? "↑ +" : hito.variacion < 0 ? "↓ " : "→ "}${
                              hito.variacion === 0 ? "sin cambio" : `${Math.abs(hito.variacion)} pp`
                            } vs su calificación anterior`}
                      </span>
                    </div>
                    <div className="corte-cifras">
                      <span>
                        OM evaluadas <b>{hito.evaluadas}</b>
                      </span>
                      <span>
                        Avance <b>{hito.avance}%</b>
                      </span>
                      <span>
                        Cumplidas <b>{hito.cumplidas}</b> de {hito.evaluadas}
                      </span>
                      <span>
                        Vigencia{hito.vigencias.length > 1 ? "s" : ""} <b>{hito.vigencias.join(", ")}</b>
                      </span>
                    </div>
                    <p className="corte-meta">Evaluó: {hito.funcionarios.join(" · ")}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Historial de una oportunidad de mejora</h3>
              <div className="card-sub">
                Seleccione una OM para ver su calificación corte a corte
              </div>
            </div>
          </div>

          {rezagadas.length === 0 ? (
            <EstadoVacio />
          ) : (
            <>
              <div className="filter-field om-selector">
                <label htmlFor="om-historial">Oportunidad</label>
                <select
                  id="om-historial"
                  className="filter-select"
                  value={detalle?.id ?? ""}
                  onChange={(evento) => setSeleccionada(evento.target.value)}
                >
                  {rezagadas.map((om) => (
                    <option key={om.id} value={om.id}>
                      {om.vigencia}
                      {om.numero !== null ? ` · PM ${om.numero}` : ""} — {recortar(om.oportunidad)}
                    </option>
                  ))}
                </select>
              </div>

              {detalle && (
                <div className="historial">
                  <p className="om-titulo">{detalle.oportunidad}</p>
                  <p className="om-meta">
                    {detalle.responsable || "Sin registrar"} · Entrega comprometida: {entregaLegible(detalle)}
                  </p>
                  <p className="om-meta">
                    Estado vigente
                    <AyudaCalculo cifra="Estado vigente" texto={ESTADO_OM} />:{" "}
                    <EstadoTag
                      color={colorEstado(estadoDeOM(detalle))}
                      simbolo={simboloEstado(estadoDeOM(detalle))}
                      label={etiquetaEstado(estadoDeOM(detalle))}
                    />
                  </p>

                  {detalle.seguimientos.length === 0 ? (
                    <EstadoVacio mensaje="Esta oportunidad de mejora no registra cortes de seguimiento." />
                  ) : (
                    <ol className="cortes cortes-compactos">
                      {[...detalle.seguimientos].reverse().map((seguimiento) => (
                        <li key={`${seguimiento.corte}-${seguimiento.funcionario}`} className="corte">
                          <div className="corte-marca" aria-hidden="true">
                            <span
                              className="corte-punto"
                              style={{ background: colorClasificacion(seguimiento.clasificacion) }}
                            />
                          </div>
                          <div className="corte-cuerpo">
                            <div className="corte-head">
                              <b>{formatearFecha(seguimiento.corte)}</b>
                              <EstadoTag
                                color={colorClasificacion(seguimiento.clasificacion)}
                                simbolo={simboloClasificacion(seguimiento.clasificacion)}
                                label={
                                  seguimiento.clasificacion === null
                                    ? "Sin calificar"
                                    : `Calificación ${seguimiento.clasificacion} de 2`
                                }
                              />
                            </div>
                            <p className="corte-observacion">
                              {seguimiento.observacion || "Sin observación registrada."}
                            </p>
                            <p className="corte-meta">Evaluó: {seguimiento.funcionario}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

/** Clase de color de la variación entre cortes (siempre acompañada de flecha). */
function variacionClase(variacion: number | null): string {
  if (variacion === null || variacion === 0) return "neutro";
  return variacion > 0 ? "sube" : "baja";
}

/** Recorta el texto de la OM para que quepa en una opción del selector. */
function recortar(texto: string, maximo = 70): string {
  return texto.length > maximo ? `${texto.slice(0, maximo).trimEnd()}…` : texto;
}
