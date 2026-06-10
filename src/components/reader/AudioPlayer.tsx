"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Cue = {
  id: string;
  start: number;
  /** texte arabe court pour l'affichage dans la liste */
  ar?: string;
  /** numéro de ligne */
  num?: number;
};

/**
 * Lecteur audio avec synchronisation des lignes.
 *
 * - Lance la lecture, met à jour la barre de progression
 * - Met en surbrillance la ligne courante (data-active="true")
 * - Scroll doux vers la ligne si elle sort de la vue
 * - Panel ListMusic : ouvre une liste des lignes timées et permet
 *   le saut direct au clic
 */
export function AudioPlayer({
  src,
  cues,
  className,
}: {
  src: string;
  cues: Cue[];
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [rate, setRate] = useState(1);

  // Index de la cue courante
  const activeIdx = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < cues.length; i++) {
      if (cues[i].start <= time) idx = i;
      else break;
    }
    return idx;
  }, [time, cues]);

  // Met en surbrillance la ligne courante dans le DOM
  useEffect(() => {
    const id = activeIdx >= 0 ? cues[activeIdx]?.id ?? null : null;
    if (id !== activeId) {
      setActiveId(id);
      const all = document.querySelectorAll<HTMLElement>("[data-line-id]");
      all.forEach((el) => {
        el.dataset.active = el.dataset.lineId === id ? "true" : "false";
      });
      if (id && playing) {
        const el = document.querySelector<HTMLElement>(`[data-line-id="${id}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 100 || rect.bottom > window.innerHeight - 200) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    }
  }, [activeIdx, cues, activeId, playing]);

  const seek = (t: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, t));
  };

  const seekToCue = (cue: Cue) => {
    seek(cue.start);
    void audioRef.current?.play();
    // Scroll vers la ligne dans le texte
    const el = document.querySelector<HTMLElement>(`[data-line-id="${cue.id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowList(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else void audioRef.current.play();
  };

  const cycleRate = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const next = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  return (
    <div className={cn("relative", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="rounded-xl border border-border bg-surface p-3 flex items-center gap-2 sm:gap-3">
        <button
          onClick={togglePlay}
          className="size-10 rounded-full bg-primary text-primary-fg inline-flex items-center justify-center hover:opacity-90 shrink-0"
          aria-label={playing ? "Pause" : "Lecture"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          onClick={() => seek(time - 10)}
          className="p-2 rounded hover:bg-surface-2 hidden sm:inline-flex"
          aria-label="Reculer 10s"
        >
          <SkipBack className="size-4" />
        </button>
        <button
          onClick={() => seek(time + 10)}
          className="p-2 rounded hover:bg-surface-2 hidden sm:inline-flex"
          aria-label="Avancer 10s"
        >
          <SkipForward className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={time}
            step={0.1}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
            aria-label="Position dans l'audio"
          />
          <div className="flex justify-between text-[10px] tabular-nums text-muted">
            <span>{fmt(time)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <button
          onClick={cycleRate}
          className="text-xs tabular-nums px-2 py-1 rounded hover:bg-surface-2 font-mono shrink-0"
          aria-label="Vitesse de lecture"
        >
          {rate}×
        </button>
        {cues.length > 0 && (
          <button
            onClick={() => setShowList((v) => !v)}
            className={cn(
              "p-2 rounded hover:bg-surface-2 shrink-0",
              showList && "bg-surface-2",
            )}
            aria-label="Liste des lignes"
            title={`${cues.length} lignes synchronisées`}
          >
            <ListMusic className="size-4" />
          </button>
        )}
        <Volume2 className="size-4 text-muted hidden md:block shrink-0" />
      </div>

      {/* Panel : liste des lignes timées */}
      {showList && cues.length > 0 && (
        <div className="absolute top-full inset-x-0 mt-2 z-30 rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {cues.length} lignes • cliquer pour sauter
            </p>
            <button
              onClick={() => setShowList(false)}
              className="p-1 rounded hover:bg-surface-2"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {cues.map((c, i) => (
              <li key={c.id}>
                <button
                  onClick={() => seekToCue(c)}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center gap-3",
                    i === activeIdx && "bg-accent/10",
                  )}
                >
                  <span className="text-[10px] tabular-nums text-muted shrink-0 w-12">
                    {fmt(c.start)}
                  </span>
                  {c.num != null && (
                    <span className="text-xs font-mono text-muted shrink-0 w-6 text-right">
                      {c.num}
                    </span>
                  )}
                  {c.ar && (
                    <span className="arabic-text font-arabic-amiri text-sm truncate flex-1 text-right">
                      {c.ar}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
