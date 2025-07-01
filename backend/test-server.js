// Teste simples do servidor
const express = require('express');

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando com SQLite'
  });
});

app.get('/test-auth', (req, res) => {
  res.json({ 
    message: 'Endpoint de autenticação funcionando',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
  console.log(`🔗 Teste: http://localhost:${PORT}/health`);
});