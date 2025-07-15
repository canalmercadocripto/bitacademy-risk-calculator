require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rotas
const authRoutes = require('./src/routes/authRoutes');
const calculatorRoutes = require('./src/routes/calculatorRoutes');
const tradeRoutes = require('./src/routes/tradeRoutes');

// SEMPRE usar SQLite para simplicidade
const { testConnection } = require('./src/config/database-sqlite');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS permissivo para Railway
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend (para Railway)
app.use(express.static(path.join(__dirname, '../build')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BitAcademy Calculator API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/trades', tradeRoutes);

// Fallback para React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro na aplicação:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: error.message 
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log('✅ Banco de dados conectado');
    } else {
      console.warn('⚠️ Problemas na conexão do banco');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Acesse: http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();