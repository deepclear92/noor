#!/usr/bin/env node
/**
 * fetch-burda.mjs — Scrape les 10 chapitres de la Qasidat al-Burda depuis
 * qasidaburda.com.
 *
 * Récupère pour chaque vers :
 *  - texte arabe vocalisé (2 hémistiches séparés par <br/>)
 *  - translittération latine
 *  - traduction anglaise (qasidaburda.com ne fournit pas le FR)
 *  - timing de synchronisation audio (data-from="X" → ms)
 *
 * Audio: 10 fichiers `/assets/audio/Burda_N.mp3` téléchargés localement.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_JSON = resolve(ROOT, "src", "content", "dalail", "burda.json");
const OUT_AUDIO = resolve(ROOT, "public", "content", "audio", "burda");

const BASE = "https://www.qasidaburda.com";
const N_CHAPTERS = 10;

const CHAPTER_TITLES_FR = {
  1: "Sur l'amour du Prophète ﷺ",
  2: "Sur la mise en garde contre les caprices de l'âme",
  3: "Les louanges du Prophète ﷺ",
  4: "Sur sa naissance bénie",
  5: "Ses miracles",
  6: "Sur la noblesse du Saint Coran",
  7: "Le voyage nocturne et l'ascension (Isrāʾ wa Miʿrāj)",
  8: "Sur le jihad et les exploits du Prophète ﷺ",
  9: "Sur la demande de pardon et l'intercession",
  10: "Sur l'imploration et l'invocation",
};

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

function extractVerses(html) {
  // Capture: numbers + timestamp + arabic + translit + transID + trans + transSingable
  // On parcourt par bloc commençant par <!-- N--> jusqu'au prochain
  const verses = [];
  const blocks = html.split(/<!--\s*\d+\s*-->/);
  // blocks[0] = avant le premier vers
  for (let i = 1; i < blocks.length; i++) {
    const seg = blocks[i];
    const numMatch = seg.match(/<p\s+class="numbers">(\d+)<span[^>]*data-from="([^"]+)"/);
    if (!numMatch) continue;
    const num = parseInt(numMatch[1], 10);
    const dataFrom = parseFloat(numMatch[2]);

    const grab = (cls) => {
      const m = seg.match(
        new RegExp(
          `<p\\s+class="lang\\s+${cls}"[^>]*>([\\s\\S]*?)</p>`,
          "i",
        ),
      );
      return m ? decode(m[1]).replace(/<br\s*\/?\s*>/gi, " ٭ ").replace(/<[^>]+>/g, "").trim() : null;
    };

    const ar = grab("arabicText");
    const translit = grab("translit");
    const tr = grab("trans");
    const transId = grab("transID");
    const transSing = grab("transSingable");
    if (!ar) continue;
    verses.push({ num, time: dataFrom, ar, translit, tr, transId, transSing });
  }
  return verses;
}

function extractAudio(html) {
  const m = html.match(/<source\s+src="([^"]+)"/i);
  return m ? m[1] : null;
}

async function fetchChapter(num) {
  const url = `${BASE}/chapters.php?chapter=${num}`;
  const html = await (await fetch(url)).text();
  return {
    num,
    url,
    verses: extractVerses(html),
    audioPath: extractAudio(html),
  };
}

async function downloadAudio(srcPath, num) {
  const url = srcPath.startsWith("http") ? srcPath : BASE + srcPath;
  const dest = resolve(OUT_AUDIO, `burda-${String(num).padStart(2, "0")}.mp3`);
  process.stdout.write(`    ↳ audio ${num}…`);
  const r = await fetch(url);
  if (!r.ok) {
    console.log(` ❌ ${r.status}`);
    return null;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(dest, buf);
  console.log(` ✓ ${(buf.length / 1024 / 1024).toFixed(1)} MiB`);
  return `/content/audio/burda/burda-${String(num).padStart(2, "0")}.mp3`;
}

await mkdir(OUT_AUDIO, { recursive: true });
console.log("Scraping qasidaburda.com…");

const lines = [];
let globalCounter = 0;
for (let n = 1; n <= N_CHAPTERS; n++) {
  process.stdout.write(`  ↓ chapitre ${n}…`);
  const c = await fetchChapter(n);
  console.log(` ${c.verses.length} vers`);
  const audioPath = c.audioPath ? await downloadAudio(c.audioPath, n) : null;

  // Titre de chapitre
  lines.push({
    id: `burda-c${n}-title`,
    ar: `الفصل ${toArabicNum(n)}`,
    tr: { fr: `${n}. ${CHAPTER_TITLES_FR[n] ?? `Chapitre ${n}`}` },
    kind: "heading",
    chapter: n,
    audio: audioPath ?? undefined,
  });

  for (const v of c.verses) {
    globalCounter++;
    lines.push({
      id: `burda-v${String(globalCounter).padStart(3, "0")}`,
      chapter: n,
      verseNum: v.num,
      ar: v.ar,
      translit: v.translit ?? undefined,
      tr: {
        ...(v.tr ? { en: v.tr } : {}),
        ...(v.transSing ? { enSingable: v.transSing } : {}),
        ...(v.transId ? { id: v.transId } : {}),
      },
      kind: "poetry",
      audio: audioPath ?? undefined,
      audioStart: v.time,
    });
  }
}

function toArabicNum(n) {
  const map = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  return String(n).split("").map((d) => map[Number(d)] ?? d).join("");
}

const section = {
  slug: "burda",
  order: 27,
  category: "qasaid",
  ar: "قصيدة البردة",
  fr: "Qasidat al-Burda",
  hint: "Imam al-Busiri — 10 chapitres avec audio synchronisé",
  source: "https://www.qasidaburda.com/",
  pages: [279, 289],
  lines,
};

await writeFile(OUT_JSON, JSON.stringify(section, null, 2), "utf-8");
console.log(`\n✓ ${lines.length} lignes → src/content/dalail/burda.json`);
console.log(`  audio + sync → public/content/audio/burda/`);
