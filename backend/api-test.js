const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Carregar middleware de autenticação
const { authenticateToken, requireAdmin } = require('./src/middleware/auth');

// Carregar controllers
const AdminController = require('./src/controllers/AdminController');
const TradeController = require('./src/controllers/TradeController');

// Middleware para simular usuário admin logado
const mockAdminAuth = (req, res, next) => {
  req.user = {
    userId: '82edd1ef667e7734919bcbca88a70b7c', // ID do admin
    email: 'admin@bitacademy.vip',
    role: 'admin'
  };
  next();
};

// Middleware para simular usuário comum logado
const mockUserAuth = (req, res, next) => {
  req.user = {
    userId: 'frontend@test.com', // ID do usuário com trades
    email: 'frontend@test.com',
    role: 'user'
  };
  next();
};

// Rotas de teste para admin
app.get('/test/admin/dashboard', mockAdminAuth, AdminController.getDashboard);
app.get('/test/admin/trades', mockAdminAuth, AdminController.getAllTrades);
app.get('/test/admin/reports/activity', mockAdminAuth, AdminController.getActivityReport);
app.get('/test/admin/stats/realtime', mockAdminAuth, AdminController.getRealtimeStats);
app.get('/test/admin/activities', mockAdminAuth, AdminController.getUserActivities);

// Rotas de teste para usuário
app.get('/test/trades/history', mockUserAuth, TradeController.getUserHistory);
app.get('/test/trades/stats', mockUserAuth, TradeController.getUserStats);

// Rota de status geral
app.get('/test/status', async (req, res) => {
  try {
    const { query } = require('./src/config/database-sqlite');
    
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM trade_history) as total_trades,
        (SELECT COUNT(*) FROM user_activities) as total_activities,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
        (SELECT COUNT(*) FROM trade_history WHERE user_id IS NOT NULL) as user_trades,
        (SELECT COUNT(DISTINCT exchange) FROM trade_history) as total_exchanges
    `);
    
    res.json({
      status: 'OK',
      database: stats.rows[0],
      endpoints: {
        admin: [
          'GET /test/admin/dashboard',
          'GET /test/admin/trades',
          'GET /test/admin/reports/activity',
          'GET /test/admin/stats/realtime',
          'GET /test/admin/activities'
        ],
        user: [
          'GET /test/trades/history',
          'GET /test/trades/stats'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3003;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste API rodando na porta ${PORT}`);
  console.log(`📋 Endpoints disponíveis:`);
  console.log(`   - GET http://localhost:${PORT}/test/status`);
  console.log(`   - GET http://localhost:${PORT}/test/admin/dashboard`);
  console.log(`   - GET http://localhost:${PORT}/test/admin/trades`);
  console.log(`   - GET http://localhost:${PORT}/test/admin/reports/activity`);
  console.log(`   - GET http://localhost:${PORT}/test/admin/stats/realtime`);
  console.log(`   - GET http://localhost:${PORT}/test/trades/history`);
  console.log(`   - GET http://localhost:${PORT}/test/trades/stats`);
});

// Testes automatizados
async function runTests() {
  const http = require('http');
  const endpoints = [
    '/test/status',
    '/test/admin/dashboard',
    '/test/admin/trades',
    '/test/admin/reports/activity',
    '/test/admin/stats/realtime',
    '/test/trades/history',
    '/test/trades/stats'
  ];
  
  console.log('\n🧪 Executando testes dos endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${PORT}${endpoint}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.success !== false) {
                console.log(`✅ ${endpoint} - OK`);
                if (endpoint === '/test/status') {
                  console.log(`   Database: ${JSON.stringify(result.database)}`);
                } else if (result.data) {
                  console.log(`   Data keys: ${Object.keys(result.data).join(', ')}`);
                }
              } else {
                console.log(`❌ ${endpoint} - Error: ${result.message}`);
              }
              resolve();
            } catch (e) {
              console.log(`❌ ${endpoint} - Invalid JSON response`);
              resolve();
            }
          });
        });
        
        req.on('error', (err) => {
          console.log(`❌ ${endpoint} - Request failed: ${err.message}`);
          resolve();
        });
        
        req.setTimeout(5000, () => {
          console.log(`⏰ ${endpoint} - Timeout`);
          req.destroy();
          resolve();
        });
      });
    } catch (error) {
      console.log(`❌ ${endpoint} - Exception: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Testes concluídos!');
  server.close();
}

// Executar testes após 2 segundos
setTimeout(runTests, 2000);