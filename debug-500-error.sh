#!/bin/bash

echo "🔍 DIAGNÓSTICO DE ERRO 500 - BITACADEMY CALCULATOR"
echo "================================================="

echo ""
echo "1. 📊 Status dos Serviços"
echo "------------------------"

echo "PM2 Status:"
pm2 status

echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager -l | head -10

echo ""
echo "2. 🔍 Logs do Backend (PM2)"
echo "--------------------------"
echo "Últimas 20 linhas dos logs do backend:"
pm2 logs bitacademy-calculator --lines 20

echo ""
echo "3. 🌐 Logs do Nginx"
echo "------------------"
echo "Últimas 10 linhas do log de erro do Nginx:"
tail -10 /var/log/nginx/bitacademy-calculator.error.log 2>/dev/null || echo "Arquivo de log não encontrado"

echo ""
echo "Últimas 5 linhas do log de acesso do Nginx:"
tail -5 /var/log/nginx/bitacademy-calculator.access.log 2>/dev/null || echo "Arquivo de log não encontrado"

echo ""
echo "4. 🧪 Testes de Conectividade"
echo "-----------------------------"

echo "Testando backend diretamente:"
BACKEND_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/health -o /tmp/backend_response.txt)
echo "Status Code: $BACKEND_RESPONSE"
echo "Response: $(cat /tmp/backend_response.txt)"

echo ""
echo "Testando API via Nginx:"
API_RESPONSE=$(curl -s -w "%{http_code}" http://calculadora.bitacademy.vip/api/health -o /tmp/api_response.txt)
echo "Status Code: $API_RESPONSE"
echo "Response: $(cat /tmp/api_response.txt)"

echo ""
echo "Testando frontend:"
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" http://calculadora.bitacademy.vip -o /tmp/frontend_response.txt)
echo "Status Code: $FRONTEND_RESPONSE"
echo "Response (primeiras 200 chars): $(head -c 200 /tmp/frontend_response.txt)"

echo ""
echo "5. 🗄️ Verificação do Banco de Dados"
echo "-----------------------------------"

cd /var/www/bitacademy-calculator/backend 2>/dev/null || cd /var/www/bitacademy-calculator/backend

if [ -f "bitacademy.db" ]; then
    echo "Banco de dados encontrado:"
    ls -la bitacademy.db
    
    echo ""
    echo "Testando conexão com o banco:"
    node -e "
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('bitacademy.db');
    
    db.all('.tables', [], (err, tables) => {
      if (err) {
        console.log('❌ Erro ao conectar:', err.message);
      } else {
        console.log('✅ Conectado ao banco');
      }
      db.close();
    });
    "
    
    echo ""
    echo "Verificando tabelas:"
    sqlite3 bitacademy.db ".tables" 2>/dev/null || echo "❌ Erro ao verificar tabelas"
    
    echo ""
    echo "Contando usuários:"
    sqlite3 bitacademy.db "SELECT COUNT(*) as total_users FROM users;" 2>/dev/null || echo "❌ Tabela users não existe"
    
else
    echo "❌ Banco de dados não encontrado!"
fi

echo ""
echo "6. 📁 Verificação de Arquivos"
echo "-----------------------------"

echo "Estrutura de diretórios:"
if [ -d "/var/www/bitacademy-calculator" ]; then
    echo "✅ Diretório principal existe"
    
    if [ -f "/var/www/bitacademy-calculator/backend/server.js" ]; then
        echo "✅ Backend server.js existe"
    else
        echo "❌ Backend server.js não existe"
    fi
    
    if [ -d "/var/www/bitacademy-calculator/frontend/build" ]; then
        echo "✅ Frontend build existe"
        echo "   Arquivos no build:"
        ls -la /var/www/bitacademy-calculator/frontend/build/ | head -5
    else
        echo "❌ Frontend build não existe"
    fi
    
    if [ -f "/var/www/bitacademy-calculator/backend/.env" ]; then
        echo "✅ Arquivo .env existe"
        echo "   Conteúdo do .env:"
        cat /var/www/bitacademy-calculator/backend/.env
    else
        echo "❌ Arquivo .env não existe"
    fi
    
else
    echo "❌ Diretório principal não existe!"
fi

echo ""
echo "7. 🔧 Configuração do Nginx"
echo "---------------------------"

echo "Configuração ativa:"
if [ -f "/etc/nginx/sites-available/bitacademy-calculator" ]; then
    echo "✅ Configuração existe"
    echo "Testando configuração:"
    nginx -t
    
    echo ""
    echo "Verificando se está ativada:"
    if [ -L "/etc/nginx/sites-enabled/bitacademy-calculator" ]; then
        echo "✅ Configuração ativada"
    else
        echo "❌ Configuração não ativada"
    fi
else
    echo "❌ Configuração não existe"
fi

echo ""
echo "8. 🔧 Tentativa de Correção Rápida"
echo "=================================="

echo "Reiniciando backend..."
pm2 restart bitacademy-calculator 2>/dev/null

echo "Aguardando 5 segundos..."
sleep 5

echo ""
echo "Testando novamente:"
FINAL_TEST=$(curl -s -w "%{http_code}" http://localhost:3001/health -o /tmp/final_test.txt)
echo "Backend Status: $FINAL_TEST"
echo "Response: $(cat /tmp/final_test.txt)"

if [ "$FINAL_TEST" = "200" ]; then
    echo "✅ Backend funcionando!"
    
    echo "Testando via Nginx:"
    NGINX_TEST=$(curl -s -w "%{http_code}" http://calculadora.bitacademy.vip/api/health -o /tmp/nginx_test.txt)
    echo "Nginx Status: $NGINX_TEST"
    echo "Response: $(cat /tmp/nginx_test.txt)"
    
    if [ "$NGINX_TEST" = "200" ]; then
        echo "✅ Tudo funcionando!"
    else
        echo "❌ Problema no Nginx"
    fi
else
    echo "❌ Backend com problemas"
fi

echo ""
echo "9. 📋 Resumo do Diagnóstico"
echo "==========================="

if [ "$FINAL_TEST" = "200" ]; then
    echo "🎉 Status: FUNCIONANDO"
    echo "🌐 Acesse: http://calculadora.bitacademy.vip"
else
    echo "❌ Status: COM PROBLEMAS"
    echo ""
    echo "🔧 Possíveis soluções:"
    echo "   1. Execute: pm2 restart bitacademy-calculator"
    echo "   2. Execute: systemctl restart nginx"
    echo "   3. Verifique: pm2 logs bitacademy-calculator"
    echo "   4. Verifique: tail -f /var/log/nginx/error.log"
    echo "   5. Se persistir, execute o script de atualização forçada"
fi

echo ""
echo "🔍 Para mais detalhes, execute:"
echo "   pm2 logs bitacademy-calculator --lines 50"
echo "   tail -50 /var/log/nginx/error.log"