/**
 * Reglas de dominio compartidas por el pipeline de datos.
 *
 *   data/*.xlsx  →  [limpiar-excel]  →  data-limpio/*.xlsx  →  [importar]  →  src/data/om-rxd.json
 *
 * Ambos pasos necesitan las mismas definiciones (qué sistemas hay, cómo se
 * normaliza una fecha, qué áreas existen), así que viven aquí una sola vez.
 */
import { fechaDesdeSerial } from "./xlsx.mjs";

/**
 * Longitud máxima de las observaciones. Acota el peso del dataset que viaja al
 * cliente: son narrativas largas y repetitivas de las que la interfaz solo
 * muestra el arranque. El texto íntegro permanece en los libros de `data/`.
 */
export const MAX_OBSERVACION = 400;

/**
 * Sistemas de gestión reconocidos. El orden define el orden de aparición en la
 * portada de temas.
 *
 * - `patron` identifica el sistema por el **nombre del archivo** de los libros
 *   base de `data/` (un libro por sistema).
 * - `patronHoja` lo identifica por el **nombre de la hoja** en los libros de
 *   actualización de `data/<dd-mm-aaaa>/`, que traen todos los sistemas en un
 *   solo libro («SGC 2025», «SGA 2025», «SGAS 2025», «SGSI», «SST»).
 */
export const SISTEMAS = [
  { id: "sgc", sigla: "SGC", nombre: "Sistema de Gestión de Calidad", patron: /_SGC/i, patronHoja: /\bSGC\b/i },
  { id: "sga", sigla: "SGA", nombre: "Sistema de Gestión Ambiental", patron: /_SGA[\s_]/i, patronHoja: /\bSGA\b/i },
  { id: "sgsst", sigla: "SG-SST", nombre: "Seguridad y Salud en el Trabajo", patron: /SG[\s-]*SST/i, patronHoja: /\bSST\b|SG[\s-]*SST/i },
  { id: "sgsi", sigla: "SGSI", nombre: "Seguridad de la Información", patron: /SG\s*SI\b/i, patronHoja: /SG\s*SI\b/i },
  { id: "sgas", sigla: "SGAS", nombre: "Sistema de Gestión Antisoborno", patron: /_SGAS/i, patronHoja: /\bSGAS\b/i },
];

/**
 * Áreas institucionales canónicas. El campo «Responsable» es texto libre y con
 * 95 variantes distintas no sirve como dimensión de análisis, así que cada OM
 * se etiqueta con todas las áreas que menciona. El orden es indiferente: se
 * evalúan todos los patrones y una OM puede pertenecer a varias áreas.
 */
export const AREAS = [
  ["Alta Dirección", /alta\s*direcci/i],
  ["Planeación Institucional", /planeaci[oó]n/i],
  ["Sistemas y Tecnología", /sistemas\s+y\s+tecnolog|comit[eé]\s+de\s+sistemas/i],
  ["Talento Humano", /talento\s+humano/i],
  ["Control Interno", /control\s+interno/i],
  ["Calidad", /calidad/i],
  ["Gestión Ambiental", /\bsga\b|gesti[oó]n\s+ambiental|oficina\s+ambiental/i],
  ["Seguridad de la Información", /\bsgsi\b|seguridad\s+de\s+la\s+informaci/i],
  ["Seguridad y Salud en el Trabajo", /sg[\s-]*sst|seguridad\s+y\s+salud|\bsst\b/i],
  ["Antisoborno", /antisoborno/i],
  ["Vicerrectoría Académica", /vice?rrector[íi]a\s+acad|vicerectoria\s+acad/i],
  ["Vicerrectoría Administrativa y Financiera", /vice?rrector[íi]a\s+(administrativa|financiera)|vicerectoria\s+administrativa|director\s+administrativo/i],
  ["Bienes, Servicios y Compras", /bienes\s+y\s+servicios|compras/i],
  ["Recursos Físicos", /recursos\s+f[íi]sicos/i],
  ["Apoyo y Desarrollo Académico", /apoyo\s+acad[eé]mico|desarrollo\s+acad[eé]mico|\bacademia\b|pr[áa]cticas\s+acad/i],
  ["Atención al Ciudadano", /atenci[oó]n\s+al\s+ciudadano/i],
  ["Archivo y Correspondencia", /archivo/i],
  ["Investigación Universitaria", /investigaci[oó]n/i],
  ["Interacción Social y Bienestar", /interacci[oó]n\s+social|bienestar/i],
  ["Autoevaluación y Acreditación", /autoevaluaci|acreditaci/i],
  ["Educación Virtual y EFAD", /educaci[oó]n\s+virtual|\befad\b/i],
  ["Admisiones y Registro", /admisiones/i],
  ["Gobierno de Datos", /gobierno\s+(de\s+)?datos/i],
  ["Cuerpos Colegiados y Comités", /cuerpos\s+colegiados|comit[eé]\s+sac|comisi[oó]n\s+de\s+gesti[oó]n/i],
  ["Dirección Jurídica", /jur[íi]dica/i],
  ["Contabilidad", /contabilidad/i],
];

/**
 * Nombres de mes reconocidos. Los completos van primero para que la
 * alternancia del regex los prefiera; las abreviaturas cubren encabezados como
 * «30 SEP 2026».
 */
const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8,
  sept: 9, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
};

/** Colapsa espacios y recorta; convierte `null`/`undefined` en cadena vacía. */
export const limpiar = (valor) => String(valor ?? "").replace(/\s+/g, " ").trim();

const iso = (anio, mes, dia) => {
  if (!anio || !mes || !dia || mes > 12 || dia > 31) return null;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
};

/**
 * Normaliza una fecha de origen heterogéneo (serial de Excel, `dd/mm/aaaa`,
 * `dd-mm-aaaa` o `30 de junio 2026`). Devuelve `null` cuando el texto no es una
 * fecha (p. ej. «Inmediato», «Vigencia 2025», «IPA 2025»), en cuyo caso la
 * aplicación conserva y muestra el texto original.
 */
export function normalizarFecha(valor) {
  if (valor == null || valor === "") return null;

  // Serial de Excel. Se acota al rango razonable de estos libros (2015–2035).
  if (typeof valor === "number") {
    return valor > 42000 && valor < 50000 ? fechaDesdeSerial(valor) : null;
  }

  const texto = limpiar(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto; // ya normalizada

  // dd/mm/aaaa · dd-mm-aaaa (tolera espacios sobrantes y separadores mixtos)
  const numerica = texto.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]?\s*(\d{4})$/);
  if (numerica) return iso(Number(numerica[3]), Number(numerica[2]), Number(numerica[1]));

  const nombreMes = Object.keys(MESES).join("|");
  const diaMesAnio = texto.match(new RegExp(`(\\d{1,2})\\s*(?:de\\s+)?(${nombreMes})\\s*(?:de\\s+)?(\\d{4})`, "i"));
  if (diaMesAnio) return iso(Number(diaMesAnio[3]), MESES[diaMesAnio[2].toLowerCase()], Number(diaMesAnio[1]));

  const mesDiaAnio = texto.match(new RegExp(`(${nombreMes})\\s+(\\d{1,2})\\s*(?:de\\s+)?(\\d{4})`, "i"));
  if (mesDiaAnio) return iso(Number(mesDiaAnio[3]), MESES[mesDiaAnio[1].toLowerCase()], Number(mesDiaAnio[2]));

  return null;
}

/** Áreas canónicas mencionadas en el texto libre de «Responsable». */
export function detectarAreas(responsable) {
  const areas = AREAS.filter(([, patron]) => patron.test(responsable)).map(([nombre]) => nombre);
  return areas.length > 0 ? areas : ["Otras áreas"];
}

export const recortar = (texto) =>
  texto.length > MAX_OBSERVACION ? `${texto.slice(0, MAX_OBSERVACION).trimEnd()}…` : texto;

/**
 * Clave de agrupación para redacciones equivalentes del campo «Responsable»:
 * ignora mayúsculas, tildes, y puntuación/espacios de cierre. No colapsa
 * diferencias de palabras (dos redacciones con texto distinto siguen siendo
 * dos claves distintas) — eso seguiría siendo texto libre genuinamente
 * distinto, no una variante de escritura de lo mismo.
 */
export function claveResponsable(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tildes/diacríticos
    .toLowerCase()
    .replace(/[.\-–—\s]+$/g, "") // puntuación y espacios de cierre («SGA.», «SGA-»)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Elige, entre variantes de escritura equivalentes, la más «correctamente
 * redactada» para mostrar: penaliza mayúsculas sostenidas (salvo siglas
 * cortas, donde son correctas) y puntuación de cierre sobrante; a igualdad,
 * la redacción más frecuente y, si persiste el empate, orden alfabético
 * (para que el resultado sea determinista).
 */
function elegirRepresentante(variantes) {
  const esSigla = (texto) => texto.length <= 6 && texto === texto.toUpperCase();
  const terminaEnPuntuacion = /[.\-–—]\s*$/;

  const puntaje = (texto) => {
    let p = 0;
    if (texto === texto.toUpperCase() && !esSigla(texto)) p -= 2;
    if (terminaEnPuntuacion.test(texto)) p -= 1;
    return p;
  };

  return [...variantes.entries()]
    .sort(
      ([textoA, vecesA], [textoB, vecesB]) =>
        puntaje(textoB) - puntaje(textoA) || vecesB - vecesA || textoA.localeCompare(textoB, "es"),
    )[0][0];
}

/**
 * Estandariza el campo «Responsable» a través de todas las OM: agrupa las
 * redacciones que solo difieren en mayúsculas, tildes o puntuación de cierre
 * y reescribe cada una con la variante elegida como representante. Devuelve
 * cuántas redacciones distintas había antes y después, para que el llamador
 * lo reporte.
 *
 * No toca redacciones genuinamente distintas (palabras distintas, un
 * responsable compuesto vs. otro): esas siguen siendo texto libre real, no
 * una variante de escritura de lo mismo.
 */
export function estandarizarResponsables(oms) {
  const variantesPorClave = new Map();
  for (const om of oms) {
    const texto = om.responsable;
    if (!texto) continue;
    const clave = claveResponsable(texto);
    const variantes = variantesPorClave.get(clave) ?? new Map();
    variantes.set(texto, (variantes.get(texto) ?? 0) + 1);
    variantesPorClave.set(clave, variantes);
  }

  const representantePorClave = new Map();
  let fusionadas = 0;
  for (const [clave, variantes] of variantesPorClave) {
    representantePorClave.set(clave, elegirRepresentante(variantes));
    if (variantes.size > 1) fusionadas += variantes.size;
  }

  for (const om of oms) {
    if (!om.responsable) continue;
    om.responsable = representantePorClave.get(claveResponsable(om.responsable));
  }

  return {
    antes: variantesPorClave.size > 0 ? [...variantesPorClave.values()].reduce((n, v) => n + v.size, 0) : 0,
    despues: variantesPorClave.size,
    fusionadas,
  };
}

/** Vigencia (año del ciclo RXD) a partir del nombre de la hoja. */
export const vigenciaDeHoja = (nombre) => nombre.match(/(20\d{2})/)?.[1] ?? null;
