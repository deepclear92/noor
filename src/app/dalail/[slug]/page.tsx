import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Reader } from "@/components/reader/Reader";
import {
  getDalailIndex,
  getDalailSection,
  getDalailSectionMeta,
  isSectionAvailable,
} from "@/lib/content";

type Params = { slug: string };

export async function generateStaticParams() {
  const idx = await getDalailIndex();
  return idx.sectionsMeta.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const meta = await getDalailSectionMeta(slug);
  if (!meta) return { title: "Section inconnue" };
  return { title: `${meta.fr} — Dalail al-Khayrat` };
}

export default async function DalailSectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const meta = await getDalailSectionMeta(slug);
  if (!meta) notFound();

  const idx = await getDalailIndex();
  const ordered = [...idx.sectionsMeta].sort((a, b) => a.order - b.order);
  const pos = ordered.findIndex((s) => s.slug === slug);
  const prev = pos > 0 ? ordered[pos - 1] : null;
  const next = pos < ordered.length - 1 ? ordered[pos + 1] : null;

  if (!(await isSectionAvailable(slug))) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
          <AlertCircle className="size-10 text-accent mx-auto mb-3" />
          <p className="arabic-text font-arabic-amiri text-3xl mb-2">{meta.ar}</p>
          <h1 className="font-display text-2xl mb-2">{meta.fr}</h1>
          {meta.hint && <p className="text-sm text-muted mb-4">{meta.hint}</p>}
          <p className="text-muted max-w-md mx-auto">
            Cette section n'est pas encore disponible.
          </p>
          <PrevNext prev={prev} next={next} />
        </div>
      </div>
    );
  }

  const section = await getDalailSection(slug);
  if (!section) notFound();

  return (
    <div className="pb-8">
      <Reader section={section} bookSlug="dalail" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-4">
        <PrevNext prev={prev} next={next} />
      </div>
    </div>
  );
}

function PrevNext({
  prev,
  next,
}: {
  prev: { slug: string; fr: string } | null;
  next: { slug: string; fr: string } | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mt-6">
      {prev ? (
        <Link
          href={`/dalail/${prev.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-2 text-sm max-w-[45%]"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span className="truncate">{prev.fr}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/dalail/${next.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-2 text-sm max-w-[45%]"
        >
          <span className="truncate">{next.fr}</span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
