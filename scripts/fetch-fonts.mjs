#!/usr/bin/env node
/**
 * fetch-fonts.mjs — Télécharge les polices arabes libres (OFL) dans public/fonts/.
 *
 * Récupère le CSS Google Fonts (User-Agent moderne → woff2), extrait l'URL
 * du sous-set "arabic" et télécharge le fichier.
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "fonts");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const FONTS = [
  { gf: "Amiri+Quran", file: "AmiriQuran-Regular.woff2" },
  { gf: "Scheherazade+New", file: "ScheherazadeNew-Regular.woff2" },
  { gf: "Noto+Naskh+Arabic", file: "NotoNaskhArabic-Regular.woff2" },
  { gf: "Reem+Kufi", file: "ReemKufi-Regular.woff2" },
  { gf: "Aref+Ruqaa", file: "ArefRuqaa-Regular.woff2" },
  { gf: "Mirza", file: "Mirza-Regular.woff2" },
  { gf: "Amiri", file: "Amiri-Regular.woff2" },
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse Google Fonts CSS et retourne l'URL .woff2 du sous-set "arabic"
 * (fallback "latin" si arabic absent).
 */
function pickWoff2(css) {
  const blocks = css.split(/@font-face\s*\{/).slice(1);
  let arabic = null,
    latin = null;
  for (const b of blocks) {
    // Le commentaire de subset peut précéder le bloc, on regarde aussi le contexte
    const subsetMatch = b.match(/\/\*\s*([a-z-]+)\s*\*\//i);
    const urlMatch = b.match(/url\((https:[^)]+\.woff2)\)/);
    if (!urlMatch) continue;
    const subset = subsetMatch?.[1] ?? "";
    if (subset === "arabic" && !arabic) arabic = urlMatch[1];
    if (subset === "latin" && !latin) latin = urlMatch[1];
  }
  return arabic ?? latin;
}

await mkdir(OUT, { recursive: true });
let ok = 0,
  ko = 0;
for (const f of FONTS) {
  const dest = resolve(OUT, f.file);
  if (await exists(dest)) {
    console.log(`  ⤳ ${f.file} déjà présent`);
    ok++;
    continue;
  }
  process.stdout.write(`  ↓ ${f.file}…`);
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${f.gf}&display=swap`;
    const css = await (
      await fetch(cssUrl, { headers: { "user-agent": UA } })
    ).text();
    const woff2 = pickWoff2(css);
    if (!woff2) {
      console.log(` ❌ URL woff2 introuvable`);
      ko++;
      continue;
    }
    const r = await fetch(woff2);
    if (!r.ok) {
      console.log(` ❌ ${r.status}`);
      ko++;
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    await writeFile(dest, buf);
    console.log(` ✓ ${(buf.length / 1024).toFixed(1)} KiB`);
    ok++;
  } catch (err) {
    console.log(` ✗ ${err.message}`);
    ko++;
  }
}
console.log(`\n${ok} OK / ${ko} échec(s)`);
