const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuração do banco SQLite para desenvolvimento
const dbPath = path.join(__dirname, '../../bitacademy.db');

// Criar conexão
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar SQLite:', err.message);
  } else {
    console.log('✅ Conectado ao SQLite');
  }
});

// Função para executar queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const isSelect = sql.trim().toLowerCase().startsWith('select') || 
                     sql.trim().toLowerCase().startsWith('with');
    
    if (isSelect) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Erro na query SELECT:', err.message);
          reject(err);
        } else {
          resolve({ rows, rowCount: rows.length });
        }
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Erro na query:', err.message);
          reject(err);
        } else {
          resolve({ 
            rows: [{ id: this.lastID }], 
            rowCount: this.changes,
            lastID: this.lastID 
          });
        }
      });
    }
  });
};

// Função para testar conexão
const testConnection = async () => {
  try {
    await query('SELECT 1 as test');
    console.log('✅ SQLite funcionando');
  } catch (err) {
    console.error('❌ Erro no teste SQLite:', err.message);
    throw err;
  }
};

// Fechar conexão
const close = () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Erro ao fechar SQLite:', err.message);
      } else {
        console.log('✅ SQLite desconectado');
      }
      resolve();
    });
  });
};

module.exports = {
  db,
  query,
  testConnection,
  close
};