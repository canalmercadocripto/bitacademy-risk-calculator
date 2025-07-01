const { testConnection, runMigrations } = require('./src/database/migrations-sqlite');
const { testConnection: dbTest } = require('./src/config/database-sqlite');

async function setupDatabase() {
  console.log('🚀 Configurando banco SQLite para desenvolvimento...');
  
  try {
    // Testar conexão
    await dbTest();
    
    // Executar migrations
    await runMigrations();
    
    console.log('✅ Banco SQLite configurado com sucesso!');
    console.log('📂 Arquivo do banco: backend/bitacademy.db');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco SQLite:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;