# 🔄 Workflow de Desenvolvimento com GitHub

## 📋 Fluxo Completo: Local → GitHub → Produção

### 🏠 **1. Desenvolvimento Local**

```bash
# Trabalhar normalmente no projeto
cd calculator_bitacademy

# Fazer mudanças nos arquivos
# Testar localmente com:
npm run dev  # ou seus comandos habituais
```

### 📤 **2. Enviar para GitHub**

```bash
# Executar script de deploy para GitHub
./scripts/deploy-to-github.sh

# O script irá:
# ✅ Limpar arquivos temporários
# ✅ Fazer commit das mudanças
# ✅ Enviar para GitHub (se remote configurado)
```

### 🔧 **3. Configuração Inicial do GitHub**

**Primeira vez apenas:**

```bash
# 1. Criar repositório no GitHub
# 2. Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/bitacademy-risk-calculator.git

# 3. Enviar pela primeira vez
git push -u origin main
```

### 🚀 **4. Atualizar Produção**

**Na sua VPS:**

```bash
# Conectar na VPS
ssh root@185.225.232.65

# Ir para diretório do projeto
cd /var/www/bitacademy-project

# Executar script de atualização
./scripts/update-production.sh
```

## 🔄 **Fluxo de Trabalho Diário**

### 🛠️ **Desenvolvimento**
1. Fazer mudanças localmente
2. Testar no ambiente local
3. Quando satisfeito, executar `./scripts/deploy-to-github.sh`

### 📦 **Deploy**
1. Acessar VPS via SSH
2. Executar `./scripts/update-production.sh`
3. Verificar se aplicação está funcionando

## 📁 **Estrutura dos Scripts**

```
scripts/
├── deploy-to-github.sh     # Local → GitHub
├── update-production.sh    # GitHub → VPS
└── setup-vps-fixed.sh     # Configuração inicial VPS
```

## ⚡ **Scripts Detalhados**

### `deploy-to-github.sh`
- ✅ Limpa arquivos temporários (node_modules, builds)
- ✅ Remove arquivos sensíveis (.env)
- ✅ Faz commit com mensagem automática ou personalizada
- ✅ Envia para GitHub
- ✅ Fornece instruções para configuração inicial

### `update-production.sh`
- ✅ Faz backup de configurações importantes
- ✅ Para aplicação (PM2)
- ✅ Baixa últimas mudanças do GitHub
- ✅ Restaura configurações locais (.env)
- ✅ Atualiza dependências
- ✅ Constrói novo frontend
- ✅ Atualiza arquivos estáticos
- ✅ Reinicia nginx e PM2
- ✅ Verifica saúde da aplicação

## 🔐 **Arquivos de Configuração**

### **Nunca commitados (mantidos na VPS):**
- `backend/.env` - Configurações de produção
- SSL certificates
- Logs

### **Sempre commitados:**
- Código fonte
- `package.json`
- Scripts de deploy
- Configurações nginx (template)

## 🚨 **Troubleshooting**

### **Problema: Git remote não configurado**
```bash
# Configurar remote
git remote add origin https://github.com/SEU_USUARIO/bitacademy-risk-calculator.git
git push -u origin main
```

### **Problema: Erro ao atualizar produção**
```bash
# Ver logs detalhados
pm2 logs

# Verificar status dos serviços
pm2 status
systemctl status nginx

# Reiniciar tudo
pm2 restart all
sudo systemctl restart nginx
```

### **Problema: Frontend não atualiza**
```bash
# Verificar se build existe
ls frontend/build/

# Verificar arquivos estáticos
ls /var/www/bitacademy/

# Limpar cache do browser
# Ctrl+F5 ou Ctrl+Shift+R
```

## 📊 **Verificações de Saúde**

### **Local (antes de enviar)**
```bash
# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000
```

### **Produção (após deploy)**
```bash
# API
curl https://calculadora.bitacademy.vip/api/exchanges

# Site
curl -I https://calculadora.bitacademy.vip
```

## 🎯 **Checklist de Deploy**

### **Antes de enviar para GitHub:**
- [ ] Código testado localmente
- [ ] Removidos console.logs desnecessários
- [ ] Verificado se não há informações sensíveis

### **Após enviar para GitHub:**
- [ ] Commit aparece no repositório
- [ ] Todas as mudanças estão incluídas

### **Após atualizar produção:**
- [ ] Site carrega corretamente
- [ ] API responde nas 4 exchanges
- [ ] Calculadora funciona
- [ ] SSL ativo (https://)
- [ ] PM2 status mostra processos online

## 💡 **Dicas Importantes**

1. **Sempre testar localmente** antes de enviar para GitHub
2. **Fazer backup** antes de grandes mudanças
3. **Monitorar logs** após cada deploy: `pm2 logs`
4. **Verificar certificados SSL** periodicamente
5. **Manter VPS atualizada**: `apt update && apt upgrade`

## 🔗 **Links Úteis**

- **Repositório**: (configurar após primeira execução)
- **Produção**: https://calculadora.bitacademy.vip
- **API**: https://calculadora.bitacademy.vip/api/exchanges
- **PM2 Logs**: `pm2 logs` na VPS
- **Nginx Logs**: `/var/log/nginx/error.log`

---

**🎉 Com este workflow, você pode desenvolver localmente e fazer deploy para produção com apenas 2 comandos!**