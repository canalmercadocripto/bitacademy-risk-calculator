const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'bitacademy.db');

console.log('🗄️ Inicializando banco de dados SQLite...');
console.log('📍 Caminho do banco:', dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(async () => {
  console.log('📋 Criando tabelas...');
  
  // Tabela users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
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
  `, (err) => {
    if (err) console.error('❌ Erro na tabela users:', err);
    else console.log('✅ Tabela users criada');
  });

  // Tabela trade_history
  db.run(`
    CREATE TABLE IF NOT EXISTS trade_history (
      id TEXT PRIMARY KEY,
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
  `, (err) => {
    if (err) console.error('❌ Erro na tabela trade_history:', err);
    else console.log('✅ Tabela trade_history criada');
  });

  // Tabela user_activities
  db.run(`
    CREATE TABLE IF NOT EXISTS user_activities (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, async (err) => {
    if (err) {
      console.error('❌ Erro na tabela user_activities:', err);
      return;
    }
    
    console.log('✅ Tabela user_activities criada');
    
    // Criar usuário admin
    try {
      console.log('👑 Criando usuário admin...');
      
      const adminId = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash('Admin123456!', 12);
      
      db.run(`
        INSERT OR REPLACE INTO users 
        (id, email, password_hash, name, last_name, phone, country_code, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId,
        'admin@seudominio.com',
        passwordHash,
        'Administrador',
        'Sistema',
        '11999999999',
        '+55',
        'admin',
        1
      ], (err) => {
        if (err) {
          console.error('❌ Erro ao criar admin:', err);
        } else {
          console.log('✅ Usuário admin criado com sucesso!');
          console.log('📧 Email: admin@seudominio.com');
          console.log('🔐 Senha: Admin123456!');
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ Erro ao fechar banco:', err);
          } else {
            console.log('🎉 Banco de dados inicializado com sucesso!');
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro ao criar hash da senha:', error);
      db.close();
    }
  });
});