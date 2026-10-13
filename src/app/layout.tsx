import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

/**
 * Tipografía institucional: Montserrat (regla visual §3.1).
 * Nota: la regla PROHÍBE Inter/Geist como principal (§3.5); por eso se
 * reemplaza la fuente por defecto de create-next-app por Montserrat.
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const TITULO = "Revisión por la Dirección · Sistemas Integrados de Gestión";
const DESCRIPCION =
  "Seguimiento a las oportunidades de mejora derivadas de la Revisión por la Dirección en los Sistemas Integrados de Gestión de la Universidad de Cundinamarca.";

/**
 * Metadatos del sitio. `openGraph` y `twitter` alimentan la vista previa del
 * enlace al compartirlo (Teams, WhatsApp, Outlook…); sin ellos cada plataforma
 * improvisa a partir del `<title>`. Las páginas con título propio heredan el
 * sufijo de la plantilla.
 */
export const metadata: Metadata = {
  title: { default: TITULO, template: "%s · Revisión por la Dirección" },
  description: DESCRIPCION,
  applicationName: TITULO,
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    siteName: "Universidad de Cundinamarca",
    locale: "es_CO",
    type: "website",
  },
  twitter: { card: "summary", title: TITULO, description: DESCRIPCION },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
