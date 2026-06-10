#!/usr/bin/env node
/**
 * build-index.mjs — Régénère src/content/dalail/_index.json à partir des
 * fichiers section présents. Calcule la durée estimée à partir du nombre
 * de lignes, classe les sections, et expose les sources/audio.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "..", "src", "content", "dalail");

const ORDER_HINT = {
  // Sourates
  "ya-sin": 0, "al-fath": 1, "al-waqia": 2,
  // Préambule
  "iftitah": 3, "duaa-niyya": 4, "fasl": 5,
  "asma-nabi": 6, "asma-allah": 7, "duaa-bidayah": 8,
  // Ahzab
  "hizb-1-lundi": 10, "hizb-2-mardi": 11, "hizb-3-mercredi": 12,
  "hizb-4-jeudi": 13, "hizb-5-vendredi": 14, "hizb-6-samedi": 15,
  "hizb-7-dimanche": 16, "hizb-8-lundi-2": 17,
  // Clôture
  "khatm": 20, "duaa-apres": 21,
  // Qasaid (biographies + qasaid)
  "bio-ibn-nasir": 30, "duaa-nasiri": 31,
  "bio-ibn-nahwi": 32, "munfarija": 33,
  "bio-ibn-mashish": 34, "salat-mashishiyya": 35, "zajr-mashishiyya": 36,
  "bio-jilani": 37, "hizb-nasr": 38,
  "bio-busiri": 39, "burda": 40,
};

const files = (await readdir(DIR)).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
const sections = [];
for (const f of files) {
  const raw = await readFile(resolve(DIR, f), "utf-8");
  const d = JSON.parse(raw);
  sections.push({
    slug: d.slug,
    order: ORDER_HINT[d.slug] ?? d.order ?? 99,
    category: d.category,
    ar: d.ar,
    fr: d.fr,
    hint: d.hint,
    durationMin: Math.max(1, Math.round((d.lines?.length ?? 0) / 10)),
    hasAudio: !!d.audio,
    source: d.source,
  });
}
sections.sort((a, b) => a.order - b.order);

const index = {
  slug: "dalail",
  ar: "دلائل الخيرات",
  fr: "Dalail al-Khayrat",
  author: {
    ar: "الإمام محمد بن سليمان الجزولي",
    fr: "Imam Muhammad ibn Sulayman al-Jazuli (m. 870 H / 1465)",
  },
  description: {
    fr: "Recueil de prières sur le Prophète ﷺ, complété par des qasaid (Burda, Munfarija, Mashishiyya), des du'as (Nasiri, ouverture, clôture) et le Hizb an-Nasr.",
    ar: "كتاب في الصلاة على النبي ﷺ للإمام أبي عبد الله محمد بن سليمان الجزولي",
  },
  sources: [
    { name: "quran.com", url: "https://quran.com", uses: "Texte coranique des sourates introductives" },
    { name: "dalailalkhayrat.com", url: "https://www.dalailalkhayrat.com/", uses: "Ahzab + audio synchronisé + traductions" },
    { name: "qasidaburda.com", url: "https://www.qasidaburda.com/", uses: "Qasidat al-Burda + audio par chapitre" },
  ],
  sectionsMeta: sections,
};
await writeFile(resolve(DIR, "_index.json"), JSON.stringify(index, null, 2), "utf-8");
console.log(`✓ _index.json régénéré · ${sections.length} sections`);
for (const s of sections) {
  console.log(`  ${String(s.order).padStart(2)} · ${s.slug.padEnd(22)} · ${s.category.padEnd(10)} · ${s.hasAudio ? "🔊" : "  "} · ${s.durationMin}m`);
}
