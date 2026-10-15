"use client";

import { Fragment, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EstadoVacio } from "@/components/dashboard/EstadoVacio";
import { EstadoTag } from "@/components/dashboard/EstadoTag";
import { useTableroOM } from "@/features/dashboard/useTableroOM";
import { construirKPIs } from "@/features/dashboard/kpis";
import type { OportunidadMejora } from "@/types";
import {
  avanceDeOM,
  colorClasificacion,
  colorEstado,
  entregaLegible,
  estadoDeOM,
  etiquetaEstado,
  formatearFecha,
  simboloClasificacion,
  simboloEstado,
} from "@/lib/om/avance";
import { AVANCE_OM, ESTADO_OM } from "@/lib/om/explicaciones";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";

type Columna = "vigencia" | "numero" | "oportunidad" | "entrega" | "avance";
type Direccion = "asc" | "desc";

const COLUMNAS: { id: Columna; label: string; numerica?: boolean; ayuda?: string }[] = [
  { id: "vigencia", label: "Vigencia" },
  { id: "numero", label: "PM N°", numerica: true },
  { id: "oportunidad", label: "Oportunidad de mejora" },
  { id: "entrega", label: "Entrega comprometida" },
  { id: "avance", label: "Avance", numerica: true, ayuda: AVANCE_OM },
];

/** Valor comparable de una OM para cada columna ordenable. */
function valorDe(om: OportunidadMejora, columna: Columna): string | number {
  switch (columna) {
    case "vigencia":
      return om.vigencia;
    case "numero":
      return om.numero ?? Number.MAX_SAFE_INTEGER;
    case "oportunidad":
      return om.oportunidad;
    case "entrega":
      return om.fechaEntrega ?? "9999-99-99";
    case "avance":
      return avanceDeOM(om);
  }
}

/**
 * Tabla completa de las oportunidades de mejora seleccionadas: el detalle
 * auditable detrás de las gráficas del tablero.
 *
 * Cada fila se despliega para mostrar el entregable comprometido y el historial
 * completo de observaciones: una OM acumula una observación por corte, cada una
 * con su propia calificación, y ahí es donde vive la explicación del avance.
 */
export function DatosView({ temaId }: { temaId: string }) {
  const { todas, oms, filtros, activos, controles, fijar, limpiar } = useTableroOM(temaId);

  const [orden, setOrden] = useState<{ columna: Columna; direccion: Direccion }>({
    columna: "avance",
    direccion: "asc",
  });
  const [expandida, setExpandida] = useState<string | null>(null);

  const kpis = useMemo(() => construirKPIs(oms, todas), [oms, todas]);

  const ordenadas = useMemo(() => {
    const factor = orden.direccion === "asc" ? 1 : -1;
    return [...oms].sort((a, b) => {
      const valorA = valorDe(a, orden.columna);
      const valorB = valorDe(b, orden.columna);
      if (typeof valorA === "number" && typeof valorB === "number") return (valorA - valorB) * factor;
      return String(valorA).localeCompare(String(valorB), "es") * factor;
    });
  }, [oms, orden]);

  const alternarOrden = (columna: Columna) => {
    setOrden((previo) =>
      previo.columna === columna
        ? { columna, direccion: previo.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" },
    );
  };

  return (
    <DashboardShell
      kpis={kpis}
      filtros={controles}
      valores={filtros}
      onFilterChange={(campo, valor) => fijar(campo as never, valor)}
      onClearAll={limpiar}
    >
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Oportunidades de mejora en seguimiento</h3>
            <div className="card-sub">
              {oms.length} de {todas.length} OM · clic en una fila para ver el entregable y todas
              sus observaciones de seguimiento
            </div>
          </div>
          {activos && <span className="filtered-badge">Filtrada</span>}
        </div>

        {ordenadas.length === 0 ? (
          <EstadoVacio />
        ) : (
          <div className="table-wrap tabla-scroll">
            <table className="data-table tabla-om">
              <caption className="sr-only">
                Oportunidades de mejora con vigencia, consecutivo, áreas responsables, fecha de
                entrega comprometida y estado de avance
              </caption>
              <thead>
                <tr>
                  {COLUMNAS.map((columna) => {
                    const activa = orden.columna === columna.id;
                    return (
                      <th
                        key={columna.id}
                        scope="col"
                        className={columna.numerica ? "num" : undefined}
                        aria-sort={
                          activa ? (orden.direccion === "asc" ? "ascending" : "descending") : "none"
                        }
                      >
                        <button
                          type="button"
                          className="th-orden"
                          onClick={() => alternarOrden(columna.id)}
                        >
                          {columna.label}
                          <span aria-hidden="true">
                            {activa ? (orden.direccion === "asc" ? " ↑" : " ↓") : " ↕"}
                          </span>
                        </button>
                        {columna.ayuda && <AyudaCalculo cifra={columna.label} texto={columna.ayuda} />}
                      </th>
                    );
                  })}
                  <th scope="col">
                    Estado
                    <AyudaCalculo cifra="Estado" texto={ESTADO_OM} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((om) => {
                  const estado = estadoDeOM(om);
                  const avance = avanceDeOM(om);
                  const abierta = expandida === om.id;

                  return (
                    <Fragment key={om.id}>
                      <tr className={abierta ? "fila-activa" : undefined}>
                        <td>{om.vigencia}</td>
                        <td className="num">{om.numero ?? "—"}</td>
                        <td className="celda-om">
                          <button
                            type="button"
                            className="celda-filtro celda-om-boton"
                            aria-expanded={abierta}
                            onClick={() => setExpandida(abierta ? null : om.id)}
                          >
                            <span aria-hidden="true" className="om-chevron">
                              {abierta ? "▾" : "▸"}
                            </span>
                            <span>
                              <span className="om-titulo-tabla">{om.oportunidad}</span>
                              <span className="om-meta">{om.responsable || "Sin registrar"}</span>
                            </span>
                          </button>
                        </td>
                        <td>{entregaLegible(om)}</td>
                        <td className="pct">{avance}%</td>
                        <td>
                          <EstadoTag
                            color={colorEstado(estado)}
                            simbolo={simboloEstado(estado)}
                            label={etiquetaEstado(estado)}
                          />
                        </td>
                      </tr>

                      {abierta && (
                        <tr className="fila-detalle">
                          <td colSpan={6}>
                            <div className="detalle-om">
                              <div>
                                <h4>Entregable comprometido</h4>
                                <p>{om.entregable || "Sin entregable registrado."}</p>
                              </div>
                              <div>
                                <h4>Responsable</h4>
                                <p>{om.responsable || "Sin registrar."}</p>
                              </div>
                              <div className="detalle-historial">
                                <h4>
                                  Observaciones del seguimiento
                                  {om.seguimientos.length > 0 &&
                                    ` · ${om.seguimientos.length} ${
                                      om.seguimientos.length === 1 ? "corte" : "cortes"
                                    }`}
                                </h4>
                                {om.seguimientos.length === 0 ? (
                                  <p>Sin observaciones registradas.</p>
                                ) : (
                                  <ol className="obs-lista">
                                    {[...om.seguimientos].reverse().map((seguimiento) => (
                                      <li
                                        key={`${seguimiento.corte}-${seguimiento.funcionario}`}
                                        className="obs-item"
                                      >
                                        <div className="obs-head">
                                          <b>{formatearFecha(seguimiento.corte)}</b>
                                          <EstadoTag
                                            color={colorClasificacion(seguimiento.clasificacion)}
                                            simbolo={simboloClasificacion(seguimiento.clasificacion)}
                                            label={
                                              seguimiento.clasificacion === null
                                                ? "Sin calificar"
                                                : `${seguimiento.clasificacion} de 2`
                                            }
                                          />
                                        </div>
                                        <p>{seguimiento.observacion || "Sin observación registrada."}</p>
                                        <p className="obs-meta">Evaluó: {seguimiento.funcionario}</p>
                                      </li>
                                    ))}
                                  </ol>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
