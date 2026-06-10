import Link from "next/link";
import { BookOpen, ScrollText } from "lucide-react";
import { CATEGORIES, getDalailIndex } from "@/lib/content";
import { ResumeReading } from "@/components/ResumeReading";
import type { SectionMeta } from "@/types/content";

export const metadata = {
  title: "Dalail al-Khayrat — sommaire",
};

export default async function DalailIndexPage() {
  const idx = await getDalailIndex();

  // Regroupe par catégorie
  const grouped = new Map<string, SectionMeta[]>();
  for (const m of idx.sectionsMeta) {
    const cat = (m.category ?? "qasaid") as string;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(m);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <header className="mb-8 text-center">
        <p className="arabic-text font-arabic-diwani text-4xl text-accent mb-2">
          {idx.ar}
        </p>
        <h1 className="font-display text-3xl mb-2">{idx.fr}</h1>
        {idx.author?.fr && (
          <p className="text-sm text-muted">par {idx.author.fr}</p>
        )}
        <p className="text-muted text-sm max-w-2xl mx-auto mt-3">
          {idx.description?.fr}
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Link
            href="/dalail/continu"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-2 text-sm"
          >
            <ScrollText className="size-4" />
            Lecture continue
          </Link>
        </div>
      </header>

      <ResumeReading book="dalail" className="mb-8" />

      {CATEGORIES.map((cat) => {
        const items = (grouped.get(cat.key) ?? []).sort(
          (a, b) => a.order - b.order,
        );
        if (items.length === 0) return null;
        return (
          <CategoryBlock key={cat.key} title={cat.fr} ar={cat.ar} items={items} />
        );
      })}
    </div>
  );
}

function CategoryBlock({
  title,
  ar,
  items,
}: {
  title: string;
  ar: string;
  items: SectionMeta[];
}) {
  return (
    <section className="mb-10">
      <header className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl text-foreground">{title}</h2>
        <p className="arabic-text font-arabic-amiri text-base text-muted">
          {ar}
        </p>
      </header>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.slug}>
            <Link
              href={`/dalail/${it.slug}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="size-4 text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{it.fr}</p>
                  {it.hint && (
                    <p className="text-xs text-muted truncate">{it.hint}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="arabic-text font-arabic-amiri text-lg">
                  {it.ar}
                </p>
                {it.durationMin && (
                  <p className="text-xs text-muted">~{it.durationMin} min</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
