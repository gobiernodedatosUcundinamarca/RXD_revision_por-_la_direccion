#!/usr/bin/env node
/**
 * Hook `Stop` de Claude Code — regla de mantenimiento de reglas (§2–3).
 *
 * Al terminar un turno, si el árbol de trabajo (o los commits hechos desde la
 * última revisión) contiene un CAMBIO SUSTANCIAL y ni `.claude/rules/` ni
 * `.claude/CLAUDE.md` se tocaron, devuelve `decision: "block"` para que Claude
 * revise si alguna regla quedó desactualizada antes de cerrar.
 *
 * Para no insistir, recuerda en `.git/claude-recordatorio-reglas.json` el
 * último HEAD visto y la firma de los cambios ya avisados: el mismo conjunto
 * de cambios solo se avisa una vez. Nunca bloquea dos veces seguidas
 * (`stop_hook_active`). Sin dependencias: solo Node y git.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function leerEntrada() {
  try {
    // Sin BOM: PowerShell lo antepone al canalizar texto a un ejecutable.
    return JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, "").trim() || "{}");
  } catch {
    return {};
  }
}

function git(...args) {
  return execFileSync("git", ["-C", raiz, ...args], { encoding: "utf8" }).trim();
}

/** Rutas cuyo cambio (de cualquier tipo) es sustancial. */
const SIEMPRE = [
  /^package\.json$/,
  /^pnpm-workspace\.yaml$/,
  /^next\.config\.ts$/,
  /^\.nvmrc$/,
  /^\.github\/workflows\//,
  /^docs\/adr\//,
  /^scripts\//,
  /^src\/lib\/om\//,
];

/** Bajo src/, crear, borrar o renombrar archivos cambia la estructura. */
const esEstructural = (estado, ruta) => /[ADR?]/.test(estado) && ruta.startsWith("src/");

const tocaReglas = (ruta) => ruta.startsWith(".claude/rules/") || ruta === ".claude/CLAUDE.md";

function cambios(headAnterior, headActual) {
  const lista = [];
  // Árbol de trabajo e índice (incluye archivos sin seguimiento).
  for (const linea of git("status", "--porcelain=v1", "-uall").split("\n")) {
    if (!linea) continue;
    const estado = linea.slice(0, 2);
    const ruta = linea.slice(3).split(" -> ").pop().replace(/^"|"$/g, "");
    lista.push({ estado, ruta });
  }
  // Commits hechos desde la última vez que corrió el hook.
  if (headAnterior && headAnterior !== headActual) {
    try {
      for (const linea of git("diff", "--name-status", headAnterior, headActual).split("\n")) {
        if (!linea) continue;
        const [estado, ...rutas] = linea.split("\t");
        lista.push({ estado, ruta: rutas.pop() });
      }
    } catch {
      // HEAD anterior inalcanzable (rebase, rama nueva): basta con el árbol actual.
    }
  }
  return lista;
}

function main() {
  const entrada = leerEntrada();
  if (entrada.stop_hook_active) return;

  let headActual;
  try {
    headActual = git("rev-parse", "HEAD");
  } catch {
    return; // No es un repositorio git.
  }

  const archivoEstado = join(git("rev-parse", "--absolute-git-dir"), "claude-recordatorio-reglas.json");
  let estado = {};
  try {
    estado = JSON.parse(readFileSync(archivoEstado, "utf8"));
  } catch {
    // Primera ejecución.
  }

  const lista = cambios(estado.head, headActual);
  const sustanciales = [
    ...new Set(
      lista
        .filter(({ estado: e, ruta }) => SIEMPRE.some((re) => re.test(ruta)) || esEstructural(e, ruta))
        .map(({ ruta }) => ruta),
    ),
  ].sort();
  const reglasTocadas = lista.some(({ ruta }) => tocaReglas(ruta));

  const firma = createHash("sha1").update(sustanciales.join("\n")).digest("hex");
  const avisar = sustanciales.length > 0 && !reglasTocadas && firma !== estado.firma;

  writeFileSync(archivoEstado, JSON.stringify({ head: headActual, firma: avisar ? firma : estado.firma }));
  if (!avisar) return;

  const muestra = sustanciales.slice(0, 12).join(", ") + (sustanciales.length > 12 ? ", …" : "");
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        `Cambio sustancial detectado (${muestra}) sin tocar .claude/rules/ ni .claude/CLAUDE.md. ` +
        "Según la regla de mantenimiento de reglas, revisa si alguna regla o el CLAUDE.md quedó " +
        "desactualizado y propone la actualización o una regla nueva. Si no hace falta nada, dilo en una línea.",
    }),
  );
}

main();
