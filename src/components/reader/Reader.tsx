"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { useReaderStore } from "@/lib/store";
import { ReaderToolbar } from "./ReaderToolbar";
import { VideoList } from "./VideoList";
import { AudioPlayer } from "./AudioPlayer";
import type { Line, Section } from "@/types/content";

const FONT_CLASS: Record<string, string> = {
  uthmanic: "font-arabic-uthmanic",
  naskh: "font-arabic-naskh",
  amiri: "font-arabic-amiri",
  indopak: "font-arabic-indopak",
  kufi: "font-arabic-kufi",
  diwani: "font-arabic-diwani",
  thuluth: "font-arabic-thuluth",
};

export function Reader({
  section,
  bookSlug,
  showToolbar = true,
}: {
  section: Section;
  bookSlug: string;
  showToolbar?: boolean;
}) {
  const prefs = useReaderStore((s) => s.prefs);
  const addBookmark = useReaderStore((s) => s.addBookmark);
  const setProgress = useReaderStore((s) => s.setProgress);
  const setLastRead = useReaderStore((s) => s.setLastRead);
  const setInReader = useReaderStore((s) => s.setInReader);
  const showReaderSettings = useReaderStore((s) => s.showReaderSettings);
  const setShowReaderSettings = useReaderStore((s) => s.setShowReaderSettings);

  // Active le mode "in reader" pour que le bouton ⚙️ de la TopBar
  // ouvre les réglages contextuels au lieu de naviguer vers /reglages.
  useEffect(() => {
    setInReader(true);
    return () => setInReader(false);
  }, [setInReader]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Cues pour la sync audio : lignes ayant un audioStart
  const audioCues = useMemo(
    () =>
      section.lines
        .filter((l) => typeof l.audioStart === "number")
        .map((l) => ({
          id: l.id,
          start: l.audioStart as number,
          ar: l.ar.slice(0, 60),
          num: l.num,
        })),
    [section.lines],
  );

  // Marque la section comme dernier emplacement lu dès l'arrivée
  useEffect(() => {
    setLastRead({
      bookSlug,
      sectionSlug: section.slug,
      label: section.fr,
      arLabel: section.ar,
      pct: 0,
    });
  }, [bookSlug, section.slug, section.fr, section.ar, setLastRead]);

  // Suit la progression et met à jour le marqueur de reprise
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    let lastSaved = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const total = el.scrollHeight - window.innerHeight;
        const scrolled = Math.max(0, -rect.top);
        const pct = total > 0 ? Math.min(1, scrolled / total) : 1;
        setProgress(bookSlug, section.slug, pct);

        const now = Date.now();
        if (now - lastSaved > 1500) {
          lastSaved = now;
          let nearestId: string | undefined;
          const blocks = el.querySelectorAll<HTMLElement>("[data-line-id]");
          for (const b of blocks) {
            const r = b.getBoundingClientRect();
            if (r.top > 80) {
              nearestId = b.dataset.lineId;
              break;
            }
          }
          setLastRead({
            bookSlug,
            sectionSlug: section.slug,
            lineId: nearestId,
            label: section.fr,
            arLabel: section.ar,
            pct,
          });
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [bookSlug, section.slug, section.fr, section.ar, setProgress, setLastRead]);

  const fontClass = FONT_CLASS[prefs.font] ?? "font-arabic-uthmanic";
  const lang = prefs.translationLang;
  const audioSrc = section.audio;

  return (
    <div className="w-full">
      {/* Audio player en sticky léger — garde l'audio toujours accessible
          (essentiel pour la lecture), mais le panneau de réglages reste caché */}
      {showToolbar && audioSrc && (
        <div className="sticky top-14 z-30 mx-auto max-w-3xl px-4 pt-3 pb-2 bg-background/80 backdrop-blur">
          <AudioPlayer src={audioSrc} cues={audioCues} />
        </div>
      )}

      {/* Drawer réglages : se montre en haut quand l'utilisateur clique ⚙️ */}
      {showToolbar && showReaderSettings && (
        <>
          <button
            aria-label="Fermer les réglages"
            onClick={() => setShowReaderSettings(false)}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
          />
          <div className="fixed top-14 inset-x-0 z-50 mx-auto max-w-3xl px-4 pt-3 pb-3 bg-background border-b border-border shadow-lg fade-up">
            <ReaderToolbar
              onBookmark={() => {
                addBookmark({
                  bookSlug,
                  sectionSlug: section.slug,
                  label: section.fr,
                });
                setShowReaderSettings(false);
              }}
            />
            <button
              onClick={() => setShowReaderSettings(false)}
              className="mt-2 w-full text-xs text-muted hover:text-foreground py-1.5 rounded hover:bg-surface-2"
            >
              Fermer
            </button>
          </div>
        </>
      )}

      <article ref={containerRef} className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <header className="mb-8 text-center">
          <h1 className={cn("arabic-text text-3xl sm:text-4xl mb-2", fontClass)}>
            {section.ar}
          </h1>
          <p className="font-display text-xl text-muted">{section.fr}</p>
          {section.hint && (
            <p className="text-sm text-muted mt-1">{section.hint}</p>
          )}
          {section.author?.fr && (
            <p className="text-xs text-muted mt-2 italic">
              {section.author.fr}
            </p>
          )}
          {section.description?.[lang] && (
            <p className="text-sm text-muted mt-3 max-w-xl mx-auto leading-relaxed">
              {section.description[lang]}
            </p>
          )}
        </header>

        {section.videos && section.videos.length > 0 && (
          <VideoList videos={section.videos} />
        )}

        <div className="space-y-6">
          {section.lines.map((line, i) => (
            <LineBlock
              key={line.id}
              line={line}
              fontClass={fontClass}
              arSize={prefs.fontSize}
              latinSize={prefs.latinSize}
              lineHeight={prefs.lineHeight}
              showArabic={prefs.showArabic}
              showTranslit={prefs.showTranslit}
              showTranslation={prefs.showTranslation}
              showExplanation={prefs.showExplanation}
              translationLang={prefs.translationLang}
              layout={prefs.layout}
              index={i}
            />
          ))}
        </div>

        {section.source && (
          <p className="text-xs text-muted mt-12 text-center italic max-w-xl mx-auto">
            Source : {section.source}
          </p>
        )}
      </article>
    </div>
  );
}

function LineBlock({
  line,
  fontClass,
  arSize,
  latinSize,
  lineHeight,
  showArabic,
  showTranslit,
  showTranslation,
  showExplanation,
  translationLang,
  layout,
  index,
}: {
  line: Line;
  fontClass: string;
  arSize: number;
  latinSize: number;
  lineHeight: number;
  showArabic: boolean;
  showTranslit: boolean;
  showTranslation: boolean;
  showExplanation: boolean;
  translationLang: "fr" | "en";
  layout: "stacked" | "side-by-side";
  index: number;
}) {
  const isHeading = line.kind === "heading" || line.kind === "title";
  const isBasmala = line.kind === "basmala" || line.kind === "bismillah";
  const isPoetry = line.kind === "poetry";
  const tr = line.tr?.[translationLang];
  const explanation = line.explanation?.[translationLang];

  return (
    <div
      id={line.id}
      data-line-id={line.id}
      className={cn(
        "rounded-lg transition-colors hover:bg-surface-2/50 -mx-2 px-2 py-2 fade-up scroll-mt-32",
        "data-[active=true]:bg-accent/10 data-[active=true]:ring-1 data-[active=true]:ring-accent/40",
        isBasmala && "text-center my-6",
        isHeading && "text-center",
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      {showExplanation && explanation && (
        <p
          className="text-xs italic text-muted bg-surface-2/60 border-l-2 border-accent pl-3 py-1.5 mb-2 rounded-sm"
          style={{ fontSize: `${Math.max(11, latinSize - 3)}px` }}
        >
          💡 {explanation}
        </p>
      )}

      {layout === "side-by-side" ? (
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <ArabicLine
            line={line}
            fontClass={fontClass}
            arSize={arSize}
            lineHeight={lineHeight}
            show={showArabic}
            poetry={isPoetry}
            basmala={isBasmala}
          />
          <LatinPair
            translit={showTranslit ? line.translit : undefined}
            translation={showTranslation ? tr : undefined}
            latinSize={latinSize}
            lineHeight={lineHeight}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <ArabicLine
            line={line}
            fontClass={fontClass}
            arSize={arSize}
            lineHeight={lineHeight}
            show={showArabic}
            poetry={isPoetry}
            basmala={isBasmala}
          />
          <LatinPair
            translit={showTranslit ? line.translit : undefined}
            translation={showTranslation ? tr : undefined}
            latinSize={latinSize}
            lineHeight={lineHeight}
          />
        </div>
      )}
    </div>
  );
}

function ArabicLine({
  line,
  fontClass,
  arSize,
  lineHeight,
  show,
  poetry,
  basmala,
}: {
  line: Line;
  fontClass: string;
  arSize: number;
  lineHeight: number;
  show: boolean;
  poetry: boolean;
  basmala: boolean;
}) {
  if (!show) return null;
  return (
    <p
      className={cn("arabic-text", fontClass, poetry && "leading-loose")}
      style={{ fontSize: `${basmala ? arSize * 1.1 : arSize}px`, lineHeight }}
    >
      {line.ayah ? (
        <>
          {line.ar}
          <span className="inline-block mx-1 align-middle text-accent">
            ﴿{toArabicDigits(line.ayah)}﴾
          </span>
        </>
      ) : (
        line.ar
      )}
    </p>
  );
}

function LatinPair({
  translit,
  translation,
  latinSize,
  lineHeight,
}: {
  translit?: string;
  translation?: string;
  latinSize: number;
  lineHeight: number;
}) {
  if (!translit && !translation) return null;
  return (
    <div className="space-y-1">
      {translit && (
        <p
          className="italic text-muted"
          style={{ fontSize: `${latinSize}px`, lineHeight }}
        >
          {translit}
        </p>
      )}
      {translation && (
        <p
          className="text-foreground/90"
          style={{ fontSize: `${latinSize}px`, lineHeight }}
        >
          {translation}
        </p>
      )}
    </div>
  );
}

function toArabicDigits(n: number) {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n)
    .split("")
    .map((d) => map[Number(d)] ?? d)
    .join("");
}
