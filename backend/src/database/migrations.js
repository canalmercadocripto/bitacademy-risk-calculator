// Usar SQLite por padrão em desenvolvimento
const dbConfig = process.env.NODE_ENV === 'production' 
  ? '../config/database' 
  : '../config/database-sqlite';

const { query } = require(dbConfig);

// Migrations para criar tabelas
const createTables = async () => {
  try {
    console.log('🔧 Criando tabelas do banco...');

    // Tabela de usuários
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de sessões/tokens
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de histórico de trades (imutável)
    await query(`
      CREATE TABLE IF NOT EXISTS trade_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(255),
        exchange VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        direction VARCHAR(10) NOT NULL,
        entry_price DECIMAL(20,8) NOT NULL,
        stop_loss DECIMAL(20,8),
        target_price DECIMAL(20,8),
        account_size DECIMAL(20,2) NOT NULL,
        risk_percent DECIMAL(5,2) NOT NULL,
        position_size DECIMAL(20,8),
        risk_amount DECIMAL(20,2),
        reward_amount DECIMAL(20,2),
        risk_reward_ratio DECIMAL(10,2),
        current_price DECIMAL(20,8),
        calculation_data JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de atividades dos usuários
    await query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para performance
    await query(`CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON trade_history(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trade_history_exchange ON trade_history(exchange)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trade_history_symbol ON trade_history(symbol)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`);

    console.log('✅ Tabelas criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    throw error;
  }
};

// Função para criar usuário admin padrão
const createDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcrypt');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bitacademy.vip';
    const adminPassword = process.env.ADMIN_PASSWORD || require('crypto').randomBytes(16).toString('hex');
    
    // Verificar se admin já existe
    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      await query(`
        INSERT INTO users (email, password_hash, name, role) 
        VALUES ($1, $2, $3, $4)
      `, [adminEmail, passwordHash, 'Administrador', 'admin']);
      
      console.log('👤 Usuário admin criado:');
      console.log(`   Email: ${adminEmail}`);
      if (!process.env.ADMIN_PASSWORD) {
        console.log(`   Senha gerada: ${adminPassword}`);
        console.log('⚠️  SALVE ESSA SENHA - ela não será exibida novamente!');
      } else {
        console.log('   Senha: [definida via variável de ambiente]');
      }
    } else {
      console.log('👤 Usuário admin já existe');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
  }
};

// Função para executar todas as migrations
const runMigrations = async () => {
  try {
    await createTables();
    await createDefaultAdmin();
    console.log('🎉 Migrations executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro nas migrations:', error.message);
    process.exit(1);
  }
};

module.exports = {
  createTables,
  createDefaultAdmin,
  runMigrations
};