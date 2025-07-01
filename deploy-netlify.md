# 🌐 DEPLOY AUTOMÁTICO NO NETLIFY

## Por que Netlify?
- ✅ Deploy automático via GitHub
- ✅ SSL gratuito
- ✅ Domínio customizado grátis
- ✅ Formulários automáticos
- ✅ Excelente para React
- ✅ Edge Functions para backend

## Como fazer:

### 1. Preparar projeto para Netlify

```bash
# Criar netlify.toml
cat > netlify.toml << EOF
[build]
  base = "frontend/"
  publish = "build/"
  command = "npm run build"

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

# Criar função serverless para backend
mkdir -p netlify/functions
cat > netlify/functions/api.js << EOF
const express = require('express');
const serverless = require('serverless-http');

// Importar suas rotas do backend
const app = express();

// Suas rotas aqui (copiar do backend/server.js)
app.use(express.json());

// Exemplo de rota
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando' });
});

module.exports.handler = serverless(app);
EOF
```

### 2. Deploy no Netlify

1. **Acesse:** https://netlify.com
2. **Login** com GitHub
3. **"New site from Git"**
4. **Selecione** seu repositório
5. **Configure:**
   - Branch: `main`
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
6. **Deploy**

### 3. Domínio customizado

1. **Site settings** → Domain management
2. **Add custom domain:** `calculadora.bitacademy.vip`
3. **Configure DNS:**
   - Tipo: `CNAME`
   - Nome: `calculadora`
   - Valor: `seu-site.netlify.app`