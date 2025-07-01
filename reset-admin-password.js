const bcrypt = require('./backend/node_modules/bcrypt');
const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'backend/bitacademy.db');
const db = new sqlite3.Database(dbPath);

async function resetAdminPassword() {
  try {
    console.log('🔐 RESET DE SENHA DO ADMINISTRADOR');
    console.log('================================');
    
    // Nova senha para o admin
    const newPassword = 'Admin123456!';
    
    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Atualizar senha do admin
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE role = 'admin'
      `, [passwordHash], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ Senha do admin resetada com sucesso!`);
          console.log(`📧 Email: admin@seudominio.com`);
          console.log(`🔑 Nova senha: ${newPassword}`);
          console.log('');
          console.log('⚠️  IMPORTANTE: Altere esta senha após o primeiro login!');
          resolve();
        }
      });
    });
    
    // Verificar usuário admin
    await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, email, name, role, created_at 
        FROM users 
        WHERE role = 'admin'
      `, [], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          console.log('');
          console.log('👤 Informações do Administrador:');
          console.log(`   ID: ${row.id}`);
          console.log(`   Email: ${row.email}`);
          console.log(`   Nome: ${row.name}`);
          console.log(`   Criado em: ${row.created_at}`);
          resolve();
        } else {
          console.log('❌ Usuário admin não encontrado!');
          console.log('💡 Execute o script de criação do admin primeiro.');
          resolve();
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    db.close();
  }
}

// Executar reset
resetAdminPassword();