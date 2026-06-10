// Normalisation pour recherche arabe : retire tashkil (diacritiques), tatweel,
// unifie alif/ya/ta-marbuta — sans toucher au texte affiché.

const TASHKIL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

export function normalizeArabic(input: string): string {
  return input
    .replace(TASHKIL, "")
    .replace(TATWEEL, "")
    .replace(/[آأإٱ]/g, "ا") // أ إ آ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/ؤ/g, "و") // ؤ → و
    .replace(/ئ/g, "ي") // ئ → ي
    .toLowerCase()
    .trim();
}
