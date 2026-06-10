import { Reader } from "@/components/reader/Reader";
import { getDalailIndex, getDalailSection, isSectionAvailable } from "@/lib/content";
import type { Section } from "@/types/content";

export const metadata = {
  title: "Lecture continue — Dalail al-Khayrat",
};

export default async function DalailContinuPage() {
  const idx = await getDalailIndex();
  const ordered = [...idx.sectionsMeta].sort((a, b) => a.order - b.order);
  const sections: Section[] = [];
  for (const m of ordered) {
    if (!(await isSectionAvailable(m.slug))) continue;
    const s = await getDalailSection(m.slug);
    if (s) sections.push(s);
  }

  return (
    <div className="pb-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-2">
        <p className="text-xs uppercase tracking-wider text-accent font-semibold">
          Lecture continue
        </p>
        <h1 className="font-display text-3xl">{idx.fr}</h1>
        <p className="arabic-text font-arabic-diwani text-2xl text-muted mt-1">
          {idx.ar}
        </p>
        <p className="text-sm text-muted mt-2">
          {sections.length} sections — {sections.reduce((a, s) => a + s.lines.length, 0)} lignes
        </p>
      </div>
      {sections.map((s, i) => (
        <div
          key={s.slug}
          className="border-t border-border mt-8 pt-8 first:border-0 first:mt-0"
        >
          <Reader section={s} bookSlug="dalail" showToolbar={i === 0} />
        </div>
      ))}
      {sections.length === 0 && (
        <p className="mx-auto max-w-3xl px-4 sm:px-6 text-muted">
          Aucune section disponible.
        </p>
      )}
    </div>
  );
}
