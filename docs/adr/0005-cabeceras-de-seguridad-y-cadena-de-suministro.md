# ADR-0005 — Endurecimiento: cabeceras de seguridad, CSP y guardas de cadena de suministro

**Estado:** Aceptada · 2026-09-08

## Contexto

Una revisión de seguridad de la app confirmó que **no hay capa de servidor
propia**: sin API routes, sin Server Actions, sin `middleware.ts`, sin
`cookies()`/`headers()`, sin autenticación y sin `fetch` a servicios externos en
runtime. Los datos son un JSON compilado en el bundle
([`src/data/om-rxd.json`](../../src/data/om-rxd.json)), generado fuera del build
por el ETL de `scripts/`. La única lógica de servidor es el render de React
Server Components de contenido estático y tres `redirect()`.

`pnpm audit` estaba en verde y no se hallaron sumideros de inyección
(`dangerouslySetInnerHTML`, `eval`, `innerHTML`). Pero sí faltaban tres
controles que CLAUDE.md ya exige:

1. **Cabeceras de seguridad en `next.config`** (CLAUDE.md §2) — ausentes.
2. **Guarda `preinstall` de pnpm** (CLAUDE.md §3, «mecanismos de refuerzo que
   deben existir») — ausente; nada impedía un `npm install` accidental.
3. **`pnpm audit` en CI** (CLAUDE.md §2) — no existía CI.

## Decisión

### Cabeceras y CSP (`next.config.ts`)

Se añade `headers()` para `/:path*` con:

| Cabecera | Valor | Motivo |
|---|---|---|
| `Content-Security-Policy` | ver abajo | Contención de XSS/inyección |
| `X-Content-Type-Options` | `nosniff` | No adivinar MIME |
| `X-Frame-Options` | `DENY` | Anti-clickjacking (navegadores viejos) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No filtrar rutas internas |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Desactiva APIs que la app no usa |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS |

Además `poweredByHeader: false` (no revelar la versión de Next.js).

**CSP** (`default-src 'self'`, todo acotado al propio origen):

- `script-src 'self' 'unsafe-inline'` — `'unsafe-inline'` lo exige el _payload_
  RSC que Next inyecta en un `<script>` inline. En desarrollo se suma
  `'unsafe-eval'` para el HMR de Turbopack (condicionado a `NODE_ENV`).
- `style-src 'self' 'unsafe-inline'` — Tailwind v4 y Recharts aplican estilos
  inline.
- `connect-src 'self'` (+ `ws:` solo en dev, para la recarga en caliente).
- `img-src 'self' data:`, `font-src 'self' data:`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`,
  `upgrade-insecure-requests`.

### Guardas de cadena de suministro

- `package.json` → `"preinstall": "npx only-allow pnpm"`: aborta cualquier
  instalación con `npm` o `yarn`.
- `package.json` → `"audit": "pnpm audit --audit-level high"`: atajo local.
- Nuevo workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):
  en cada push/PR a `main` corre `pnpm audit --audit-level high`, `pnpm lint`,
  `pnpm typecheck` y `pnpm build` con `--frozen-lockfile`.

## Alternativas consideradas

- **Cabeceras a nivel de host** (`vercel.json`, nginx, Cloudflare). Descartada
  como fuente única: acopla la seguridad al proveedor de hosting y CLAUDE.md §2
  pide explícitamente que vivan en `next.config`. Si más adelante se despliega
  detrás de un CDN, se pueden duplicar allí sin quitar las de Next.
- **CSP estricta con nonce** (sin `'unsafe-inline'`). Descartada por ahora:
  Next 16 con RSC no expone un mecanismo de nonce estable para el payload
  inline sin `middleware.ts`, y añadir middleware solo para esto contradice la
  ausencia deliberada de capa de servidor. Revisar cuando Next lo soporte de
  forma nativa.
- **`output: "export"`** (estático puro, cero servidor Node). Atractiva porque
  eliminaría toda superficie de servidor, pero las rutas con `redirect()` y
  parámetros dinámicos (`temas/[temaId]`) exigen `generateStaticParams` y
  cambian el comportamiento de los `redirect`. Queda como trabajo aparte, a
  validar con el build.

## Consecuencias

- Toda respuesta lleva las cabeceras; verificable con
  `curl -I http://localhost:3000` tras `pnpm build && pnpm start`.
- La CSP es **funcional pero no máxima** (`'unsafe-inline'` en scripts): mejora
  supeditada al soporte de nonce en Next. Documentado arriba para no perder el
  hilo.
- Un `npm install` ahora falla de inmediato con un mensaje claro.
- La CI bloquea el merge si aparece una vulnerabilidad alta/crítica, si el lint
  o los tipos fallan, o si el build se rompe.
- Si se añade un recurso de terceros (fuente, script, analítica), **hay que
  ampliar la CSP** en `next.config.ts` o se bloqueará en silencio.
