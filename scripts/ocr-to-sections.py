#!/usr/bin/env python3
"""
ocr-to-sections.py — Compile les fichiers .ocr-cache/pNNN-best.txt en JSON
structuré par section, en se basant sur la table des matières du PDF.

- Filtres minimaux pour préserver tashkeel et fidélité au PDF
- Sauve dans .ocr-cache/sections-raw.json pour preview avant intégration
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".ocr-cache"
OUT = CACHE / "sections-raw.json"

# (slug, fr, ar, hint, page_start, page_end)
SECTIONS = [
    ("khatm",            "Clôture de Dalail",       "ختم دلائل الخيرات",          "Khatm",                                  236, 236),
    ("duaa-apres",       "Du'a après la lecture",   "دعاء يقرأ عقب دلائل الخيرات", "Bouclage du khatm",                     237, 241),
    ("bio-ibn-nasir",    "Biographie d'Ibn Nasir",  "ترجمة سيدي ابن ناصر الدرعي",  "Auteur du Du'a Nasiri",                 242, 243),
    ("duaa-nasiri",      "Du'a Nasiri",             "الدعاء الناصري",             "Sidi Ibn Nasir al-Dar'i (1085 H / 1674)", 244, 250),
    ("bio-ibn-nahwi",    "Biographie d'Ibn Nahwi",  "ترجمة سيدي ابن النحوي",       "Auteur d'al-Munfarija",                  251, 252),
    ("munfarija",        "Qasida al-Munfarija",     "قصيدة المنفرجة",             "Sidi Ibn an-Nahwi (513 H / 1119)",       253, 260),
    ("bio-ibn-mashish",  "Biographie d'Ibn Mashish","ترجمة سيدي عبد السلام بن مشيش","Auteur de la Mashishiyya",              261, 263),
    ("salat-mashishiyya","Salat al-Mashishiyya",    "الصلاة المشيشية",            "Sidi Abdes-Salam Ibn Mashish",           264, 266),
    ("zajr-mashishiyya", "Zajr al-Mashishiyya",     "زجر الصلاة المشيشية",        "Réfutation et défense",                  267, 268),
    ("bio-jilani",       "Biographie d'al-Jilani",  "ترجمة سيدي عبد القادر الجيلاني","Auteur du Hizb an-Nasr",                269, 270),
    ("hizb-nasr",        "Hizb an-Nasr",            "حزب النصر",                  "Sidi 'Abd al-Qadir al-Jilani (561 H)",   271, 275),
    ("bio-busiri",       "Biographie d'al-Busiri",  "ترجمة الإمام البوصيري",       "Auteur de la Burda",                     276, 278),
    ("burda",            "Qasidat al-Burda",        "قصيدة البردة",               "Imam al-Busiri (m. 696 H / 1296)",       279, 289),
    ("fin-livre",        "Table des matières / fin","ختام الكتاب",                "Table des matières",                     290, 299),
]

ARABIC_LETTER = re.compile(r"[ا-يٱ]")           # lettres pures
ARABIC_OR_TASHKIL = re.compile(r"[؀-ۿ]")        # arabe + tashkeel + ponctuation arabe


def arabic_letters(s: str) -> int:
    return len(ARABIC_LETTER.findall(s))


def arabic_chars(s: str) -> int:
    return len(ARABIC_OR_TASHKIL.findall(s))


def clean_line(raw: str) -> str:
    """Normalise les espaces, supprime caractères de contrôle bidi."""
    s = raw
    s = s.replace("‏", "").replace("‎", "")  # RLM, LRM
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


LATIN_DIGIT = re.compile(r"[A-Za-z0-9]")
PUNCT_NOISE = re.compile(r"[°©٠²³`~^_=+\\|<>{}\[\]]")


def is_meaningful(line: str) -> bool:
    """Garde la ligne si elle contient un mot arabe substantiel et propre.

    Critères stricts pour ne garder que les lignes vraiment lisibles —
    élimine le pur bruit OCR (typographies décoratives, ornements).
    """
    if not line:
        return False
    letters = arabic_letters(line)
    if letters < 10:                               # ligne trop courte
        return False
    real = re.sub(r"\s", "", line)
    if not real:
        return False
    ratio_arab = arabic_chars(line) / len(real)
    if ratio_arab < 0.70:                          # filtre serré : 70% arabe min
        return False
    # Présence excessive de latin/chiffres (OCR raté)
    n_latin = len(LATIN_DIGIT.findall(line))
    if n_latin > 3:
        return False
    # Présence excessive de symboles bizarres
    n_punct_noise = len(PUNCT_NOISE.findall(line))
    if n_punct_noise > 1:
        return False
    # Mot le plus long doit avoir ≥ 3 lettres arabes (sinon fragmenté)
    words = line.split()
    real_words = [w for w in words if arabic_letters(w) >= 3]
    if len(real_words) < 2:                        # au moins 2 mots arabes complets
        return False
    return True


def main():
    sections = []
    for slug, fr, ar, hint, p_start, p_end in SECTIONS:
        all_lines = []
        pages_used = []
        for p in range(p_start, p_end + 1):
            f = CACHE / f"p{p:03d}-best.txt"
            if not f.exists():
                continue
            raw = f.read_text(encoding="utf-8")
            lines = [clean_line(l) for l in raw.split("\n")]
            kept = [l for l in lines if is_meaningful(l)]
            if kept:
                pages_used.append({"page": p, "lines": len(kept)})
                all_lines.extend(kept)
        # Stats qualité
        total_letters = sum(arabic_letters(l) for l in all_lines)
        avg = round(total_letters / max(1, len(all_lines)))
        sections.append({
            "slug": slug,
            "fr": fr,
            "ar": ar,
            "hint": hint,
            "pages": [p_start, p_end],
            "pagesUsed": pages_used,
            "stats": {
                "totalLines": len(all_lines),
                "totalLetters": total_letters,
                "avgLettersPerLine": avg,
            },
            "lines": all_lines,
        })
    OUT.write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ {OUT.relative_to(ROOT)}")
    for s in sections:
        print(f"  {s['slug']:24s} {s['stats']['totalLines']:>4} lignes — {s['stats']['totalLetters']:>5} lettres arabes")


if __name__ == "__main__":
    main()
