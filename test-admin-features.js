// Script para testar funcionalidades do admin
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001/api';

async function testAdminFeatures() {
  try {
    console.log('🔄 Testando funcionalidades do admin...\n');

    // 1. Login do admin
    console.log('1. Fazendo login do admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bitacademy.vip',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // 2. Testar backup do banco
    console.log('\n2. Testando backup do banco...');
    const backupResponse = await axios.get(`${BASE_URL}/admin/backup/database`, {
      headers,
      responseType: 'arraybuffer'
    });
    
    const backupFilename = 'test-backup.db';
    fs.writeFileSync(backupFilename, backupResponse.data);
    console.log(`✅ Backup criado: ${backupFilename} (${backupResponse.data.length} bytes)`);

    // 3. Testar export de usuários em CSV
    console.log('\n3. Testando export de usuários em CSV...');
    const usersCSVResponse = await axios.get(`${BASE_URL}/admin/export/users?format=csv`, {
      headers,
      responseType: 'text'
    });
    
    fs.writeFileSync('test-users-export.csv', usersCSVResponse.data);
    console.log(`✅ Export de usuários CSV criado (${usersCSVResponse.data.length} chars)`);

    // 4. Testar export de usuários em JSON
    console.log('\n4. Testando export de usuários em JSON...');
    const usersJSONResponse = await axios.get(`${BASE_URL}/admin/export/users?format=json`, {
      headers
    });
    
    fs.writeFileSync('test-users-export.json', JSON.stringify(usersJSONResponse.data, null, 2));
    console.log(`✅ Export de usuários JSON criado (${usersJSONResponse.data.totalUsers} usuários)`);

    // 5. Testar export de trades em CSV
    console.log('\n5. Testando export de trades em CSV...');
    const tradesCSVResponse = await axios.get(`${BASE_URL}/admin/export/trades?format=csv`, {
      headers,
      responseType: 'text'
    });
    
    fs.writeFileSync('test-trades-export.csv', tradesCSVResponse.data);
    console.log(`✅ Export de trades CSV criado (${tradesCSVResponse.data.length} chars)`);

    // 6. Testar export de trades em JSON
    console.log('\n6. Testando export de trades em JSON...');
    const tradesJSONResponse = await axios.get(`${BASE_URL}/admin/export/trades?format=json`, {
      headers
    });
    
    fs.writeFileSync('test-trades-export.json', JSON.stringify(tradesJSONResponse.data, null, 2));
    console.log(`✅ Export de trades JSON criado (${tradesJSONResponse.data.totalTrades} trades)`);

    console.log('\n🎉 Todos os testes passaram com sucesso!');
    console.log('\nArquivos criados:');
    console.log('- test-backup.db');
    console.log('- test-users-export.csv');
    console.log('- test-users-export.json');
    console.log('- test-trades-export.csv');
    console.log('- test-trades-export.json');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAdminFeatures();