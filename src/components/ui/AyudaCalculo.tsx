"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Ancho máximo del globo, en píxeles. */
const ANCHO_MAXIMO = 360;

/**
 * Apartados que van como nota al pie del globo, separados del cuerpo: las
 * explicaciones de `explicaciones.ts` los introducen con «Ejemplo:» o «Variación:».
 */
const APARTADO = /\s(?=(?:Ejemplo|Variación):)/;

/** Separa la explicación en cuerpo y notas al pie («Ejemplo: …», «Variación: …»). */
function separar(texto: string): { cuerpo: string; notas: { etiqueta: string; texto: string }[] } {
  const [cuerpo = "", ...resto] = texto.split(APARTADO);
  return {
    cuerpo,
    notas: resto.map((parte) => {
      const [etiqueta = "", ...demas] = parte.split(":");
      return { etiqueta, texto: demas.join(":").trim() };
    }),
  };
}
/** Margen mínimo entre el globo y el borde de la ventana. */
const MARGEN = 12;
/** Separación entre el ícono y el globo. */
const SEPARACION = 8;

interface Posicion {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

interface AyudaCalculoProps {
  /** Nombre de la cifra que se explica: completa la etiqueta accesible. */
  cifra: string;
  /** Explicación del cálculo. */
  texto: string;
}

/**
 * Ícono «!» que explica cómo se calcula una cifra.
 *
 * - Se abre al pasar el mouse, al enfocarlo con teclado o al tocarlo (móvil),
 *   y se cierra al salir, al perder el foco, con Escape o al desplazar la
 *   página (regla dashboard §8 «toque», §11 «teclado»).
 * - El texto está siempre enlazado con `aria-describedby` (a una copia oculta
 *   visualmente), así que el lector de pantalla lo lee aunque el globo esté cerrado.
 * - El globo se dibuja en `<body>` con posición fija calculada al abrir: no lo
 *   recortan los contenedores con desplazamiento (tablas), nunca se sale de la
 *   ventana y no hereda estilos del lugar donde está el ícono.
 */
export function AyudaCalculo({ cifra, texto }: AyudaCalculoProps) {
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const { cuerpo, notas } = separar(texto);
  const [posicion, setPosicion] = useState<Posicion | null>(null);

  const abrir = () => {
    const rect = boton.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(ANCHO_MAXIMO, window.innerWidth - MARGEN * 2);
    const centrado = rect.left + rect.width / 2 - width / 2;
    const left = Math.max(MARGEN, Math.min(centrado, window.innerWidth - MARGEN - width));
    // En la mitad inferior de la ventana el globo se abre hacia arriba.
    const haciaArriba = rect.bottom > window.innerHeight * 0.6;
    setPosicion(
      haciaArriba
        ? { left, width, bottom: window.innerHeight - rect.top + SEPARACION }
        : { left, width, top: rect.bottom + SEPARACION },
    );
  };
  const cerrar = () => setPosicion(null);
  const abierta = posicion !== null;

  // Con la página en movimiento, la posición fija dejaría el globo flotando
  // lejos del ícono: se cierra.
  useEffect(() => {
    if (!abierta) return;
    const alMover = () => setPosicion(null);
    window.addEventListener("scroll", alMover, true);
    window.addEventListener("resize", alMover);
    return () => {
      window.removeEventListener("scroll", alMover, true);
      window.removeEventListener("resize", alMover);
    };
  }, [abierta]);

  return (
    <span className="ayuda" onMouseEnter={abrir} onMouseLeave={cerrar}>
      <button
        ref={boton}
        type="button"
        className="ayuda-boton"
        aria-label={`Cómo se calcula: ${cifra}`}
        aria-describedby={id}
        aria-expanded={abierta}
        onFocus={abrir}
        onBlur={cerrar}
        onClick={(evento) => {
          // Dentro de filas o tarjetas clicables, el clic solo abre la ayuda.
          evento.stopPropagation();
          abrir();
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") cerrar();
        }}
      >
        !
      </button>
      {/* Descripción para lectores de pantalla, siempre presente. */}
      <span id={id} className="sr-only">
        {texto}
      </span>
      {/* El globo visible se dibuja en <body> (portal): así ningún estilo del
          lugar donde está el ícono —portada, encabezados de tabla, KPI— se
          filtra dentro de él. Solo existe mientras está abierto, que siempre
          ocurre en el navegador tras un evento, así que `document` existe. */}
      {posicion &&
        createPortal(
          <div role="tooltip" aria-hidden="true" className="ayuda-globo" style={posicion}>
            <p className="ayuda-titulo">Cómo se calcula · {cifra}</p>
            <p className="ayuda-texto">{cuerpo}</p>
            {notas.map((nota) => (
              <p key={nota.etiqueta} className="ayuda-nota">
                <strong>{nota.etiqueta}:</strong> {nota.texto}
              </p>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
