#!/bin/bash

echo "🧪 Testando salvamento de trades com informações completas..."

# Login para obter token
echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitacademy.vip","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro ao fazer login"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login realizado com sucesso"

# Dados do trade de teste
TRADE_DATA='{
  "exchange": "binance",
  "symbol": "BTCUSDT",
  "direction": "long",
  "entryPrice": 50000,
  "stopLoss": 48000,
  "targetPrice": 55000,
  "accountSize": 10000,
  "riskPercent": 2,
  "positionSize": 1000,
  "riskAmount": 200,
  "rewardAmount": 500,
  "riskRewardRatio": 2.5,
  "currentPrice": 50100,
  "calculationData": {
    "takeProfits": [
      {"price": 52000, "percentage": 25},
      {"price": 53500, "percentage": 50},
      {"price": 55000, "percentage": 100}
    ],
    "stopLossDistance": 2000,
    "targetDistance": 5000,
    "positionPercent": 10,
    "maxLoss": 200,
    "potentialGain": 500
  }
}'

echo "💾 Salvando trade de teste..."
SAVE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/trades/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$TRADE_DATA")

echo "📊 Resposta do servidor:"
echo "$SAVE_RESPONSE"

echo ""
echo "✅ Teste concluído!"
echo "🔍 Verifique o painel admin para ver se as informações aparecem corretamente"