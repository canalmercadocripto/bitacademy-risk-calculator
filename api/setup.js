const { setupDatabase } = require('./setup-database');

// API endpoint to run database setup
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    console.log('🚀 Executando setup do banco de dados...');
    const result = await setupDatabase();
    
    return res.status(200).json({
      success: result.success,
      message: result.success ? 'Database setup completed successfully!' : result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro no setup:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}