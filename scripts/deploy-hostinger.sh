#!/usr/bin/env bash
# deploy-hostinger.sh — Script de déploiement sur Hostinger Business Web Hosting
#
# À exécuter via le Terminal SSH d'hPanel (Avancé → SSH Access).
# Pré-requis Hostinger : Node.js 20+ activé sur le plan + plus de 1 GB d'espace.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/deepclear92/noor/main/scripts/deploy-hostinger.sh | bash -s -- noor-test.example.com
#
# Ou bien :
#   wget https://github.com/deepclear92/noor/archive/refs/heads/main.tar.gz
#   tar -xzf main.tar.gz
#   cd noor-main
#   bash scripts/deploy-hostinger.sh noor-test.example.com

set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage : $0 <sous-domaine>"
  echo "Ex.   : $0 noor-test.tondomaine.com"
  exit 1
fi

PROJECT_DIR="$HOME/domains/$DOMAIN/public_html"
NODE_VERSION="${NODE_VERSION:-20}"

echo ">> Déploiement Noor sur $DOMAIN"
echo ">> Répertoire cible : $PROJECT_DIR"

# 1. S'assurer que Node existe
if ! command -v node &> /dev/null; then
  echo "ERREUR : Node.js n'est pas activé. Active-le d'abord dans hPanel → Node.js."
  exit 1
fi
echo ">> Node $(node --version) — OK"

# 2. Si le repo n'est pas encore là, le cloner (depuis main)
if [[ ! -d "$PROJECT_DIR/.git" ]]; then
  echo ">> Clonage du repo…"
  mkdir -p "$PROJECT_DIR"
  cd "$PROJECT_DIR/.."
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    git clone "https://$GITHUB_TOKEN@github.com/deepclear92/noor.git" "$(basename "$PROJECT_DIR")"
  else
    git clone "https://github.com/deepclear92/noor.git" "$(basename "$PROJECT_DIR")"
  fi
else
  echo ">> Mise à jour du repo…"
  cd "$PROJECT_DIR"
  git pull --rebase
fi

cd "$PROJECT_DIR"

# 3. Installer les dépendances
echo ">> npm install…"
npm install --omit=dev --legacy-peer-deps

# 4. Build production
echo ">> npm run build…"
NEXT_TELEMETRY_DISABLED=1 npm run build

# 5. Copier les fichiers statiques dans le bundle standalone
echo ">> Copie de .next/static et /public dans .next/standalone…"
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp public/pdf-worker.mjs .next/standalone/public/ 2>/dev/null || true

# 6. Télécharger les assets lourds (Dakhira PDFs + audios) si manquants
if [[ ! -d "public/content/dakhira" ]] || [[ -z "$(ls -A public/content/dakhira 2>/dev/null | grep -v '.gitkeep')" ]]; then
  echo ">> Téléchargement des 56 volumes Dakhira (~600 MiB)…"
  node scripts/fetch-dakhira.mjs
  cp -r public/content .next/standalone/public/
fi

if [[ ! -d "public/content/audio/dalail" ]]; then
  echo ">> Téléchargement de l'audio Dalail (~150 MiB)…"
  node scripts/fetch-dalail-site.mjs
fi

if [[ ! -d "public/content/audio/burda" ]]; then
  echo ">> Téléchargement de l'audio Burda (~70 MiB)…"
  node scripts/fetch-burda.mjs
fi

# Re-copie après téléchargements
cp -r public/content .next/standalone/public/ 2>/dev/null || true

# 7. Créer un fichier .htaccess pour la redirection (LiteSpeed Passenger)
cat > "$PROJECT_DIR/.htaccess" <<'HTACCESS'
# Pass tous les requests vers l'app Node Passenger
PassengerNodejs /usr/bin/node
PassengerAppType node
PassengerStartupFile .next/standalone/server.js
PassengerAppRoot /home/USER/domains/DOMAIN/public_html
HTACCESS
sed -i "s|/home/USER|$HOME|g; s|/DOMAIN|/$DOMAIN|g" "$PROJECT_DIR/.htaccess"

# 8. Démarrer le serveur (testable directement)
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ Déploiement terminé sur https://$DOMAIN"
echo ""
echo "Démarrage manuel pour test :"
echo "  cd $PROJECT_DIR/.next/standalone"
echo "  PORT=3000 node server.js"
echo ""
echo "Démarrage permanent via Hostinger Node.js Application Manager :"
echo "  hPanel → Avancé → Node.js"
echo "  → Application root : $PROJECT_DIR"
echo "  → Application startup file : .next/standalone/server.js"
echo "  → Application URL : $DOMAIN"
echo "═══════════════════════════════════════════════════════════════"
