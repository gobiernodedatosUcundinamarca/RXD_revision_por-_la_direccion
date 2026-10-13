/**
 * Paso 1 del pipeline: `data/*.xlsx` → `data-limpio/*.xlsx`.
 *
 * Ejecutar con:  pnpm datos:limpiar
 *
 * Toma los libros de seguimiento tal como los mantiene la institución y produce
 * una versión **plana y sin ambigüedades** de los mismos datos:
 *
 * - Sin celdas combinadas: cada fila es una OM completa.
 * - Sin filas vacías intercaladas ni filas de totales.
 * - Sin hojas duplicadas de una misma vigencia.
 * - Encabezados de corte normalizados a `Observación AAAA-MM-DD · <funcionario>`.
 * - Fechas de entrega interpretadas a ISO en una columna aparte, conservando
 *   siempre el texto original tal como se redactó.
 *
 * No inventa, no corrige y no descarta contenido: solo reordena lo que ya está,
 * de modo que el paso de importación no tenga que interpretar formato.
 *
 * Actualizaciones incrementales: los libros de las subcarpetas fechadas
 * `data/<dd-mm-aaaa>/` se aplican después, en orden cronológico, y **solo
 * agregan los cortes cuya fecha aún no está registrada**. Lo ya registrado no se
 * reemplaza; si el libro nuevo lo contradice, se avisa por consola.
 */
import { readdirSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { leerLibro } from "./lib/xlsx.mjs";
import { escribirLibro } from "./lib/xlsx-escribir.mjs";
import { SISTEMAS, limpiar, normalizarFecha, vigenciaDeHoja } from "./lib/dominio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEN = join(RAIZ, "data");
const DESTINO = join(RAIZ, "data-limpio");

/** Columnas fijas que abren toda hoja limpia. */
const COLUMNAS_BASE = [
  "PM N°",
  "Vigencia",
  "Fecha de entrega",
  "Fecha de entrega (ISO)",
  "Responsable",
  "Oportunidad de Mejora",
  "Entregable",
];

/**
 * Empareja cada columna de observación con su columna de clasificación y lee la
 * fecha del corte de su encabezado.
 *
 * No se puede asumir que sean adyacentes: alguna hoja intercala una columna
 * «EVIDENCIA» entre ambas. Los cortes cuya fecha no se puede interpretar se
 * descartan con aviso, para que todo seguimiento tenga fecha.
 */
function mapearCortes(encabezados, avisos, contexto) {
  const cortes = [];

  for (let col = 0; col < encabezados.length; col++) {
    if (!/OBSERVACI[OÓ]N/i.test(String(encabezados[col] ?? ""))) continue;

    let colClasificacion = -1;
    for (let siguiente = col + 1; siguiente < encabezados.length; siguiente++) {
      const cabecera = String(encabezados[siguiente] ?? "");
      if (/OBSERVACI[OÓ]N/i.test(cabecera)) break;
      if (/CLASIFICACI[OÓ]N/i.test(cabecera)) {
        colClasificacion = siguiente;
        break;
      }
    }
    if (colClasificacion < 0) {
      avisos.push(`${contexto}: columna ${col} sin CLASIFICACION asociada, omitida`);
      continue;
    }

    const texto = limpiar(encabezados[col]);
    const funcionario = limpiar(texto.match(/FUNCIONARIO\s*:?\s*(.*?)\s*FECHA\s*:/i)?.[1] ?? "");
    const fechaTexto = limpiar(texto.match(/FECHA\s*:?\s*(.*)$/i)?.[1] ?? "");
    // «23 - 04 - 2024» y «26-07-2023» llegan con espacios intercalados.
    const compacta = fechaTexto.replace(/\s*-\s*/g, "-").replace(/\s*\/\s*/g, "/");
    const fecha = normalizarFecha(compacta) ?? normalizarFecha(fechaTexto);

    if (!fecha) {
      avisos.push(`${contexto}: corte sin fecha interpretable («${fechaTexto}»), omitido`);
      continue;
    }

    cortes.push({
      fecha,
      funcionario: funcionario || "Sin registrar",
      colObservacion: col,
      colClasificacion,
    });
  }

  return cortes;
}

/**
 * Agrupa filas físicas en registros lógicos de OM.
 *
 * El lector ya replicó los valores de las celdas combinadas, así que una OM que
 * ocupaba varias filas aparece repetida en todas ellas. Se consideran la misma
 * OM las filas consecutivas que comparten `PM N°` y no se contradicen en la
 * oportunidad: los libros combinan unas columnas y otras no, de modo que una
 * fila de continuación puede traer número y responsable con la oportunidad
 * vacía. Solo se separan cuando ambas declaran una oportunidad distinta.
 */
function agruparEnOM(filas) {
  const grupos = [];

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i] ?? [];
    const numero = limpiar(fila[0]);

    if (/^total/i.test(numero)) continue; // fila de cierre del libro

    const oportunidad = limpiar(fila[3]);
    const responsable = limpiar(fila[2]);
    const entregable = limpiar(fila[4]);
    if (!oportunidad && !responsable) continue;

    const previo = grupos[grupos.length - 1];
    const oportunidadPrevia = previo ? limpiar(previo[0][3]) : "";
    const entregablePrevio = previo ? limpiar(previo[0][4]) : "";
    // Un mismo `PM N°` puede repartir su seguimiento entre varios entregables
    // propios (SGA 2024): cada fila trae su propio ENTREGABLE, no un
    // fragmento de celda combinada. Solo se consideran continuación de la
    // misma OM cuando ni la oportunidad ni el entregable se contradicen.
    const continua =
      previo &&
      numero !== "" &&
      limpiar(previo[0][0]) === numero &&
      (oportunidad === "" || oportunidadPrevia === "" || oportunidadPrevia === oportunidad) &&
      (entregable === "" || entregablePrevio === "" || entregablePrevio === entregable);

    if (continua) previo.push(fila);
    else grupos.push([fila]);
  }

  return grupos;
}

/** Texto de una columna dentro del grupo, sin repetir valores. */
function valorUnico(grupo, columna) {
  const vistos = [];
  for (const fila of grupo) {
    const valor = limpiar(fila[columna]);
    if (valor && !vistos.includes(valor)) vistos.push(valor);
  }
  return vistos.join(" ");
}

/** Primera calificación numérica de una columna dentro del grupo. */
function primerNumero(grupo, columna) {
  for (const fila of grupo) {
    const bruto = fila[columna];
    if (bruto === "" || bruto == null) continue;
    const valor = Number(bruto);
    if (Number.isFinite(valor)) return valor;
  }
  return null;
}

/** Convierte una hoja del libro original en una hoja limpia. */
function limpiarHoja(hoja, avisos, contexto) {
  const filas = hoja.filas.filter((f) => f && f.some((c) => c != null && c !== ""));
  if (filas.length < 2) return null;

  const encabezados = filas[0];
  if (!/PM\s*N/i.test(String(encabezados[0] ?? ""))) return null;

  const vigencia = vigenciaDeHoja(hoja.nombre);
  const cortes = mapearCortes(encabezados, avisos, contexto);

  const cabecera = [
    ...COLUMNAS_BASE,
    ...cortes.flatMap((c) => [
      `Observación ${c.fecha} · ${c.funcionario}`,
      `Clasificación ${c.fecha}`,
    ]),
  ];

  const cuerpo = agruparEnOM(filas).map((grupo) => {
    const fechaTexto = valorUnico(grupo, 1);
    const serie = grupo.map((f) => f[1]).find((v) => typeof v === "number");
    const numeroTexto = valorUnico(grupo, 0);

    return [
      /^\d+$/.test(numeroTexto) ? Number(numeroTexto) : numeroTexto,
      vigencia,
      fechaTexto,
      normalizarFecha(serie ?? fechaTexto) ?? "",
      valorUnico(grupo, 2),
      valorUnico(grupo, 3),
      valorUnico(grupo, 4),
      ...cortes.flatMap((c) => [
        valorUnico(grupo, c.colObservacion),
        primerNumero(grupo, c.colClasificacion),
      ]),
    ];
  });

  return { nombre: hoja.nombre, vigencia, filas: [cabecera, ...cuerpo], registros: cuerpo.length };
}

/** Posición de `PM N°` y de la oportunidad en una hoja limpia. */
const COL_LIMPIA = { numero: 0, oportunidad: 5 };

/** Identifica una OM entre libros: mismo `PM N°` y mismo texto de oportunidad. */
const claveOM = (numero, oportunidad) => `${limpiar(numero)}|${limpiar(oportunidad).toLowerCase()}`;

/** Fecha ISO de cada encabezado `Observación AAAA-MM-DD · …` de una hoja limpia, con su columna. */
function cortesDeHojaLimpia(hoja) {
  const cortes = [];
  hoja.filas[0].forEach((cabecera, col) => {
    const fecha = String(cabecera).match(/^Observación (\d{4}-\d{2}-\d{2})/)?.[1];
    if (fecha) cortes.push({ fecha, colObservacion: col, colClasificacion: col + 1 });
  });
  return cortes;
}

/**
 * Subcarpetas `data/<dd-mm-aaaa>/` en orden cronológico: cada una trae un libro
 * de actualización con la fecha en que se recibió.
 */
function carpetasDeActualizacion() {
  return readdirSync(ORIGEN, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => ({ nombre: entrada.name, fecha: normalizarFecha(entrada.name) }))
    .filter((carpeta) => carpeta.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Aplica una hoja de un libro de actualización sobre las hojas limpias de su
 * sistema. **Solo agrega cortes cuya fecha aún no está registrada**: nunca
 * modifica observaciones ni calificaciones existentes, ni agrega o quita OM.
 * Lo que difiere de lo ya registrado se reporta por consola para revisión.
 *
 * La hoja destino es la de la vigencia que indica el nombre de la hoja; si el
 * nombre no trae año («SGSI», «SST»), la hoja del sistema con la que más OM
 * coinciden.
 */
function aplicarActualizacion(hoja, hojasSistema, avisos, contexto) {
  const filas = hoja.filas.filter((f) => f && f.some((c) => c != null && c !== ""));
  if (filas.length < 2 || !/PM\s*N/i.test(String(filas[0][0] ?? ""))) return null;

  const cortes = mapearCortes(filas[0], avisos, contexto);
  const grupos = agruparEnOM(filas).map((grupo) => ({
    grupo,
    numero: valorUnico(grupo, 0),
    clave: claveOM(valorUnico(grupo, 0), valorUnico(grupo, 3)),
  }));

  const vigencia = vigenciaDeHoja(hoja.nombre);
  const candidatas = vigencia ? hojasSistema.filter((h) => h.vigencia === vigencia) : hojasSistema;
  const coincidencias = (destino) => {
    const claves = new Set(destino.filas.slice(1).map((f) => claveOM(f[COL_LIMPIA.numero], f[COL_LIMPIA.oportunidad])));
    return grupos.filter((g) => claves.has(g.clave)).length;
  };
  const destino = candidatas
    .map((h) => ({ hoja: h, n: coincidencias(h) }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n || String(b.hoja.vigencia).localeCompare(String(a.hoja.vigencia)))[0]?.hoja;

  if (!destino) {
    avisos.push(`${contexto}: ninguna OM coincide con las hojas existentes del sistema; no se aplicó`);
    return null;
  }

  const filaPorClave = new Map(
    destino.filas.slice(1).map((f) => [claveOM(f[COL_LIMPIA.numero], f[COL_LIMPIA.oportunidad]), f]),
  );
  const grupoPorClave = new Map(grupos.map((g) => [g.clave, g]));

  for (const g of grupos) {
    if (!filaPorClave.has(g.clave)) {
      avisos.push(`${contexto}: PM ${g.numero || "s/n"} no coincide con ninguna OM de «${destino.nombre}»; no se agregó`);
    }
  }
  for (const [clave, fila] of filaPorClave) {
    if (!grupoPorClave.has(clave)) {
      avisos.push(`${contexto}: PM ${fila[COL_LIMPIA.numero] || "s/n"} de «${destino.nombre}» no aparece en la actualización; se conserva`);
    }
  }

  // Los cortes con la misma fecha se emparejan por orden de aparición, porque
  // un libro puede repetir una fecha (dos «30 ABRIL 2026»).
  const existentes = cortesDeHojaLimpia(destino);
  const usadosPorFecha = new Map();
  const agregados = [];

  for (const corte of cortes) {
    const ocurrencia = usadosPorFecha.get(corte.fecha) ?? 0;
    usadosPorFecha.set(corte.fecha, ocurrencia + 1);
    const yaRegistrado = existentes.filter((e) => e.fecha === corte.fecha)[ocurrencia];

    if (yaRegistrado) {
      for (const [clave, fila] of filaPorClave) {
        const g = grupoPorClave.get(clave);
        if (!g) continue;
        const observacion = valorUnico(g.grupo, corte.colObservacion);
        const clasificacion = primerNumero(g.grupo, corte.colClasificacion);
        const antes = fila[yaRegistrado.colClasificacion];
        const difiereClasificacion = (antes ?? null) !== clasificacion;
        if (difiereClasificacion || limpiar(fila[yaRegistrado.colObservacion]) !== observacion) {
          avisos.push(
            `${contexto}: PM ${g.numero} corte ${corte.fecha} difiere de lo registrado` +
              (difiereClasificacion ? ` (clasificación ${antes ?? "vacía"} → ${clasificacion ?? "vacía"})` : " (texto de la observación)") +
              "; no se aplicó",
          );
        }
      }
      continue;
    }

    destino.filas[0].push(`Observación ${corte.fecha} · ${corte.funcionario}`, `Clasificación ${corte.fecha}`);
    for (const fila of destino.filas.slice(1)) {
      const g = grupoPorClave.get(claveOM(fila[COL_LIMPIA.numero], fila[COL_LIMPIA.oportunidad]));
      fila.push(g ? valorUnico(g.grupo, corte.colObservacion) : "", g ? primerNumero(g.grupo, corte.colClasificacion) : null);
    }
    agregados.push(corte.fecha);
  }

  return { destino: destino.nombre, agregados, oms: grupos.length };
}

function main() {
  const archivos = readdirSync(ORIGEN).filter(
    (f) => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"),
  );
  const avisos = [];
  const bloqueados = [];

  mkdirSync(DESTINO, { recursive: true });

  // Se limpian los libros obsoletos uno a uno, no la carpeta entera: si el
  // usuario tiene uno abierto en Excel, borrar el directorio falla con EPERM y
  // dejaría el paso a medias. Aquí solo se pierde el archivo bloqueado, que de
  // todas formas se reescribe a continuación.
  const esperados = new Set(SISTEMAS.map((s) => `${s.id}.xlsx`));
  for (const previo of readdirSync(DESTINO)) {
    if (!previo.endsWith(".xlsx") || esperados.has(previo)) continue;
    try {
      rmSync(join(DESTINO, previo));
    } catch {
      avisos.push(`No se pudo eliminar el libro obsoleto data-limpio/${previo} (¿abierto?)`);
    }
  }

  let totalHojas = 0;
  let totalRegistros = 0;

  // 1. Base: un libro por sistema en `data/`.
  const hojasPorSistema = new Map();

  for (const definicion of SISTEMAS) {
    const archivo = archivos.find((f) => definicion.patron.test(f));
    if (!archivo) {
      avisos.push(`Sin archivo para ${definicion.sigla} (patrón ${definicion.patron})`);
      continue;
    }

    const hojasLimpias = [];
    const vigenciasVistas = new Set();

    for (const hoja of leerLibro(join(ORIGEN, archivo))) {
      const vigencia = vigenciaDeHoja(hoja.nombre);
      if (vigencia && vigenciasVistas.has(vigencia)) {
        avisos.push(
          `${definicion.sigla}: hoja duplicada «${hoja.nombre}» (vigencia ${vigencia}) omitida`,
        );
        continue;
      }

      const limpia = limpiarHoja(hoja, avisos, `${definicion.sigla} «${hoja.nombre}»`);
      if (!limpia || limpia.registros === 0) continue;

      if (vigencia) vigenciasVistas.add(vigencia);
      hojasLimpias.push(limpia);
    }

    if (hojasLimpias.length === 0) {
      avisos.push(`${definicion.sigla}: ninguna hoja con datos`);
      continue;
    }

    hojasPorSistema.set(definicion.id, hojasLimpias);
  }

  // 2. Actualizaciones: `data/<dd-mm-aaaa>/*.xlsx`, en orden cronológico. Solo
  //    agregan cortes nuevos sobre las hojas de la base.
  for (const carpeta of carpetasDeActualizacion()) {
    const libros = readdirSync(join(ORIGEN, carpeta.nombre)).filter(
      (f) => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"),
    );
    for (const libro of libros) {
      for (const hoja of leerLibro(join(ORIGEN, carpeta.nombre, libro))) {
        const contexto = `Actualización ${carpeta.nombre} «${hoja.nombre}»`;
        const definicion = SISTEMAS.find((s) => s.patronHoja.test(hoja.nombre));
        const hojasSistema = definicion && hojasPorSistema.get(definicion.id);
        if (!hojasSistema) {
          avisos.push(`${contexto}: no corresponde a ningún sistema con datos base; omitida`);
          continue;
        }

        const resultado = aplicarActualizacion(hoja, hojasSistema, avisos, contexto);
        if (!resultado) continue;
        console.log(
          `↻ ${carpeta.nombre}/${libro} «${hoja.nombre}» → ${definicion.sigla} «${resultado.destino}»: ` +
            (resultado.agregados.length > 0
              ? `+${resultado.agregados.length} corte(s) [${resultado.agregados.join(", ")}]`
              : "sin cortes nuevos"),
        );
      }
    }
  }

  // 3. Escritura de los libros limpios.
  for (const definicion of SISTEMAS) {
    const hojasLimpias = hojasPorSistema.get(definicion.id);
    if (!hojasLimpias) continue;

    const destino = join(DESTINO, `${definicion.id}.xlsx`);
    try {
      escribirLibro(destino, hojasLimpias);
    } catch (error) {
      // Excel bloquea el archivo mientras lo tiene abierto: se avisa con la
      // causa concreta y se sigue con los demás sistemas, en vez de abortar.
      if (error.code === "EBUSY" || error.code === "EPERM") {
        bloqueados.push(`data-limpio/${definicion.id}.xlsx`);
        continue;
      }
      throw error;
    }

    totalHojas += hojasLimpias.length;
    totalRegistros += hojasLimpias.reduce((n, h) => n + h.registros, 0);
    console.log(
      `✓ data-limpio/${definicion.id}.xlsx — ${hojasLimpias.length} hojas · ` +
        `${hojasLimpias.reduce((n, h) => n + h.registros, 0)} OM ` +
        `[${hojasLimpias.map((h) => h.nombre).join(", ")}]`,
    );
  }

  // Procedencia junto a los archivos generados: quién los produjo y desde qué.
  writeFileSync(
    join(DESTINO, "LEEME.md"),
    [
      "# Libros limpios (generados)",
      "",
      "**No editar a mano.** Esta carpeta se regenera por completo con:",
      "",
      "```bash",
      "pnpm datos:limpiar",
      "```",
      "",
      "Origen: los libros de [`../data/`](../data/), que son la fuente de verdad.",
      "Sobre ellos se aplican, en orden cronológico, los libros de actualización de",
      "las subcarpetas fechadas `../data/<dd-mm-aaaa>/`, que solo agregan los cortes",
      "de seguimiento cuya fecha aún no estaba registrada.",
      "",
      "Cada archivo es un sistema de gestión, con una hoja por vigencia. Frente a",
      "los originales, aquí no hay celdas combinadas, filas vacías intercaladas,",
      "hojas duplicadas ni filas de totales: **una fila es una oportunidad de**",
      "**mejora completa**.",
      "",
      "Los encabezados de seguimiento se normalizaron a",
      "`Observación AAAA-MM-DD · <funcionario>` y `Clasificación AAAA-MM-DD`, y se",
      "añadió `Fecha de entrega (ISO)` junto al texto original, que se conserva",
      "siempre tal como se redactó.",
      "",
      `Generado el ${new Date().toISOString().slice(0, 10)}.`,
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(`\n${totalHojas} hojas · ${totalRegistros} OM en total`);
  for (const aviso of avisos) console.log(`  ! ${aviso}`);

  if (bloqueados.length > 0) {
    console.error(
      `\n✖ No se pudo escribir ${bloqueados.join(", ")}: el archivo está abierto en Excel.\n` +
        `  Ciérralo y vuelve a ejecutar «pnpm datos:importar».`,
    );
    process.exitCode = 1;
  }
}

main();
