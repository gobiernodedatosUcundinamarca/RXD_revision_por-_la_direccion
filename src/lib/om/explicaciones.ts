/**
 * Cómo se calcula cada cifra del tablero, redactado **una sola vez** (DRY —
 * CLAUDE.md §6). Lo muestran los íconos «!» (`AyudaCalculo`) de KPI, gráficas
 * y tablas, de modo que una misma cifra se explica igual en todas las vistas.
 *
 * Cada texto debe coincidir con la función que calcula la cifra en
 * `src/lib/om/` (se indica entre paréntesis en el TSDoc de cada constante). Si
 * cambia el cálculo, cambia aquí su explicación en el mismo commit.
 */

/** `avanceDeOM` */
export const AVANCE_OM =
  "Avance de una OM = última calificación ÷ 2 × 100. Escala: 0 → 0 %, 0,5 → 25 %, 1 → 50 %, 1,5 → 75 %, 2 → 100 %. Una OM nunca calificada cuenta como 0 %.";

/** `avancePromedio` */
export const AVANCE_PROMEDIO =
  "Promedio del avance de cada OM: (última calificación ÷ 2 × 100). Cada OM pesa lo mismo y una nunca calificada cuenta como 0 %. Ejemplo: tres OM con calificación 2, 1 y 0 → (100 + 50 + 0) ÷ 3 = 50 %.";

/** `resumen().tasaCierre` */
export const TASA_CIERRE =
  "OM cumplidas (última calificación = 2) ÷ total de OM × 100. Solo cuentan las terminadas: el avance parcial no suma. Ejemplo: 10 cumplidas de 14 → 71,4 %.";

/** `resumen().total` */
export const TOTAL_OM =
  "Número de oportunidades de mejora que quedan después de aplicar los filtros; sin filtros, todas las del sistema.";

/** `resumen().cumplidas` */
export const CUMPLIDAS = "OM cuya última calificación registrada es 2 (100 % de avance).";

/** `total − cumplidas` */
export const SIN_CERRAR = "Total de OM menos las cumplidas, sin importar cuánto avance lleven.";

/** `resumen().sinAvance` */
export const ATENCION =
  "Dentro de las sin cerrar, las que tienen última calificación 0 o nunca fueron calificadas: lo más urgente.";

/** `ultimoCorte` */
export const ULTIMO_CORTE =
  "Fecha de seguimiento más reciente registrada en las OM del conjunto. No cae el mismo día en todos los sistemas.";

/** `variacionUltimoCorte(serieAvancePorCorte(...))` */
export const VARIACION_ESTADO =
  "Diferencia en puntos porcentuales (pp) entre el último corte y el anterior. En cada fecha se toma, para cada OM, su última calificación hasta ese día, así que mide cuánto cambió el estado vigente del portafolio.";

/** `seriesPorSeguimiento(...).avance` */
export const EVOLUCION_AVANCE =
  "Una línea por vigencia. Cada punto promedia (calificación ÷ 2 × 100) solo de las OM evaluadas en ese corte; las que no se evaluaron ese día no cuentan. Equivale a la fila de promedios de la hoja de esa vigencia en el libro de seguimiento.";

/** `seriesPorSeguimiento(...).tasaCierre` */
export const EVOLUCION_CIERRE =
  "Una línea por vigencia. Cada punto = OM evaluadas en ese corte con calificación 2 ÷ OM evaluadas en ese corte × 100. Las que no se evaluaron ese día no cuentan.";

/** `hitosPorCorte` */
export const HITOS_CORTE =
  "Cada corte cuenta solo las OM evaluadas ese día. Avance = promedio de sus calificaciones ÷ 2 × 100. Cumplidas = las calificadas con 2. La variación compara esas mismas OM con su calificación anterior; si ninguna tenía una, es su primera evaluación.";

/** `distribucionPorEstado` */
export const COMPOSICION_ESTADO =
  "Cuenta las OM según su última calificación: 0 sin avance (incluye las nunca calificadas), 0,5 avance mínimo, 1 avance parcial, 1,5 avance significativo, 2 cumplida.";

/** `avancePorVigencia` */
export const AVANCE_POR_VIGENCIA =
  "Para cada vigencia, promedio del avance de sus OM (última calificación ÷ 2 × 100). Las barras se ordenan de mayor a menor avance.";

/** `avancePorResponsable` */
export const AVANCE_POR_RESPONSABLE =
  "Agrupa las OM por el texto del campo «Responsable» tal como se registró y promedia su avance (última calificación ÷ 2 × 100). Cada OM cuenta en un solo grupo.";

/** `compararSistemas().avance` */
export const AVANCE_POR_SISTEMA =
  "Para cada sistema, promedio del avance de sus OM (última calificación ÷ 2 × 100). Un sistema con más OM no pesa más aquí: cada barra es su propio promedio.";

/** `totalesGlobales().avance` */
export const AVANCE_GLOBAL =
  "Promedio del avance de todas las OM de todos los sistemas juntos (última calificación ÷ 2 × 100). Cada OM pesa lo mismo, así que los sistemas con más OM influyen más en el resultado.";

/** `ordenarPorRezago` */
export const REZAGO =
  "OM aún no cumplidas, ordenadas de menor a mayor avance; a igual avance, primero la de vigencia más antigua.";

/** `estadoDeOM` */
export const ESTADO_OM = "Estado según la última calificación registrada de la OM en la escala 0–2.";

/** `estaVencida` */
export const VENCIDA =
  "Una OM está vencida si su fecha de entrega comprometida es anterior al último corte de seguimiento de su sistema y todavía no está cumplida. Si la entrega se registró como texto («Inmediato»), no se evalúa.";

/** Indicador «Cobertura de seguimiento» */
export const COBERTURA =
  "OM con al menos un corte calificado ÷ total de OM × 100. Mide si a todas se les ha hecho seguimiento alguna vez.";

/** Indicador «Oportunidades de vigencias anteriores aún sin cerrar» */
export const HEREDADAS =
  "OM de vigencias anteriores a la más reciente del sistema que todavía no están cumplidas.";

/** Indicador «Cortes de seguimiento registrados» */
export const CORTES_REGISTRADOS =
  "Número de fechas de seguimiento distintas registradas en las OM del conjunto.";
