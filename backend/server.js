require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

// Importar rotas
const exchangeRoutes = require('./src/routes/exchangeRoutes');
const calculatorRoutes = require('./src/routes/calculatorRoutes');
const authRoutes = require('./src/routes/authRoutes');
const tradeRoutes = require('./src/routes/tradeRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Usar SQLite por padrão em desenvolvimento
const dbConfig = process.env.NODE_ENV === 'production' 
  ? './src/config/database' 
  : './src/config/database-sqlite';

const { testConnection } = require(dbConfig);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(compression());

// CORS configurado para produção
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Middleware para IP do cliente
app.use((req, res, next) => {
  req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  next();
});

// Middleware para session ID (usuários anônimos)
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    req.sessionId = req.headers['x-session-id'] || uuidv4();
  }
  next();
});

app.use(express.json());

// Rate limiting - configuração mais flexível para desenvolvimento
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // 1000 em dev, 200 em prod
  message: {
    error: 'Muitas requisições deste IP, tente novamente em alguns minutos.',
    retryAfter: Math.ceil(15 * 60 / 60) + ' minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Reset rate limit para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/reset-rate-limit', (req, res) => {
    // Limpar dados do rate limiter (apenas em desenvolvimento)
    limiter.resetKey(req.ip);
    res.json({ 
      success: true, 
      message: 'Rate limit resetado para este IP',
      ip: req.ip 
    });
  });
}

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Inicializar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Banco de dados: Conectado`);
      console.log(`🔐 Autenticação: Ativa`);
      console.log(`👥 Sistema de usuários: Ativo`);
      console.log(`📈 Tracking de trades: Ativo`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error.message);
    console.log('💡 Execute: npm run setup-db para configurar o banco');
    process.exit(1);
  }
}

startServer();