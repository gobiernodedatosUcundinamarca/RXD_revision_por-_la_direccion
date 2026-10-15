"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { KPIRow, type KPI } from "@/components/dashboard/KPIRow";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { EstadoVacio } from "@/components/dashboard/EstadoVacio";
import { EstadoTag } from "@/components/dashboard/EstadoTag";
import { ColumnasComparativoInfo } from "@/components/dashboard/ColumnasComparativoInfo";
import { ChartCard } from "@/components/charts/ChartCard";
import { BarrasCategoria } from "@/components/charts/BarrasCategoria";
import { LeyendaInteractiva } from "@/components/charts/LeyendaInteractiva";
import { LogoSistema } from "@/components/brand/LogoSistema";
import { Icon } from "@/components/ui/Icon";
import {
  colorEstado,
  etiquetaEstado,
  formatearFecha,
  formatearPorcentaje,
  simboloEstado,
} from "@/lib/om/avance";
import {
  compararSistemas,
  composicionApilada,
  estadosPresentes,
  totalesGlobales,
  vigenciasGlobales,
} from "../_lib/comparativo";
import { BarrasEstadoPorSistema } from "./BarrasEstadoPorSistema";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";
import {
  AVANCE_GLOBAL,
  AVANCE_POR_SISTEMA,
  COMPOSICION_ESTADO,
  CUMPLIDAS,
  SIN_CERRAR,
  TASA_CIERRE,
  ULTIMO_CORTE,
  VARIACION_ESTADO,
} from "@/lib/om/explicaciones";

/**
 * Tablero consolidado: la última medición de **todos** los sistemas de gestión,
 * uno al lado del otro.
 *
 * Es la única vista cuya dimensión de análisis es el propio sistema, así que no
 * usa el contexto de filtros del layout interno —que vive por tema— sino su
 * propio filtro de vigencia, común a todo lo que muestra.
 *
 * Advertencia de lectura que la vista declara: el «último corte» no cae el mismo
 * día en todos los sistemas, así que las cifras comparan estados vigentes, no
 * fotos tomadas a la vez.
 */
export function ConsolidadoView() {
  const [vigencia, setVigencia] = useState("");
  const [sistemaActivo, setSistemaActivo] = useState<string | null>(null);

  const filas = useMemo(() => compararSistemas(vigencia), [vigencia]);
  const globales = useMemo(() => totalesGlobales(vigencia), [vigencia]);
  const estados = useMemo(() => estadosPresentes(vigencia), [vigencia]);
  const apiladas = useMemo(() => composicionApilada(filas), [filas]);

  const detalle = useMemo(
    () => filas.find((fila) => fila.id === sistemaActivo) ?? null,
    [filas, sistemaActivo],
  );

  // Referencia estable: si el array se recreara en cada render, Recharts
  // reiniciaría la animación de entrada con cada clic de selección.
  const barrasAvance = useMemo(
    () =>
      filas.map((fila) => ({
        clave: fila.id,
        etiqueta: fila.sigla,
        valor: Number((fila.avance ?? 0).toFixed(1)),
        detalle: `${fila.cumplidas} de ${fila.total} cumplidas`,
      })),
    [filas],
  );

  const leyendaEstados = useMemo(
    () =>
      estados.map((estado) => ({
        clave: estado,
        label: etiquetaEstado(estado),
        color: colorEstado(estado),
        valor: String(
          filas.reduce(
            (suma, fila) => suma + (fila.distribucion.find((s) => s.estado === estado)?.value ?? 0),
            0,
          ),
        ),
        simbolo: simboloEstado(estado),
      })),
    [estados, filas],
  );

  const controles = useMemo(
    () => [
      {
        id: "vigencia",
        label: "Vigencia",
        options: vigenciasGlobales().map((v) => ({ value: v, label: v })),
      },
    ],
    [],
  );

  const kpis: KPI[] = [
    {
      label: "Oportunidades de mejora",
      value: globales.total.toLocaleString("es-CO"),
      nota: `en ${globales.sistemas} sistemas integrados de gestión`,
      formula: "Suma de las OM de todos los sistemas (solo las de la vigencia elegida, si hay filtro).",
    },
    {
      label: "Tasa de cierre global vigente",
      value: formatearPorcentaje(globales.tasaCierre, 0),
      nota: `${globales.cumplidas} de ${globales.total} OM cumplidas`,
      formula: `${TASA_CIERRE} Se calcula sobre todas las OM de todos los sistemas juntos.`,
    },
    {
      label: "Avance promedio global vigente",
      value: formatearPorcentaje(globales.avance, 0),
      nota: "Escala institucional 0–2 en %",
      formula: AVANCE_GLOBAL,
    },
  ];

  return (
    <>
      <KPIRow kpis={kpis} />

      <FilterBar
        filters={controles}
        valores={{ vigencia }}
        onChange={(_id, valor) => setVigencia(valor)}
        onClearAll={() => setVigencia("")}
      />

      {filas.length === 0 ? (
        <div className="card">
          <EstadoVacio mensaje="Ningún sistema registra oportunidades de mejora en la vigencia seleccionada." />
        </div>
      ) : (
        <>
          <div className="grid-2a">
            <ChartCard
              title="Avance promedio por sistema de gestión"
              sub="Última calificación vigente de cada OM · escala 0–2 expresada en %"
              calculo={AVANCE_POR_SISTEMA}
              filtrada={Boolean(vigencia)}
            >
              <BarrasCategoria
                data={barrasAvance}
                orientacion="horizontal"
                seleccionado={sistemaActivo}
                onSelect={(clave) => setSistemaActivo(sistemaActivo === clave ? null : clave)}
                ejeValor="Eje horizontal: avance promedio (%). Eje vertical: sistema de gestión."
              />
            </ChartCard>

            <ChartCard
              title="Composición del portafolio por sistema"
              sub="Número de OM en cada estado de avance"
              calculo={COMPOSICION_ESTADO}
              filtrada={Boolean(vigencia)}
            >
              <BarrasEstadoPorSistema data={apiladas} estados={estados} />
              <LeyendaInteractiva
                items={leyendaEstados}
                descripcion="Estados de avance de la escala institucional"
              />
            </ChartCard>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3>Estado vigente de cada sistema</h3>
                <div className="card-sub">
                  Clic en un sistema para ver su composición; el enlace abre su tablero completo
                </div>
                <ColumnasComparativoInfo />
              </div>
              {vigencia && <span className="filtered-badge">Vigencia {vigencia}</span>}
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">
                  Sistemas integrados de gestión con su último corte, número de OM, cumplidas,
                  pendientes, avance promedio y variación
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Sistema</th>
                    <th scope="col">
                      Último corte
                      <AyudaCalculo cifra="Último corte" texto={ULTIMO_CORTE} />
                    </th>
                    <th scope="col" className="num">OM</th>
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
                      <AyudaCalculo cifra="Avance" texto={AVANCE_POR_SISTEMA} />
                    </th>
                    <th scope="col">
                      Variación
                      <AyudaCalculo
                        cifra="Variación"
                        texto={`${VARIACION_ESTADO} Se mide contra el corte anterior de ese mismo sistema.`}
                      />
                    </th>
                    <th scope="col">Tablero</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila) => {
                    const activa = sistemaActivo === fila.id;
                    return (
                      <tr key={fila.id} className={activa ? "fila-activa" : undefined}>
                        <th scope="row" className="celda-nombre">
                          <button
                            type="button"
                            className="celda-filtro celda-sistema"
                            aria-pressed={activa}
                            onClick={() => setSistemaActivo(activa ? null : fila.id)}
                          >
                            <LogoSistema id={fila.id} nombre={fila.nombre} height={30} />
                            <span>
                              <b>{fila.sigla}</b>
                              <span className="om-meta">{fila.nombre}</span>
                            </span>
                          </button>
                        </th>
                        <td>{formatearFecha(fila.ultimoCorte)}</td>
                        <td className="num">{fila.total}</td>
                        <td className="num">{fila.cumplidas}</td>
                        <td className="num">{fila.sinCerrar}</td>
                        <td className="pct pct-green">{formatearPorcentaje(fila.avance, 1)}</td>
                        <td>
                          {fila.variacion === null ? (
                            <span className="om-meta">—</span>
                          ) : (
                            <span className={`corte-var ${fila.variacion > 0 ? "sube" : fila.variacion < 0 ? "baja" : "neutro"}`}>
                              {fila.variacion > 0 ? "↑ +" : fila.variacion < 0 ? "↓ " : "→ "}
                              {fila.variacion === 0 ? "sin cambio" : `${Math.abs(fila.variacion)} pp`}
                            </span>
                          )}
                        </td>
                        <td>
                          <Link href={`/temas/${fila.id}/resumen`} className="tabla-link">
                            Abrir <Icon name="arrowRight" size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="nota-pie">
              El último corte no cae el mismo día en todos los sistemas: la tabla compara el estado
              vigente de cada uno, no fotos tomadas a la vez. La variación se mide contra el corte
              anterior de ese mismo sistema y también refleja el ingreso de nuevas OM al portafolio.
            </p>
          </div>

          {detalle && (
            <div className="card">
              <div className="card-head">
                <div className="detalle-sistema-head">
                  <LogoSistema id={detalle.id} nombre={detalle.nombre} height={56} />
                  <div>
                    <h3>{detalle.nombre}</h3>
                    <div className="card-sub">
                      {detalle.total} OM · vigencias {detalle.vigencias.join(", ")} · último corte{" "}
                      {formatearFecha(detalle.ultimoCorte)}
                    </div>
                  </div>
                </div>
                <button type="button" className="filter-clear" onClick={() => setSistemaActivo(null)}>
                  Limpiar selección
                </button>
              </div>

              <ul className="leyenda">
                {detalle.distribucion.map((segmento) => (
                  <li key={segmento.estado} className="lg-item">
                    <EstadoTag
                      color={segmento.color}
                      simbolo={simboloEstado(segmento.estado)}
                      label={`${segmento.name}: ${segmento.value}`}
                    />
                  </li>
                ))}
              </ul>

              <Link href={`/temas/${detalle.id}/resumen`} className="card-link">
                Abrir el tablero del {detalle.nombre} →
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
