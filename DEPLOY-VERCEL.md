# 🚀 Deploy no Vercel - BitAcademy Calculator

## ✅ Projeto preparado para Vercel!

### 📁 Arquivos adicionados:
- `vercel.json` - Configuração do Vercel
- `api/` - APIs serverless
- `vercel-env.txt` - Variáveis de ambiente

### 🚀 Como fazer deploy:

#### 1. **Commitar tudo para GitHub**
```bash
git add .
git commit -m "feat: preparar projeto para deploy Vercel"
git push origin main
```

#### 2. **Deploy no Vercel**
1. Acesse: https://vercel.com
2. Login com GitHub
3. "New Project"
4. Selecione: `bitacademy-risk-calculator`
5. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** npm run build
   - **Output Directory:** frontend/build
6. **Deploy!**

#### 3. **Configurar variáveis de ambiente**
No Vercel Dashboard → Settings → Environment Variables:
```
NODE_ENV=production
JWT_SECRET=BitAcademy2025SecureCalculatorJWT
```

#### 4. **Configurar domínio customizado**
1. Settings → Domains
2. Add: `calculadora.bitacademy.vip`
3. Configure DNS:
   - Tipo: CNAME
   - Nome: calculadora
   - Valor: cname.vercel-dns.com

### ✅ Resultado:
- **URL automática:** https://seu-projeto.vercel.app
- **Domínio custom:** https://calculadora.bitacademy.vip
- **Deploy automático** a cada push
- **SSL automático**
- **Sem servidor para gerenciar**

### 🧪 APIs disponíveis:
- `/api/health` - Health check
- `/api/auth` - Autenticação (login/me)
- `/api/calculate` - Cálculos de risco

### 🎯 Login de teste:
- Email: admin@seudominio.com
- Senha: Admin123456!

### 📝 Próximos passos:
1. Testar todas as funcionalidades
2. Adicionar banco de dados (pode usar Vercel KV ou PlanetScale)
3. Implementar registro de usuários
4. Adicionar mais APIs conforme necessário

## 🎉 Seu projeto estará funcionando em minutos, sem VPS!