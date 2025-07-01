# BitAcademy - Workflow de Deploy e Atualização

## Workflow Completo: Desenvolvimento → Produção

### 1. Desenvolvimento Local
```bash
# Trabalhar localmente
npm run dev              # Testar frontend
npm run start:backend    # Testar backend

# Validar funcionalidades
npm test                 # Se tiver testes

# Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

### 2. Deploy Inicial (VPS Limpa)
```bash
# Na VPS (como root)
sudo ./deploy-initial-production.sh

# O script faz:
# ✅ Instala dependências do sistema
# ✅ Configura firewall e segurança  
# ✅ Clona projeto do GitHub
# ✅ Configura ambiente de produção
# ✅ Instala Node.js, PM2, Nginx
# ✅ Cria banco SQLite e migra dados
# ✅ Faz build do frontend
# ✅ Configura Nginx como proxy
# ✅ Inicia aplicação com PM2
# ✅ Testa todas as funcionalidades
```

### 3. Atualizações em Produção
```bash
# Na VPS (como root)
sudo ./update-production.sh

# O script faz:
# ✅ Backup completo (código + banco)
# ✅ Verifica atualizações no GitHub
# ✅ Atualiza código automaticamente
# ✅ Executa migrações de banco
# ✅ Atualiza dependências
# ✅ Rebuild do frontend
# ✅ Reinicia serviços (PM2 + Nginx)
# ✅ Testa funcionalidades
# ✅ Rollback automático se falhar
```

## Comandos Úteis de Monitoramento

### PM2 (Gerenciamento de Processos)
```bash
pm2 status              # Status das aplicações
pm2 logs                # Ver logs em tempo real
pm2 restart all         # Reiniciar todas as aplicações
pm2 reload all          # Reload sem downtime
pm2 stop all            # Parar todas as aplicações
pm2 monit               # Monitor em tempo real
```

### Nginx (Servidor Web)
```bash
systemctl status nginx   # Status do Nginx
systemctl restart nginx  # Reiniciar Nginx
systemctl reload nginx   # Recarregar configuração
nginx -t                 # Testar configuração
tail -f /var/log/nginx/bitacademy_access.log  # Ver logs de acesso
tail -f /var/log/nginx/bitacademy_error.log   # Ver logs de erro
```

### Sistema e Banco
```bash
# Verificar espaço em disco
df -h

# Ver processos
htop

# Backup manual do banco
cp /var/www/bitacademy/backend/bitacademy.db /var/backups/bitacademy/manual_$(date +%Y%m%d_%H%M%S).db

# Ver backups existentes
ls -la /var/backups/bitacademy/

# Verificar porta da aplicação
netstat -tlnp | grep :3001
curl -s http://localhost:3001/health
```

## Estrutura de Arquivos na VPS

```
/var/www/bitacademy/
├── frontend/
│   ├── build/           # Build de produção (servido pelo Nginx)
│   ├── src/
│   └── package.json
├── backend/
│   ├── src/
│   ├── bitacademy.db    # Banco SQLite
│   ├── .env             # Variáveis de ambiente
│   └── package.json
├── ecosystem.config.js  # Configuração PM2
└── README.md

/var/backups/bitacademy/
├── backup_pre_update_*.tar.gz  # Backups antes das atualizações
├── bitacademy_*.db             # Backups do banco
├── deploy_initial_*.txt        # Logs do deploy inicial
└── update_*.txt                # Logs das atualizações

/etc/nginx/sites-available/
└── bitacademy                  # Configuração do Nginx
```

## URLs e Acesso

- **Site**: http://SEU-IP (porta 80)
- **API**: http://SEU-IP/api (proxy para 3001)
- **Health Check**: http://SEU-IP/health
- **Admin**: Login diretamente no site

## Solução de Problemas

### Site não carrega
```bash
# Verificar Nginx
systemctl status nginx
nginx -t

# Verificar PM2
pm2 status
pm2 logs
```

### API não responde
```bash
# Verificar backend
curl http://localhost:3001/health
pm2 logs backend
```

### Erro de banco
```bash
# Verificar arquivo do banco
ls -la /var/www/bitacademy/backend/bitacademy.db

# Restaurar backup se necessário
cp /var/backups/bitacademy/bitacademy_YYYYMMDD_HHMMSS.db /var/www/bitacademy/backend/bitacademy.db
pm2 restart all
```

### Rollback Manual
```bash
cd /var/www/bitacademy

# Ver commits anteriores
git log --oneline -10

# Voltar para commit específico
git reset --hard COMMIT_HASH

# Reinstalar e rebuild
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Reiniciar
pm2 restart all
systemctl reload nginx
```

## Funcionalidades Implementadas

✅ **Formulário de Registro Completo**
- Nome, sobrenome, email, senha, telefone
- Validação de campos obrigatórios
- Seleção de código do país
- Máscaras de entrada

✅ **Sistema de Autenticação**
- Login/logout seguro
- JWT tokens
- Sessões persistentes

✅ **Dashboard Administrativo**
- Gestão de usuários
- Estatísticas de uso
- Logs de atividade

✅ **Calculadora de Risk Management**
- Cálculo de position size
- Risk/reward ratio
- Suporte a múltiplas exchanges

✅ **Segurança**
- Senhas criptografadas
- Proteção CSRF
- Headers de segurança
- Firewall configurado

## Próximos Passos Opcionais

1. **SSL/HTTPS**: Configure certificado SSL com Let's Encrypt
2. **Domínio**: Configure um domínio personalizado
3. **Monitoramento**: Setup de alertas e métricas
4. **Backup Automático**: Configurar backups diários
5. **CDN**: Configurar CDN para melhor performance