"use client";

import { useReaderStore, type ArabicFont } from "@/lib/store";
import { Trash2, Bookmark } from "lucide-react";
import Link from "next/link";

const FONTS: { id: ArabicFont; label: string; cls: string }[] = [
  { id: "uthmanic", label: "Uthmanic Hafs", cls: "font-arabic-uthmanic" },
  { id: "amiri", label: "Amiri / Naskh", cls: "font-arabic-amiri" },
  { id: "indopak", label: "Indo-Pak", cls: "font-arabic-indopak" },
  { id: "kufi", label: "Reem Kufi", cls: "font-arabic-kufi" },
  { id: "diwani", label: "Diwani", cls: "font-arabic-diwani" },
  { id: "thuluth", label: "Thuluth", cls: "font-arabic-thuluth" },
];

export default function ReglagesPage() {
  const prefs = useReaderStore((s) => s.prefs);
  const setPrefs = useReaderStore((s) => s.setPrefs);
  const bookmarks = useReaderStore((s) => s.bookmarks);
  const removeBookmark = useReaderStore((s) => s.removeBookmark);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-8">
      <header>
        <h1 className="font-display text-3xl mb-2">Réglages</h1>
        <p className="text-muted text-sm">
          Personnalise l'affichage. Tes préférences sont sauvegardées localement.
        </p>
      </header>

      <section>
        <h2 className="font-semibold mb-3">Police arabe</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => setPrefs({ font: f.id })}
              className={`rounded-xl border p-3 text-center transition-all ${
                prefs.font === f.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface hover:shadow-sm"
              }`}
            >
              <p className={`arabic-text text-2xl mb-1 ${f.cls}`}>
                بِسْمِ ٱللَّهِ
              </p>
              <p className="text-xs text-muted">{f.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Taille du texte</h2>
        <div className="space-y-3">
          <Slider
            label={`Arabe — ${prefs.fontSize}px`}
            min={18}
            max={72}
            step={1}
            value={prefs.fontSize}
            onChange={(v) => setPrefs({ fontSize: v })}
          />
          <Slider
            label={`Translit. / Traduction — ${prefs.latinSize}px`}
            min={12}
            max={28}
            step={1}
            value={prefs.latinSize}
            onChange={(v) => setPrefs({ latinSize: v })}
          />
          <Slider
            label={`Interligne — ${prefs.lineHeight.toFixed(1)}`}
            min={1.4}
            max={3}
            step={0.1}
            value={prefs.lineHeight}
            onChange={(v) => setPrefs({ lineHeight: v })}
          />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Couches de texte</h2>
        <div className="grid sm:grid-cols-3 gap-2">
          <Toggle
            label="Arabe"
            on={prefs.showArabic}
            onChange={(v) => setPrefs({ showArabic: v })}
          />
          <Toggle
            label="Translittération"
            on={prefs.showTranslit}
            onChange={(v) => setPrefs({ showTranslit: v })}
          />
          <Toggle
            label="Traduction"
            on={prefs.showTranslation}
            onChange={(v) => setPrefs({ showTranslation: v })}
          />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Disposition</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPrefs({ layout: "stacked" })}
            className={`rounded-xl border p-3 ${
              prefs.layout === "stacked"
                ? "border-primary bg-primary/5"
                : "border-border bg-surface"
            }`}
          >
            Empilé (vertical)
          </button>
          <button
            onClick={() => setPrefs({ layout: "side-by-side" })}
            className={`rounded-xl border p-3 ${
              prefs.layout === "side-by-side"
                ? "border-primary bg-primary/5"
                : "border-border bg-surface"
            }`}
          >
            Côte-à-côte
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Thème</h2>
        <div className="grid grid-cols-4 gap-2">
          {(["light", "sepia", "dark", "auto"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPrefs({ theme: t })}
              className={`rounded-xl border p-3 text-sm capitalize ${
                prefs.theme === t
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface"
              }`}
            >
              {t === "auto" ? "Auto" : t === "light" ? "Jour" : t === "dark" ? "Nuit" : "Sépia"}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Bookmark className="size-4 text-accent" />
          Mes marque-pages
        </h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun marque-page. Tu peux en ajouter depuis la barre du lecteur.
          </p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li
                key={`${b.bookSlug}-${b.sectionSlug}-${b.lineId ?? "_"}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
              >
                <Link
                  href={`/${b.bookSlug}/${b.sectionSlug}${b.lineId ? `#${b.lineId}` : ""}`}
                  className="hover:underline"
                >
                  {b.label ?? `${b.bookSlug} • ${b.sectionSlug}`}
                </Link>
                <button
                  onClick={() => removeBookmark(b.bookSlug, b.sectionSlug, b.lineId)}
                  className="p-1.5 rounded hover:bg-surface-2"
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted block mb-1">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-primary)]"
      />
    </label>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`rounded-xl border p-3 text-sm transition-colors ${
        on
          ? "border-primary bg-primary/5"
          : "border-border bg-surface"
      }`}
    >
      <span className="block font-medium">{label}</span>
      <span className="text-xs text-muted">{on ? "Activé" : "Masqué"}</span>
    </button>
  );
}
