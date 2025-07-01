# 🚀 DEPLOY AUTOMÁTICO NO VERCEL

## Por que Vercel?
- ✅ Deploy automático via GitHub
- ✅ SSL gratuito
- ✅ Domínio customizado grátis
- ✅ Escalabilidade automática
- ✅ Zero configuração de servidor
- ✅ Suporte completo a React + Node.js

## Como fazer:

### 1. Preparar o projeto para Vercel

Primeiro, vamos ajustar o projeto para o Vercel:

```bash
# No seu computador local (não na VPS)
cd calculator_bitacademy

# Criar arquivo vercel.json
cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

# Ajustar package.json do frontend para Vercel
cd frontend
npm run build

# Voltar para a raiz
cd ..
```

### 2. Fazer deploy no Vercel

1. **Acesse:** https://vercel.com
2. **Faça login** com sua conta GitHub
3. **Clique em "New Project"**
4. **Selecione** o repositório `bitacademy-risk-calculator`
5. **Configure:**
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`
6. **Clique "Deploy"**

### 3. Configurar domínio customizado

1. **No painel do Vercel** → Settings → Domains
2. **Adicione:** `calculadora.bitacademy.vip`
3. **Configure DNS** no seu domínio:
   - Tipo: `CNAME`
   - Nome: `calculadora`
   - Valor: `cname.vercel-dns.com`

### 4. Variáveis de ambiente

No Vercel → Settings → Environment Variables:
```
NODE_ENV=production
JWT_SECRET=BitAcademy2025SecureJWT
VERCEL=1
```

## ✅ Resultado:
- **URL automática:** https://seu-projeto.vercel.app
- **Domínio custom:** https://calculadora.bitacademy.vip
- **Deploy automático** a cada push no GitHub
- **SSL automático**
- **Sem servidor para gerenciar**