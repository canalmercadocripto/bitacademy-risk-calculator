const { testConnection, runMigrations } = require('./src/database/migrations');
const { testConnection: dbTest } = require('./src/config/database');

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados...');
  
  try {
    // Testar conexão
    await dbTest();
    
    // Executar migrations
    await runMigrations();
    
    console.log('✅ Banco de dados configurado com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message);
    console.log('\n💡 Certifique-se que o PostgreSQL está rodando e configurado corretamente.');
    console.log('📋 Comandos para instalar PostgreSQL no Ubuntu:');
    console.log('   sudo apt update');
    console.log('   sudo apt install postgresql postgresql-contrib');
    console.log('   sudo -u postgres createuser --createdb bitacademy');
    console.log('   sudo -u postgres createdb bitacademy_calculator');
    console.log('   sudo -u postgres psql -c "ALTER USER bitacademy PASSWORD \'bitacademy123\';"');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;