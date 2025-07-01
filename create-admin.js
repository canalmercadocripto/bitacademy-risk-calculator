const bcrypt = require('./backend/node_modules/bcrypt');
const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'backend/bitacademy.db');
const db = new sqlite3.Database(dbPath);

async function createOrUpdateAdmin() {
  try {
    console.log('👑 CRIAÇÃO/ATUALIZAÇÃO DO ADMINISTRADOR');
    console.log('=====================================');
    
    // Dados do admin
    const adminData = {
      email: 'admin@seudominio.com',
      password: 'Admin123456!',
      name: 'Administrador',
      lastName: 'Sistema',
      phone: '11999999999',
      countryCode: '+55'
    };
    
    // Hash da senha
    const passwordHash = await bcrypt.hash(adminData.password, 12);
    
    // Verificar se admin já existe
    const existingAdmin = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, email, role 
        FROM users 
        WHERE email = ? OR role = 'admin'
      `, [adminData.email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingAdmin) {
      console.log('🔄 Admin já existe, atualizando senha...');
      
      // Atualizar admin existente
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE users 
          SET password_hash = ?, name = ?, last_name = ?, phone = ?, country_code = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [passwordHash, adminData.name, adminData.lastName, adminData.phone, adminData.countryCode, existingAdmin.id], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Admin atualizado com sucesso!');
            resolve();
          }
        });
      });
      
    } else {
      console.log('🆕 Criando novo admin...');
      
      // Criar novo admin
      const adminId = crypto.randomBytes(16).toString('hex');
      
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO users (id, email, password_hash, name, last_name, phone, country_code, role, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', 1)
        `, [adminId, adminData.email, passwordHash, adminData.name, adminData.lastName, adminData.phone, adminData.countryCode], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Admin criado com sucesso!');
            resolve();
          }
        });
      });
    }
    
    console.log('');
    console.log('🎉 CONFIGURAÇÃO CONCLUÍDA');
    console.log('========================');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Senha: ${adminData.password}`);
    console.log(`👤 Nome: ${adminData.name} ${adminData.lastName}`);
    console.log(`📱 Telefone: ${adminData.countryCode} ${adminData.phone}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere esta senha após o primeiro login!');
    console.log('🌐 Acesse: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar admin:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.log('💡 Email já está em uso. Use o script reset-admin-password.js para resetar a senha.');
    }
  } finally {
    db.close();
  }
}

// Executar criação/atualização
createOrUpdateAdmin();