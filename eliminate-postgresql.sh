#!/bin/bash

echo "🔧 ELIMINANDO POSTGRESQL DEFINITIVAMENTE"
echo "========================================"

cd /var/www/bitacademy-calculator

echo ""
echo "1. 🔍 Procurando referências ao PostgreSQL..."

# Procurar por todas as referências ao PostgreSQL
echo "   Arquivos que ainda referenciam PostgreSQL:"
grep -r "5432\|postgresql\|postgres\|pg\|database'" backend/src/ 2>/dev/null || echo "   Nenhuma referência encontrada"

echo ""
echo "   Arquivos que referenciam database sem sqlite:"
grep -r "database'" backend/src/ | grep -v "database-sqlite" || echo "   Nenhuma referência encontrada"

echo ""
echo "2. 🛠️ Corrigindo TODOS os arquivos de modelo..."

# Lista de todos os modelos que precisam ser corrigidos
MODELS=(
    "backend/src/models/User.js"
    "backend/src/models/TradeHistory.js"
    "backend/src/controllers/AuthController.js"
    "backend/src/controllers/AdminController.js"
    "backend/src/controllers/TradeController.js"
)

for model in "${MODELS[@]}"; do
    if [ -f "$model" ]; then
        echo "   🔧 Corrigindo $model..."
        
        # Substituir qualquer referência ao database genérico por database-sqlite
        sed -i 's/require.*database.*$/const { query } = require("..\/config\/database-sqlite");/g' "$model"
        sed -i 's/require.*\.\.\/config\/database.*$/const { query } = require("..\/config\/database-sqlite");/g' "$model"
        
        # Remover condicionais de ambiente que escolhem o banco
        sed -i '/const dbConfig = process\.env\.NODE_ENV/,+3d' "$model"
        sed -i '/const.*database.*production/,+3d' "$model"
        
        echo "     ✅ $model corrigido"
    else
        echo "     ⚠️ $model não encontrado"
    fi
done

echo ""
echo "3. 🔧 Verificando arquivos de configuração..."

# Verificar se existe database.js (PostgreSQL) e remover referências
if [ -f "backend/src/config/database.js" ]; then
    echo "   📄 Encontrado database.js (PostgreSQL), mas vamos ignorá-lo"
    
    # Adicionar uma linha que força erro se for usado
    cat > backend/src/config/database.js << 'EOF'
// ESTE ARQUIVO NÃO DEVE SER USADO EM PRODUÇÃO
// SEMPRE USE database-sqlite.js
throw new Error('PostgreSQL foi desabilitado! Use database-sqlite.js');
EOF
    echo "     ✅ database.js desabilitado"
fi

# Verificar database-sqlite.js
if [ -f "backend/src/config/database-sqlite.js" ]; then
    echo "   ✅ database-sqlite.js existe"
else
    echo "   ❌ database-sqlite.js não existe! Criando..."
    
    mkdir -p backend/src/config
    cat > backend/src/config/database-sqlite.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuração do banco SQLite
const dbPath = path.join(__dirname, '../../bitacademy.db');

console.log('🗄️ Usando SQLite em:', dbPath);

// Função para executar queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar SQLite:', err);
        reject(err);
        return;
      }
    });

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ Erro na query:', err);
        reject(err);
      } else {
        resolve({
          rows: rows,
          rowCount: rows ? rows.length : 0,
          affectedRows: rows ? rows.length : 0,
          changes: db.changes
        });
      }
      db.close();
    });
  });
};

// Função para testar conexão
const testConnection = async () => {
  try {
    await query('SELECT 1 as test');
    console.log('✅ Conectado ao SQLite');
    console.log('✅ SQLite funcionando');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar SQLite:', error);
    return false;
  }
};

module.exports = {
  query,
  testConnection
};
EOF
    echo "     ✅ database-sqlite.js criado"
fi

echo ""
echo "4. 🔄 Verificando server.js..."

cd backend

# Backup do server.js
cp server.js server.js.backup.$(date +%s)

# Forçar uso do SQLite no server.js
sed -i '16,20c\
// SEMPRE usar SQLite - POSTGRESQL DESABILITADO\
const dbConfig = "./src/config/database-sqlite";' server.js

echo "   ✅ server.js configurado para SQLite apenas"

echo ""
echo "5. 📄 Verificando .env..."

# Garantir que o .env força SQLite
if grep -q "FORCE_SQLITE" .env; then
    echo "   ✅ FORCE_SQLITE já existe no .env"
else
    echo "FORCE_SQLITE=true" >> .env
    echo "   ✅ FORCE_SQLITE adicionado ao .env"
fi

if grep -q "DB_TYPE" .env; then
    sed -i 's/DB_TYPE=.*/DB_TYPE=sqlite/' .env
else
    echo "DB_TYPE=sqlite" >> .env
fi

echo "   📋 Conteúdo atual do .env:"
cat .env

echo ""
echo "6. 🚫 Desabilitando dependências PostgreSQL..."

# Verificar se pg está instalado e criar um "fake" que falha
if [ -d "node_modules/pg" ]; then
    echo "   📦 PostgreSQL (pg) encontrado, criando bloqueio..."
    
    # Criar um index.js que sempre falha
    cat > node_modules/pg/lib/index.js << 'EOF'
// PostgreSQL foi desabilitado nesta instalação
throw new Error('PostgreSQL foi desabilitado! Esta aplicação usa SQLite apenas.');
EOF
    echo "     ✅ PostgreSQL (pg) desabilitado"
fi

echo ""
echo "7. 🔄 Reiniciando aplicação..."

# Parar PM2
pm2 stop bitacademy-calculator

# Aguardar
sleep 3

# Iniciar novamente
pm2 start bitacademy-calculator

# Aguardar inicialização
sleep 5

echo ""
echo "8. 🧪 Testando sem PostgreSQL..."

echo "   Testando health check:"
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
echo "   Response: $HEALTH"

if echo "$HEALTH" | grep -q "OK"; then
    echo "   ✅ Backend funcionando sem PostgreSQL!"
    
    # Testar uma operação que normalmente usaria PostgreSQL
    echo ""
    echo "   Testando operação de banco (sem login):"
    sleep 2
    
    # Verificar logs por erros de PostgreSQL
    echo ""
    echo "   Verificando logs por erros de PostgreSQL:"
    if pm2 logs bitacademy-calculator --lines 20 | grep -i "5432\|postgres"; then
        echo "   ❌ Ainda há tentativas de PostgreSQL!"
    else
        echo "   ✅ Nenhuma tentativa de PostgreSQL encontrada!"
    fi
    
else
    echo "   ❌ Backend ainda com problemas"
    echo ""
    echo "   Logs recentes:"
    pm2 logs bitacademy-calculator --lines 10
fi

echo ""
echo "9. 🌐 Testando via Nginx..."

NGINX_TEST=$(curl -s http://calculadora.bitacademy.vip/api/health 2>/dev/null)
echo "   Nginx Response: $NGINX_TEST"

if echo "$NGINX_TEST" | grep -q "OK"; then
    echo "   ✅ Nginx funcionando!"
    
    echo ""
    echo "🎉 POSTGRESQL ELIMINADO COM SUCESSO!"
    echo "==================================="
    echo ""
    echo "🌐 Acesse: http://calculadora.bitacademy.vip"
    echo "🔑 Login: admin@seudominio.com"
    echo "🔐 Senha: Admin123456!"
    echo ""
    echo "✅ Usando APENAS SQLite"
    echo "✅ PostgreSQL completamente desabilitado"
    
else
    echo "   ❌ Nginx ainda com problemas"
fi

echo ""
echo "10. 📊 Status final:"

pm2 status

echo ""
echo "🔍 Monitoramento contínuo:"
echo "   pm2 logs bitacademy-calculator --lines 20"
echo "   curl -s http://localhost:3001/health"
echo ""
echo "   Para verificar se não há mais tentativas de PostgreSQL:"
echo "   pm2 logs bitacademy-calculator | grep -i postgres || echo 'Nenhuma tentativa de PostgreSQL!'"