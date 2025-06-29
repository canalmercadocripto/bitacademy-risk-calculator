#!/bin/bash

# Script para enviar projeto para GitHub
echo "📦 Preparando projeto para GitHub..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script a partir do diretório raiz do projeto${NC}"
    exit 1
fi

# Limpar arquivos desnecessários
echo -e "${YELLOW}🧹 Limpando arquivos temporários...${NC}"
rm -rf frontend/node_modules
rm -rf backend/node_modules
rm -rf frontend/build
rm -f *.tar.gz
rm -rf bitacademy-deploy-*
rm -f backend/.env

# Inicializar git se não existir
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Inicializando repositório Git...${NC}"
    git init
    git branch -M main
fi

# Adicionar arquivos
echo -e "${YELLOW}📁 Adicionando arquivos ao Git...${NC}"
git add .

# Verificar se há mudanças
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️ Nenhuma mudança para commitar${NC}"
else
    # Commit
    echo -e "${YELLOW}💾 Fazendo commit...${NC}"
    read -p "Digite a mensagem do commit (ou pressione Enter para usar padrão): " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="feat: atualização da calculadora BitAcademy $(date '+%Y-%m-%d %H:%M')"
    fi
    
    git commit -m "$COMMIT_MSG"
fi

# Verificar se remote existe
REMOTE_EXISTS=$(git remote -v | grep origin | wc -l)

if [ $REMOTE_EXISTS -eq 0 ]; then
    echo -e "${BLUE}🔗 Configure o remote do GitHub:${NC}"
    echo "1. Crie um repositório no GitHub"
    echo "2. Execute: git remote add origin https://github.com/SEU_USUARIO/bitacademy-risk-calculator.git"
    echo "3. Execute: git push -u origin main"
    echo ""
    echo -e "${GREEN}✅ Projeto pronto para ser enviado ao GitHub!${NC}"
else
    # Push para GitHub
    echo -e "${YELLOW}🚀 Enviando para GitHub...${NC}"
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Projeto enviado com sucesso para o GitHub!${NC}"
    else
        echo -e "${RED}❌ Erro ao enviar para GitHub${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "1. ✅ Código no GitHub"
echo "2. 🔧 Configure GitHub Actions (opcional)"
echo "3. 🚀 Use ./scripts/update-production.sh para atualizações"
echo ""
echo -e "${GREEN}🔗 URL do repositório:${NC}"
git remote get-url origin 2>/dev/null || echo "Configure o remote primeiro"