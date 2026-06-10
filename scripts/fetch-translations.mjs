#!/usr/bin/env node
/**
 * fetch-translations.mjs — Scrape la translittération et la traduction
 * depuis dalailalkhayrat.com et les fusionne dans les JSON de section.
 *
 * Stratégie:
 *   1. Charge chaque JSON existant dans src/content/dalail/
 *   2. Récupère la page correspondante du site source
 *   3. Aligne ligne-à-ligne (heuristique sur le texte arabe normalisé)
 *   4. Réécrit le JSON avec les champs translit et tr.fr ajoutés
 *
 * NOTE: le mapping des URL sources est manuel et doit être complété.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CONTENT_DIR = resolve(ROOT, "src/content/dalail");

// À compléter en explorant https://www.dalailalkhayrat.com
const URL_MAP = {
  "ya-sin": "https://www.dalailalkhayrat.com/intro-ya-sin",
  "al-fath": "https://www.dalailalkhayrat.com/intro-al-fath",
  "al-waqia": "https://www.dalailalkhayrat.com/intro-al-waqia",
  "hizb-1-lundi": "https://www.dalailalkhayrat.com/hizb-1",
  "hizb-2-mardi": "https://www.dalailalkhayrat.com/hizb-2",
  "hizb-3-mercredi": "https://www.dalailalkhayrat.com/hizb-3",
  "hizb-4-jeudi": "https://www.dalailalkhayrat.com/hizb-4",
  "hizb-5-vendredi": "https://www.dalailalkhayrat.com/hizb-5",
  "hizb-6-samedi": "https://www.dalailalkhayrat.com/hizb-6",
  "hizb-7-dimanche": "https://www.dalailalkhayrat.com/hizb-7",
  "hizb-8-lundi-2": "https://www.dalailalkhayrat.com/hizb-8",
};

const TASHKIL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

function normalize(s) {
  return s
    .replace(TASHKIL, "")
    .replace(TATWEEL, "")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .trim();
}

async function fetchPage(url) {
  const r = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 NoorReader/1.0" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} pour ${url}`);
  return r.text();
}

/**
 * Parse extrêmement basique: à adapter au DOM réel du site source.
 * Renvoie un tableau de triplets { ar, translit, tr }.
 */
function extractRows(html) {
  // Hypothèse: rows séparés par <tr> ou <div class="row"> contenant trois colonnes
  // Cette logique sera ajustée après inspection du HTML réel.
  const rows = [];
  const trRegex = /<(?:tr|div)[^>]*?(?:row|verse|line)[^>]*>([\s\S]*?)<\/(?:tr|div)>/gi;
  let m;
  while ((m = trRegex.exec(html))) {
    const cells = [...m[1].matchAll(/<(?:td|div|p|span)[^>]*>([\s\S]*?)<\/(?:td|div|p|span)>/gi)]
      .map((c) => c[1].replace(/<[^>]+>/g, "").trim());
    if (cells.length >= 3) {
      const [a, b, c] = cells;
      const arabic = [a, b, c].find((x) => /[؀-ۿ]/.test(x));
      const others = [a, b, c].filter((x) => x !== arabic);
      rows.push({
        ar: arabic ?? "",
        translit: others[0] ?? "",
        tr: others[1] ?? "",
      });
    }
  }
  return rows;
}

async function enrich(slug) {
  const url = URL_MAP[slug];
  if (!url) {
    console.log(`  - ${slug}: pas d'URL définie, ignoré`);
    return;
  }
  const file = resolve(CONTENT_DIR, `${slug}.json`);
  const json = JSON.parse(await readFile(file, "utf-8"));

  let html;
  try {
    html = await fetchPage(url);
  } catch (e) {
    console.log(`  ✗ ${slug}: ${e.message}`);
    return;
  }
  const rows = extractRows(html);
  if (rows.length === 0) {
    console.log(`  ! ${slug}: aucune ligne extraite — DOM à adapter`);
    return;
  }

  // Aligne par texte arabe normalisé
  const map = new Map(rows.map((r) => [normalize(r.ar), r]));
  let hits = 0;
  for (const line of json.lines) {
    const key = normalize(line.ar);
    const found = map.get(key);
    if (!found) continue;
    if (found.translit) line.translit = found.translit;
    if (found.tr) {
      line.tr = line.tr ?? {};
      line.tr.fr = found.tr;
    }
    hits++;
  }
  await writeFile(file, JSON.stringify(json, null, 2), "utf-8");
  console.log(`  ✓ ${slug}: ${hits}/${json.lines.length} lignes enrichies`);
}

async function main() {
  const files = (await readdir(CONTENT_DIR)).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_"),
  );
  console.log(`Enrichissement de ${files.length} fichiers…`);
  for (const f of files) {
    const slug = f.replace(/\.json$/, "");
    await enrich(slug);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
