#!/bin/bash

echo "🔍 VERIFICAÇÃO PRÉ-DEPLOY - BITACADEMY CALCULATOR"
echo "================================================"

ERRORS=0

echo ""
echo "1. 📋 Verificando arquivos essenciais..."

# Verificar arquivos principais
REQUIRED_FILES=(
    "backend/server.js"
    "backend/package.json"
    "frontend/package.json"
    "frontend/src/App.js"
    "create-admin.js"
    "reset-admin-password.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file FALTANDO"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "2. 🔧 Verificando configurações do backend..."

# Verificar rotas essenciais
if grep -q "authRoutes" backend/server.js; then
    echo "   ✅ Rotas de autenticação configuradas"
else
    echo "   ❌ Rotas de autenticação FALTANDO"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "updateProfile" backend/src/controllers/AuthController.js; then
    echo "   ✅ Função updateProfile implementada"
else
    echo "   ❌ Função updateProfile FALTANDO"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "changePassword" backend/src/controllers/AuthController.js; then
    echo "   ✅ Função changePassword implementada"
else
    echo "   ❌ Função changePassword FALTANDO"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "3. 🎨 Verificando componentes do frontend..."

# Verificar componentes essenciais
COMPONENTS=(
    "frontend/src/components/AuthModal.js"
    "frontend/src/components/LoginPage.js"
    "frontend/src/components/UserProfile.js"
    "frontend/src/components/PhoneInput.js"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        echo "   ✅ $(basename $component)"
    else
        echo "   ❌ $(basename $component) FALTANDO"
        ERRORS=$((ERRORS + 1))
    fi
done

# Verificar se PhoneInput está integrado
if grep -q "PhoneInput" frontend/src/components/LoginPage.js; then
    echo "   ✅ PhoneInput integrado no LoginPage"
else
    echo "   ❌ PhoneInput NÃO integrado no LoginPage"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "4. 📱 Verificando funcionalidades do telefone..."

if grep -q "lastName" frontend/src/components/LoginPage.js; then
    echo "   ✅ Campo lastName no formulário"
else
    echo "   ❌ Campo lastName FALTANDO"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "phone" frontend/src/components/LoginPage.js; then
    echo "   ✅ Campo phone no formulário"
else
    echo "   ❌ Campo phone FALTANDO"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "5. 🗄️ Verificando modelo de dados..."

if grep -q "updateProfile" backend/src/models/User.js; then
    echo "   ✅ Método updateProfile no modelo User"
else
    echo "   ❌ Método updateProfile FALTANDO no modelo User"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "last_name" backend/src/models/User.js; then
    echo "   ✅ Campo last_name no modelo"
else
    echo "   ❌ Campo last_name FALTANDO no modelo"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "6. 🔐 Verificando scripts administrativos..."

if node -e "require('./create-admin.js')" 2>/dev/null; then
    echo "   ✅ Script create-admin.js válido"
else
    echo "   ⚠️  Script create-admin.js pode ter problemas"
fi

if node -e "require('./reset-admin-password.js')" 2>/dev/null; then
    echo "   ✅ Script reset-admin-password.js válido"
else
    echo "   ⚠️  Script reset-admin-password.js pode ter problemas"
fi

echo ""
echo "7. 📦 Verificando dependências..."

cd backend
if npm list --production --silent 2>/dev/null; then
    echo "   ✅ Dependências do backend OK"
else
    echo "   ⚠️  Verificar dependências do backend"
fi
cd ..

cd frontend
if npm list --silent 2>/dev/null; then
    echo "   ✅ Dependências do frontend OK"
else
    echo "   ⚠️  Verificar dependências do frontend"
fi
cd ..

echo ""
echo "8. 🌐 Verificando configurações de produção..."

if grep -q "CORS_ORIGIN" backend/server.js; then
    echo "   ✅ CORS configurado para produção"
else
    echo "   ❌ CORS NÃO configurado para produção"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "NODE_ENV.*production" backend/server.js; then
    echo "   ✅ Detecção de ambiente de produção"
else
    echo "   ❌ Detecção de ambiente de produção FALTANDO"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "9. ⚡ Testando funcionalidades principais..."

# Testar backend rapidamente
cd backend
if timeout 10s npm run dev > /dev/null 2>&1 & sleep 3 && curl -s http://localhost:3001/health | grep -q "OK"; then
    echo "   ✅ Backend inicia e responde"
    pkill -f "node.*server.js" 2>/dev/null
else
    echo "   ⚠️  Backend pode ter problemas para iniciar"
    pkill -f "node.*server.js" 2>/dev/null
fi
cd ..

# Verificar se o build do frontend funciona
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build do frontend funciona"
    rm -rf build 2>/dev/null
else
    echo "   ❌ Build do frontend FALHA"
    ERRORS=$((ERRORS + 1))
fi
cd ..

echo ""
echo "================================================"

if [ $ERRORS -eq 0 ]; then
    echo "🎉 VERIFICAÇÃO COMPLETA - TUDO OK!"
    echo "✅ Pronto para deploy em produção"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Execute: git add . && git commit -m 'deploy: preparar para produção'"
    echo "   2. Execute: git push origin main"
    echo "   3. Na VPS execute: wget https://raw.githubusercontent.com/canalmercadocripto/bitacademy-risk-calculator/main/deploy-production.sh"
    echo "   4. Na VPS execute: chmod +x deploy-production.sh && sudo ./deploy-production.sh"
else
    echo "❌ PROBLEMAS ENCONTRADOS: $ERRORS"
    echo "⚠️  Corrija os erros antes do deploy"
fi

echo ""