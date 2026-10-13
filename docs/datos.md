# Datos: seguimiento a Oportunidades de Mejora (OM)

Fuente única de verdad sobre el origen, la transformación y el significado de los datos del tablero.

---

## 1. Origen

Los libros de [`data/`](../data/) son los archivos de seguimiento que mantiene la institución sobre
las **Oportunidades de Mejora derivadas de la Revisión por la Dirección (RXD)**. Hay un libro por
sistema de gestión y, dentro de cada uno, **una hoja por vigencia** (el año del ciclo de RXD que
originó las OM).

| Libro | Sistema | `id` |
|---|---|---|
| `SEG OM RXD_SGC JUNIO 2026.xlsx` | Sistema de Gestión de Calidad | `sgc` |
| `SEG OM RXD_SGA JUNIO  2026.xlsx` | Sistema de Gestión Ambiental | `sga` |
| `SEG OM RXD_SG SST JUNIO 2026.xlsx` | Seguridad y Salud en el Trabajo | `sgsst` |
| `SEG OM RXD_SG SI JUNIO 2026.xlsx` | Seguridad de la Información | `sgsi` |
| `SEG OM RXD_SGAS JUNIO 2026.xlsx` | Sistema de Gestión Antisoborno | `sgas` |

### Actualizaciones (subcarpetas fechadas)

Los seguimientos posteriores llegan en subcarpetas `data/<dd-mm-aaaa>/` (la fecha de recepción), con
**un solo libro y una hoja por sistema**. Se aplican sobre los libros base en orden cronológico y
**solo agregan los cortes cuya fecha aún no está registrada**: no reemplazan observaciones ni
calificaciones existentes, ni agregan o quitan OM. Ver
[ADR-0006](adr/0006-actualizaciones-incrementales-de-datos.md).

| Carpeta | Libro | Aporte |
|---|---|---|
| `13-10-2026/` | `SISTEMAS INTEGRADOS DE GESTION.xlsx` | Corte **30-sep-2026** de la vigencia 2025 en SGC, SGA, SGSI y SGAS (SG-SST no trae cortes nuevos) |

El sistema de cada hoja se reconoce por el nombre de la hoja (`SGC 2025`, `SST`, `SGSI`…) y la hoja
base por coincidencia de OM (`PM N°` + texto de la oportunidad), así que la hoja no necesita llevar
el año en el nombre.

### Estructura de cada hoja

| Columna | Contenido |
|---|---|
| `PM N°` | Consecutivo del plan de mejoramiento (falta en algunos registros) |
| `Fecha` / `Fecha de entrega` | Compromiso de entrega |
| `Responsable` | Área o áreas responsables, en **texto libre** |
| `Oportunidad de Mejora` | Qué se debe mejorar |
| `ENTREGABLE` | Evidencia comprometida |
| `OBSERVACION FUNCIONARIO: <nombre> FECHA: <fecha>` | Observación de un corte de seguimiento |
| `CLASIFICACION` | Calificación del avance en ese corte |

Los dos últimos se repiten en pares, uno por corte. **No siempre son adyacentes**: alguna hoja
intercala una columna `EVIDENCIA` entre ambos, así que el importador empareja cada observación con
la primera columna `CLASIFICACION` que la sigue antes de la siguiente observación.

### Escala de clasificación

Escala institucional de avance, de 0 a 2:

| Valor | Estado en la aplicación | Avance |
|---:|---|---:|
| `2` | Cumplida | 100 % |
| `1.5` | Avance significativo | 75 % |
| `1` | Avance parcial | 50 % |
| `0.5` | Avance mínimo | 25 % |
| `0` o *(vacío, nunca calificada)* | Sin avance | 0 % |

---

## 2. Transformación (ETL)

El pipeline tiene **dos pasos**, con un artefacto intermedio auditable:

```
data/*.xlsx  ──[limpiar]──▶  data-limpio/*.xlsx  ──[importar]──▶  src/data/om-rxd.json
   original                    libros planos                        dataset tipado
```

```bash
pnpm datos:limpiar      # solo el paso 1
pnpm datos:importar     # los dos pasos, en orden
```

**Paso 1 — [`scripts/limpiar-excel.mjs`](../scripts/limpiar-excel.mjs).** Concentra toda la
interpretación de formato y escribe un libro por sistema en [`data-limpio/`](../data-limpio/), con
una hoja por vigencia. Frente al original: sin celdas combinadas, sin filas vacías intercaladas, sin
hojas duplicadas y sin filas de totales — **una fila es una OM completa**. Los encabezados de corte
quedan como `Observación AAAA-MM-DD · <funcionario>` y `Clasificación AAAA-MM-DD`, y se añade
`Fecha de entrega (ISO)` junto al texto original, que se conserva siempre.

**Paso 2 — [`scripts/importar-om-rxd.mjs`](../scripts/importar-om-rxd.mjs).** Traduce columnas a
campos. Al recibir la tabla ya normalizada no necesita saber nada de formato, lo que lo deja corto y
fácil de auditar. Al final, estandariza las redacciones equivalentes del campo `Responsable` a
través de todas las OM — ver [«Estandarización de redacciones
equivalentes»](#estandarización-de-redacciones-equivalentes) más abajo.

Ninguno de los dos usa dependencias externas: [`scripts/lib/xlsx.mjs`](../scripts/lib/xlsx.mjs)
descomprime el ZIP del `.xlsx` con `node:zlib` y lee el XML; su gemelo
[`xlsx-escribir.mjs`](../scripts/lib/xlsx-escribir.mjs) genera los libros limpios. Se evita así sumar
un parser de Excel al árbol de producción, que no aportaría nada al navegador
(ver [ADR-0001](adr/0001-fuente-de-datos-etl-excel-a-json.md)). Las reglas compartidas por ambos
pasos —sistemas, áreas, normalización de fechas— viven en
[`scripts/lib/dominio.mjs`](../scripts/lib/dominio.mjs).

> `data-limpio/` se **regenera por completo** en cada ejecución: no editar a mano. La fuente de
> verdad sigue siendo `data/`.

### Normalizaciones aplicadas

| Situación en el origen | Tratamiento |
|---|---|
| **Celdas combinadas** (una OM ocupa varias filas) | Se «descombinan»: el valor de la esquina superior-izquierda se replica en todo su rango, y luego las filas se **agrupan por `PM N°`** en un solo registro, salvo que declaren un `ENTREGABLE` propio distinto (ver más abajo) |
| Hojas duplicadas de una misma vigencia (`SGA 2022` y `2022`) | Se conserva la primera con datos; se avisa por consola |
| Fila de cierre `TOTAL AVANCES` | Se descarta: no es una OM |
| `PM N°` vacío | La OM se conserva con `numero: null` |
| Fecha como número de serie de Excel (`46112`) | Se convierte a ISO (`2026-04-30`) |
| Fecha como `30/06/2026`, `30 de junio 2026`, `Abril 30 de 2026`, `30 SEP 2026` | Se convierte a ISO (acepta nombres de mes completos y abreviados) |
| Fecha como texto libre (`Inmediato`, `IPA 2025`, `Vigencia 2024`) | `fechaEntrega: null`; se conserva el texto original en `fechaEntregaTexto` y es lo que muestra la interfaz |
| Corte cuya fecha no se puede interpretar | Se descarta con aviso, para garantizar que **todo seguimiento tenga fecha** |
| Observaciones muy largas | Se recortan a 400 caracteres; el texto íntegro permanece en los libros de `data/` |
| Libro de actualización (`data/<dd-mm-aaaa>/`) con un corte cuya fecha ya existe | No se aplica; si su contenido difiere de lo registrado, se avisa por consola |
| Libro de actualización con un corte de fecha nueva | Se agrega a la hoja base de la misma vigencia, para las OM que coinciden |

### Celdas combinadas

Tres hojas usan combinaciones verticales para dar altura al texto de la oportunidad:
**SGSI 2025** (9 rangos) y **SGC 2022** (3).

En un `.xlsx` una celda combinada guarda el valor **solo** en su esquina superior-izquierda, así
que las filas restantes del rango llegan vacías. El lector las rellena antes de interpretar nada
(`descombinar` en [`scripts/lib/xlsx.mjs`](../scripts/lib/xlsx.mjs)) y el importador agrupa después
las filas consecutivas que comparten `PM N°`.

Los libros no combinan las mismas columnas en todas las hojas: SGC 2022 combina `A`, `B` y `C` pero
no `D`, de modo que una fila de continuación trae número y responsable con la oportunidad vacía. Por
eso dos filas se consideran la misma OM cuando comparten `PM N°` y **no se contradicen** ni en la
oportunidad ni en el entregable —coinciden, o uno está vacío—, y solo se separan si alguno de los
dos declara un valor distinto.

En estas dos hojas ninguna fila de continuación aporta datos propios: descombinar no cambia el
número de OM que producen.

### Un `PM N°` con varios entregables propios (sin celdas combinadas)

**SGA 2024** ya no llega con celdas combinadas: cada `PM N°` que reparte su seguimiento entre varios
entregables trae **una fila completa por entregable**, cada una con su propio `ENTREGABLE` y sus
propias observaciones/clasificaciones por corte — no son repeticiones de una celda combinada, son
registros distintos que comparten número y texto de oportunidad.

Como la condición de agrupación exige que ni la oportunidad **ni el entregable** se contradigan,
estas filas **no se fusionan**: cada entregable queda como su propia OM en el dataset, con el mismo
`numero` pero un `id` desambiguado (el importador avisa «PM N ampara mas de una oportunidad» aunque
la oportunidad sea idéntica, porque lo que distingue las filas es el entregable). Fusionarlas —como
ocurría antes de este ajuste— concatenaba los entregables en un solo texto y solo conservaba la
clasificación de la primera fila del grupo, perdiendo el seguimiento propio de cada entregable.

### Áreas responsables

El campo `Responsable` es texto libre con **92 redacciones distintas** en los cinco libros («SGA»,
«Equipo SGA», «Directora de Planeación Institucional. Coordinadora SGA.»…), por lo que no sirve
como dimensión de análisis tal cual.

#### Estandarización de redacciones equivalentes

Antes de las 92, el texto crudo traía 96 redacciones: algunas no son responsables distintos, son la
misma redacción con mayúsculas, tildes o puntuación de cierre inconsistentes («SGA» / «SGA.» /
«SGA-», o «DIRECCIÓN DE SISTEMAS Y TECNOLOGÍA» en mayúsculas sostenidas frente a «Dirección de
Sistemas y Tecnología»). `estandarizarResponsables` (en
[`scripts/lib/dominio.mjs`](../scripts/lib/dominio.mjs)), al final de `importar-om-rxd.mjs`:

1. Agrupa todas las OM (de los cinco sistemas) por una clave que ignora mayúsculas, tildes y
   puntuación/espacios de cierre (`claveResponsable`).
2. Dentro de cada grupo con más de una variante, elige la más «correctamente redactada» como
   representante: penaliza mayúsculas sostenidas (salvo siglas cortas, donde son correctas) y
   puntuación de cierre sobrante; a igualdad, la variante más frecuente.
3. Reescribe `responsable` de cada OM del grupo con esa variante.

**No** colapsa redacciones con palabras distintas (dos responsables compuestos con integrantes
distintos, o nombres genuinamente distintos siguen siendo texto libre real, no una variante de
escritura de lo mismo) — solo diferencias de formato de la misma redacción. El pipeline reporta por
consola cuántas redacciones había antes y después de estandarizar.

El ETL etiqueta además cada OM con las **áreas institucionales canónicas** que su texto menciona, mediante
coincidencia de patrones (26 áreas + `Otras áreas` como respaldo). Consecuencias:

- Una OM puede pertenecer a **varias** áreas.
- La suma de OM por área **supera** el número de OM: mide **carga por área**, no una partición del
  total. La vista Responsables lo declara explícitamente.
- El texto literal se conserva íntegro en `responsable` y **es lo que muestran todas las vistas**
  junto a cada OM — no las áreas derivadas, que pueden omitir un fragmento del texto si no coincide
  con ningún patrón conocido.
- La vista **Responsables** también agrupa por el texto literal (`avancePorResponsable`), no por
  área: cada OM cuenta en una sola fila, así que la tabla es una partición completa del conjunto. Las
  áreas (`om.areas`) quedan solo como una de las tres dimensiones del **filtro global** del tablero
  (junto a vigencia y estado), disponible desde cualquier vista.

---

## 3. Modelo resultante

Tipos en [`src/types/index.ts`](../src/types/index.ts):

```ts
SistemaGestion { id, sigla, nombre, archivo, oms: OportunidadMejora[] }

OportunidadMejora {
  id, vigencia, numero,
  fechaEntrega,            // ISO o null
  fechaEntregaTexto,       // compromiso tal como se redactó
  responsable, areas,      // texto libre + áreas canónicas
  oportunidad, entregable,
  seguimientos: SeguimientoOM[]   // ordenados cronológicamente
}

SeguimientoOM { corte, corteTexto, funcionario, observacion, clasificacion }
```

Cifras del dataset vigente: **162 OM** y **995 registros de seguimiento** en 5 sistemas.

---

## 4. Métricas derivadas

Implementadas en [`src/lib/om/`](../src/lib/om/) como funciones puras.

### Estado vigente de una OM

Es su **última clasificación registrada** (`clasificacionFinal`). Una OM sin ninguna calificación
cuenta como **0 (Sin avance)** — decisión explícita del tablero: no hay un estado aparte para «sin
seguimiento». (Versión anterior de esta métrica sí los distinguía, para no castigar el promedio por
ausencia de registro; se dejó de distinguir a pedido de negocio — el detalle de cada corte sigue
disponible en Datos/Seguimiento con su propia marca «Sin calificar» por observación.)

### Avance promedio

Promedia **todas** las OM del conjunto: una OM nunca calificada suma 0 al promedio, igual que una
calificada explícitamente con 0.

### Serie temporal — lectura acumulada

`serieAvancePorCorte` calcula cada punto **como una foto del portafolio a esa fecha**: para cada OM
toma su última calificación *en ese corte o antes* (`clasificacionEnCorte`), no solo lo que se
calificó ese día.

La alternativa —promediar únicamente lo calificado en el corte— describiría el ritmo de trabajo del
evaluador, no el avance del portafolio. Cada punto viaja con su `base` (cuántas OM lo sustentan) y
el tooltip la declara, porque **la población cambia**: cuando entra una vigencia nueva el promedio
puede bajar sin que ninguna OM haya retrocedido. La vista Seguimiento lo advierte.

### Vencimiento

`estaVencida` compara la fecha comprometida contra la **fecha del último corte de seguimiento**, no
contra «hoy»: es el momento en que la institución evaluó por última vez el estado, y es la
referencia honesta para afirmar un incumplimiento. Las OM cuyo compromiso es texto libre no se
evalúan y se contabilizan aparte (`sinFechaEvaluable`).

### Referencias de los indicadores

Los umbrales de la vista Indicadores (≥ 80 %, 0 OM…) son **referencias de lectura definidas para
este tablero** con el fin de priorizar la atención. **No** son metas institucionales aprobadas, y la
propia vista lo declara al pie.

---

## 5. Limitaciones conocidas

- El dataset (≈360 KB) viaja al cliente porque las vistas son componentes de cliente. Es aceptable a
  esta escala; si crece, el camino es mover la agregación a componentes de servidor o a una API.
- La detección de áreas es por patrones sobre texto libre: una redacción nueva y muy distinta caería
  en `Otras áreas` hasta añadir su patrón en `scripts/importar-om-rxd.mjs`.
