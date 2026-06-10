import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PdfViewer } from "@/components/reader/PdfViewer";
import { getDakhiraUrl } from "@/lib/dakhira";

type Params = { volume: string };

// Pas de prérendu à build-time — la résolution Blob se fait à la première
// requête seulement (sinon Next.js spamme l'API Vercel Blob pendant le build
// et timeout sur Vercel).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { volume } = await params;
  const num = volume.replace(/^dakira-/, "");
  return { title: `Dakira — Volume ${Number(num)}` };
}

export default async function DakiraVolumePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { volume } = await params;
  const numStr = volume.replace(/^dakira-/, "");
  const num = Number(numStr);
  if (Number.isNaN(num) || num < 1 || num > 56) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p>Volume introuvable.</p>
      </div>
    );
  }
  const padded = String(num).padStart(2, "0");
  const pdfPath = await getDakhiraUrl(num);

  const prev = num > 1 ? `/dakhira/dakira-${String(num - 1).padStart(2, "0")}` : null;
  const next = num < 56 ? `/dakhira/dakira-${String(num + 1).padStart(2, "0")}` : null;

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-6">
      <header className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">
            ذخيرة المحتاج
          </p>
          <h1 className="font-display text-2xl">Volume {num}</h1>
        </div>
        <div className="flex gap-2">
          {prev && (
            <Link
              href={prev}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-2 text-sm"
            >
              <ChevronLeft className="size-4" />
              Vol. {num - 1}
            </Link>
          )}
          <Link
            href="/dakhira"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-2 text-sm"
          >
            Sommaire
          </Link>
          {next && (
            <Link
              href={next}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-2 text-sm"
            >
              Vol. {num + 1}
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </header>

      <PdfViewer
        src={pdfPath}
        bookSlug="dakhira"
        sectionSlug={`dakira-${padded}`}
        label={`Dakira — Volume ${num}`}
        arLabel={`ذخيرة المحتاج — المجلد ${num}`}
      />
    </div>
  );
}
