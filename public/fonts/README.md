# Polices arabes

Place ici les fichiers `.woff2` des polices référencées dans `globals.css`.
Pour le développement, l'application tombe sur les polices `local()`
installées sur le système ou sur les fallbacks (serif).

## Sources libres recommandées

- **Uthmanic Hafs** — https://github.com/quran/quran.com-frontend-next/tree/master/public/fonts
- **Amiri / Amiri Quran** — https://www.amirifont.org/ — GFL
- **Scheherazade New** — https://software.sil.org/scheherazade/ — OFL
- **Noto Naskh Arabic** — Google Fonts (OFL)
- **Reem Kufi** — Google Fonts (OFL)
- **Aref Ruqaa** — Google Fonts (OFL) (proxy pour Diwani / Ruq'ah)
- **Mirza** — Google Fonts (OFL) (proxy pour Thuluth)

Convertis les `.ttf` en `.woff2` via :
```bash
npx ttf2woff2 NotoNaskhArabic-Regular.ttf > NotoNaskhArabic-Regular.woff2
```

Nommage attendu :
- `UthmanicHafs.woff2`
- `AmiriQuran-Regular.woff2`
- `ScheherazadeNew-Regular.woff2`
- `NotoNaskhArabic-Regular.woff2`
- `ReemKufi-Regular.woff2`
- `ArefRuqaa-Regular.woff2`
- `Mirza-Regular.woff2`
