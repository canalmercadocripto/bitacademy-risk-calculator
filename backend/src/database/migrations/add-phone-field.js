const { query } = require('../../config/database-sqlite');

// Migration para adicionar campo telefone à tabela users
const addPhoneField = async () => {
  try {
    console.log('🔧 Adicionando campo telefone à tabela users...');

    // Verificar se a coluna já existe
    const tableInfo = await query(`PRAGMA table_info(users)`);
    const hasPhoneField = tableInfo.rows.some(row => row.name === 'phone');
    const hasCountryCodeField = tableInfo.rows.some(row => row.name === 'country_code');

    if (!hasPhoneField) {
      await query(`ALTER TABLE users ADD COLUMN phone TEXT`);
      console.log('✅ Campo phone adicionado');
    }

    if (!hasCountryCodeField) {
      await query(`ALTER TABLE users ADD COLUMN country_code TEXT DEFAULT '+55'`);
      console.log('✅ Campo country_code adicionado');
    }

    // Criar índice para telefone
    await query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
    
    console.log('✅ Migration phone field concluída!');

  } catch (error) {
    console.error('❌ Erro na migration add-phone-field:', error.message);
    throw error;
  }
};

module.exports = { addPhoneField };