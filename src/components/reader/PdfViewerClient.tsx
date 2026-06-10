"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Minus,
  Plus,
  Download,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useReaderStore } from "@/lib/store";

// PDF.js worker — copié dans /public/pdf-worker.mjs pour matcher la version
// de react-pdf (évite les "API/Worker version mismatch").
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker.mjs";
}

type Props = {
  src: string;
  bookSlug?: string;
  /** slug pour mémoriser la page (ex. "dakira-07") */
  sectionSlug?: string;
  label?: string;
  arLabel?: string;
};

/**
 * Lecteur PDF avec virtualisation. Pour les gros volumes (200+ pages), on ne
 * rend que les pages visibles via IntersectionObserver — sinon le navigateur
 * mobile crash en allouant tous les canvas en mémoire.
 *
 *  - défilement vertical continu
 *  - mémorisation automatique de la page en cours (par volume)
 *  - reprise à la page sauvegardée à la prochaine ouverture
 *  - zoom + boutons + plein écran + téléchargement
 */
export function PdfViewer({
  src,
  bookSlug,
  sectionSlug,
  label,
  arLabel,
}: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [exists, setExists] = useState<boolean | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const initialPage = useReaderStore((s) =>
    sectionSlug ? s.dakhiraPages[sectionSlug] ?? 1 : 1,
  );
  const setDakhiraPage = useReaderStore((s) => s.setDakhiraPage);
  const setLastRead = useReaderStore((s) => s.setLastRead);

  // Vérifie l'existence du fichier
  useEffect(() => {
    let cancelled = false;
    fetch(src, { method: "HEAD" })
      .then((r) => !cancelled && setExists(r.ok))
      .catch(() => !cancelled && setExists(false));
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Marque le volume comme dernier emplacement lu
  useEffect(() => {
    if (bookSlug && sectionSlug) {
      setLastRead({ bookSlug, sectionSlug, label, arLabel, pct: 0 });
    }
  }, [bookSlug, sectionSlug, label, arLabel, setLastRead]);

  // Largeur du conteneur
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(Math.min(w - 24, 1100));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Document chargé : initialiser et scroller à la dernière page
  const onDocLoad = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      const start = Math.max(1, initialPage - 1);
      const end = Math.min(n, initialPage + 1);
      const init = new Set<number>();
      for (let i = start; i <= end; i++) init.add(i);
      setVisiblePages(init);
      setCurrentPage(initialPage);

      if (initialPage > 1 && initialPage <= n) {
        setTimeout(() => {
          const el = pageRefs.current.get(initialPage);
          if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
        }, 250);
      }
    },
    [initialPage],
  );

  // IntersectionObserver : virtualisation
  // On garde max ~5 pages rendues (visible + 2 avant + 2 après).
  useEffect(() => {
    if (!numPages) return;
    if (observerRef.current) observerRef.current.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        // Liste des pages actuellement intersectées
        const intersecting = new Set<number>();
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const p = parseInt(e.target.getAttribute("data-page") ?? "0", 10);
          if (p) intersecting.add(p);
        }
        if (intersecting.size === 0) return;
        // Calcule le centre des intersections
        const min = Math.min(...intersecting);
        const max = Math.max(...intersecting);
        // Garde visible + buffer (max 5 pages au total)
        const next = new Set<number>();
        for (let i = min - 2; i <= max + 2; i++) {
          if (i >= 1 && i <= numPages) next.add(i);
        }
        setVisiblePages(next);
      },
      {
        root: null,
        rootMargin: "100px 0px",
        threshold: 0.01,
      },
    );

    // Observe tous les placeholders existants
    for (const [, el] of pageRefs.current) {
      if (el) obs.observe(el);
    }
    observerRef.current = obs;

    return () => obs.disconnect();
  }, [numPages]);

  // Page courante depuis le scroll
  useEffect(() => {
    if (!numPages) return;
    let raf = 0;
    let lastSavedPage = currentPage;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let best = currentPage;
        let bestDist = Infinity;
        for (const [pageNum, el] of pageRefs.current.entries()) {
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const dist = Math.abs(r.top - 120);
          if (r.bottom > 120 && dist < bestDist) {
            bestDist = dist;
            best = pageNum;
          }
        }
        if (best !== currentPage) setCurrentPage(best);
        if (sectionSlug && best !== lastSavedPage) {
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            setDakhiraPage(sectionSlug, best);
            lastSavedPage = best;
          }, 600);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [currentPage, sectionSlug, setDakhiraPage, numPages]);

  const jumpToPage = (p: number) => {
    const n = numPages ?? 1;
    const target = Math.max(1, Math.min(n, p));
    setVisiblePages((prev) => {
      const next = new Set(prev);
      for (let i = target - 2; i <= target + 2; i++) {
        if (i >= 1 && i <= n) next.add(i);
      }
      return next;
    });
    setTimeout(() => {
      const el = pageRefs.current.get(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(target);
    }, 50);
  };

  if (exists === false) {
    return (
      <div className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-8 text-center">
        <AlertCircle className="size-8 text-accent mx-auto mb-2" />
        <p className="text-muted">
          Fichier PDF non trouvé.{" "}
          <code className="bg-surface px-1.5 py-0.5 rounded text-xs">{src}</code>
        </p>
      </div>
    );
  }

  const pageWidth = containerWidth * scale;
  // Ratio A4 standard pour les placeholders (~1.41)
  const estHeight = Math.round(pageWidth * 1.41);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Toolbar */}
      <div className="sticky top-14 z-20 flex items-center gap-2 p-2 border-b border-border bg-surface-2/95 backdrop-blur">
        <button
          onClick={() => jumpToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded hover:bg-surface disabled:opacity-30"
          aria-label="Page précédente"
        >
          <ChevronUp className="size-4" />
        </button>
        <div className="flex items-center gap-1.5 text-xs tabular-nums">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => jumpToPage(parseInt(e.target.value, 10) || 1)}
            className="w-12 px-1 py-0.5 text-center bg-surface border border-border rounded"
            min={1}
            max={numPages ?? 999}
            aria-label="Numéro de page"
          />
          <span className="text-muted">/ {numPages ?? "…"}</span>
        </div>
        <button
          onClick={() => jumpToPage(currentPage + 1)}
          disabled={!numPages || currentPage >= numPages}
          className="p-1.5 rounded hover:bg-surface disabled:opacity-30"
          aria-label="Page suivante"
        >
          <ChevronDown className="size-4" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="p-1.5 rounded hover:bg-surface"
          aria-label="Zoom arrière"
        >
          <Minus className="size-4" />
        </button>
        <span className="text-xs tabular-nums w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
          className="p-1.5 rounded hover:bg-surface"
          aria-label="Zoom avant"
        >
          <Plus className="size-4" />
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener"
          className="p-1.5 rounded hover:bg-surface"
          aria-label="Plein écran"
          title="Ouvrir dans un nouvel onglet"
        >
          <Maximize2 className="size-4" />
        </a>
        <a
          href={src}
          download
          className="p-1.5 rounded hover:bg-surface"
          aria-label="Télécharger"
        >
          <Download className="size-4" />
        </a>
      </div>

      {/* Document virtualisé */}
      <div
        ref={containerRef}
        className="bg-surface-2 px-2 py-4 sm:px-4 sm:py-6 flex flex-col items-center"
      >
        <Document
          file={src}
          onLoadSuccess={onDocLoad}
          loading={
            <div className="flex items-center gap-2 text-muted py-12">
              <Loader2 className="size-5 animate-spin" />
              Chargement du PDF…
            </div>
          }
          error={
            <div className="text-center text-danger py-12">
              <AlertCircle className="size-6 mx-auto mb-2" />
              Erreur de chargement du PDF.
            </div>
          }
        >
          {Array.from({ length: numPages ?? 0 }, (_, i) => i + 1).map((n) => {
            const shouldRender = visiblePages.has(n);
            return (
              <div
                key={n}
                ref={(el) => {
                  if (el) {
                    pageRefs.current.set(n, el);
                    observerRef.current?.observe(el);
                  } else {
                    pageRefs.current.delete(n);
                  }
                }}
                data-page={n}
                className="mb-3 shadow-md scroll-mt-32 bg-white"
                style={{
                  width: pageWidth,
                  minHeight: shouldRender ? "auto" : estHeight,
                }}
              >
                {shouldRender ? (
                  <Page
                    pageNumber={n}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div
                        className="flex items-center justify-center text-muted"
                        style={{ width: pageWidth, height: estHeight }}
                      >
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Page {n}
                      </div>
                    }
                  />
                ) : (
                  // Placeholder léger : pas de canvas, juste un cadre
                  <div
                    className="flex items-center justify-center text-muted/30 select-none"
                    style={{ width: pageWidth, height: estHeight }}
                  >
                    <span className="text-xs">Page {n}</span>
                  </div>
                )}
                <div className="text-center text-[10px] text-muted py-1 bg-surface">
                  Page {n}
                </div>
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
}
