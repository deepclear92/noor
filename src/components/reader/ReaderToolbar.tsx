"use client";

import {
  Type,
  Minus,
  Plus,
  Sun,
  Moon,
  Languages,
  AlignJustify,
  Bookmark,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useReaderStore, type ArabicFont } from "@/lib/store";

const FONTS: { id: ArabicFont; label: string; preview: string }[] = [
  { id: "uthmanic", label: "Uthmanic Hafs", preview: "بِسْمِ" },
  { id: "amiri", label: "Amiri / Naskh", preview: "بِسْمِ" },
  { id: "indopak", label: "Indo-Pak", preview: "بِسْمِ" },
  { id: "kufi", label: "Reem Kufi", preview: "بسم" },
  { id: "diwani", label: "Diwani / Ruq'ah", preview: "بِسْمِ" },
  { id: "thuluth", label: "Thuluth", preview: "بِسْمِ" },
];

export function ReaderToolbar({
  className,
  onBookmark,
}: {
  className?: string;
  onBookmark?: () => void;
}) {
  const prefs = useReaderStore((s) => s.prefs);
  const setPrefs = useReaderStore((s) => s.setPrefs);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-3 flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {/* Police arabe */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <Type className="size-4 text-muted" />
        <select
          aria-label="Police arabe"
          value={prefs.font}
          onChange={(e) => setPrefs({ font: e.target.value as ArabicFont })}
          className="bg-transparent text-sm py-1 px-1 outline-none cursor-pointer"
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Taille arabe */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <span className="text-xs text-muted">ع</span>
        <button
          className="p-1 rounded hover:bg-surface-2"
          onClick={() => setPrefs({ fontSize: Math.max(18, prefs.fontSize - 2) })}
          aria-label="Réduire la police arabe"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="text-xs w-6 text-center tabular-nums">{prefs.fontSize}</span>
        <button
          className="p-1 rounded hover:bg-surface-2"
          onClick={() => setPrefs({ fontSize: Math.min(72, prefs.fontSize + 2) })}
          aria-label="Agrandir la police arabe"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Taille latine */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <span className="text-xs text-muted">A</span>
        <button
          className="p-1 rounded hover:bg-surface-2"
          onClick={() => setPrefs({ latinSize: Math.max(12, prefs.latinSize - 1) })}
          aria-label="Réduire la traduction"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="text-xs w-6 text-center tabular-nums">{prefs.latinSize}</span>
        <button
          className="p-1 rounded hover:bg-surface-2"
          onClick={() => setPrefs({ latinSize: Math.min(28, prefs.latinSize + 1) })}
          aria-label="Agrandir la traduction"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Interligne */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <AlignJustify className="size-4 text-muted" />
        <input
          type="range"
          min={1.4}
          max={3}
          step={0.1}
          value={prefs.lineHeight}
          onChange={(e) => setPrefs({ lineHeight: Number(e.target.value) })}
          className="w-20 accent-[var(--color-primary)]"
          aria-label="Interligne"
        />
      </div>

      {/* Couches de texte */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <Languages className="size-4 text-muted" />
        <ToggleChip
          active={prefs.showArabic}
          onClick={() => setPrefs({ showArabic: !prefs.showArabic })}
        >
          عربي
        </ToggleChip>
        <ToggleChip
          active={prefs.showTranslit}
          onClick={() => setPrefs({ showTranslit: !prefs.showTranslit })}
        >
          Translit.
        </ToggleChip>
        <ToggleChip
          active={prefs.showTranslation}
          onClick={() => setPrefs({ showTranslation: !prefs.showTranslation })}
        >
          FR
        </ToggleChip>
        <ToggleChip
          active={prefs.showExplanation}
          onClick={() => setPrefs({ showExplanation: !prefs.showExplanation })}
        >
          💡 Notes
        </ToggleChip>
      </div>

      {/* Thème */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <button
          onClick={() => setPrefs({ theme: "light" })}
          className={cn(
            "p-1.5 rounded",
            prefs.theme === "light" ? "bg-surface-2" : "hover:bg-surface-2",
          )}
          aria-label="Mode jour"
        >
          <Sun className="size-4" />
        </button>
        <button
          onClick={() => setPrefs({ theme: "sepia" })}
          className={cn(
            "p-1.5 rounded text-[10px] font-semibold",
            prefs.theme === "sepia" ? "bg-surface-2" : "hover:bg-surface-2",
          )}
          aria-label="Mode sépia"
        >
          Aa
        </button>
        <button
          onClick={() => setPrefs({ theme: "dark" })}
          className={cn(
            "p-1.5 rounded",
            prefs.theme === "dark" ? "bg-surface-2" : "hover:bg-surface-2",
          )}
          aria-label="Mode nuit"
        >
          <Moon className="size-4" />
        </button>
      </div>

      {/* Marque-page */}
      {onBookmark && (
        <button
          className="p-1.5 rounded hover:bg-surface-2"
          onClick={onBookmark}
          aria-label="Marque-page"
        >
          <Bookmark className="size-4" />
        </button>
      )}

      {/* Réinitialiser */}
      <button
        className="p-1.5 rounded hover:bg-surface-2 ml-auto"
        onClick={() =>
          setPrefs({
            font: "uthmanic",
            fontSize: 32,
            latinSize: 16,
            lineHeight: 2,
            showArabic: true,
            showTranslit: true,
            showTranslation: true,
          })
        }
        aria-label="Réinitialiser les réglages d'affichage"
        title="Réinitialiser"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-fg"
          : "bg-surface-2 text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
