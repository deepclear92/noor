#!/usr/bin/env node
/**
 * fetch-dalail-site.mjs — Scrape dalailalkhayrat.com pour :
 *   - les 8 ahzab (parts.php?part=N)
 *   - les noms du Prophète ﷺ et d'Allah (names.php)
 *   - les du'as d'ouverture, d'intention et de clôture (duas.php)
 *
 * Pour chaque entrée:
 *   - arabe vocalisé
 *   - translittération latine
 *   - traductions FR, EN, ID, FA, TR
 *   - timestamps audio (data-from / playFrom) pour synchronisation
 *
 * Audio: déposé dans public/content/audio/dalail/
 */
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "src", "content", "dalail");
const AUDIO_DIR = resolve(ROOT, "public", "content", "audio", "dalail");
const BASE = "https://www.dalailalkhayrat.com";

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

const TARGETS = [
  // slug,                page on site,                    order, category, ar, fr, hint
  { slug: "iftitah",         path: "/duas.php?dua=opening",      order: 3, category: "preambule", ar: "افتتاح دلائل الخيرات", fr: "Ouverture de Dalail al-Khayrat", hint: "Préambule" },
  { slug: "duaa-niyya",      path: "/duas.php?dua=intention",    order: 4, category: "preambule", ar: "نية القراءة",          fr: "Du'a d'intention",               hint: "Intention de lecture", isNew: true },
  { slug: "asma-nabi",       path: "/names.php?names=RasoolSAW", order: 5, category: "preambule", ar: "أسماء سيدنا محمد ﷺ",     fr: "Les noms du Prophète ﷺ",         hint: "Pré-récitation (203 noms)" },
  { slug: "asma-allah",      path: "/names.php?names=Allah",     order: 6, category: "preambule", ar: "أسماء الله الحسنى",    fr: "Les noms d'Allah",               hint: "99 noms divins", isNew: true },
  { slug: "duaa-bidayah",    path: "/duas.php?dua=intention",    order: 7, category: "preambule", ar: "دعاء بدء دلائل الخيرات", fr: "Du'a d'ouverture",               hint: "Avant le hizb" },
  { slug: "hizb-1-lundi",    path: "/parts.php?part=1", order: 10, category: "ahzab", ar: "الحزب الأول",   fr: "Hizb 1 — Lundi",       hint: "Lundi (الإثنين)" },
  { slug: "hizb-2-mardi",    path: "/parts.php?part=2", order: 11, category: "ahzab", ar: "الحزب الثاني",  fr: "Hizb 2 — Mardi",       hint: "Mardi (الثلاثاء)" },
  { slug: "hizb-3-mercredi", path: "/parts.php?part=3", order: 12, category: "ahzab", ar: "الحزب الثالث",  fr: "Hizb 3 — Mercredi",    hint: "Mercredi (الأربعاء)" },
  { slug: "hizb-4-jeudi",    path: "/parts.php?part=4", order: 13, category: "ahzab", ar: "الحزب الرابع",  fr: "Hizb 4 — Jeudi",       hint: "Jeudi (الخميس)" },
  { slug: "hizb-5-vendredi", path: "/parts.php?part=5", order: 14, category: "ahzab", ar: "الحزب الخامس",  fr: "Hizb 5 — Vendredi",    hint: "Vendredi (الجمعة)" },
  { slug: "hizb-6-samedi",   path: "/parts.php?part=6", order: 15, category: "ahzab", ar: "الحزب السادس", fr: "Hizb 6 — Samedi",      hint: "Samedi (السبت)" },
  { slug: "hizb-7-dimanche", path: "/parts.php?part=7", order: 16, category: "ahzab", ar: "الحزب السابع", fr: "Hizb 7 — Dimanche",    hint: "Dimanche (الأحد)" },
  { slug: "hizb-8-lundi-2",  path: "/parts.php?part=8", order: 17, category: "ahzab", ar: "الجزء الثامن", fr: "Hizb 8 — Lundi (2e tour)", hint: "Conclusion hebdomadaire" },
  { slug: "duaa-apres",      path: "/duas.php?dua=completion",   order: 20, category: "cloture",   ar: "دعاء يقرأ عقب دلائل الخيرات", fr: "Du'a après la lecture", hint: "Bouclage du khatm" },
];

const LANG_KEYS = ["trans", "transFR", "transID", "transFA", "transTR"];

function extractAudio(html) {
  const m = html.match(/<source\s+src="([^"]+)"/i);
  return m ? m[1] : null;
}

function parseLangBlock(seg, cls) {
  const m = seg.match(
    new RegExp(`<p\\s+class="lang\\s+${cls}"[^>]*>([\\s\\S]*?)</p>`, "i"),
  );
  if (!m) return null;
  return decode(m[1].replace(/<[^>]+>/g, "")).trim() || null;
}

function extractVerses(html) {
  // 1. Tronque jusqu'au début du transcript (#MyP) pour ignorer les commentaires
  //    HTML et les blocs hors contenu (footer, menu, etc.).
  const start = html.search(/<div\s+id="MyP"[^>]*>/i);
  const end = html.search(/<\/div>\s*<\/section>\s*<section[^>]+class="cid-/i);
  const body = start >= 0 ? html.slice(start, end > start ? end : undefined) : html;

  // 2. Trouve toutes les <p class="lang XYZ">...</p> dans l'ordre.
  //    On accepte aussi <p class="numbers">N<span onclick="playFrom(T)">…</p>.
  const verses = [];
  let pendingNum = null;
  let pendingTime = null;
  let current = null; // verse en cours de construction

  const re =
    /<p\s+class="(numbers|lang\s+\S+)"[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(body))) {
    const cls = m[1];
    const inner = m[2];
    if (cls === "numbers") {
      const n = inner.match(/^\s*(\d+)/);
      const t = inner.match(/playFrom\(([^,)\s]+)/);
      pendingNum = n ? parseInt(n[1], 10) : null;
      pendingTime = t ? parseFloat(t[1]) : null;
      continue;
    }
    const subcls = cls.replace(/^lang\s+/i, "");
    const text = decode(inner.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, "")).trim();
    if (!text) continue;

    if (subcls === "arabicText") {
      // Démarre un nouveau verse
      if (current) verses.push(current);
      current = {
        num: pendingNum ?? verses.length + 1,
        time: pendingTime ?? null,
        ar: text,
        translit: null,
        tr: {},
      };
      pendingNum = null;
      pendingTime = null;
    } else if (current) {
      if (subcls === "translit") current.translit = text;
      else if (subcls === "transFR") current.tr.fr = text;
      else if (subcls === "trans") current.tr.en = text;
      else if (subcls === "transID") current.tr.id = text;
      else if (subcls === "transFA") current.tr.fa = text;
      else if (subcls === "transTR") current.tr.tr = text;
    }
  }
  if (current) verses.push(current);
  // Normalise tr à null si vide
  for (const v of verses) {
    if (Object.keys(v.tr).length === 0) v.tr = null;
  }
  return verses;
}

async function downloadAudio(srcPath, slug) {
  if (!srcPath) return null;
  const url = srcPath.startsWith("http") ? srcPath : BASE + srcPath;
  const ext = url.split(".").pop().split("?")[0];
  const filename = `${slug}.${ext}`;
  const dest = resolve(AUDIO_DIR, filename);
  process.stdout.write(`    ↳ audio…`);
  const r = await fetch(url);
  if (!r.ok) {
    console.log(` ❌ ${r.status}`);
    return null;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(dest, buf);
  console.log(` ✓ ${(buf.length / 1024 / 1024).toFixed(1)} MiB`);
  return `/content/audio/dalail/${filename}`;
}

async function fetchTarget(t) {
  const url = BASE + t.path;
  process.stdout.write(`→ ${t.slug.padEnd(20)} `);
  const html = await (await fetch(url)).text();
  const verses = extractVerses(html);
  const audioPath = await downloadAudio(extractAudio(html), t.slug);
  const ext = audioPath?.split(".").pop();
  console.log(`${String(verses.length).padStart(3)} entrées, audio=${audioPath ? "✓" : "—"}`);

  const lines = verses.map((v, i) => ({
    id: `${t.slug}-${String(i + 1).padStart(3, "0")}`,
    num: v.num,
    ar: v.ar,
    translit: v.translit ?? undefined,
    tr: v.tr ?? undefined,
    kind: t.category === "ahzab" ? "prose" : "prose",
    audio: audioPath ?? undefined,
    audioStart: v.time ?? undefined,
  }));

  const section = {
    slug: t.slug,
    order: t.order,
    category: t.category,
    ar: t.ar,
    fr: t.fr,
    hint: t.hint,
    source: url,
    audio: audioPath ?? undefined,
    lines,
  };

  const out = resolve(OUT_DIR, `${t.slug}.json`);
  await writeFile(out, JSON.stringify(section, null, 2), "utf-8");
  return { slug: t.slug, count: verses.length, audio: !!audioPath };
}

await mkdir(AUDIO_DIR, { recursive: true });
console.log("Scraping dalailalkhayrat.com…\n");
for (const t of TARGETS) {
  try {
    await fetchTarget(t);
  } catch (err) {
    console.error(`  ✗ ${t.slug}: ${err.message}`);
  }
}
console.log("\n✓ dalail importé depuis dalailalkhayrat.com");
