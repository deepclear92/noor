# Noor — Recueil de prières sur le Prophète ﷺ

Application web/PWA installable centrée sur **Dalail al-Khayrat** (Imam al-Jazuli) et **Kitab Dakhirat al-Muhtaj** (56 volumes), avec architecture extensible pour accueillir d'autres œuvres (hadiths, sira).

> **Sur lui les prières et la paix.**

## Fonctionnalités

- 📖 **Dalail al-Khayrat** complet : 8 ahzab répartis sur la semaine, sourates introductives (Ya-Sin, Al-Fath, Al-Waqi'a), 203 noms du Prophète ﷺ, 99 noms d'Allah, du'as d'ouverture/intention/clôture, Qasidat al-Burda (10 chapitres), Salat al-Mashishiyya, Qasida al-Munfarija, Du'a Nasiri, Hizb an-Nasr.
- 🔊 **Audio synchronisé** : timestamps par ligne pour les ahzab (dalailalkhayrat.com), par vers pour la Burda (qasidaburda.com), par verset pour le Coran (quran.com). Lecteur sticky avec vitesse variable, liste cliquable des lignes.
- 🌍 **Multi-langues** : texte arabe vocalisé + translittération latine + traductions FR/EN/ID/FA/TR selon les sources. Toggles indépendants.
- 🎨 **Lecteur paramétrable** : 6+ polices arabes (Uthmanic Hafs, Amiri, Scheherazade, Noto Naskh, Reem Kufi, Aref Ruqaa, Mirza), taille ajustable, interligne, 3 thèmes (jour/sépia/nuit), explications par ligne (Mashishiyya).
- 📚 **Kitab Dakhira** : viewer PDF virtualisé (5 pages rendues à la fois), mémorisation de la dernière page par volume, navigation rapide.
- 🔁 **Reprendre la lecture** : carte sur l'accueil affichant la dernière section/page lue, par livre et globalement.
- 🔎 **Recherche full-text** arabe (normalisation tashkil), FR, EN, latin.
- 📱 **PWA installable** iOS/Android/Desktop, fonctionne hors-ligne pour le contenu déjà chargé.
- 🔖 **Marque-pages, progrès de lecture, compteurs de récitations**.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind 4
- **Zustand** + persist pour préférences/bookmarks/lastRead
- **react-pdf** + virtualisation IntersectionObserver pour Dakhira
- **Fuse.js** pour la recherche client
- **next/font/google** pour les polices arabes (sous-set automatique)
- **Tesseract OCR** + scrapers Node pour l'ingestion des sources

## Sources

| Section | Source | Type |
|---|---|---|
| Sourates introductives | [quran.com API](https://quran.com) | Texte uthmani + traduction Hamidullah + audio Mishary Alafasy |
| 8 ahzab + asma + du'as | [dalailalkhayrat.com](https://www.dalailalkhayrat.com/) | Arabe + translittération + FR/EN/ID/FA/TR + audio synchronisé |
| Qasidat al-Burda | [qasidaburda.com](https://www.qasidaburda.com/) | Arabe + translittération + EN + audio par chapitre |
| Mashishiyya, Munfarija, Nasiri | Domaine public (≥12e siècle) | Texte arabe authentique + traduction française originale (projet Noor) |
| Dakhirat al-Muhtaj | [archive.org/Dakhirat-almuhtaj](https://archive.org/details/Dakhirat-almuhtaj) | 56 volumes PDF |

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone https://github.com/deepclear92/noor.git
cd noor
npm install

# 2. Télécharger les assets lourds (PDFs Dakhira ~600 MiB + audios ~280 MiB)
node scripts/fetch-dakhira.mjs        # 56 volumes PDF
node scripts/fetch-burda.mjs          # Audio Burda par chapitre
node scripts/fetch-dalail-site.mjs    # Audio ahzab + texte
node scripts/fetch-sourates.mjs       # Texte + audio sourates intro
node scripts/fetch-fonts.mjs          # Polices arabes (optionnel)

# 3. Démarrer en dev
npm run dev
# → http://localhost:3030
```

## Structure

```
noor/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── dalail/           # Sommaire + lecteur par section + lecture continue
│   │   ├── dakhira/          # Sommaire 56 volumes + viewer PDF par volume
│   │   ├── recherche/        # Recherche full-text
│   │   ├── reglages/         # Police, thème, marque-pages
│   │   └── api/search-index/ # Index agrégé pour la recherche
│   ├── components/
│   │   ├── reader/           # Reader, ReaderToolbar, AudioPlayer, PdfViewer, VideoList
│   │   ├── nav/              # TopBar (avec ⚙️ contextuel), BottomBar mobile
│   │   ├── ResumeReading.tsx # Carte « Reprendre la lecture »
│   │   └── ThemeBootstrap.tsx
│   ├── content/dalail/       # JSON par section + _index.json
│   ├── lib/                  # store zustand, content loaders, arabic normalize
│   └── types/                # Schéma Section / Line / Video / BookIndex
├── scripts/                  # Fetchers et extracteurs (Python + Node)
└── public/
    ├── fonts/                # Polices arabes woff2 (sous-set arabe)
    ├── icons/                # Manifest + favicon PWA
    ├── content/audio/        # (gitignored) Audio Burda + Dalail
    ├── content/dakhira/      # (gitignored) 56 PDFs Dakhira
    └── pdf-worker.mjs        # Worker PDF.js (copié depuis pdfjs-dist)
```

## Déploiement

### Tunnel public temporaire (dev)
```bash
cloudflared tunnel --url http://localhost:3030
```

### Production (Docker)
```bash
docker compose up --build
```

### Vercel / Hostinger
Build standalone activé dans `next.config.ts`. Compatible avec n'importe quelle plateforme Node.

## À propos du contenu

Tous les textes arabes utilisés sont des œuvres classiques (12e–17e siècles) **dans le domaine public**. Les traductions françaises de Mashishiyya, Munfarija et Nasiri ont été produites originalement par le projet, en prose claire, à partir du texte arabe ancien.

## Licence

Code : MIT.
Contenu : sources et licences détaillées dans chaque fichier JSON (`source` field) et dans le tableau ci-dessus.

---

*Composé avec amour pour le Prophète ﷺ.*
