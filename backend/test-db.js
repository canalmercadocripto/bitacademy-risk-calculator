const { query } = require('./src/config/database-sqlite');

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão SQLite...');
    
    // Verificar se existe a tabela users
    const tables = await query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    
    console.log('📋 Tabelas encontradas:', tables.rows);
    
    if (tables.rows.length > 0) {
      // Verificar estrutura da tabela users
      const schema = await query(`PRAGMA table_info(users)`);
      console.log('🏗️ Estrutura da tabela users:', JSON.stringify(schema.rows, null, 2));
      
      // Listar usuários existentes
      const users = await query(`SELECT * FROM users LIMIT 5`);
      console.log('👥 Usuários existentes:', users.rows);
      
      // Testar modelo User
      const User = require('./src/models/User');
      const testEmail = `test${Date.now()}@example.com`;
      
      console.log('🧪 Testando modelo User...');
      const newUser = await User.create({
        email: testEmail,
        password: '123456',
        name: 'Test User Model',
        role: 'user'
      });
      
      console.log('✅ Usuário criado via modelo:', newUser);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDatabase();