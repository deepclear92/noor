"use client";

import Link from "next/link";
import { BookOpen, X, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useReaderStore, type LastRead } from "@/lib/store";
import { cn } from "@/lib/cn";

/**
 * Carte "Reprendre la lecture".
 *
 * - `book` = "dalail" | "dakhira" : limite à un livre précis (utilisé sur les
 *    pages d'index Dalail / Dakhira).
 * - Sans `book` : affiche le dernier emplacement tous livres confondus (accueil).
 */
export function ResumeReading({
  book,
  variant = "hero",
  className,
}: {
  book?: "dalail" | "dakhira";
  variant?: "hero" | "compact";
  className?: string;
}) {
  const last = useReaderStore((s) =>
    book ? s.lastReadByBook[book] : s.lastReadGlobal,
  );
  const clear = useReaderStore((s) => s.clearLastRead);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || !last) return null;

  const href = buildHref(last);
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 relative overflow-hidden",
        isHero ? "p-5 sm:p-6" : "p-4",
        className,
      )}
    >
      <div className="absolute inset-0 ornament-corner opacity-30 pointer-events-none" />
      <div className="flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-accent/15 text-accent inline-flex items-center justify-center shrink-0">
            <RotateCcw className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-accent font-semibold">
              Reprendre la lecture
            </p>
            <p className="font-medium truncate">
              {last.label ?? `${last.bookSlug} • ${last.sectionSlug}`}
            </p>
            {last.arLabel && (
              <p className="arabic-text font-arabic-amiri text-sm text-muted truncate">
                {last.arLabel}
              </p>
            )}
            {typeof last.pct === "number" && last.pct > 0 && last.pct < 1 && (
              <div className="mt-2 w-full h-1 rounded-full bg-surface-2 overflow-hidden max-w-xs">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round(last.pct * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-primary text-primary-fg text-sm font-medium hover:opacity-90"
          >
            <BookOpen className="size-4" />
            Reprendre
          </Link>
          <button
            onClick={() => clear(last.bookSlug)}
            className="p-2 rounded-full hover:bg-surface-2 text-muted"
            aria-label="Effacer le marqueur de reprise"
            title="Effacer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function buildHref(r: LastRead): string {
  if (r.bookSlug === "dakhira") return `/dakhira/${r.sectionSlug}`;
  const anchor = r.lineId ? `#${r.lineId}` : "";
  return `/${r.bookSlug}/${r.sectionSlug}${anchor}`;
}
