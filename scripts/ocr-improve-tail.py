#!/usr/bin/env python3
"""
ocr-improve-tail.py — Re-OCR des pages 236-299 du PDF Dalail avec :
 - crop des marges décoratives (~10% sur chaque bord)
 - 3 passes Tesseract avec PSM différents (3, 4, 6)
 - sélection du meilleur résultat par page (heuristique : nb de caractères arabes valides)
 - préservation du tashkeel
 - filtrage minimal (uniquement le pur bruit)

Sortie :
 - .ocr-cache/p<NNN>-best.txt  : texte OCR final retenu par page
 - .ocr-cache/p<NNN>-cropped.png : image cropée (pour debug)
"""
import sys
import re
import subprocess
from pathlib import Path

try:
    import fitz
    from PIL import Image
    import numpy as np
except ImportError as e:
    sys.stderr.write(f"Manque dépendance : {e}. Lance : pip3 install pymupdf pillow numpy\n")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".ocr-cache"
PDF = sys.argv[1] if len(sys.argv) > 1 else (
    "/Users/anashalhal/Library/Mobile Documents/com~apple~CloudDocs/Downloads/Dalil A4-1.pdf"
)
START = int(sys.argv[2]) if len(sys.argv) > 2 else 236
END = int(sys.argv[3]) if len(sys.argv) > 3 else 299

ARABIC_LETTER = re.compile(r"[ا-يٱ]")  # lettres pures, sans tashkeel ni chiffres


def score(text: str) -> int:
    """Score : nombre de lettres arabes utiles dans le texte."""
    return len(ARABIC_LETTER.findall(text))


def crop_image(src_png: Path, dst_png: Path) -> None:
    """Crop les marges décoratives en se basant sur la densité de pixels noirs.

    Garde la boîte qui contient au moins 5% de pixels noirs par ligne/colonne.
    """
    img = Image.open(src_png).convert("L")
    arr = np.array(img)
    H, W = arr.shape
    black = arr < 100
    h_density = black.sum(axis=1)
    v_density = black.sum(axis=0)
    h_thresh = W * 0.04
    v_thresh = H * 0.04
    y_idx = np.where(h_density > h_thresh)[0]
    x_idx = np.where(v_density > v_thresh)[0]
    if len(y_idx) == 0 or len(x_idx) == 0:
        img.save(dst_png)
        return
    y0, y1 = int(y_idx[0]), int(y_idx[-1])
    x0, x1 = int(x_idx[0]), int(x_idx[-1])
    # Padding pour ne pas couper le tashkeel
    pad_y, pad_x = int(H * 0.012), int(W * 0.01)
    y0 = max(0, y0 - pad_y)
    y1 = min(H, y1 + pad_y)
    x0 = max(0, x0 - pad_x)
    x1 = min(W, x1 + pad_x)
    img.crop((x0, y0, x1, y1)).save(dst_png)


def ocr(png: Path, psm: int) -> str:
    # Base sans suffixe parasitique : ajouter ".psm{psm}" littéralement à la fin
    # (et NON via with_suffix qui remplacerait l'extension existante).
    out_base = png.parent / f"{png.stem}.psm{psm}"
    txt = out_base.with_name(out_base.name + ".txt")
    if txt.exists():
        return txt.read_text(encoding="utf-8")
    try:
        subprocess.run(
            ["tesseract", str(png), str(out_base), "-l", "ara", "--psm", str(psm)],
            check=True,
            capture_output=True,
            timeout=60,
        )
        return txt.read_text(encoding="utf-8") if txt.exists() else ""
    except Exception:
        return ""


def main():
    doc = fitz.open(PDF)
    if END > len(doc):
        end = len(doc)
    else:
        end = END
    print(f"Re-OCR pages {START}-{end} sur {len(doc)} avec crop + multi-PSM…")

    for p in range(START, end + 1):
        idx = p - 1
        src_png = CACHE / f"p{p:03d}.png"
        if not src_png.exists():
            page = doc[idx]
            pix = page.get_pixmap(dpi=300)
            pix.save(str(src_png))

        cropped = CACHE / f"p{p:03d}-cropped.png"
        if not cropped.exists():
            try:
                crop_image(src_png, cropped)
            except Exception as e:
                print(f"  ! crop p{p}: {e}")
                cropped = src_png

        # 3 passes Tesseract
        results = {}
        for psm in (3, 4, 6):
            results[psm] = ocr(cropped, psm)

        # Choisir le meilleur (le plus d'arabe utile)
        best_psm = max(results, key=lambda k: score(results[k]))
        best_text = results[best_psm]
        best = CACHE / f"p{p:03d}-best.txt"
        best.write_text(best_text, encoding="utf-8")

        s = score(best_text)
        marker = "★" if s > 50 else ("·" if s > 10 else "✗")
        print(f"  {marker} p{p:>3} psm={best_psm} arabe={s:>4} lettres")

    doc.close()
    print(f"\nTerminé. Résultats : {CACHE}/pNNN-best.txt")


if __name__ == "__main__":
    main()
