# Reglas visuales — UCundinamarca

Alcance **cerrado**: colores, logotipo/imagotipo/escudo y tipografía. Nada de navegación, gráficas ni lógica. Referencia: **Manual de Imagen Institucional ECOM002 v18**.

## 1. Color

### 1.1 Paleta principal (predominante)

| Token | HEX | Pantone |
|---|---|---|
| `--uc-yellow` | `#FBE122` | 107 C |
| `--uc-gold` | `#DAAA00` | 110 C |
| `--uc-green` | `#007B3E` | 3536 C |
| `--uc-green-dark` | `#00482B` | 3537 C |

### 1.2 Paleta secundaria (complementa, no compite)

`--uc-orange #F7931E` · `--uc-lime #79C000` · `--uc-green-light #91C256` · `--uc-turquoise #00A99D` · `--uc-gray-dark #4D4D4D`

### 1.3 Neutros de soporte

`--uc-white #FFFFFF` · `--uc-black #000000` (máximo contraste, restringido) · `--uc-background #F7F7F5` · `--uc-surface #FFFFFF` · `--uc-border #D9DDD9` · `--uc-text #2B2B2B` · `--uc-text-secondary #666666`

### 1.4 Degradados permitidos (solo estos 4; dirección y % adaptables, colores no)

| Token | Colores |
|---|---|
| `--uc-gradient-green-turquoise` | `#007B3E → #79C000 → #00A99D` |
| `--uc-gradient-deep-green` | `#00482B → #007B3E → #79C000` |
| `--uc-gradient-turquoise-gold` | `#00A99D → #FBE122 → #DAAA00` |
| `--uc-gradient-green-orange` | `#00482B → #DAAA00 → #F7931E` |

### 1.5 Jerarquía

- Dominan `#007B3E` y `#00482B`; amarillo/oro para énfasis; secundarios como apoyo.
- Máximo **un color principal + dos complementarios por vista**. Fondos claros para legibilidad.
- `#4D4D4D` para textos, íconos y neutros.

### 1.6 Escudo

Sus colores (incluidos azul claro y rojo de la bandera) solo vienen del **archivo oficial**; nunca se estiman ni reconstruyen.

### 1.7 Prohibiciones

- Tonos aproximados (p. ej. `#004A2B` **no** es el verde oscuro oficial: es `#00482B`).
- Recolorear imagotipo, logo o escudo; degradados no autorizados; neón o saturados ajenos.
- **HEX sueltos cuando existe un token.**
- Rojo/azul del escudo como colores de interfaz; secundarios con más presencia que los verdes.

### 1.8 Tokens en código

Fuente única en código: `:root` de [`src/app/globals.css`](../../src/app/globals.css) (valores de §1.1–1.3 + tokens de aplicación: `--uc-tint`, `--uc-focus-ring`, rampa `--uc-avance-*`…). Un token nuevo se declara allí, nunca en un componente.

## 2. Logotipo, imagotipo y escudo

### 2.1 Identificador digital

- **Imagotipo horizontal** = identificador principal; vertical solo con poco espacio.
- Preferir SVG; PNG transparente si no hay vector. `object-fit: contain`, relación de aspecto intacta.
- Área de seguridad ≥ ¼ de la altura del escudo. "Universidad de Cundinamarca" sin traducir.

### 2.2 Escudo: uso restringido

Solo simbólico/ceremonial (y favicon). **Nunca** logo operativo de la interfaz.

### 2.3 Versiones permitidas

Color, línea en positivo, línea en negativo, imagotipo horizontal (digital), vertical (espacio reducido). Blanco sobre fondos oscuros, negro/color sobre claros.

### 2.4 Prohibiciones

Deformar, rotar, recortar, fragmentar, reordenar, recolorear, cambiar su tipografía, añadir sombras/brillos/3D, reconstruir a mano, reemplazar por texto, baja resolución, fondos que resten visibilidad, combinar con símbolos políticos/religiosos/de gobierno.

### 2.5 Tamaño mínimo

Escudo ≥ 20 mm impreso. En digital, nunca hasta perder legibilidad. Logos de sistema (llevan el nombre en el arte): ≥ ~58 px de alto.

### 2.6 Implementación

Solo mediante componentes, nunca `<img>` suelto:

- `LogoUcundinamarca` (`variant: horizontal|vertical`, `tono: blanco|negro|color`, `alt="Universidad de Cundinamarca"`).
- `LogoSistema` para los logotipos de cada sistema de gestión (identificadores **secundarios**).

### 2.7 Recursos en el proyecto

Originales: [`.claude/lmagenes/`](../lmagenes/) (ignorar `__MACOSX/`) e [`imagenes/`](../../imagenes/). Servidos desde `public/brand/`:

| Origen | Destino |
|---|---|
| `IMAGOTIPO HORIZONTAL {NEGRO,BLANCO,COLOR}.png` | `imagotipo-horizontal-{negro,blanco,color}.png` |
| `IMAGOTIPO VERTICAL *.png` | `imagotipo-vertical-*.png` |
| `ESCUDO COLOR.png` | `escudo-color.png` (favicon/simbólico) |
| `imagenes/sgc3092.png` · `sga3091.png` · `sgsst3094.png` · `sgsi-4.png` · `logo-anti-soborno_1.png` | `sistemas/{sgc,sga,sgsst,sgsi,sgas}.png` (id = registro de temas) |

Pendiente deseable: exportar SVG desde `LOGO VECTORES.ai`.

## 3. Tipografía

### 3.1 Digital

**Montserrat** principal (vía `next/font/google`): `"Montserrat", "Century Gothic", Arial, sans-serif`.

### 3.2 Familias

Montserrat (interfaz) · Century Gothic (alternativa sans) · Times New Roman (documentos formales).

### 3.3 Jerarquía

| Nivel | Tamaño | Peso |
|---|---|---|
| Título principal | 28–32 px | 700 |
| Sección | 20–24 px | 600 |
| Subtítulo | 16–18 px | 600 |
| Texto | 14–16 px | 400 |
| Etiquetas | 12–14 px | 500 |
| Auxiliar | 12–13 px | 400 |

### 3.4 Aplicación

Jerarquía consistente; negrita solo en títulos/énfasis; alineación izquierda; interlineado 1.4–1.6; mayúsculas solo en siglas, nombres oficiales y títulos breves.

### 3.5 Prohibiciones

**Inter** como principal; tipografías manuscritas/decorativas; mezclar familias sin función; párrafos en mayúsculas; pesos/tamaños inconsistentes entre equivalentes.

### 3.6 Tokens

`--uc-font` (digital) en [`globals.css`](../../src/app/globals.css); Montserrat se expone como `--font-montserrat` desde `app/layout.tsx`.

## 4. Instrucción para Claude

Solo colores, logos y tipografías de esta regla; verdes dominantes; imagotipo en la interfaz, escudo solo simbólico; Montserrat; no inventar colores, variantes de logo ni familias.
