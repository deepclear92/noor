"use client";

import { useState } from "react";
import { Play, X, Film } from "lucide-react";
import type { Video } from "@/types/content";
import { cn } from "@/lib/cn";

/**
 * Liste des vidéos d'une section avec lazy-loading des iframes YouTube
 * (l'iframe n'est créée qu'au clic, pour éviter de charger plein de scripts
 * tiers à l'arrivée sur la page).
 */
export function VideoList({ videos }: { videos: Video[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!videos || videos.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Film className="size-4 text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
          Vidéos
        </h2>
      </div>
      <ul className="space-y-3">
        {videos.map((v, i) => {
          const yt = v.youtube ?? extractYouTubeId(v.url ?? "");
          const isOpen = openIndex === i;
          return (
            <li key={i}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3 hover:bg-surface text-left",
                  isOpen && "border-primary bg-primary/5",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-accent/15 text-accent inline-flex items-center justify-center">
                    {isOpen ? <X className="size-4" /> : <Play className="size-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{v.label}</p>
                    {v.kind && (
                      <p className="text-xs text-muted capitalize">{v.kind}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted">
                  {isOpen ? "Fermer" : "Lire"}
                </span>
              </button>
              {isOpen && yt && (
                <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-border">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`}
                    title={v.label}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function extractYouTubeId(url: string): string | undefined {
  const m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{6,})/);
  return m?.[1];
}
