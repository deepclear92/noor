// Modèle de contenu pour Noor — extensible aux futurs livres.

export type Lang = "fr" | "en" | "ar-translit";

export type Line = {
  /** identifiant stable (utilisé pour bookmarks, ancres) */
  id: string;
  /** texte arabe vocalisé */
  ar: string;
  /** translittération latine (méthode standardisée) */
  translit?: string;
  /** traductions par langue */
  tr?: Partial<Record<Exclude<Lang, "ar-translit">, string>>;
  /** numéro de verset si applicable (sourate) */
  ayah?: number;
  /** numéro de ligne dans la section */
  num?: number;
  /** type de ligne pour le rendu */
  kind?: "verse" | "bismillah" | "title" | "heading" | "poetry" | "prose" | "basmala";
  /** lien audio pour cette ligne */
  audio?: string;
  /** seconde de début dans la piste audio principale */
  audioStart?: number;
  /** notes/explication par langue (affichable en option) */
  explanation?: Partial<Record<"ar" | "fr" | "en", string>>;
  /** numéro de chapitre pour les poèmes multi-chapitres */
  chapter?: number;
};

export type Category =
  | "intro"
  | "preambule"
  | "ahzab"
  | "cloture"
  | "qasaid"
  | string;

export type Video = {
  /** ID YouTube ou URL complète */
  youtube?: string;
  url?: string;
  /** label affiché */
  label: string;
  /** type : récitation, chant, vidéo explicative */
  kind?: "recitation" | "chant" | "lecture" | "explanation";
  /** durée en secondes (optionnel) */
  duration?: number;
};

export type Section = {
  slug: string;
  /** titre arabe */
  ar: string;
  /** titre français */
  fr: string;
  /** sous-titre éventuel (ex: jour de la semaine) */
  hint?: string;
  /** position dans le livre */
  order: number;
  /** catégorie : utilisée pour grouper dans la TOC */
  category?: Category;
  /** plage de pages dans le PDF source [start, end] (1-indexé) */
  pages?: [number, number];
  /** ligne par ligne (alignement arabe ↔ translit ↔ trad) */
  lines: Line[];
  /** url audio principal optionnelle */
  audio?: string;
  /** estimation durée de lecture en minutes */
  durationMin?: number;
  /** vidéos associées (YouTube) — récitations, chants, lectures */
  videos?: Video[];
  /** source d'origine du contenu */
  source?: string;
  /** description courte affichée en tête de section */
  description?: { fr?: string; ar?: string; en?: string };
  /** auteur du texte (pour qasaid) */
  author?: { ar?: string; fr?: string };
};

export type Book = {
  slug: string;
  ar: string;
  fr: string;
  author?: { ar?: string; fr?: string };
  description?: { fr: string; ar?: string };
  /** ordre d'apparition dans la bibliothèque */
  order: number;
  sections: Section[];
};

export type SectionMeta = Pick<
  Section,
  "slug" | "ar" | "fr" | "hint" | "order" | "durationMin" | "category"
>;

export type BookIndex = {
  slug: string;
  ar: string;
  fr: string;
  author?: { ar?: string; fr?: string };
  description?: { fr: string; ar?: string };
  sectionsMeta: SectionMeta[];
};
