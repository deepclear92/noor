#!/usr/bin/env node
/**
 * fetch-sourates.mjs — Importe les 3 sourates introductives de Dalail al-Khayrat
 * (Ya-Sin, Al-Fath, Al-Waqi'a) depuis l'API officielle quran.com.
 *
 * Pour chaque sourate, récupère :
 *  - texte uthmani propre, vocalisé
 *  - translittération mot-à-mot, concaténée
 *  - traduction française (Hamidullah, id 31)
 *  - URL audio par verset (Alafasy) + URL audio complet de la sourate
 *  - timing word-by-word pour synchronisation
 *
 * Écrase src/content/dalail/{ya-sin,al-fath,al-waqia}.json.
 */
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "src", "content", "dalail");

const API = "https://api.quran.com/api/v4";
const TRANSLATION_FR = 31; // Muhammad Hamidullah
const RECITER_ID = 7;       // Mishary Rashid Alafasy
const AUDIO_VERSE_BASE = "https://verses.quran.com/Alafasy/mp3";

const SOURATES = [
  { slug: "ya-sin",   id: 36, ar: "سورة يس",       fr: "Sourate Ya-Sin",    order: 0, pages: [5, 20] },
  { slug: "al-fath",  id: 48, ar: "سورة الفتح",     fr: "Sourate Al-Fath",   order: 1, pages: [21, 32] },
  { slug: "al-waqia", id: 56, ar: "سورة الواقعة",   fr: "Sourate Al-Waqi'a", order: 2, pages: [33, 42] },
];

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}

async function fetchAllVerses(chapterId) {
  const verses = [];
  let page = 1;
  while (true) {
    const url =
      `${API}/verses/by_chapter/${chapterId}` +
      `?language=fr&words=true&translations=${TRANSLATION_FR}` +
      `&fields=text_uthmani,text_indopak,page_number,juz_number` +
      `&word_fields=text_uthmani,transliteration` +
      `&audio=${RECITER_ID}&per_page=50&page=${page}`;
    const d = await fetchJson(url);
    verses.push(...d.verses);
    const meta = d.meta ?? d.pagination ?? {};
    const totalPages =
      meta.total_pages ??
      Math.ceil((meta.total_records ?? verses.length) / (meta.per_page ?? 50));
    if (page >= totalPages || d.verses.length === 0) break;
    page++;
  }
  return verses;
}

async function fetchChapter(meta) {
  console.log(`\n→ ${meta.fr} (sourate ${meta.id})`);
  const chap = await fetchJson(`${API}/chapters/${meta.id}`);
  const fullAudio = await fetchJson(
    `${API}/chapter_recitations/${RECITER_ID}/${meta.id}`,
  );
  const verses = await fetchAllVerses(meta.id);
  console.log(`  ↳ ${verses.length} versets récupérés`);

  // Bismillah pre — la basmala est implicite sauf pour At-Tawba
  const lines = [];
  if (chap.chapter.bismillah_pre) {
    lines.push({
      id: `${meta.slug}-basmala`,
      ar: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      translit: "Bismi llāhi r-Raḥmāni r-Raḥīm",
      tr: { fr: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux." },
      kind: "basmala",
    });
  }

  for (const v of verses) {
    // Translittération par mot, en concaténant les words avec leur translit (skip les marqueurs end)
    const transWords = (v.words ?? [])
      .filter((w) => w.char_type_name === "word" && w.transliteration?.text)
      .map((w) => w.transliteration.text);
    const translit = transWords.join(" ").trim();
    const fr = v.translations?.[0]?.text ?? "";
    const verseNum = v.verse_number;
    const audioName =
      String(meta.id).padStart(3, "0") + String(verseNum).padStart(3, "0") + ".mp3";

    lines.push({
      id: `${meta.slug}-v${verseNum}`,
      ayah: verseNum,
      ar: v.text_uthmani.trim(),
      translit: translit || undefined,
      tr: fr ? { fr: stripTags(fr) } : undefined,
      kind: "verse",
      audio: `${AUDIO_VERSE_BASE}/${audioName}`,
      // segments: [word_position, end_position, start_ms, duration_ms]
      audioSegments: v.audio?.segments,
      page: v.page_number,
    });
  }

  const section = {
    slug: meta.slug,
    order: meta.order,
    category: "intro",
    ar: meta.ar,
    fr: meta.fr,
    hint: "Sourate introductive",
    pages: meta.pages,
    source: `https://quran.com/ar/${meta.id}`,
    audio: fullAudio.audio_file?.audio_url,
    lines,
  };
  const out = resolve(OUT_DIR, `${meta.slug}.json`);
  await writeFile(out, JSON.stringify(section, null, 2), "utf-8");
  console.log(`  ✓ ${out.replace(resolve(OUT_DIR, ".."), ".")}`);
}

function stripTags(s) {
  return s
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

for (const s of SOURATES) {
  try {
    await fetchChapter(s);
  } catch (err) {
    console.error(`  ✗ ${s.slug} : ${err.message}`);
  }
}
console.log("\n✓ Sourates importées depuis quran.com");
