#!/usr/bin/env node

const axios = require('axios');

// Configuração do teste
const API_BASE = 'http://localhost:3001';
const testUser = {
  name: 'João',
  lastName: 'Silva',
  email: `teste${Date.now()}@exemplo.com`, // Email único para cada teste
  password: 'senha123',
  phone: '11987654321',
  countryCode: '+55'
};

console.log('🧪 Iniciando teste do formulário de registro...\n');

async function testRegister() {
  try {
    console.log('📝 Dados do teste:');
    console.log(`   Nome: ${testUser.name}`);
    console.log(`   Sobrenome: ${testUser.lastName}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Telefone: ${testUser.countryCode} ${testUser.phone}`);
    console.log(`   Senha: ${testUser.password}\n`);

    console.log('🚀 Enviando requisição de registro...');
    
    const response = await axios.post(`${API_BASE}/api/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ REGISTRO BEM-SUCEDIDO!');
      console.log(`   Usuário criado: ${response.data.data.user.name}`);
      console.log(`   Email: ${response.data.data.user.email}`);
      console.log(`   Token JWT gerado: ${response.data.data.token ? 'Sim' : 'Não'}`);
      console.log(`   Mensagem: ${response.data.message}\n`);
      
      // Testar login com o usuário criado
      console.log('🔐 Testando login com o usuário criado...');
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginResponse.data.success) {
        console.log('✅ LOGIN BEM-SUCEDIDO!');
        console.log(`   Usuário logado: ${loginResponse.data.data.user.name}`);
        console.log(`   Role: ${loginResponse.data.data.user.role}\n`);
      } else {
        console.log('❌ Erro no login:', loginResponse.data.message);
      }
      
    } else {
      console.log('❌ ERRO NO REGISTRO:');
      console.log(`   Mensagem: ${response.data.message}`);
    }

  } catch (error) {
    console.log('❌ ERRO NA REQUISIÇÃO:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Mensagem: ${error.response.data?.message || 'Erro desconhecido'}`);
      
      if (error.response.data?.debug) {
        console.log(`   Debug: ${error.response.data.debug}`);
      }
    } else {
      console.log(`   Erro: ${error.message}`);
    }
  }
}

// Teste de validação - campos obrigatórios
async function testValidation() {
  console.log('🧪 Testando validação de campos obrigatórios...\n');
  
  const invalidData = {
    name: 'João',
    // lastName faltando
    email: 'teste@exemplo.com',
    password: 'senha123',
    phone: '11987654321'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/api/auth/register`, invalidData);
    console.log('❌ Validação falhou - deveria ter dado erro');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validação funcionando corretamente!');
      console.log(`   Erro esperado: ${error.response.data.message}`);
    } else {
      console.log('❌ Erro inesperado na validação:', error.message);
    }
  }
}

// Executar testes
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 TESTE DO FORMULÁRIO DE REGISTRO COMPLETO');
  console.log('='.repeat(60));
  
  // Verificar se o backend está funcionando
  try {
    await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend está funcionando\n');
  } catch (error) {
    console.log('❌ Backend não está respondendo');
    console.log('   Certifique-se de que o servidor está rodando em localhost:3001');
    process.exit(1);
  }
  
  await testRegister();
  await testValidation();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTES CONCLUÍDOS!');
  console.log('='.repeat(60));
  console.log('\n💡 Para testar manualmente:');
  console.log('   1. Acesse: http://localhost:3000');
  console.log('   2. Clique em "Criar conta"');
  console.log('   3. Preencha todos os campos obrigatórios');
  console.log('   4. Verifique se o registro funciona corretamente');
}

runTests().catch(console.error);