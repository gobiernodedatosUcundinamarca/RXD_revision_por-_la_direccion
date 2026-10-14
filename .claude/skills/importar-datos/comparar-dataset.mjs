#!/usr/bin/env node
/**
 * Compara dos versiones de `src/data/om-rxd.json` y mide el alcance de una
 * importación: OM agregadas o quitadas, seguimientos previos alterados y
 * cortes nuevos por sistema y vigencia. Sin dependencias.
 *
 * Uso: node .claude/skills/importar-datos/comparar-dataset.mjs <antes.json> <despues.json>
 * Sale con código 1 si algún dato ya registrado cambió (lo que ADR-0006 no permite
 * salvo regla explícita en scripts/lib/dominio.mjs).
 */
import { readFileSync } from "node:fs";

const [rutaAntes, rutaDespues] = process.argv.slice(2);
if (!rutaAntes || !rutaDespues) {
  console.error("Uso: comparar-dataset.mjs <antes.json> <despues.json>");
  process.exit(2);
}

/** Indexa OM y seguimientos; un corte repetido en la misma OM se distingue por ocurrencia. */
function indexar(ruta) {
  // Sin BOM: la redirección `>` de PowerShell lo agrega.
  const datos = JSON.parse(readFileSync(ruta, "utf8").replace(/^﻿/, ""));
  const oms = new Map();
  const seguimientos = new Map();
  for (const sistema of datos.sistemas) {
    for (const om of sistema.oms) {
      const claveOm = `${sistema.id}|${om.id}`;
      const { seguimientos: lista, ...ficha } = om;
      oms.set(claveOm, { sistema: sistema.id, vigencia: om.vigencia, ficha: JSON.stringify(ficha) });
      const vistos = {};
      for (const seg of lista) {
        vistos[seg.corte] = (vistos[seg.corte] ?? 0) + 1;
        seguimientos.set(`${claveOm}|${seg.corte}#${vistos[seg.corte]}`, {
          sistema: sistema.id,
          vigencia: om.vigencia,
          corte: seg.corte,
          valor: JSON.stringify(seg),
        });
      }
    }
  }
  return { oms, seguimientos };
}

const antes = indexar(rutaAntes);
const despues = indexar(rutaDespues);
const faltan = (a, b) => [...a.keys()].filter((k) => !b.has(k));

const omsQuitadas = faltan(antes.oms, despues.oms);
const omsNuevas = faltan(despues.oms, antes.oms);
const fichasCambiadas = [...antes.oms].filter(([k, v]) => despues.oms.has(k) && despues.oms.get(k).ficha !== v.ficha);
const segQuitados = faltan(antes.seguimientos, despues.seguimientos);
const segNuevos = faltan(despues.seguimientos, antes.seguimientos);
const segCambiados = [...antes.seguimientos].filter(
  ([k, v]) => despues.seguimientos.has(k) && despues.seguimientos.get(k).valor !== v.valor,
);

console.log(`OM: ${antes.oms.size} → ${despues.oms.size} · seguimientos: ${antes.seguimientos.size} → ${despues.seguimientos.size}`);

const porGrupo = {};
for (const k of segNuevos) {
  const { sistema, vigencia, corte } = despues.seguimientos.get(k);
  const g = (porGrupo[`${sistema} ${vigencia}`] ??= { total: 0, cortes: new Set() });
  g.total += 1;
  g.cortes.add(corte);
}
console.log("\nSeguimientos nuevos por sistema y vigencia:");
for (const [grupo, { total, cortes }] of Object.entries(porGrupo).sort()) {
  console.log(`  ${grupo}: ${total} (cortes ${[...cortes].sort().join(", ")})`);
}
if (!segNuevos.length) console.log("  (ninguno)");

const listar = (titulo, claves) => {
  if (!claves.length) return;
  console.log(`\n${titulo} (${claves.length}):`);
  for (const k of claves.slice(0, 20)) console.log(`  ${k}`);
  if (claves.length > 20) console.log(`  … y ${claves.length - 20} más`);
};
listar("OM nuevas", omsNuevas);
listar("OM quitadas", omsQuitadas);
listar("Fichas de OM modificadas", fichasCambiadas.map(([k]) => k));
listar("Seguimientos previos quitados", segQuitados);
listar("Seguimientos previos modificados", segCambiados.map(([k]) => k));

const alterado = omsQuitadas.length + omsNuevas.length + fichasCambiadas.length + segQuitados.length + segCambiados.length;
console.log(alterado ? "\n⚠ Cambió información ya registrada: justificar cada caso." : "\n✓ Lo ya registrado queda idéntico.");
process.exit(alterado ? 1 : 0);
