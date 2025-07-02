const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    console.log('🔄 Criando tabelas do banco de dados...');

    // Tabela de usuários
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `;

    // Tabela de trades/cálculos
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        exchange VARCHAR(50) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        account_size DECIMAL(15,2) NOT NULL,
        risk_percentage DECIMAL(5,2) NOT NULL,
        entry_price DECIMAL(15,8) NOT NULL,
        stop_loss DECIMAL(15,8) NOT NULL,
        take_profit DECIMAL(15,8) NOT NULL,
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
      )
    `;

    // Tabela de configurações do sistema
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tabela de configurações do usuário
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, setting_key)
      )
    `;

    // Tabela de logs de atividades
    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Tabelas criadas com sucesso!');

    // Criar usuário admin padrão se não existir
    const adminExists = await sql`
      SELECT id FROM users WHERE email = 'admin@bitacademy.com'
    `;

    if (adminExists.rows.length === 0) {
      await sql`
        INSERT INTO users (name, email, phone, password, role)
        VALUES ('Admin BitAcademy', 'admin@bitacademy.com', '+5511999999999', '$2b$10$vI0h4xVrxQJ0QGKJ7Z9F8eF7Y8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2', 'admin')
      `;
      console.log('✅ Usuário admin criado!');
    }

    // Inserir configurações padrão do sistema
    const defaultSettings = [
      ['maintenance_mode', 'false', 'Modo de manutenção do sistema'],
      ['max_trades_per_user', '1000', 'Máximo de trades por usuário'],
      ['default_risk_percentage', '2', 'Porcentagem de risco padrão'],
      ['supported_exchanges', 'binance,bybit,bingx,bitget', 'Exchanges suportadas'],
      ['app_version', '2.0.0', 'Versão da aplicação']
    ];

    for (const [key, value, description] of defaultSettings) {
      await sql`
        INSERT INTO system_settings (setting_key, setting_value, description)
        VALUES (${key}, ${value}, ${description})
        ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP
      `;
    }

    console.log('✅ Configurações padrão inseridas!');

    return { success: true, message: 'Database setup completed successfully!' };
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { setupDatabase };

// Para execução direta
if (require.main === module) {
  setupDatabase()
    .then(result => {
      console.log('🎉 Setup finalizado:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}