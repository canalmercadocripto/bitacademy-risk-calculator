#!/bin/bash

# Script de Validação Pós-Atualização
# BitAcademy Risk Calculator

echo "🔍 VALIDAÇÃO PÓS-ATUALIZAÇÃO BITACADEMY"
echo "======================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_DIR="/var/www/bitacademy"
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Função para log
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0

test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        success "$2"
    else
        error "$2"
    fi
}

echo ""
log "🔍 Iniciando validação completa..."

echo ""
echo "1️⃣ VERIFICAÇÃO DE SERVIÇOS"
echo "=========================="

# Verificar PM2
log "Verificando PM2..."
if pm2 list | grep -q "online"; then
    test_result 0 "PM2 está rodando com aplicações online"
else
    test_result 1 "PM2 não tem aplicações online"
fi

# Verificar Nginx
log "Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    test_result 0 "Nginx está ativo"
else
    test_result 1 "Nginx não está ativo"
fi

echo ""
echo "2️⃣ VERIFICAÇÃO DE CONECTIVIDADE"
echo "==============================="

# Verificar backend
log "Testando backend (porta 3001)..."
if curl -s "$BACKEND_URL/health" > /dev/null; then
    test_result 0 "Backend respondendo na porta 3001"
else
    test_result 1 "Backend não está respondendo na porta 3001"
fi

# Verificar frontend
log "Testando frontend (porta 3000)..."
if curl -s "$FRONTEND_URL" > /dev/null; then
    test_result 0 "Frontend respondendo na porta 3000"
else
    test_result 1 "Frontend não está respondendo na porta 3000"
fi

echo ""
echo "3️⃣ VERIFICAÇÃO DO BANCO DE DADOS"
echo "================================"

# Verificar arquivo do banco
log "Verificando arquivo do banco..."
if [ -f "$APP_DIR/backend/bitacademy.db" ]; then
    test_result 0 "Arquivo do banco existe"
else
    test_result 1 "Arquivo do banco não encontrado"
fi

# Verificar estrutura da tabela users
log "Verificando estrutura da tabela users..."
DB_SCHEMA=$(sqlite3 "$APP_DIR/backend/bitacademy.db" ".schema users" 2>/dev/null)
if echo "$DB_SCHEMA" | grep -q "last_name"; then
    test_result 0 "Campo last_name existe na tabela users"
else
    test_result 1 "Campo last_name não encontrado na tabela users"
fi

if echo "$DB_SCHEMA" | grep -q "phone"; then
    test_result 0 "Campo phone existe na tabela users"
else
    test_result 1 "Campo phone não encontrado na tabela users"
fi

echo ""
echo "4️⃣ VERIFICAÇÃO DAS APIS"
echo "======================"

# Verificar endpoint de saúde
log "Testando endpoint /health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health" | grep -o '"status":"OK"' 2>/dev/null)
if [ "$HEALTH_RESPONSE" = '"status":"OK"' ]; then
    test_result 0 "Endpoint /health retorna OK"
else
    test_result 1 "Endpoint /health não está funcionando"
fi

# Verificar endpoint de registro (sem criar usuário)
log "Testando endpoint /api/auth/register (validação)..."
REGISTER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{}')

if [ "$REGISTER_RESPONSE" = "400" ]; then
    test_result 0 "Endpoint /api/auth/register valida campos obrigatórios"
else
    test_result 1 "Endpoint /api/auth/register não está validando (código: $REGISTER_RESPONSE)"
fi

echo ""
echo "5️⃣ TESTE FUNCIONAL COMPLETO"
echo "==========================="

# Teste de registro completo com dados válidos
log "Testando registro completo..."
TEST_EMAIL="test_$(date +%s)@bitacademy-test.com"
FULL_REGISTER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Test\",
        \"lastName\": \"User\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"test123456\",
        \"phone\": \"11999999999\",
        \"countryCode\": \"+55\"
    }")

if [ "$FULL_REGISTER_RESPONSE" = "201" ]; then
    test_result 0 "Registro completo funcionando (usuário criado)"
    
    # Testar login do usuário criado
    log "Testando login do usuário criado..."
    LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"test123456\"
        }")
    
    if [ "$LOGIN_RESPONSE" = "200" ]; then
        test_result 0 "Login do usuário criado funcionando"
    else
        test_result 1 "Login do usuário criado falhou (código: $LOGIN_RESPONSE)"
    fi
    
elif [ "$FULL_REGISTER_RESPONSE" = "409" ]; then
    test_result 0 "Endpoint de registro funcionando (usuário já existe)"
else
    test_result 1 "Registro completo falhou (código: $FULL_REGISTER_RESPONSE)"
fi

echo ""
echo "6️⃣ VERIFICAÇÃO DE ARQUIVOS"
echo "=========================="

# Verificar arquivos importantes
log "Verificando arquivos do projeto..."

IMPORTANT_FILES=(
    "$APP_DIR/backend/server.js"
    "$APP_DIR/backend/src/controllers/AuthController.js"
    "$APP_DIR/backend/src/models/User.js"
    "$APP_DIR/frontend/build/index.html"
    "$APP_DIR/ecosystem.config.js"
)

for file in "${IMPORTANT_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_result 0 "$(basename $file) existe"
    else
        test_result 1 "$(basename $file) não encontrado"
    fi
done

echo ""
echo "7️⃣ VERIFICAÇÃO DE LOGS"
echo "====================="

# Verificar logs de erro recentes
log "Verificando logs recentes..."

# Logs PM2 (últimos 10 minutos)
PM2_ERRORS=$(pm2 logs --lines 50 | grep -i error | tail -5)
if [ -z "$PM2_ERRORS" ]; then
    test_result 0 "Nenhum erro crítico nos logs PM2 recentes"
else
    test_result 1 "Erros encontrados nos logs PM2"
    echo -e "${YELLOW}Últimos erros PM2:${NC}"
    echo "$PM2_ERRORS"
fi

echo ""
echo "📊 RESULTADO FINAL"
echo "=================="

# Calcular porcentagem de sucesso
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
else
    SUCCESS_RATE=0
fi

echo ""
echo -e "${BLUE}Total de testes: ${NC}$TOTAL_TESTS"
echo -e "${GREEN}Testes passou: ${NC}$PASSED_TESTS"
echo -e "${RED}Testes falharam: ${NC}$((TOTAL_TESTS - PASSED_TESTS))"
echo -e "${YELLOW}Taxa de sucesso: ${NC}$SUCCESS_RATE%"

echo ""
if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 ATUALIZAÇÃO BEM-SUCEDIDA!${NC}"
    echo -e "${GREEN}✅ Sistema funcionando corretamente${NC}"
    echo ""
    echo -e "${BLUE}🆕 Novas funcionalidades disponíveis:${NC}"
    echo "📝 Formulário de registro completo"
    echo "🔍 Validação de todos os campos obrigatórios"
    echo "📱 Campo telefone com código do país"
    echo "💾 Banco de dados atualizado"
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️ ATUALIZAÇÃO PARCIALMENTE BEM-SUCEDIDA${NC}"
    echo -e "${YELLOW}Alguns testes falharam, mas funcionalidades principais funcionam${NC}"
    echo -e "${YELLOW}Recomenda-se investigar os erros${NC}"
else
    echo -e "${RED}❌ ATUALIZAÇÃO COM PROBLEMAS${NC}"
    echo -e "${RED}Muitos testes falharam${NC}"
    echo -e "${RED}🚨 CONSIDERE FAZER ROLLBACK${NC}"
    echo ""
    echo -e "${YELLOW}Para fazer rollback:${NC}"
    echo "sudo ./rollback-production.sh"
fi

echo ""
echo -e "${BLUE}📋 Comandos úteis para monitoramento:${NC}"
echo "pm2 status                    # Status das aplicações"
echo "pm2 logs                      # Ver logs em tempo real"
echo "pm2 restart all               # Reiniciar aplicações"
echo "systemctl status nginx        # Status do nginx"
echo "curl -I $BACKEND_URL/health   # Testar backend"
echo ""

# Salvar relatório
REPORT_FILE="/tmp/bitacademy_validation_$(date +%Y%m%d_%H%M%S).log"
{
    echo "RELATÓRIO DE VALIDAÇÃO BITACADEMY"
    echo "Data: $(date)"
    echo "Taxa de sucesso: $SUCCESS_RATE% ($PASSED_TESTS/$TOTAL_TESTS)"
    echo ""
    echo "Testes executados:"
    echo "- Verificação de serviços (PM2, Nginx)"
    echo "- Conectividade (Backend, Frontend)"
    echo "- Banco de dados (estrutura, campos)"
    echo "- APIs (health, auth/register, auth/login)"
    echo "- Teste funcional completo"
    echo "- Verificação de arquivos"
    echo "- Análise de logs"
    echo ""
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo "STATUS: SUCESSO ✅"
    elif [ $SUCCESS_RATE -ge 70 ]; then
        echo "STATUS: SUCESSO PARCIAL ⚠️"
    else
        echo "STATUS: PROBLEMAS ❌"
    fi
} > "$REPORT_FILE"

echo -e "${GREEN}📄 Relatório salvo em: $REPORT_FILE${NC}"

exit $((TOTAL_TESTS - PASSED_TESTS))