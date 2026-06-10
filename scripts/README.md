# Scripts d'ingestion Noor

## Dalail al-Khayrat — extraction du texte arabe

Le PDF source contient le texte arabe vocalisé. L'extraction se fait en deux étapes :

```bash
# 1. Installe les dépendances Python
pip3 install pymupdf

# 2. Extrait le texte arabe par section
python3 scripts/extract-dalail.py "/chemin/vers/Dalil A4-1.pdf"

# 3. Enrichit avec translittération + traduction depuis dalailalkhayrat.com
node scripts/fetch-translations.mjs
```

> ⚠️ Le scraper `fetch-translations.mjs` utilise une heuristique générique
> de parsing HTML. Après une première exécution, **inspecte le HTML réel
> du site source** et ajuste la fonction `extractRows()` pour cibler les
> bons sélecteurs CSS / structure DOM.

## Kitab Dakira — 56 volumes

```bash
# Télécharge tous les volumes (~plusieurs GiB total)
node scripts/fetch-dakhira.mjs

# Ou seulement quelques volumes
node scripts/fetch-dakhira.mjs 1 2 3
```

Les PDFs sont déposés dans `public/content/dakhira/dakira01.pdf`…`dakira56.pdf`
et servis directement par Next.js.

## Recherche

Après chaque extraction, l'index de recherche se reconstruit
automatiquement au build. Pour relancer en dev :

```bash
npm run dev
```
