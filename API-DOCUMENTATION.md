# 📚 API Documentation - Sistema de Usuários e Analytics

## 🔐 Autenticação

### Registrar Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123",
  "name": "Nome do Usuário"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

### Verificar Token Atual
```http
GET /api/auth/me
Authorization: Bearer jwt_token_here
```

### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer jwt_token_here
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer jwt_token_here
```

## 📊 Trades e Histórico

### Salvar Cálculo de Trade
```http
POST /api/trades/calculate
Authorization: Bearer jwt_token_here (opcional)
Content-Type: application/json

{
  "exchange": "binance",
  "symbol": "BTCUSDT",
  "direction": "LONG",
  "entryPrice": 45000,
  "stopLoss": 44000,
  "targetPrice": 47000,
  "accountSize": 10000,
  "riskPercent": 2,
  "positionSize": 0.4444,
  "riskAmount": 200,
  "rewardAmount": 400,
  "riskRewardRatio": 2,
  "currentPrice": 45100,
  "calculationData": {
    "smartTargets": [46000, 47000, 48000],
    "winRate": 65
  }
}
```

**Nota:** Esta rota funciona com ou sem autenticação. Usuários anônimos têm seus trades salvos por session ID.

### Buscar Histórico do Usuário
```http
GET /api/trades/history?page=1&limit=20
Authorization: Bearer jwt_token_here
```

### Buscar Estatísticas do Usuário
```http
GET /api/trades/stats
Authorization: Bearer jwt_token_here
```

### Buscar Histórico de Sessão Anônima
```http
GET /api/trades/session/{sessionId}?page=1&limit=20
```

## 👨‍💼 Painel Administrativo

**Todas as rotas requerem token de admin:**
```
Authorization: Bearer jwt_token_admin
```

### Dashboard Principal
```http
GET /api/admin/dashboard
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "users": {
        "total_users": 150,
        "total_admins": 2,
        "active_week": 45,
        "active_month": 120,
        "new_week": 12
      },
      "trades": {
        "total_trades": 1250,
        "active_users": 89,
        "exchanges_used": 4,
        "symbols_traded": 45,
        "avg_risk_percent": 2.5,
        "total_risk_volume": 125000
      }
    },
    "exchanges": [
      {
        "exchange": "binance",
        "trade_count": 500,
        "unique_users": 45,
        "avg_risk": 2.3,
        "total_volume": 50000
      }
    ],
    "topSymbols": [
      {
        "symbol": "BTCUSDT",
        "exchange": "binance",
        "trade_count": 200,
        "unique_users": 35
      }
    ],
    "dailyActivity": [
      {
        "date": "2024-01-15",
        "trades": 45,
        "active_users": 12,
        "volume": 2500
      }
    ]
  }
}
```

### Listar Usuários
```http
GET /api/admin/users?page=1&limit=50
```

### Detalhes de Usuário
```http
GET /api/admin/users/{userId}
```

### Ativar/Desativar Usuário
```http
PATCH /api/admin/users/{userId}/status
Content-Type: application/json

{
  "active": false
}
```

### Listar Todos os Trades
```http
GET /api/admin/trades?page=1&limit=50&exchange=binance&symbol=BTCUSDT&userId=uuid&startDate=2024-01-01&endDate=2024-01-31
```

### Relatório de Atividade
```http
GET /api/admin/reports/activity?days=30
```

### Atividades dos Usuários (Logs)
```http
GET /api/admin/activities?page=1&limit=50&userId=uuid
```

### Estatísticas em Tempo Real
```http
GET /api/admin/stats/realtime
```

## 🔧 Headers Importantes

### Para Usuários Autenticados
```
Authorization: Bearer jwt_token_here
Content-Type: application/json
```

### Para Usuários Anônimos
```
X-Session-ID: session_uuid_here
Content-Type: application/json
```

## 📋 Códigos de Status

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Dados inválidos
- **401** - Não autenticado
- **403** - Sem permissão
- **404** - Não encontrado
- **409** - Conflito (ex: email já existe)
- **500** - Erro interno do servidor

## 🗄️ Configuração do Banco

### Instalar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Configurar usuário e banco
sudo -u postgres createuser --createdb bitacademy
sudo -u postgres createdb bitacademy_calculator
sudo -u postgres psql -c "ALTER USER bitacademy PASSWORD 'bitacademy123';"
```

### Configurar Banco na Aplicação
```bash
cd backend
npm run setup-db
```

## 🔐 Variáveis de Ambiente

Criar arquivo `backend/.env`:
```bash
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitacademy_calculator
DB_USER=bitacademy
DB_PASSWORD=bitacademy123

# JWT
JWT_SECRET=sua-chave-secreta-muito-forte

# CORS
CORS_ORIGIN=http://localhost:3000,https://calculadora.bitacademy.vip

# Servidor
PORT=3001
NODE_ENV=development
```

## 🚀 Inicialização

### Backend
```bash
cd backend
npm install
npm run setup-db  # Primeira vez apenas
npm run dev       # Desenvolvimento
npm start         # Produção
```

### Admin Padrão
Após setup do banco, será criado:
- **Email:** admin@bitacademy.vip
- **Senha:** admin123
- **⚠️ ALTERE A SENHA EM PRODUÇÃO!**

## 📊 Estrutura dos Dados

### Trade History (Imutável)
```json
{
  "id": "uuid",
  "user_id": "uuid", // null para anônimos
  "session_id": "uuid", // para anônimos
  "exchange": "binance",
  "symbol": "BTCUSDT",
  "direction": "LONG",
  "entry_price": 45000,
  "stop_loss": 44000,
  "target_price": 47000,
  "account_size": 10000,
  "risk_percent": 2,
  "position_size": 0.4444,
  "risk_amount": 200,
  "reward_amount": 400,
  "risk_reward_ratio": 2,
  "current_price": 45100,
  "calculation_data": {}, // JSON com dados extras
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### User
```json
{
  "id": "uuid",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "role": "user", // ou "admin"
  "is_active": true,
  "last_login": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-10T08:00:00Z"
}
```

## 💡 Recursos Especiais

### ✅ Tracking Automático
- Todos os cálculos são salvos automaticamente
- Usuários anônimos: por session ID
- Usuários logados: por user ID
- Histórico **imutável** - dados nunca são deletados

### ✅ Analytics Avançados
- Dashboard em tempo real
- Métricas por exchange
- Símbolos mais tradados
- Atividade diária/semanal/mensal
- Logs completos de atividade

### ✅ Segurança
- JWT com expiração
- Rate limiting
- Logs de atividade
- IPs e User-Agents registrados
- Senhas hasheadas com bcrypt

### ✅ Flexibilidade
- Funciona com e sem autenticação
- Session tracking para anônimos
- Filtros avançados nos relatórios
- Paginação em todas as listagens