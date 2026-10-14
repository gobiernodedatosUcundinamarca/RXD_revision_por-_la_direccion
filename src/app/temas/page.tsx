import Link from "next/link";
import { LogoUcundinamarca } from "@/components/brand/LogoUcundinamarca";
import { SelloAcreditacion } from "@/components/brand/SelloAcreditacion";
import { Icon } from "@/components/ui/Icon";
import { PieInstitucional } from "@/components/layout/PieInstitucional";
import { TarjetaTema } from "@/features/temas/TarjetaTema";
import { TEMAS } from "@/features/temas/temas";
import { getTodasLasOM, ultimoCorte } from "@/lib/om/dataset";
import { formatearFecha } from "@/lib/om/avance";
import { resumen } from "@/lib/om/metricas";
import { TASA_CIERRE, ULTIMO_CORTE } from "@/lib/om/explicaciones";
import { AyudaCalculo } from "@/components/ui/AyudaCalculo";

/** Layout 1 — Portada de temas (regla layouts §3–5). */
export default function PortadaPage() {
  const todas = getTodasLasOM();
  const global = resumen(todas);

  return (
    <>
      <header className="topbar">
        <LogoUcundinamarca variant="horizontal" tono="negro" height={80} />
        <div className="spacer" />
        <div className="top-actions">
          <SelloAcreditacion height={72} />
        </div>
      </header>

      <div className="hero">
        <div className="eyebrow">Revisión por la Dirección · Sistemas Integrados de Gestión</div>
        <h1>Seguimiento a Oportunidades de Mejora</h1>
        <p>
          Estado de las oportunidades de mejora derivadas de la Revisión por la Dirección en los
          sistemas integrados de gestión de la Universidad, con su avance por vigencia, corte de
          seguimiento y área responsable.
        </p>
        {/* Acción principal de la portada: la visión de conjunto va antes que
            la elección de un sistema, así que se ofrece de entrada. */}
        <div className="hero-acciones">
          <Link href="/consolidado" className="btn-primario">
            <Icon name="grid" size={17} />
            Ver todos los sistemas
          </Link>
          <span className="hero-acciones-nota">
            Compare avance, cierre y carga pendiente de los {TEMAS.length} sistemas en un solo tablero
          </span>
        </div>

        <div className="hero-meta">
          <div className="m">
            <b>{global.total}</b>
            <span>oportunidades de mejora</span>
          </div>
          <div className="m">
            <b>{TEMAS.length}</b>
            <span>sistemas integrados de gestión</span>
          </div>
          <div className="m">
            <b>{global.cumplidas}</b>
            <span>
              cumplidas ({global.tasaCierre?.toFixed(0) ?? 0}%)
              <AyudaCalculo
                cifra="OM cumplidas"
                texto={`${TASA_CIERRE} Suma todas las OM de todos los sistemas.`}
              />
            </span>
          </div>
          <div className="m">
            <b>{formatearFecha(ultimoCorte(todas))}</b>
            <span>
              último corte de seguimiento
              <AyudaCalculo cifra="Último corte de seguimiento" texto={ULTIMO_CORTE} />
            </span>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Sistemas integrados de gestión</h2>
        <span>O seleccione uno para abrir su tablero de seguimiento</span>
      </div>

      <div className="theme-grid">
        {TEMAS.map((tema) => (
          <TarjetaTema key={tema.id} tema={tema} />
        ))}
      </div>

      <PieInstitucional />
    </>
  );
}
