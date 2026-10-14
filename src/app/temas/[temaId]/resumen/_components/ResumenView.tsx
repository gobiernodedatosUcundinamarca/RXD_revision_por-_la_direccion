"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EstadoTag } from "@/components/dashboard/EstadoTag";
import { ChartCard } from "@/components/charts/ChartCard";
import { EvolucionPorVigencia } from "@/components/charts/EvolucionPorVigencia";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarrasCategoria } from "@/components/charts/BarrasCategoria";
import { LeyendaInteractiva } from "@/components/charts/LeyendaInteractiva";
import { useTableroOM } from "@/features/dashboard/useTableroOM";
import { construirKPIs } from "@/features/dashboard/kpis";
import { seriesEvolucion, vigenciasDe } from "@/features/dashboard/evolucion";
import {
  avanceDeOM,
  colorEstado,
  entregaLegible,
  etiquetaEstado,
  simboloEstado,
} from "@/lib/om/avance";
import {
  avancePorVigencia,
  distribucionPorEstado,
  ordenarPorRezago,
  ultimaObservacion,
} from "@/lib/om/metricas";
import { estadoDeOM } from "@/lib/om/avance";
import {
  AVANCE_OM,
  AVANCE_POR_VIGENCIA,
  COMPOSICION_ESTADO,
  EVOLUCION_AVANCE,
  REZAGO,
} from "@/lib/om/explicaciones";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";

/** Cuántas OM rezagadas se listan en el panel de atención prioritaria. */
const MAX_PRIORITARIAS = 6;

/**
 * Panorama del sistema de gestión: evolución del avance, composición por estado
 * y por vigencia, y las OM que exigen atención.
 *
 * Cada gráfica filtra por su propia dimensión y responde a las selecciones de
 * las demás a través del contexto compartido (regla dashboard §3–4).
 */
export function ResumenView({ temaId }: { temaId: string }) {
  const { todas, oms, omsIgnorando, filtros, activos, controles, fijar, alternar, limpiar } =
    useTableroOM(temaId);

  const kpis = useMemo(() => construirKPIs(oms, todas), [oms, todas]);

  // Una línea por vigencia: se calcula ignorando el filtro de vigencia, que la
  // propia gráfica controla desde su leyenda (la selección atenúa las demás).
  const series = useMemo(() => seriesEvolucion(omsIgnorando("vigencia"), "avance"), [omsIgnorando]);
  const vigencias = useMemo(() => vigenciasDe(todas), [todas]);

  // El donut filtra por estado: se calcula ignorando ese mismo filtro para no
  // reducirse al único segmento seleccionado.
  const porEstado = useMemo(() => distribucionPorEstado(omsIgnorando("estado")), [omsIgnorando]);
  const porVigencia = useMemo(() => avancePorVigencia(omsIgnorando("vigencia")), [omsIgnorando]);

  const prioritarias = useMemo(
    () => ordenarPorRezago(oms.filter((om) => estadoDeOM(om) !== "cumplida")).slice(0, MAX_PRIORITARIAS),
    [oms],
  );

  // Referencias estables: si estos arrays se recrearan en cada render, Recharts
  // reiniciaría la animación de entrada con cada clic de selección.
  const barrasVigencia = useMemo(
    () =>
      porVigencia.map((grupo) => ({
        clave: grupo.clave,
        etiqueta: grupo.clave,
        valor: grupo.avance,
        detalle: `${grupo.cumplidas} de ${grupo.total} cumplidas`,
      })),
    [porVigencia],
  );

  const leyendaEstados = useMemo(
    () =>
      porEstado.map((segmento) => ({
        clave: segmento.clave,
        label: segmento.name,
        color: segmento.color,
        valor: `${segmento.value} OM`,
        simbolo: simboloEstado(segmento.estado),
      })),
    [porEstado],
  );

  const totalEstados = porEstado.reduce((suma, segmento) => suma + segmento.value, 0);

  return (
    <DashboardShell
      kpis={kpis}
      filtros={controles}
      valores={filtros}
      onFilterChange={(campo, valor) => fijar(campo as never, valor)}
      onClearAll={limpiar}
    >
      <div className="grid-2a">
        <ChartCard
          title="Evolución del avance por seguimiento y vigencia"
          sub="Avance promedio de las OM evaluadas en cada corte · una línea por vigencia · escala 0–2 en %"
          calculo={EVOLUCION_AVANCE}
          estado={series.length === 0 ? "vacio" : "ok"}
          filtrada={activos}
          mensajeVacio="No existen cortes de seguimiento para los filtros seleccionados."
        >
          <EvolucionPorVigencia
            series={series}
            vigencias={vigencias}
            serie="avance"
            ejeY="Avance (%)"
            meta={{ valor: 100, label: "Cierre total" }}
            seleccionada={filtros.vigencia || null}
            onSelect={(vigencia) => alternar("vigencia", vigencia)}
          />
          <p className="chart-highlight">
            Cada punto promedia solo las oportunidades evaluadas en ese seguimiento, igual que la fila de
            promedios del libro de cada vigencia.
          </p>
        </ChartCard>

        <ChartCard
          title="Composición por estado de avance"
          sub="Número de OM según su última calificación · clic en un segmento para filtrar todo el tablero"
          calculo={COMPOSICION_ESTADO}
          estado={porEstado.length === 0 ? "vacio" : "ok"}
          filtrada={Boolean(filtros.estado)}
        >
          <DonutChart
            data={porEstado}
            seleccionado={filtros.estado || null}
            onSelect={(clave) => alternar("estado", clave)}
            centro={{ valor: String(totalEstados), etiqueta: "OM" }}
          />
          <LeyendaInteractiva
            items={leyendaEstados}
            seleccionado={filtros.estado || null}
            onSelect={(clave) => alternar("estado", clave)}
            descripcion="Filtrar por estado de avance"
          />
        </ChartCard>
      </div>

      <div className="grid-2b">
        <ChartCard
          title="Avance promedio por vigencia de la RXD"
          sub="Ordenado de mayor a menor avance, no por año · clic en una barra para filtrar"
          calculo={AVANCE_POR_VIGENCIA}
          estado={porVigencia.length === 0 ? "vacio" : "ok"}
          filtrada={Boolean(filtros.vigencia)}
        >
          <BarrasCategoria
            data={barrasVigencia}
            seleccionado={filtros.vigencia || null}
            onSelect={(clave) => alternar("vigencia", clave)}
            ejeValor="Eje vertical: avance promedio (%). Eje horizontal: vigencia del ciclo de RXD."
          />
        </ChartCard>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-titulo">
                <h3>Oportunidades de mejora con mayor rezago</h3>
                <AyudaCalculo
                  cifra="Oportunidades de mejora con mayor rezago"
                  texto={`${REZAGO} ${AVANCE_OM}`}
                />
              </div>
              <div className="card-sub">Sin cerrar, ordenadas de menor a mayor avance</div>
            </div>
            {activos && <span className="filtered-badge">Filtrada</span>}
          </div>

          {prioritarias.length === 0 ? (
            <div className="estado-vacio">
              <div className="ev-ic" aria-hidden="true">
                ✓
              </div>
              <p>
                No hay oportunidades de mejora sin cerrar para los filtros seleccionados.
              </p>
            </div>
          ) : (
            <ul className="om-lista om-lista-compacta">
              {prioritarias.map((om) => {
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
                    <p className="om-meta">{om.responsable || "Sin registrar"}</p>
                  </li>
                );
              })}
            </ul>
          )}

          <Link href={`/temas/${temaId}/datos`} className="card-link">
            Ver todas las oportunidades de mejora →
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Última observación de la OM más rezagada</h3>
            <div className="card-sub">
              Observación registrada en el corte más reciente de la OM con mayor rezago
            </div>
          </div>
        </div>
        <div className="card-body">
          {prioritarias[0] ? (
            <>
              <p className="om-titulo">{prioritarias[0].oportunidad}</p>
              <p className="om-meta">
                Responsable: {prioritarias[0].responsable || "Sin registrar"} · Entrega comprometida:{" "}
                {entregaLegible(prioritarias[0])}
              </p>
              <p className="om-observacion">
                {ultimaObservacion(prioritarias[0]) || "Sin observación registrada."}
              </p>
            </>
          ) : (
            <p className="om-meta">Sin OM pendientes que reportar.</p>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
