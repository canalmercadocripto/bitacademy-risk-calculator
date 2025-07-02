#!/bin/bash

echo "🚀 Setup Automatizado: Vercel + Supabase"
echo "========================================"

echo ""
echo "📋 PASSO 1: Integração Vercel + Supabase"
echo "1. Acesse: https://vercel.com/dashboard"
echo "2. Vá no seu projeto → Storage → Connect Store"
echo "3. Escolha 'Supabase' → Add Integration"
echo "4. Autorize a conexão (cria projeto automaticamente)"
echo ""
echo "⏳ Pressione ENTER quando terminar a integração..."
read

echo ""
echo "📋 PASSO 2: SQL das Tabelas"
echo "Vou abrir o SQL que você precisa executar..."
echo ""

# Criar arquivo SQL temporário para facilitar
cat > /tmp/supabase-tables.sql << 'EOF'
-- Executar no SQL Editor do Supabase

-- Tabela de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Tabela de trades/cálculos
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  account_size DECIMAL(15,2) NOT NULL,
  risk_percentage DECIMAL(5,2) NOT NULL,
  entry_price DECIMAL(15,8) NOT NULL,
  stop_loss DECIMAL(15,8),
  take_profit DECIMAL(15,8),
  position_size DECIMAL(15,8) NOT NULL,
  risk_amount DECIMAL(15,2) NOT NULL,
  reward_amount DECIMAL(15,2) NOT NULL,
  risk_reward_ratio DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(15,8),
  trade_type VARCHAR(10) DEFAULT 'long',
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações do sistema
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações do usuário
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, setting_key)
);

-- Tabela de logs de atividades
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso via service_role
CREATE POLICY "Enable all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON trades FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON system_settings FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON user_settings FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON activity_logs FOR ALL USING (true);
EOF

echo "📁 SQL criado em: /tmp/supabase-tables.sql"
echo ""
echo "🔗 Agora execute:"
echo "1. Acesse o projeto Supabase criado pela integração"
echo "2. Vá em SQL Editor"
echo "3. Cole e execute o SQL acima"
echo ""
echo "⏳ Pressione ENTER quando terminar de executar o SQL..."
read

echo ""
echo "📋 PASSO 3: Configurar JWT_SECRET no Vercel"
echo "Ainda precisamos adicionar uma variável:"
echo ""
echo "1. Vercel → Seu Projeto → Settings → Environment Variables"
echo "2. Adicione:"
echo "   Nome: JWT_SECRET"
echo "   Valor: BitAcademySecureKey2025\$Production#Calculator!Risk@Management"
echo ""
echo "⏳ Pressione ENTER quando terminar..."
read

echo ""
echo "📋 PASSO 4: Redeploy e Setup Inicial"
echo "Vamos forçar um redeploy com as novas variáveis..."

# Verificar se tem vercel CLI
if command -v vercel &> /dev/null; then
    echo "🚀 Fazendo redeploy..."
    vercel --prod --yes 2>/dev/null || echo "⚠️ Faça redeploy manual no dashboard"
else
    echo "⚠️ Faça redeploy manual: Vercel → Deployments → Redeploy"
fi

echo ""
echo "📋 PASSO 5: Executar Setup dos Dados"
echo "Após o deploy, acesse uma vez:"
echo "https://SEU_PROJETO.vercel.app/api/setup"
echo ""

echo "✅ SETUP COMPLETO!"
echo "📧 Admin: admin@bitacademy.com / Admin123456!"
echo "📧 Teste: teste@bitacademy.com / teste123"
echo ""
echo "🎉 Sistema funcionando com Supabase!"