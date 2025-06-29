# 🔧 Configuração da VPS - Passo a Passo

## ❌ Erro Resolvido: Nginx SSL

O erro que você encontrou é normal - acontece porque o nginx tenta carregar certificados SSL que ainda não existem. Aqui está a solução:

## 🚀 **SOLUÇÃO: Configuração em 2 Etapas**

### **Etapa 1: Configuração Inicial (Sem SSL)**

Na sua VPS, execute:

```bash
# 1. Use o script corrigido
./setup-vps-fixed.sh
```

### **Etapa 2: Configurar Domínio**

```bash
# 2. Editar configuração do nginx
nano nginx-initial.conf

# Substituir TODAS as ocorrências de "seu-dominio.com" pelo seu domínio real
# Exemplo: se seu domínio é "trading.com", substitua por "trading.com"
```

### **Etapa 3: Aplicar Configuração**

```bash
# 3. Copiar configuração atualizada
cp nginx-initial.conf /etc/nginx/sites-available/bitacademy

# 4. Testar e reiniciar nginx
nginx -t
systemctl restart nginx
```

### **Etapa 4: Instalar Dependências**

```bash
# 5. Backend
cd backend
npm install --production
cd ..

# 6. Frontend
cd frontend
npm install
npm run build
cd ..
```

### **Etapa 5: Configurar Backend**

```bash
# 7. Configurar variáveis de ambiente
cp .env.example backend/.env
nano backend/.env

# Editar as seguintes linhas:
# CORS_ORIGIN=https://seu-dominio.com,https://www.seu-dominio.com
```

### **Etapa 6: Iniciar Aplicação**

```bash
# 8. Iniciar com PM2
pm2 start ecosystem.config.js

# 9. Verificar status
pm2 status

# 10. Ver logs (se houver problemas)
pm2 logs
```

### **Etapa 7: Testar HTTP**

```bash
# 11. Testar se está funcionando
curl -I http://seu-dominio.com

# Ou abrir no navegador: http://seu-dominio.com
```

### **Etapa 8: Configurar SSL (Depois que HTTP funcionar)**

```bash
# 12. Executar script de SSL
./setup-ssl.sh

# Seguir as instruções do script
```

## 🔍 **Verificações Importantes**

### Antes de configurar SSL:

1. **DNS configurado**: Domínio apontando para IP da VPS
2. **HTTP funcionando**: Site acessível via `http://seu-dominio.com`
3. **Serviços rodando**: 
   ```bash
   pm2 status        # Backend e frontend devem estar online
   systemctl status nginx  # Nginx deve estar ativo
   ```

### Portas que devem estar abertas:
```bash
ufw status
# Deve mostrar:
# 22/tcp (SSH)
# 80/tcp (HTTP)  
# 443/tcp (HTTPS)
```

## 🚨 **Troubleshooting**

### Problema: Nginx não inicia
```bash
# Ver erro específico
nginx -t

# Ver logs
tail -f /var/log/nginx/error.log
```

### Problema: PM2 não inicia aplicação
```bash
# Ver logs detalhados
pm2 logs

# Reiniciar
pm2 restart all
```

### Problema: Site não carrega
```bash
# Verificar se portas estão ativas
netstat -tlnp | grep -E ':(80|443|3000|3001) '

# Verificar DNS
nslookup seu-dominio.com
```

### Problema: SSL falha
```bash
# Verificar se HTTP funciona primeiro
curl -I http://seu-dominio.com

# Verificar logs do certbot
tail -f /var/log/letsencrypt/letsencrypt.log
```

## ✅ **Checklist de Deploy**

- [ ] Script `setup-vps-fixed.sh` executado sem erros
- [ ] Domínio editado em `nginx-initial.conf`
- [ ] Nginx configurado e rodando
- [ ] Dependências instaladas (backend + frontend)
- [ ] Variáveis de ambiente configuradas
- [ ] PM2 iniciado com aplicação
- [ ] HTTP funcionando (`http://seu-dominio.com`)
- [ ] SSL configurado (`https://seu-dominio.com`)
- [ ] PM2 startup configurado

## 🎯 **Resultado Final**

Após seguir todos os passos:

- ✅ **Site**: `https://seu-dominio.com`
- ✅ **API**: `https://seu-dominio.com/api/exchanges`
- ✅ **Exchanges**: BingX, Bybit, Binance, Bitget
- ✅ **SSL**: Certificado Let's Encrypt
- ✅ **Auto-renewal**: Renovação automática
- ✅ **Monitoramento**: PM2 com auto-restart

---

## 🆘 **Se algo der errado:**

1. **Pare tudo e reconfigure**:
   ```bash
   pm2 stop all
   systemctl stop nginx
   ```

2. **Execute novamente**:
   ```bash
   ./setup-vps-fixed.sh
   ```

3. **Configure passo a passo** seguindo este guia

4. **Teste cada etapa** antes de prosseguir para a próxima