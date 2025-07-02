# Setup de Deploy - BitAcademy Risk Calculator

## ⚠️ CONFIGURAÇÃO OBRIGATÓRIA NO VERCEL

### 1. Criar Banco de Dados
```bash
# No dashboard Vercel:
1. Vá ao seu projeto
2. Storage → Create Database → Postgres
3. Anote a connection string fornecida
```

### 2. Configurar Variáveis de Ambiente
**Settings → Environment Variables:**
```bash
POSTGRES_URL=postgresql://...          # Connection string do Vercel Postgres
POSTGRES_URL_NON_POOLING=postgresql://... # Connection string sem pooling
JWT_SECRET=BitAcademySecureKey2025$Production#Calculator!Risk@Management
NODE_ENV=production
```

### 3. Executar Setup do Banco
Após deploy, acesse uma vez:
```
https://SEU_PROJETO.vercel.app/api/setup
```

### 4. Credenciais Criadas Automaticamente
- **Admin:** admin@bitacademy.com / Admin123456!
- **Teste:** teste@bitacademy.com / teste123

## 🚀 Deploy Automático
- Push para `main` = deploy automático
- Vercel detecta mudanças e faz rebuild

## 🔧 Comandos Úteis
```bash
# Deploy manual (se logado)
vercel --prod --yes

# Verificar logs
vercel logs SEU_PROJETO

# Ver status
vercel ls
```

## ⚡ Funcionalidades Ativas
✅ Gestão completa de usuários  
✅ Trades salvando no banco  
✅ Analytics avançado  
✅ Histórico funcionando  
✅ Autenticação 100% database-driven  