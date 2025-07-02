# 🚀 Setup Supabase - BitAcademy Risk Calculator

## 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. **Create new project**
3. **Nome:** `bitacademy-calculator`
4. **Password:** (anote esta senha)
5. **Region:** South America (São Paulo)

## 2. Criar Tabelas

Vá em **SQL Editor** e execute este script:

```sql
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
```

## 3. Configurar Variáveis no Vercel

**Settings → Environment Variables:**

```bash
SUPABASE_URL=https://SEU_PROJETO_ID.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
JWT_SECRET=BitAcademySecureKey2025$Production#Calculator!Risk@Management
NODE_ENV=production
```

**🔑 Onde encontrar as chaves:**
- **Project Settings → API**
- `Project URL` = SUPABASE_URL
- `anon public` = SUPABASE_ANON_KEY

## 4. Executar Setup Inicial

Após deploy, acesse uma vez:
```
https://SEU_PROJETO.vercel.app/api/setup
```

## 5. Credenciais Criadas

- **Admin:** admin@bitacademy.com / Admin123456!
- **Teste:** teste@bitacademy.com / teste123

## 🎯 Vantagens do Supabase

✅ **Gratuito até 500MB**  
✅ **PostgreSQL completo**  
✅ **Realtime subscriptions**  
✅ **Dashboard visual**  
✅ **Backup automático**  
✅ **APIs REST automáticas**  

## 🔧 Verificação

Teste o sistema:
1. Faça login
2. Calcule um trade  
3. Verifique se salvou
4. Acesse Analytics
5. Teste gestão de usuários

**Sistema pronto! 🎉**