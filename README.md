# 🧮 BitAcademy Risk Calculator

**Calculadora profissional de Risk Management para Trading de Criptomoedas**

[![Deploy Status](https://img.shields.io/badge/deploy-online-green.svg)](https://calculadora.bitacademy.vip)
[![Node.js](https://img.shields.io/badge/node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)

## 🌐 **Demo Online**
👀 **[https://calculadora.bitacademy.vip](https://calculadora.bitacademy.vip)**

## 📱 Funcionalidades

- ✅ **Integração com 4 Corretoras**: BingX, Bybit, Binance, Bitget
- ✅ **Dados em Tempo Real**: Preços atualizados automaticamente
- ✅ **Cálculo Preciso**: Position sizing, P&L e Risk/Reward ratio
- ✅ **Interface Moderna**: React com tema claro/escuro
- ✅ **Validação Inteligente**: Verificação automática de trades
- ✅ **Export de Resultados**: Copiar análises completas
- ✅ **Responsivo**: Funciona em desktop e mobile

## 🏗️ Arquitetura

```
📁 risk-calculator/
├── 🔧 backend/           # API Node.js/Express
├── 🎨 frontend/          # React SPA
├── 🐳 docker-compose.yml # Orquestração
├── 🌐 nginx/             # Reverse proxy
└── 🚀 deploy.sh          # Script de deploy
```

## 🚀 Deploy Rápido

### Pré-requisitos
- VPS com Ubuntu 20.04+
- Acesso root ou sudo
- Portas 80 e 443 liberadas

### Instalação Automática
```bash
# Clone o repositório
git clone <seu-repositorio>
cd calculator_bitacademy

# Execute o script de deploy
./deploy.sh
```

O script irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Configurar certificados SSL
- ✅ Construir e iniciar os containers
- ✅ Verificar a saúde dos serviços

## 🔧 Configuração Manual

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edite o .env conforme necessário
npm install
npm start
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Docker (Recomendado)
```bash
# Desenvolvimento
docker-compose up --build

# Produção
docker-compose -f docker-compose.yml up -d
```

## 📊 APIs Disponíveis

### Exchanges
- `GET /api/exchanges` - Listar corretoras disponíveis
- `GET /api/exchanges/:exchange/symbols` - Símbolos da corretora
- `GET /api/exchanges/:exchange/price/:symbol` - Preço atual

### Calculadora
- `POST /api/calculator/calculate` - Calcular risk management
- `POST /api/calculator/validate` - Validar trade
- `GET /api/calculator/info` - Informações da calculadora

## 🌐 Exemplo de Uso da API

```javascript
// Buscar preço atual
const response = await fetch('/api/exchanges/binance/price/BTCUSDT');
const data = await response.json();

// Calcular risk management
const calculation = await fetch('/api/calculator/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entryPrice: 45000,
    stopLoss: 44000,
    targetPrice: 47000,
    accountSize: 10000,
    riskPercent: 2,
    direction: 'LONG'
  })
});
```

## ⚡ Performance

- **Cache Inteligente**: 5 minutos para símbolos, 30s para preços
- **Rate Limiting**: Proteção contra abuso
- **Compressão Gzip**: Redução de 70% no tráfego
- **SSL/TLS**: Criptografia end-to-end

## 🔒 Segurança

- ✅ **Helmet.js**: Headers de segurança
- ✅ **Rate Limiting**: Proteção DDoS
- ✅ **CORS**: Controle de origem
- ✅ **SSL/HTTPS**: Certificados automáticos
- ✅ **Nginx**: Proxy reverso seguro

## 📱 Compatibilidade

### Corretoras Suportadas
- **Binance** - Futures USDT
- **Bybit** - Linear Perpetual
- **BingX** - Perpetual Contracts

### Navegadores
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐳 Docker

### Desenvolvimento
```bash
docker-compose up --build
```

### Produção
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Logs
```bash
docker-compose logs -f
```

## 📈 Monitoramento

### Health Check
```bash
curl http://localhost:3001/health
```

### Métricas
- **Uptime**: Tempo de atividade
- **Memory**: Uso de memória
- **Response Time**: Tempo de resposta das APIs

## 🔧 Configuração Avançada

### Variáveis de Ambiente (Backend)
```bash
PORT=3001                    # Porta do servidor
NODE_ENV=production         # Ambiente
FRONTEND_URL=https://...    # URL do frontend
CACHE_TTL=300              # TTL do cache (segundos)

# APIs das corretoras (opcional)
BINANCE_API_KEY=...
BYBIT_API_KEY=...
BINGX_API_KEY=...
```

### Nginx Personalizado
```nginx
# Configuração customizada em nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    # Suas configurações SSL
    ssl_certificate /path/to/cert;
    ssl_certificate_key /path/to/key;
    
    # ... resto da configuração
}
```

## 🚀 Deploy em Produção

### 1. Configurar Domínio
```bash
# Apontar DNS para seu VPS
# A seu-dominio.com -> IP_DO_VPS
```

### 2. SSL com Let's Encrypt
```bash
# Instalar certbot
sudo apt install certbot

# Gerar certificados
sudo certbot certonly --webroot -w /var/www/certbot -d seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Configurar Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 🐛 Troubleshooting

### Problemas Comuns

**1. Erro de CORS**
- Verificar `FRONTEND_URL` no backend
- Conferir configuração do nginx

**2. API das Corretoras Falha**
- Verificar conectividade
- Rate limits das exchanges
- Chaves de API (se configuradas)

**3. Container não Inicia**
```bash
# Verificar logs
docker-compose logs backend
docker-compose logs frontend

# Verificar recursos
docker stats
```

**4. SSL/HTTPS Issues**
```bash
# Verificar certificados
openssl x509 -in /path/to/cert -text -noout

# Testar SSL
curl -I https://seu-dominio.com
```

## 📞 Suporte

- 📧 **Email**: contato@bitacademy.com.br
- 💬 **Telegram**: @BitAcademySupport
- 📖 **Docs**: [Documentação Completa](docs/)

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ pela equipe BitAcademy**

*Calculadora profissional para traders profissionais* 🚀

---

**🔗 Repositório GitHub:** https://github.com/canalmercadocripto/bitacademy-risk-calculator