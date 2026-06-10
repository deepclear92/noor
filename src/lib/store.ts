"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ArabicFont =
  | "uthmanic"
  | "naskh"
  | "indopak"
  | "kufi"
  | "diwani"
  | "thuluth"
  | "amiri";

export type Theme = "light" | "dark" | "sepia" | "auto";

export type ReaderPrefs = {
  font: ArabicFont;
  fontSize: number; // px (arabic)
  latinSize: number; // px (translit + traduction)
  lineHeight: number; // multiplier
  showArabic: boolean;
  showTranslit: boolean;
  showTranslation: boolean;
  showExplanation: boolean;
  translationLang: "fr" | "en";
  theme: Theme;
  layout: "stacked" | "side-by-side";
};

export type Bookmark = {
  bookSlug: string;
  sectionSlug: string;
  lineId?: string;
  label?: string;
  createdAt: number;
};

export type LastRead = {
  bookSlug: string;
  sectionSlug: string;
  lineId?: string;
  /** libellé court (titre fr) — pour affichage rapide */
  label?: string;
  /** sous-titre arabe — pour affichage rapide */
  arLabel?: string;
  /** progression dans la section 0..1 */
  pct: number;
  updatedAt: number;
};

export type ReadingProgress = {
  // key: `${bookSlug}/${sectionSlug}` → percentage 0..1
  [key: string]: { pct: number; updatedAt: number };
};

type State = {
  prefs: ReaderPrefs;
  setPrefs: (p: Partial<ReaderPrefs>) => void;
  bookmarks: Bookmark[];
  addBookmark: (b: Omit<Bookmark, "createdAt">) => void;
  removeBookmark: (bookSlug: string, sectionSlug: string, lineId?: string) => void;
  progress: ReadingProgress;
  setProgress: (bookSlug: string, sectionSlug: string, pct: number) => void;
  /** dernier emplacement par livre — pour "Reprendre la lecture" */
  lastReadByBook: Record<string, LastRead>;
  /** dernier emplacement tous livres confondus */
  lastReadGlobal?: LastRead;
  setLastRead: (r: Omit<LastRead, "updatedAt">) => void;
  clearLastRead: (bookSlug: string) => void;
  // compteur de récitations par section
  counts: Record<string, number>;
  incrementCount: (bookSlug: string, sectionSlug: string) => void;
  resetCount: (bookSlug: string, sectionSlug: string) => void;
  // dernière page lue par volume Dakhira (clé = slug du volume)
  dakhiraPages: Record<string, number>;
  setDakhiraPage: (volumeSlug: string, page: number) => void;
  // état UI : on est-on dans une page Reader (Dalail) ?
  // Quand vrai, le bouton ⚙️ de la TopBar ouvre les réglages du lecteur
  // au lieu de naviguer vers /reglages.
  inReader: boolean;
  setInReader: (v: boolean) => void;
  showReaderSettings: boolean;
  setShowReaderSettings: (v: boolean) => void;
};

const defaultPrefs: ReaderPrefs = {
  font: "uthmanic",
  fontSize: 32,
  latinSize: 16,
  lineHeight: 2.0,
  showArabic: true,
  showTranslit: true,
  showTranslation: true,
  showExplanation: false,
  translationLang: "fr",
  theme: "auto",
  layout: "stacked",
};

export const useReaderStore = create<State>()(
  persist(
    (set, get) => ({
      prefs: defaultPrefs,
      setPrefs: (p) => set({ prefs: { ...get().prefs, ...p } }),
      bookmarks: [],
      addBookmark: (b) =>
        set({
          bookmarks: [
            { ...b, createdAt: Date.now() },
            ...get().bookmarks.filter(
              (x) =>
                !(
                  x.bookSlug === b.bookSlug &&
                  x.sectionSlug === b.sectionSlug &&
                  x.lineId === b.lineId
                ),
            ),
          ],
        }),
      removeBookmark: (bookSlug, sectionSlug, lineId) =>
        set({
          bookmarks: get().bookmarks.filter(
            (x) =>
              !(
                x.bookSlug === bookSlug &&
                x.sectionSlug === sectionSlug &&
                x.lineId === lineId
              ),
          ),
        }),
      progress: {},
      setProgress: (bookSlug, sectionSlug, pct) =>
        set({
          progress: {
            ...get().progress,
            [`${bookSlug}/${sectionSlug}`]: { pct, updatedAt: Date.now() },
          },
        }),
      lastReadByBook: {},
      lastReadGlobal: undefined,
      setLastRead: (r) => {
        const entry: LastRead = { ...r, updatedAt: Date.now() };
        set({
          lastReadByBook: { ...get().lastReadByBook, [r.bookSlug]: entry },
          lastReadGlobal: entry,
        });
      },
      clearLastRead: (bookSlug) => {
        const next = { ...get().lastReadByBook };
        delete next[bookSlug];
        const global = get().lastReadGlobal;
        set({
          lastReadByBook: next,
          lastReadGlobal:
            global?.bookSlug === bookSlug ? undefined : global,
        });
      },
      counts: {},
      incrementCount: (bookSlug, sectionSlug) => {
        const key = `${bookSlug}/${sectionSlug}`;
        set({ counts: { ...get().counts, [key]: (get().counts[key] ?? 0) + 1 } });
      },
      resetCount: (bookSlug, sectionSlug) => {
        const key = `${bookSlug}/${sectionSlug}`;
        const c = { ...get().counts };
        delete c[key];
        set({ counts: c });
      },
      dakhiraPages: {},
      setDakhiraPage: (volumeSlug, page) => {
        set({
          dakhiraPages: { ...get().dakhiraPages, [volumeSlug]: page },
        });
      },
      inReader: false,
      setInReader: (v) => set({ inReader: v, showReaderSettings: v ? get().showReaderSettings : false }),
      showReaderSettings: false,
      setShowReaderSettings: (v) => set({ showReaderSettings: v }),
    }),
    { name: "noor-reader-v1" },
  ),
);
