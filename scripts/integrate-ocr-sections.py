#!/usr/bin/env python3
"""
integrate-ocr-sections.py — Intègre les résultats OCR améliorés dans le site.

- Garde les sections déjà en bonne version : burda, munfarija, salat-mashishiyya
- Augmente duaa-nasiri (prélude curated + lignes OCR additionnelles)
- Remplace les 8 sections où OCR apporte un gain : khatm, duaa-apres, bio-*, hizb-nasr, zajr-mashishiyya
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / ".ocr-cache" / "sections-raw.json"
DALAIL = ROOT / "src" / "content" / "dalail"

with open(RAW, "r", encoding="utf-8") as f:
    sections = {s["slug"]: s for s in json.load(f)}

# Sections à remplacer entièrement par OCR amélioré
REPLACE = {
    "khatm":             ("ختم دلائل الخيرات",          "Clôture de Dalail",         "Khatm",                   "cloture",  20),
    "duaa-apres":        ("دعاء يقرأ عقب دلائل الخيرات", "Du'a après la lecture",     "Bouclage du khatm",       "cloture",  21),
    "bio-ibn-nasir":     ("ترجمة سيدي ابن ناصر الدرعي", "Biographie d'Ibn Nasir al-Dar'i", "Auteur du Du'a Nasiri", "qasaid", 30),
    "bio-ibn-nahwi":     ("ترجمة سيدي ابن النحوي",       "Biographie d'Ibn an-Nahwi", "Auteur d'al-Munfarija",   "qasaid",  32),
    "bio-ibn-mashish":   ("ترجمة سيدي عبد السلام بن مشيش", "Biographie d'Ibn Mashish", "Auteur de la Mashishiyya", "qasaid", 34),
    "zajr-mashishiyya":  ("زجر الصلاة المشيشية",         "Zajr al-Mashishiyya",       "Réfutation et défense",   "qasaid",  36),
    "bio-jilani":        ("ترجمة سيدي عبد القادر الجيلاني","Biographie d'al-Jilani",   "Auteur du Hizb an-Nasr",  "qasaid",  37),
    "hizb-nasr":         ("حزب النصر",                   "Hizb an-Nasr",              "Sidi 'Abd al-Qadir al-Jilani (m. 561 H)", "qasaid", 38),
    "bio-busiri":        ("ترجمة الإمام البوصيري",        "Biographie de l'Imam al-Busiri", "Auteur de la Burda", "qasaid", 39),
}

# Sections à garder telles quelles (ne pas écraser)
KEEP = {"burda", "munfarija", "salat-mashishiyya"}


def write_section(slug, ar, fr, hint, category, order, ocr_lines):
    """Écrit un nouveau fichier section depuis l'OCR."""
    lines = []
    for i, txt in enumerate(ocr_lines, 1):
        lines.append({
            "id": f"{slug}-l{i:03d}",
            "ar": txt,
            "kind": "prose",
        })
    section = {
        "slug": slug,
        "order": order,
        "category": category,
        "ar": ar,
        "fr": fr,
        "hint": hint,
        "source": "OCR du PDF source (Dalil A4-1.pdf) — tashkeel préservé · pages 236-299",
        "lines": lines,
    }
    out = DALAIL / f"{slug}.json"
    out.write_text(json.dumps(section, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


# 1. Remplacer les 9 sections où OCR > existant
print("→ Sections remplacées par OCR amélioré :")
for slug, (ar, fr, hint, category, order) in REPLACE.items():
    s = sections.get(slug)
    if not s:
        print(f"  ✗ {slug} absent du raw")
        continue
    if not s["lines"]:
        print(f"  ✗ {slug} pas de lignes OCR")
        continue
    write_section(slug, ar, fr, hint, category, order, s["lines"])
    print(f"  ✓ {slug:24s} ← {len(s['lines'])} lignes")

# 2. Augmenter duaa-nasiri : prélude curated + OCR additionnel
print("\n→ Augmentation duaa-nasiri :")
duaa_path = DALAIL / "duaa-nasiri.json"
existing = json.loads(duaa_path.read_text(encoding="utf-8"))
# Lignes curated existantes
curated = existing["lines"]
print(f"  → {len(curated)} lignes curated existantes")
# Lignes OCR additionnelles (skip celles déjà dans curated)
curated_ar = {l["ar"][:30] for l in curated if "ar" in l}
ocr_lines = sections["duaa-nasiri"]["lines"]
added = []
for txt in ocr_lines:
    if txt[:30] not in curated_ar:
        added.append(txt)
        curated_ar.add(txt[:30])
# Ajoute après le placeholder de fin "suite à compléter"
new_lines = [l for l in curated if "à compléter" not in (l.get("translit", "") or "")]
for i, txt in enumerate(added, len(new_lines) + 1):
    new_lines.append({
        "id": f"duaa-nasiri-ocr-{i:03d}",
        "ar": txt,
        "kind": "poetry" if "٭" in txt or "*" in txt else "prose",
    })
existing["lines"] = new_lines
existing["source"] = (
    "Prélude (Coran 33:56) + 10 premiers distiques : texte arabe domaine public, "
    "traduction française originale (projet Noor). "
    "Suite (distiques 11-71) : OCR du PDF source, tashkeel préservé."
)
duaa_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  ✓ duaa-nasiri : {len(curated)} curated + {len(added)} OCR = {len(new_lines)} lignes total")

# 3. Sections gardées
print("\n→ Sections gardées telles quelles :")
for slug in KEEP:
    print(f"  · {slug}")

print("\n✓ Intégration OCR terminée. Régénère l'index avec : node scripts/build-index.mjs")
