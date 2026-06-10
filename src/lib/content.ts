// Chargement des contenus depuis le filesystem au build (Server Components).
// Tous les JSON de src/content/dalail/*.json sont disponibles automatiquement.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Section, BookIndex } from "@/types/content";

const DALAIL_DIR = path.join(process.cwd(), "src", "content", "dalail");

let _indexCache: BookIndex | null = null;
let _availableCache: Set<string> | null = null;

export async function getDalailIndex(): Promise<BookIndex> {
  if (_indexCache) return _indexCache;
  const raw = await readFile(path.join(DALAIL_DIR, "_index.json"), "utf-8");
  _indexCache = JSON.parse(raw) as BookIndex;
  return _indexCache;
}

export async function getAvailableSlugs(): Promise<Set<string>> {
  if (_availableCache) return _availableCache;
  const files = await readdir(DALAIL_DIR);
  _availableCache = new Set(
    files
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .map((f) => f.replace(/\.json$/, "")),
  );
  return _availableCache;
}

export async function getDalailSection(slug: string): Promise<Section | null> {
  const available = await getAvailableSlugs();
  if (!available.has(slug)) return null;
  const raw = await readFile(path.join(DALAIL_DIR, `${slug}.json`), "utf-8");
  return JSON.parse(raw) as Section;
}

export async function getDalailSectionMeta(slug: string) {
  const idx = await getDalailIndex();
  return idx.sectionsMeta.find((s) => s.slug === slug) ?? null;
}

export async function isSectionAvailable(slug: string): Promise<boolean> {
  const av = await getAvailableSlugs();
  return av.has(slug);
}

/** Catégories utilisées dans la TOC */
export const CATEGORIES = [
  { key: "intro",     ar: "السور المقدمة",         fr: "Sourates introductives" },
  { key: "preambule", ar: "افتتاح ومقدمة",          fr: "Préambule" },
  { key: "ahzab",     ar: "أحزاب الأسبوع",          fr: "Les 8 ahzab de la semaine" },
  { key: "cloture",   ar: "ختم الدلائل",            fr: "Clôture & du'a" },
  { key: "qasaid",    ar: "قصائد ودعوات وأذكار",   fr: "Qasaid, du'as & ahzab additionnels" },
] as const;
