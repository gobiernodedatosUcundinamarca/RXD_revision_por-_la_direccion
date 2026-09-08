import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const esDesarrollo = process.env.NODE_ENV !== "production";

/**
 * Política de Seguridad de Contenido (CSP).
 *
 * La app es un tablero estático: no carga scripts ni estilos de terceros, no
 * hace `fetch` en runtime y no incrusta iframes. Por eso `default-src 'self'`
 * y todo lo demás se acota a ese origen.
 *
 * - `script-src`: `'unsafe-inline'` lo exige el arranque de React Server
 *   Components (Next inyecta el _payload_ RSC en un `<script>` inline). En
 *   desarrollo se añade `'unsafe-eval'`, que necesita el HMR de Turbopack.
 * - `style-src 'unsafe-inline'`: Tailwind v4 y Recharts aplican estilos inline.
 * - `connect-src ws:` (solo dev): websocket del recarga en caliente.
 * - `frame-ancestors 'none'`: nadie puede embeber la app (equivale a
 *   X-Frame-Options DENY, que se mantiene por compatibilidad).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${esDesarrollo ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const cabecerasSeguridad = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Fija la raíz del workspace: hay un package-lock.json huérfano en el
  // directorio padre (D:\ninchaustegui\Desktop\RXD) que Next.js confunde con
  // otro workspace, ver aviso "multiple lockfiles" en consola.
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  /**
   * Oculta el indicador de desarrollo de Next.js: el círculo oscuro que se
   * superponía sobre el menú lateral en la esquina inferior izquierda.
   *
   * Es chrome del framework (`<nextjs-portal>`), no un elemento de la interfaz,
   * y nunca formó parte del build de producción. Se apaga porque en este
   * proyecto la pantalla se revisa y se presenta en desarrollo, y ahí tapaba
   * «Volver a temas».
   */
  devIndicators: false,

  // No revelar la versión de Next.js en la cabecera `X-Powered-By`.
  poweredByHeader: false,

  // Cabeceras de seguridad en todas las rutas (CLAUDE.md §2).
  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
