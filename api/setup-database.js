const { supabase } = require('../lib/supabase');

async function setupDatabase() {
  try {
    console.log('🔄 Verificando e criando dados iniciais...');

    // Criar usuário admin padrão se não existir
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@bitacademy.com')
      .single();

    if (!adminExists) {
      const { error: adminError } = await supabase
        .from('users')
        .insert({
          name: 'Admin BitAcademy',
          email: 'admin@bitacademy.com',
          phone: '+5511999999999',
          password: 'Admin123456!',
          role: 'admin'
        });
        
      if (adminError) {
        throw adminError;
      }
      
      console.log('✅ Usuário admin principal criado!');
      console.log('📧 Email: admin@bitacademy.com');
      console.log('🔒 Senha: Admin123456!');
    } else {
      console.log('ℹ️ Usuário admin já existe');
    }
    
    // Verificar se existe usuário de teste
    const { data: testUserExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'teste@bitacademy.com')
      .single();

    if (!testUserExists) {
      const { error: testError } = await supabase
        .from('users')
        .insert({
          name: 'Usuário Teste',
          email: 'teste@bitacademy.com',
          phone: '+5511888888888',
          password: 'teste123',
          role: 'user'
        });
        
      if (testError) {
        throw testError;
      }
      
      console.log('✅ Usuário de teste criado!');
      console.log('📧 Email: teste@bitacademy.com');
      console.log('🔒 Senha: teste123');
    } else {
      console.log('ℹ️ Usuário de teste já existe');
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
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description
        }, {
          onConflict: 'setting_key'
        });
        
      if (error) {
        console.log(`⚠️ Warning inserting setting ${key}:`, error.message);
      }
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