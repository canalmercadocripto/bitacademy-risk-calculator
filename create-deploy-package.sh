#!/bin/bash

# Script para criar pacote de deploy limpo
echo "📦 Criando pacote de deploy..."

# Criar diretório temporário
DEPLOY_DIR="bitacademy-deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p $DEPLOY_DIR

# Copiar arquivos necessários (excluindo node_modules e builds)
echo "📁 Copiando arquivos..."

# Root files
cp package.json $DEPLOY_DIR/
cp ecosystem.config.js $DEPLOY_DIR/
cp nginx.conf $DEPLOY_DIR/
cp nginx-initial.conf $DEPLOY_DIR/
cp setup-vps-fixed.sh $DEPLOY_DIR/
cp setup-ssl.sh $DEPLOY_DIR/
cp DEPLOY-README.md $DEPLOY_DIR/
cp CONFIGURACAO-VPS.md $DEPLOY_DIR/
cp .env.example $DEPLOY_DIR/

# Backend
mkdir -p $DEPLOY_DIR/backend
cp -r backend/src $DEPLOY_DIR/backend/
cp backend/package.json $DEPLOY_DIR/backend/
cp backend/server.js $DEPLOY_DIR/backend/

# Frontend
mkdir -p $DEPLOY_DIR/frontend
cp -r frontend/src $DEPLOY_DIR/frontend/
cp -r frontend/public $DEPLOY_DIR/frontend/
cp frontend/package.json $DEPLOY_DIR/frontend/

# Criar tarball
echo "🗜️ Comprimindo..."
tar -czf ${DEPLOY_DIR}.tar.gz $DEPLOY_DIR

# Limpeza
rm -rf $DEPLOY_DIR

echo "✅ Pacote criado: ${DEPLOY_DIR}.tar.gz"
echo ""
echo "🚀 Para fazer deploy:"
echo "1. Envie o arquivo ${DEPLOY_DIR}.tar.gz para sua VPS"
echo "2. Extraia: tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "3. Execute: cd ${DEPLOY_DIR} && chmod +x setup-vps.sh && ./setup-vps.sh"
echo "4. Siga as instruções no DEPLOY-README.md"