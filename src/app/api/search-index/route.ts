import { NextResponse } from "next/server";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { normalizeArabic } from "@/lib/arabic";

// Endpoint statique: liste agrégée de toutes les lignes pour la recherche.
// Construit au build / au premier appel ; mis en cache fortement.
export const dynamic = "force-static";

type Row = {
  bookSlug: string;
  sectionSlug: string;
  sectionFr: string;
  sectionAr: string;
  lineId: string;
  ar: string;
  arNorm: string;
  translit?: string;
  tr?: string;
};

export async function GET() {
  const dir = path.join(process.cwd(), "src", "content", "dalail");
  const files = (await readdir(dir)).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_"),
  );

  const rows: Row[] = [];
  for (const f of files) {
    const raw = await readFile(path.join(dir, f), "utf-8");
    const json = JSON.parse(raw) as {
      slug: string;
      ar: string;
      fr: string;
      lines: Array<{
        id: string;
        ar: string;
        translit?: string;
        tr?: Record<string, string>;
      }>;
    };
    for (const l of json.lines) {
      rows.push({
        bookSlug: "dalail",
        sectionSlug: json.slug,
        sectionFr: json.fr,
        sectionAr: json.ar,
        lineId: l.id,
        ar: l.ar,
        arNorm: normalizeArabic(l.ar),
        translit: l.translit,
        tr: l.tr?.fr,
      });
    }
  }

  return NextResponse.json({ count: rows.length, rows });
}
