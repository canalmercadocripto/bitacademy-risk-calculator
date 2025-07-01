# 🚂 DEPLOY AUTOMÁTICO NO RAILWAY

## Por que Railway?
- ✅ Deploy automático via GitHub
- ✅ Suporte completo Node.js + React
- ✅ Banco de dados incluído
- ✅ SSL automático
- ✅ Domínio customizado
- ✅ Logs em tempo real

## Como fazer:

### 1. Preparar projeto para Railway

```bash
# Criar railway.json
cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:production"
  }
}
EOF

# Ajustar package.json na raiz
cat > package.json << EOF
{
  "name": "bitacademy-calculator",
  "version": "1.0.0",
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install",
    "build": "cd frontend && npm run build",
    "start:production": "cd backend && npm start",
    "postinstall": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF
```

### 2. Deploy no Railway

1. **Acesse:** https://railway.app
2. **Login** com GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. **Selecione** `bitacademy-risk-calculator`
5. **Configure variáveis:**
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=BitAcademy2025SecureJWT
   ```
6. **Deploy automático**

### 3. Domínio customizado

1. **Project** → **Settings** → **Domains**
2. **Custom Domain:** `calculadora.bitacademy.vip`
3. **Configure DNS:**
   - Tipo: `CNAME`
   - Nome: `calculadora`
   - Valor: `seu-projeto.up.railway.app`

## ✅ Vantagens do Railway:
- **Backend + Frontend** juntos
- **SQLite funciona** perfeitamente
- **Logs em tempo real**
- **Escalabilidade automática**