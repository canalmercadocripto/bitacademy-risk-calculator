# 🚀 BitAcademy Calculadora de Risco - Sistema Completo

Sistema completo de calculadora de gerenciamento de risco para trading de criptomoedas com frontend React e backend Node.js.

## ✨ Funcionalidades

### 🔒 **ACESSO RESTRITO - LOGIN OBRIGATÓRIO**
- **Calculadora protegida:** Acesso apenas com login
- **Controle por perfil:** Admin vs Usuário
- **Sessões seguras:** JWT com expiração

### 🧮 Calculadora de Risk Management (Usuários)
- Cálculo automático de tamanho de posição
- Análise de risk/reward ratio
- Suporte a operações LONG e SHORT
- Múltiplos cenários de análise
- Validação inteligente de dados
- **Histórico pessoal de trades**

### 👑 **Painel Administrativo Completo (Admin)**
- **Dashboard com métricas avançadas**
- **Gestão completa de usuários**
- **Estatísticas de uso por corretora**
- **Monitoramento de trades em tempo real**
- **Relatórios de performance**
- **Controle de atividades**

#### 📊 Métricas Administrativas:
- Total de usuários e trades
- Volume de capital sob gestão
- Exchanges mais utilizadas
- Estatísticas por usuário individual
- Histórico completo de todas as operações
- Atividade em tempo real

### 🔐 Sistema de Autenticação
- Registro e login de usuários
- Autenticação JWT
- Gestão de sessões
- Proteção de rotas por perfil
- **Middleware de autorização**

### 📊 Tracking de Trades
- Histórico completo de cálculos
- Estatísticas de performance
- Dados por exchange e símbolo
- **Dashboard personalizado por usuário**
- **Visão global para administradores**

### 🌐 Integração com Exchanges
- Suporte a múltiplas exchanges (Binance, Bybit, BingX, Bitget)
- Preços em tempo real
- Seleção de pares de trading
- Atualização automática

## 🏗️ Arquitetura

```
calculator_bitacademy/
├── frontend/                 # React App (Porta 3000)
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/          # Custom Hooks
│   │   ├── services/       # APIs e Serviços
│   │   └── styles/         # CSS Styles
│   └── package.json
├── backend/                 # Node.js API (Porta 3001)
│   ├── src/
│   │   ├── controllers/    # Controladores
│   │   ├── models/         # Modelos de Dados
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   ├── services/       # Serviços
│   │   └── config/         # Configurações
│   ├── bitacademy.db       # Banco SQLite
│   └── package.json
├── start-local.sh          # Script de inicialização
├── stop-local.sh           # Script para parar
└── README-LOCAL.md         # Este arquivo
```

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 16+ 
- npm 8+
- 4GB RAM disponível
- Portas 3000 e 3001 livres

### Instalação e Execução

1. **Iniciar o sistema completo:**
   ```bash
   ./start-local.sh
   ```

2. **Acessar a aplicação:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

3. **Login administrativo:**
   - Email: `admin@bitacademy.vip`
   - Senha: `admin123`

4. **Parar o sistema:**
   ```bash
   ./stop-local.sh
   ```

## 📋 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/logout` - Logout

### Calculadora
- `POST /api/calculator/calculate` - Calcular risk management
- `POST /api/calculator/scenarios` - Múltiplos cenários
- `GET /api/calculator/info` - Informações da calculadora

### Trades
- `POST /api/trades/calculate` - Salvar cálculo
- `GET /api/trades/history` - Histórico do usuário
- `GET /api/trades/stats` - Estatísticas

### Exchanges
- `GET /api/exchanges` - Listar exchanges
- `GET /api/exchanges/:id/symbols` - Símbolos da exchange
- `GET /api/exchanges/:id/price/:symbol` - Preço atual

### Administração
- `GET /api/admin/users` - Listar usuários
- `GET /api/admin/dashboard` - Dashboard
- `GET /api/admin/trades` - Todos os trades

## 🔧 Configuração

### Variáveis de Ambiente (Backend)

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=bitacademy-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Configuração do Frontend

O frontend está configurado com proxy automático para o backend na porta 3001.

### Banco de Dados

- **Desenvolvimento:** SQLite (`backend/bitacademy.db`)
- **Produção:** PostgreSQL (configurar variáveis de ambiente)

## 📊 Exemplos de Uso

### Calcular Risk Management

```bash
curl -X POST http://localhost:3001/api/calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "entryPrice": 50000,
    "stopLoss": 49000,
    "targetPrice": 52000,
    "accountSize": 10000,
    "riskPercent": 2,
    "direction": "long"
  }'
```

### Registrar Usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

### Salvar Trade (com autenticação)

```bash
curl -X POST http://localhost:3001/api/trades/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "exchange": "binance",
    "symbol": "BTCUSDT",
    "direction": "long",
    "entryPrice": 45000,
    "stopLoss": 44000,
    "targetPrice": 47000,
    "accountSize": 5000,
    "riskPercent": 1.5
  }'
```

## 🛠️ Desenvolvimento

### Estrutura de Desenvolvimento

```bash
# Backend (Porta 3001)
cd backend
npm install
npm run dev

# Frontend (Porta 3000)
cd frontend
npm install
npm start
```

### Scripts Úteis

```bash
# Logs em tempo real
tail -f backend.log
tail -f frontend.log

# Testar API
curl http://localhost:3001/health

# Reset do banco
rm backend/bitacademy.db
cd backend && node setup-database-sqlite.js
```

## 🔐 Segurança

- Autenticação JWT com expiração
- Rate limiting (100 req/15min por IP)
- Validação de entrada
- Headers de segurança
- CORS configurado
- Senhas hasheadas com bcrypt

## 📈 Performance

- Compressão gzip ativada
- Caching de responses
- Queries otimizadas
- Bundle otimizado do React
- Lazy loading de componentes

## 🐛 Troubleshooting

### Problemas Comuns

1. **Porta em uso:**
   ```bash
   ./stop-local.sh
   ./start-local.sh
   ```

2. **Erro de banco:**
   ```bash
   cd backend
   rm bitacademy.db
   node setup-database-sqlite.js
   ```

3. **Dependências:**
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```

### Logs

- Backend: `backend.log`
- Frontend: `frontend.log`
- Banco: Logs no console durante setup

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs em `backend.log` e `frontend.log`
2. Testar health checks:
   - Backend: http://localhost:3001/health
   - Frontend: http://localhost:3000
3. Reiniciar sistema: `./stop-local.sh && ./start-local.sh`

## 🎯 Recursos Avançados

- **Temas:** Modo claro/escuro
- **Responsivo:** Mobile-friendly
- **PWA Ready:** Pode ser instalado como app
- **Real-time:** Preços atualizados automaticamente
- **Export:** Dados em CSV/PDF
- **Multi-idioma:** Preparado para i18n

---

## 🚀 Sistema Pronto!

O sistema está 100% funcional e pronto para uso em ambiente local de desenvolvimento e testes.

**Acesse agora:** http://localhost:3000

*Desenvolvido com ❤️ para a comunidade BitAcademy*