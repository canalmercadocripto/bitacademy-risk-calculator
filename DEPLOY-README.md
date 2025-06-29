# 🚀 Deploy do BitAcademy Risk Calculator para VPS

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Domínio apontando para o IP da VPS
- Acesso SSH root ou sudo
- Mínimo 1GB RAM, 1 vCPU

## 🛠️ Passo a Passo

### 1. Preparar arquivos localmente

```bash
# No seu computador local
cd /home/admplay/calculator_bitacademy
chmod +x deploy.sh
./deploy.sh
```

### 2. Fazer upload para VPS

**Opção A: SCP (recomendado)**
```bash
# Compactar projeto
tar -czf bitacademy.tar.gz --exclude=node_modules --exclude=.git .

# Enviar para VPS (substitua USER e IP)
scp bitacademy.tar.gz user@SEU_IP_VPS:/tmp/

# Conectar na VPS
ssh user@SEU_IP_VPS
```

**Opção B: Git Clone**
```bash
# Na VPS
git clone https://github.com/seu-usuario/calculator_bitacademy.git
cd calculator_bitacademy
```

**Opção C: SFTP/FTP**
- Use um cliente como FileZilla
- Faça upload da pasta completa

### 3. Configurar VPS

```bash
# Na VPS - executar como root
sudo su -
cd /tmp
tar -xzf bitacademy.tar.gz
mv calculator_bitacademy /var/www/bitacademy
cd /var/www/bitacademy

# Executar script de configuração
chmod +x setup-vps.sh
./setup-vps.sh
```

### 4. Editar configurações

```bash
# Editar domínio no nginx
nano nginx.conf
# Substituir "seu-dominio.com" pelo seu domínio real

# Editar CORS no backend
nano backend/.env
# Substituir "seu-dominio.com" pelo seu domínio real
```

### 5. Instalar dependências e fazer build

```bash
cd /var/www/bitacademy

# Backend
cd backend
npm install --production
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..
```

### 6. Configurar SSL (Let's Encrypt)

```bash
# Primeiro, testar sem SSL
nginx -t && systemctl restart nginx

# Depois configurar SSL
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 7. Iniciar aplicação

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Configurar auto-start
pm2 startup
pm2 save

# Ver logs
pm2 logs
```

## 🔧 Comandos Úteis

### Gerenciamento PM2
```bash
pm2 status                 # Ver status
pm2 logs                   # Ver logs
pm2 restart all            # Reiniciar tudo
pm2 stop all               # Parar tudo
pm2 delete all             # Remover tudo
pm2 monit                  # Monitor em tempo real
```

### Nginx
```bash
nginx -t                   # Testar configuração
systemctl restart nginx   # Reiniciar nginx
systemctl status nginx    # Status do nginx
tail -f /var/log/nginx/bitacademy_error.log  # Ver logs de erro
```

### SSL/Certbot
```bash
certbot renew             # Renovar certificados
certbot certificates      # Listar certificados
```

## 🔒 Segurança

### Firewall
```bash
ufw status                 # Status do firewall
ufw allow 22               # SSH
ufw allow 80               # HTTP
ufw allow 443              # HTTPS
ufw enable                 # Ativar firewall
```

### Backup automático
```bash
# Criar script de backup
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /root/backup_bitacademy_$DATE.tar.gz /var/www/bitacademy
find /root/backup_bitacademy_*.tar.gz -mtime +7 -delete
EOF

chmod +x /root/backup.sh

# Adicionar no crontab (backup diário 2h da manhã)
echo "0 2 * * * /root/backup.sh" | crontab -
```

## 🐛 Troubleshooting

### Problema: Site não carrega
```bash
# Verificar serviços
pm2 status
systemctl status nginx

# Verificar logs
pm2 logs
tail -f /var/log/nginx/bitacademy_error.log
```

### Problema: API não responde
```bash
# Verificar se backend está rodando
pm2 logs bitacademy-backend

# Testar API diretamente
curl http://localhost:3001/api/exchanges
```

### Problema: SSL não funciona
```bash
# Verificar certificados
certbot certificates

# Renovar se necessário
certbot renew

# Verificar configuração nginx
nginx -t
```

## 📊 Monitoramento

### Status da aplicação
```bash
# Ver status em tempo real
pm2 monit

# Ver uso de recursos
htop

# Ver logs em tempo real
pm2 logs --lines 100
```

### Health Check
```bash
# Criar script de health check
cat > /root/health-check.sh << 'EOF'
#!/bin/bash
if curl -f http://localhost:3001/api/exchanges > /dev/null 2>&1; then
    echo "Backend OK"
else
    echo "Backend FALHOU - Reiniciando..."
    pm2 restart bitacademy-backend
fi
EOF

chmod +x /root/health-check.sh

# Executar a cada 5 minutos
echo "*/5 * * * * /root/health-check.sh" | crontab -
```

## 🔄 Atualizações

Para atualizar a aplicação:

```bash
cd /var/www/bitacademy

# Fazer backup
tar -czf ../backup_$(date +%Y%m%d).tar.gz .

# Parar aplicação
pm2 stop all

# Atualizar código (git pull ou upload novo)
git pull  # OU fazer novo upload

# Instalar dependências se houver mudanças
cd backend && npm install --production && cd ..
cd frontend && npm install && npm run build && cd ..

# Reiniciar aplicação
pm2 start ecosystem.config.js
```

## 📞 Suporte

Em caso de problemas, verifique:
1. Logs do PM2: `pm2 logs`
2. Logs do Nginx: `/var/log/nginx/bitacademy_error.log`
3. Status dos serviços: `pm2 status` e `systemctl status nginx`
4. Conectividade de rede: `curl -I seu-dominio.com`

---

✅ **Aplicação funcionando**: `https://seu-dominio.com`
📡 **API funcionando**: `https://seu-dominio.com/api/exchanges`