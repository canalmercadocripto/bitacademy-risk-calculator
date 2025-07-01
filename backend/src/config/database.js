const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'bitacademy',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bitacademy_calculator',
  password: process.env.DB_PASSWORD || 'bitacademy123',
  port: process.env.DB_PORT || 5432,
  // Configurações para produção
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Função para testar conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL');
    client.release();
  } catch (err) {
    console.error('❌ Erro ao conectar PostgreSQL:', err.message);
    // Em desenvolvimento, criar banco automaticamente se não existir
    if (process.env.NODE_ENV !== 'production') {
      console.log('💡 Execute: npm run setup-db para criar o banco');
    }
  }
};

// Função para executar queries
const query = async (text, params) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executada:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (err) {
    console.error('❌ Erro na query:', err.message);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};