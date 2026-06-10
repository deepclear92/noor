"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// react-pdf accède à DOMMatrix lors de l'évaluation de son module ;
// on le charge donc uniquement côté client.
export const PdfViewer = dynamic(
  () => import("./PdfViewerClient").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-surface p-12 flex flex-col items-center gap-3 text-muted">
        <Loader2 className="size-6 animate-spin text-accent" />
        <p className="text-sm">Chargement du lecteur PDF…</p>
      </div>
    ),
  },
);
