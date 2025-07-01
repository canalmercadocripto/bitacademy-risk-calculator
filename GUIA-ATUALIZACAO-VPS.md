# 🚀 Guia de Atualização VPS - BitAcademy

## 📋 **Visão Geral da Atualização**

Esta atualização adiciona **formulário completo de registro** com os seguintes campos obrigatórios:
- ✅ **Nome**
- ✅ **Sobrenome** (novo)
- ✅ **Email**
- ✅ **Senha**
- ✅ **Telefone** (novo campo visual)

## 🔄 **O que será atualizado:**

### **Frontend:**
- Formulário de registro com novos campos
- Validação completa de todos os campos
- Componente de telefone com código do país

### **Backend:**
- Validação de nome, sobrenome, email, senha e telefone
- Migração do banco para adicionar campo `last_name`
- APIs atualizadas para novos campos

### **Banco de Dados:**
- Adição do campo `last_name` na tabela `users`
- Campos `phone` e `country_code` já existem, apenas validação

## 📦 **Pré-requisitos**

Antes de executar a atualização, certifique-se de que:

1. **SSH ativo** na VPS
2. **Aplicação rodando** normalmente
3. **Acesso root** ou sudo
4. **Backup atual** (será feito automaticamente)
5. **Git configurado** no servidor

## 🛡️ **Processo de Atualização Segura**

### **Opção 1: Atualização Automática (Recomendada)**

```bash
# 1. Fazer upload do script para sua VPS
scp update-production.sh user@seu-servidor:/tmp/

# 2. Conectar na VPS
ssh user@seu-servidor

# 3. Mover script para local apropriado
sudo mv /tmp/update-production.sh /var/www/bitacademy/
sudo chmod +x /var/www/bitacademy/update-production.sh

# 4. Executar atualização
cd /var/www/bitacademy
sudo ./update-production.sh
```

### **Opção 2: Atualização Manual (Passo a Passo)**

#### **Passo 1: Backup Manual**
```bash
# Criar diretório de backup
sudo mkdir -p /var/backups/bitacademy

# Backup da aplicação
sudo tar -czf /var/backups/bitacademy/app_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/bitacademy

# Backup do banco
sudo cp /var/www/bitacademy/backend/bitacademy.db /var/backups/bitacademy/db_$(date +%Y%m%d_%H%M%S).db
```

#### **Passo 2: Parar Aplicação**
```bash
# Parar PM2
sudo pm2 stop all
```

#### **Passo 3: Atualizar Código**
```bash
# Entrar no diretório
cd /var/www/bitacademy

# Atualizar do GitHub
sudo git fetch origin
sudo git reset --hard origin/main
```

#### **Passo 4: Migração do Banco**
```bash
# Executar migração
cd /var/www/bitacademy/backend
sudo node setup-database-sqlite.js
```

#### **Passo 5: Atualizar Dependências**
```bash
# Backend
cd /var/www/bitacademy/backend
sudo npm install --production

# Frontend
cd /var/www/bitacademy/frontend
sudo npm install
sudo npm run build
```

#### **Passo 6: Reiniciar Aplicação**
```bash
# Iniciar com PM2
cd /var/www/bitacademy
sudo pm2 start ecosystem.config.js
```

## 🧪 **Testes Pós-Atualização**

### **1. Verificar Status**
```bash
# Status PM2
pm2 status

# Status dos serviços
curl -I http://localhost:3001/health
curl -I http://localhost:3000
```

### **2. Testar Novo Registro**
```bash
# Teste via curl
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João",
    "lastName": "Silva", 
    "email": "teste@exemplo.com",
    "password": "123456",
    "phone": "11987654321",
    "countryCode": "+55"
  }'
```

### **3. Teste no Browser**
1. Acesse seu site
2. Clique em "Criar conta"
3. Verifique se todos os campos aparecem:
   - Nome
   - Sobrenome
   - Email
   - Senha
   - Telefone
4. Teste o registro completo

## 🆘 **Rollback (Se algo der errado)**

### **Opção 1: Script Automático**
```bash
# Executar rollback
sudo ./rollback-production.sh
```

### **Opção 2: Rollback Manual**
```bash
# Parar aplicação
sudo pm2 stop all

# Restaurar backup
sudo rm -rf /var/www/bitacademy
sudo tar -xzf /var/backups/bitacademy/app_XXXXXXXX_XXXXXX.tar.gz -C /

# Restaurar banco
sudo cp /var/backups/bitacademy/db_XXXXXXXX_XXXXXX.db /var/www/bitacademy/backend/bitacademy.db

# Reiniciar
sudo pm2 start ecosystem.config.js
```

## ✅ **Checklist de Validação**

Após a atualização, verifique:

- [ ] **Site carrega** normalmente
- [ ] **Login funciona** com usuários existentes
- [ ] **Registro novo** solicita todos os campos
- [ ] **Validação funciona** (campos obrigatórios)
- [ ] **Telefone** aparece no formulário
- [ ] **Dados salvos** corretamente no banco
- [ ] **PM2 status** mostra aplicação online
- [ ] **Logs** sem erros críticos

## 📊 **Verificação de Dados**

### **Verificar Estrutura do Banco**
```bash
# Conectar no banco SQLite
sudo sqlite3 /var/www/bitacademy/backend/bitacademy.db

# Verificar estrutura da tabela users
.schema users

# Deve mostrar:
# - name TEXT NOT NULL
# - last_name TEXT  (novo campo)
# - phone TEXT
# - country_code TEXT DEFAULT '+55'
# - email TEXT UNIQUE NOT NULL
# - password_hash TEXT NOT NULL
```

### **Verificar Usuários Existentes**
```sql
-- No SQLite
SELECT id, name, last_name, email, phone FROM users LIMIT 5;

-- Usuários antigos terão last_name = NULL (normal)
-- Novos usuários terão last_name preenchido
```

## 🚨 **Problemas Comuns**

### **Erro: "Column already exists"**
```bash
# Normal durante migração
# O script detecta campos existentes automaticamente
```

### **Erro: "PM2 not found"**
```bash
# Instalar PM2
sudo npm install -g pm2
```

### **Erro: "Git conflicts"**
```bash
# Resolver conflitos
cd /var/www/bitacademy
sudo git stash
sudo git pull origin main
```

### **Erro: "Port already in use"**
```bash
# Parar processos
sudo pm2 stop all
sudo killall node
```

## 📝 **Logs Importantes**

### **Verificar Logs**
```bash
# Logs PM2
pm2 logs

# Logs Nginx
sudo tail -f /var/log/nginx/error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

## 🎯 **Resultado Esperado**

Após a atualização bem-sucedida:

1. **Usuários existentes** continuam funcionando normalmente
2. **Novo registro** solicita: nome, sobrenome, email, senha, telefone
3. **Validação completa** de todos os campos
4. **Interface moderna** com novos campos
5. **Banco atualizado** com campo last_name
6. **Backup seguro** de tudo que foi alterado

## 🔄 **Próximos Passos**

Após a atualização:

1. **Teste completo** de todas as funcionalidades
2. **Monitore logs** por algumas horas
3. **Teste performance** do site
4. **Documente** qualquer personalização adicional
5. **Configure monitoramento** se necessário

---

## 📞 **Suporte**

Em caso de problemas:
1. **Verifique logs** primeiro
2. **Execute rollback** se necessário
3. **Documente o erro** para análise
4. **Mantenha backups** sempre atualizados

**O sistema está pronto para atualização segura! 🚀**