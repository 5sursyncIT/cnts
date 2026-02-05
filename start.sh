#!/bin/bash

# Script de démarrage de l'application SGI-CNTS
# Ce script démarre la base de données, le backend et le frontend

set -e

echo "🚀 Démarrage de SGI-CNTS..."
echo ""

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Démarrer PostgreSQL
echo -e "${BLUE}[1/3] Démarrage de PostgreSQL...${NC}"
docker-compose up -d db
sleep 2 # Attendre que PostgreSQL soit prêt

# Vérifier que PostgreSQL est bien démarré
if docker-compose ps db | grep -q "Up"; then
    echo -e "${GREEN}✓ PostgreSQL démarré${NC}"
else
    echo -e "${YELLOW}⚠ Attention: PostgreSQL n'est peut-être pas prêt${NC}"
fi

echo ""

# 2. Démarrer le Backend (FastAPI)
echo -e "${BLUE}[2/3] Démarrage du Backend (FastAPI)...${NC}"
cd backend
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠ L'environnement virtuel .venv n'existe pas${NC}"
    echo "Créez-le avec: python3 -m venv .venv && . .venv/bin/activate && pip install -e '.[dev]'"
    exit 1
fi

# Lancer le backend en arrière-plan dans un nouveau terminal ou tmux
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd) && . .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; exec bash"
    echo -e "${GREEN}✓ Backend démarré dans un nouveau terminal (http://0.0.0.0:8000)${NC}"
elif command -v tmux &> /dev/null; then
    tmux new-session -d -s cnts-backend "cd $(pwd) && . .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo -e "${GREEN}✓ Backend démarré dans tmux session 'cnts-backend' (http://0.0.0.0:8000)${NC}"
    echo "  Attachez-vous avec: tmux attach -t cnts-backend"
else
    echo -e "${YELLOW}⚠ Ni gnome-terminal ni tmux trouvé${NC}"
    echo "Démarrez manuellement le backend avec:"
    echo "  cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
fi

cd ..
sleep 1
echo ""

# 3. Démarrer le Frontend (Next.js)
echo -e "${BLUE}[3/3] Démarrage du Frontend (Next.js)...${NC}"
cd web

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules n'existe pas, installation des dépendances...${NC}"
    npm install
fi

# Lancer le frontend en arrière-plan dans un nouveau terminal ou tmux
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd) && npm run dev; exec bash"
    echo -e "${GREEN}✓ Frontend démarré dans un nouveau terminal (http://localhost:3000)${NC}"
elif command -v tmux &> /dev/null; then
    tmux new-session -d -s cnts-frontend "cd $(pwd) && npm run dev"
    echo -e "${GREEN}✓ Frontend démarré dans tmux session 'cnts-frontend' (http://localhost:3000)${NC}"
    echo "  Attachez-vous avec: tmux attach -t cnts-frontend"
else
    echo -e "${YELLOW}⚠ Ni gnome-terminal ni tmux trouvé${NC}"
    echo "Démarrez manuellement le frontend avec:"
    echo "  cd web && npm run dev"
fi

cd ..
echo ""
echo -e "${GREEN}✅ Démarrage terminé !${NC}"
echo ""
echo "📱 Application accessible sur:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://0.0.0.0:8000"
echo "  - API Docs: http://0.0.0.0:8000/docs"
echo ""
echo "🛑 Pour arrêter l'application:"
echo "  - PostgreSQL: docker-compose down"
echo "  - Backend/Frontend: Ctrl+C dans les terminaux respectifs"
if command -v tmux &> /dev/null; then
    echo "  - Ou: tmux kill-session -t cnts-backend && tmux kill-session -t cnts-frontend"
fi
