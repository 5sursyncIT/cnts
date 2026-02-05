#!/bin/bash

# Script d'arrêt de l'application SGI-CNTS

set -e

echo "🛑 Arrêt de SGI-CNTS..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Arrêter les sessions tmux si elles existent
if command -v tmux &> /dev/null; then
    echo -e "${BLUE}Arrêt des sessions tmux...${NC}"
    
    if tmux has-session -t cnts-backend 2>/dev/null; then
        tmux kill-session -t cnts-backend
        echo -e "${GREEN}✓ Backend tmux session arrêtée${NC}"
    fi
    
    if tmux has-session -t cnts-frontend 2>/dev/null; then
        tmux kill-session -t cnts-frontend
        echo -e "${GREEN}✓ Frontend tmux session arrêtée${NC}"
    fi
fi

# 2. Arrêter PostgreSQL
echo -e "${BLUE}Arrêt de PostgreSQL...${NC}"
docker-compose down
echo -e "${GREEN}✓ PostgreSQL arrêté${NC}"

echo ""
echo -e "${GREEN}✅ Application arrêtée !${NC}"
