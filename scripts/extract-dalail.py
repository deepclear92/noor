#!/usr/bin/env python3
"""
extract-dalail.py — Extrait le texte arabe de Dalail al-Khayrat via OCR.

Stratégie:
 1. Rend chaque page du PDF en image 300 dpi (PyMuPDF).
 2. Lance Tesseract en mode arabe (`-l ara`, --psm 6).
 3. Nettoie le bruit (ornements OCRisés à tort, numéros de pages, en-têtes répétés).
 4. Découpe en lignes propres et écrit src/content/dalail/<slug>.json.

Pourquoi OCR plutôt que l'extraction texte du PDF ? Le PDF source a une typo-
graphie complexe (tashkil positionnés indépendamment, ligatures décoratives,
marges ornées) qui désordonne l'extraction native. L'OCR lit le rendu visuel
final, c'est plus fidèle.

Performance: ~290 pages × ~1,5 s/page ≈ 7 min sur Apple Silicon.
Cache: les PNG sont conservés dans .ocr-cache/ pour ré-extraire rapidement.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.stderr.write("ERREUR : pip3 install pymupdf\n")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "src" / "content" / "dalail"
CACHE_DIR = ROOT / ".ocr-cache"

# (slug, ar, fr, hint, category, p_start, p_end_excl) — pages 1-indexées
SECTIONS = [
    ("ya-sin",             "سورة يس",                          "Sourate Ya-Sin",                 "Sourate introductive",         "intro",      5,   21),
    ("al-fath",            "سورة الفتح",                       "Sourate Al-Fath",                "Sourate introductive",         "intro",      21,  33),
    ("al-waqia",           "سورة الواقعة",                     "Sourate Al-Waqi'a",              "Sourate introductive",         "intro",      33,  43),

    ("iftitah",            "افتتاح دلائل الخيرات",              "Ouverture de Dalail al-Khayrat", "Préambule",                    "preambule",  43,  52),
    ("fasl",               "فصل",                              "Chapitre",                       "Vertus de la salat",           "preambule",  52,  66),
    ("asma-nabi",          "أسماء سيدنا محمد ﷺ",                "Les noms du Prophète ﷺ",          "Pré-récitation",               "preambule",  66,  74),
    ("duaa-bidayah",       "دعاء بدء دلائل الخيرات",            "Du'a d'ouverture",               "Avant le hizb",                "preambule",  74,  77),

    ("hizb-1-lundi",       "الحزب الأول",                      "Hizb 1 — Lundi",                 "Lundi (الإثنين)",               "ahzab",      77,  96),
    ("hizb-2-mardi",       "الحزب الثاني",                     "Hizb 2 — Mardi",                 "Mardi (الثلاثاء)",              "ahzab",      96,  115),
    ("hizb-3-mercredi",    "الحزب الثالث",                     "Hizb 3 — Mercredi",              "Mercredi (الأربعاء)",           "ahzab",      115, 134),
    ("hizb-4-jeudi",       "الحزب الرابع",                     "Hizb 4 — Jeudi",                 "Jeudi (الخميس)",                "ahzab",      134, 154),
    ("hizb-5-vendredi",    "الحزب الخامس",                     "Hizb 5 — Vendredi",              "Vendredi (الجمعة)",             "ahzab",      154, 178),
    ("hizb-6-samedi",      "الحزب السادس",                     "Hizb 6 — Samedi",                "Samedi (السبت)",                "ahzab",      178, 200),
    ("hizb-7-dimanche",    "الحزب السابع",                     "Hizb 7 — Dimanche",              "Dimanche (الأحد)",              "ahzab",      200, 221),
    ("hizb-8-lundi-2",     "الجزء الثامن",                     "Hizb 8 — Lundi (2e tour)",       "Conclusion hebdomadaire",      "ahzab",      221, 236),

    ("khatm",              "ختم دلائل الخيرات",                "Clôture de Dalail",              "Khatm",                        "cloture",    236, 237),
    ("duaa-apres",         "دعاء يقرأ عقب دلائل الخيرات",       "Du'a après la lecture",          "Bouclage du khatm",            "cloture",    237, 242),

    ("bio-ibn-nasir",      "ترجمة سيدي ابن ناصر الدرعي",       "Biographie d'Ibn Nasir al-Dar'i", "Auteur du Du'a Nasiri",        "qasaid",     242, 244),
    ("duaa-nasiri",        "الدعاء الناصري",                   "Du'a Nasiri",                    "Sidi Ibn Nasir al-Dar'i",      "qasaid",     244, 251),

    ("bio-ibn-nahwi",      "ترجمة سيدي ابن النحوي",            "Biographie d'Ibn an-Nahwi",      "Auteur d'al-Munfarija",        "qasaid",     251, 253),
    ("munfarija",          "قصيدة المنفرجة",                   "Qasida al-Munfarija",            "Sidi Ibn an-Nahwi",            "qasaid",     253, 261),

    ("bio-ibn-mashish",    "ترجمة سيدي عبد السلام بن مشيش",    "Biographie d'Ibn Mashish",       "Auteur de la Mashishiyya",     "qasaid",     261, 264),
    ("salat-mashishiyya",  "الصلاة المشيشية",                  "Salat al-Mashishiyya",           "Sidi Abdes-Salam Ibn Mashish", "qasaid",     264, 267),
    ("zajr-mashishiyya",   "زجر الصلاة المشيشية",              "Zajr al-Mashishiyya",            "Réfutation et défense",        "qasaid",     267, 269),

    ("bio-jilani",         "ترجمة سيدي عبد القادر الجيلاني",   "Biographie de Sidi Abdul-Qadir al-Jilani", "Auteur du Hizb an-Nasr","qasaid", 269, 271),
    ("hizb-nasr",          "حزب النصر",                        "Hizb an-Nasr",                   "Sidi Abdul-Qadir al-Jilani",   "qasaid",     271, 276),

    ("bio-busiri",         "ترجمة الإمام البوصيري",             "Biographie de l'Imam al-Busiri", "Auteur de la Burda",           "qasaid",     276, 279),
    ("burda",              "قصيدة البردة",                     "Qasidat al-Burda",               "Imam al-Busiri",               "qasaid",     279, 290),
]

ARABIC = re.compile(r"[؀-ۿ]")
ARABIC_OR_TASHKIL = re.compile(r"[؀-ۿً-ْ]")
PAGE_NUMBER = re.compile(r"^\s*\d{1,3}\s*$")
TASHKIL = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭ]")
TATWEEL = re.compile(r"ـ")
NUMBERS_AR = "٠١٢٣٤٥٦٧٨٩"

# En-têtes répétés en haut de chaque page — listés pour suppression
RUNNING_HEADERS = {
    "حزب الإثنين", "حزب الثلاثاء", "حزب الأربعاء", "حزب الخميس",
    "حزب الجمعة", "حزب السبت", "حزب الأحد",
}


def norm_ar(s: str) -> str:
    s = TASHKIL.sub("", s)
    s = TATWEEL.sub("", s)
    s = re.sub(r"[آأإٱ]", "ا", s)
    s = s.replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    return re.sub(r"\s+", "", s)


def arabic_ratio(s: str) -> float:
    """Proportion de caractères arabes (lettres + voyelles) dans la chaîne."""
    if not s:
        return 0.0
    real = re.sub(r"\s", "", s)
    if not real:
        return 0.0
    arab = sum(1 for c in real if ARABIC_OR_TASHKIL.match(c))
    return arab / len(real)


def arabic_letters_count(s: str) -> int:
    """Nombre de lettres arabes (hors tashkil/tatweel/chiffres)."""
    return len(re.findall(r"[ا-يٱ]", s))


def fragmentation_ratio(s: str) -> float:
    """Détecte les lignes 'fragmentées' (ornements OCRisés) : beaucoup de
    mots très courts entrecoupés d'espaces.

    Retourne le ratio (mots ≤ 2 caractères) / nb_mots_total.
    """
    words = [w for w in s.split() if w]
    if not words:
        return 1.0
    short = sum(1 for w in words if arabic_letters_count(w) <= 2)
    return short / len(words)


def has_excessive_digits(s: str, allow_ayah_markers: bool = False) -> bool:
    """Présence excessive de chiffres dans une ligne courte → ornement.

    Pour les sourates (allow_ayah_markers=True), on autorise les chiffres
    qui sont des marqueurs de versets ﴿N﴾ ou [N], très fréquents.
    """
    digits = len(re.findall(r"[0-9٠-٩]", s))
    if allow_ayah_markers and ("﴿" in s or "[" in s or "(" in s):
        digits -= len(re.findall(r"[(﴿\[]\s*[0-9٠-٩]+\s*[)﴾\]]", s)) * 2
        digits = max(0, digits)
    return digits >= 3 and len(s) < 50


def looks_like_title(line: str, title_ar: str) -> bool:
    line_n = norm_ar(line)
    title_n = norm_ar(title_ar)
    if not line_n or not title_n:
        return False
    if line_n == title_n or title_n in line_n:
        return True
    if len(line_n) > len(title_n) + 6:
        return False
    common = sum(1 for c in title_n if c in line_n)
    return common / max(1, len(title_n)) >= 0.7


def ensure_png(doc, idx: int) -> Path:
    """Rend la page idx en PNG 300dpi (cached)."""
    out = CACHE_DIR / f"p{idx + 1:03d}.png"
    if out.exists():
        return out
    pix = doc[idx].get_pixmap(dpi=300)
    pix.save(out)
    return out


def ocr_page(png: Path) -> str:
    """OCR via Tesseract en mode arabe. Retourne le texte brut multilignes."""
    out_base = png.with_suffix("")
    txt = out_base.with_suffix(".txt")
    if not txt.exists():
        subprocess.run(
            ["tesseract", str(png), str(out_base), "-l", "ara", "--psm", "6"],
            check=True,
            capture_output=True,
        )
    return txt.read_text(encoding="utf-8")


def clean_lines(raw: str, title_ar: str, *, category: str) -> list[str]:
    """Nettoie le texte OCR ligne à ligne.

    Filtres :
     1. Ratio arabe minimal
     2. Au moins N lettres arabes (N moins strict pour les sourates,
        où des versets très courts existent)
     3. Pas trop de mots-fragments (1-2 lettres) → ornement OCRisé
     4. Pas trop de chiffres dans une ligne courte (marqueurs de versets
        autorisés pour les sourates)
     5. Pas le titre dupliqué
     6. Pas une ligne dominée par un caractère répété
    """
    is_sourate = category == "intro"
    min_letters = 4 if is_sourate else 8

    out = []
    for line in raw.split("\n"):
        ln = line.strip()
        if not ln:
            continue
        if PAGE_NUMBER.match(ln):
            continue
        if ln in RUNNING_HEADERS:
            continue
        if arabic_ratio(ln) < 0.55:
            continue
        if arabic_letters_count(ln) < min_letters:
            continue
        if fragmentation_ratio(ln) > 0.5:
            continue
        if has_excessive_digits(ln, allow_ayah_markers=is_sourate):
            continue
        if looks_like_title(ln, title_ar):
            continue
        # Caractère répété de façon excessive (ornement, ligne ASCII brutale)
        dominant = False
        for c in set(ln):
            if c == " ":
                continue
            if ln.count(c) > len(ln) * 0.5:
                dominant = True
                break
        if dominant:
            continue
        out.append(ln)
    return out


def kind_of(line: str, category: str) -> str:
    if "﴿" in line and "﴾" in line:
        return "verse"
    if category == "intro":
        return "verse"
    if category == "qasaid" and "٭" in line:
        return "poetry"
    return "prose"


def ayah_of(line: str):
    m = re.search(r"﴿\s*([٠-٩\d]+)\s*﴾", line)
    if not m:
        return None
    raw = m.group(1)
    return int(raw.translate(str.maketrans(NUMBERS_AR, "0123456789")))


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage : python3 extract-dalail.py <chemin/vers/Dalil.pdf>\n")
        sys.exit(1)
    pdf_path = Path(sys.argv[1]).expanduser()
    if not pdf_path.exists():
        sys.stderr.write(f"PDF introuvable : {pdf_path}\n")
        sys.exit(1)

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"PDF : {pdf_path.name} — {total_pages} pages — OCR (ara)")

    index_sections = []
    for order, (slug, ar, fr, hint, category, p_start, p_end_excl) in enumerate(SECTIONS):
        i_start = max(0, p_start - 1)
        i_end = min(total_pages, p_end_excl - 1)

        all_raw = []
        for p in range(i_start, i_end):
            png = ensure_png(doc, p)
            try:
                txt = ocr_page(png)
            except subprocess.CalledProcessError as e:
                sys.stderr.write(f"  ! OCR a échoué sur page {p + 1}: {e.stderr.decode('utf-8', 'replace')[:160]}\n")
                continue
            all_raw.append(txt)

        cleaned = clean_lines("\n".join(all_raw), ar, category=category)

        lines = []
        for i, ln in enumerate(cleaned):
            entry = {
                "id": f"{slug}-l{i + 1:04d}",
                "ar": ln,
                "kind": kind_of(ln, category),
            }
            a = ayah_of(ln)
            if a is not None:
                entry["ayah"] = a
            lines.append(entry)

        section = {
            "slug": slug,
            "order": order,
            "category": category,
            "ar": ar,
            "fr": fr,
            "hint": hint,
            "pages": [p_start, p_end_excl - 1],
            "lines": lines,
        }
        out_file = CONTENT_DIR / f"{slug}.json"
        out_file.write_text(
            json.dumps(section, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  ✓ {slug:24s} {len(lines):4d} lignes (pages {p_start:>3}-{p_end_excl - 1:<3})")

        index_sections.append({
            "slug": slug,
            "order": order,
            "category": category,
            "ar": ar,
            "fr": fr,
            "hint": hint,
            "durationMin": max(1, round(len(lines) / 10)),
        })

    index = {
        "slug": "dalail",
        "ar": "دلائل الخيرات",
        "fr": "Dalail al-Khayrat",
        "author": {
            "ar": "الإمام محمد بن سليمان الجزولي",
            "fr": "Imam Muhammad ibn Sulayman al-Jazuli (m. 870 H / 1465)",
        },
        "description": {
            "fr": "Recueil de prières sur le Prophète ﷺ, complété par des qasaid (Burda, Munfarija, Mashishiyya), des du'as (Nasiri, ouverture, clôture) et le Hizb an-Nasr.",
            "ar": "كتاب في الصلاة على النبي ﷺ للإمام أبي عبد الله محمد بن سليمان الجزولي",
        },
        "sectionsMeta": index_sections,
    }
    (CONTENT_DIR / "_index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    doc.close()
    print(f"\n✓ {len(index_sections)} sections extraites par OCR")
    print(f"  Cache PNG/TXT : {CACHE_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
