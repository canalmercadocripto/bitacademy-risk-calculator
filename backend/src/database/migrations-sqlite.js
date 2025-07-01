const { query } = require('../config/database-sqlite');

// Migrations para SQLite
const createTables = async () => {
  try {
    console.log('🔧 Criando tabelas SQLite...');

    // Tabela de usuários
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        last_name TEXT,
        phone TEXT,
        country_code TEXT DEFAULT '+55',
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de sessões/tokens
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de histórico de trades (imutável)
    await query(`
      CREATE TABLE IF NOT EXISTS trade_history (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        session_id TEXT,
        exchange TEXT NOT NULL,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        entry_price REAL NOT NULL,
        stop_loss REAL,
        target_price REAL,
        account_size REAL NOT NULL,
        risk_percent REAL NOT NULL,
        position_size REAL,
        risk_amount REAL,
        reward_amount REAL,
        risk_reward_ratio REAL,
        current_price REAL,
        calculation_data TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de atividades dos usuários
    await query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    console.log('✅ Tabelas SQLite criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas SQLite:', error.message);
    throw error;
  }
};

// Função para migrar tabela de usuários (adicionar campos que possam não existir)
const migrateUsersTable = async () => {
  try {
    console.log('🔄 Verificando estrutura da tabela users...');
    
    // Adicionar campos que podem não existir em versões antigas
    const fieldsToAdd = [
      { name: 'last_name', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'country_code', type: 'TEXT DEFAULT \'+55\'' }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        await query(`ALTER TABLE users ADD COLUMN ${field.name} ${field.type}`);
        console.log(`✅ Campo ${field.name} adicionado à tabela users`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`ℹ️ Campo ${field.name} já existe na tabela users`);
        } else {
          console.error(`❌ Erro ao adicionar campo ${field.name}:`, error.message);
        }
      }
    }
    
    console.log('✅ Migração da tabela users concluída!');
    
  } catch (error) {
    console.error('❌ Erro na migração da tabela users:', error.message);
  }
};

// Função para criar usuário admin padrão
const createDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcrypt');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@seudominio.com';
    const adminPassword = process.env.ADMIN_PASSWORD || require('crypto').randomBytes(16).toString('hex');
    
    // Verificar se admin já existe
    const existingAdmin = await query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    
    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      await query(`
        INSERT INTO users (email, password_hash, name, role) 
        VALUES (?, ?, ?, ?)
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
    await migrateUsersTable();
    await createDefaultAdmin();
    console.log('🎉 Migrations SQLite executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro nas migrations SQLite:', error.message);
    process.exit(1);
  }
};

module.exports = {
  createTables,
  migrateUsersTable,
  createDefaultAdmin,
  runMigrations
};