#!/bin/bash

echo "🧪 Teste Completo de Trade com Dados Reais"
echo "==========================================="

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

# Primeiro, testar a API de cálculo
echo ""
echo "🧮 Testando API de cálculo..."
CALC_RESPONSE=$(curl -s -X POST http://localhost:3001/api/calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "entryPrice": 106589,
    "stopLoss": 106000,
    "targetPrice": 119999,
    "accountSize": 2458,
    "riskPercent": 2,
    "direction": "long"
  }')

echo "📊 Resposta da calculadora:"
echo "$CALC_RESPONSE" | head -300
echo ""

# Extrair dados calculados para usar no trade
POSITION_VALUE=$(echo "$CALC_RESPONSE" | grep -o '"value":[^,}]*' | cut -d':' -f2)
RISK_AMOUNT=$(echo "$CALC_RESPONSE" | grep -o '"amount":[^,}]*' | head -1 | cut -d':' -f2)
PROFIT_AMOUNT=$(echo "$CALC_RESPONSE" | grep -o '"amount":[^,}]*' | tail -1 | cut -d':' -f2)
RR_RATIO=$(echo "$CALC_RESPONSE" | grep -o '"riskRewardRatio":[^,}]*' | cut -d':' -f2)

echo "📈 Dados extraídos para salvar:"
echo "   Position Value: $POSITION_VALUE"
echo "   Risk Amount: $RISK_AMOUNT" 
echo "   Profit Amount: $PROFIT_AMOUNT"
echo "   R/R Ratio: $RR_RATIO"

# Agora salvar o trade completo
echo ""
echo "💾 Salvando trade completo..."

# Usar dados reais do exemplo problemático
TRADE_DATA="{
  \"exchange\": \"bingx\",
  \"symbol\": \"BTCUSDT\",
  \"direction\": \"long\",
  \"entryPrice\": 106589,
  \"stopLoss\": 106000,
  \"targetPrice\": 119999,
  \"accountSize\": 2458,
  \"riskPercent\": 2,
  \"positionSize\": $POSITION_VALUE,
  \"riskAmount\": $RISK_AMOUNT,
  \"rewardAmount\": $PROFIT_AMOUNT,
  \"riskRewardRatio\": $RR_RATIO,
  \"currentPrice\": 107007.90,
  \"calculationData\": {
    \"takeProfits\": [
      {\"level\": 1, \"percentage\": 25, \"price\": 109941.5, \"profit\": 279.81},
      {\"level\": 2, \"percentage\": 50, \"price\": 113294, \"profit\": 559.62},
      {\"level\": 3, \"percentage\": 75, \"price\": 116646.5, \"profit\": 839.43},
      {\"level\": 4, \"percentage\": 100, \"price\": 119999, \"profit\": 1119.25}
    ],
    \"positionSize\": 0.0834634974533107,
    \"positionValue\": $POSITION_VALUE,
    \"riskAmount\": $RISK_AMOUNT,
    \"profitAmount\": $PROFIT_AMOUNT,
    \"riskRewardRatio\": $RR_RATIO
  }
}"

SAVE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/trades/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$TRADE_DATA")

echo "💾 Resposta do salvamento:"
echo "$SAVE_RESPONSE"

echo ""
echo "✅ Teste completo concluído!"
echo ""
echo "🔍 Agora verifique o painel admin para confirmar que:"
echo "   ✓ R/R não está N/A"
echo "   ✓ Posição tem valores corretos"
echo "   ✓ Potencial lucro está preenchido"
echo "   ✓ TPs parciais aparecem na seção de preços"
echo ""
echo "🌐 Acesse: http://localhost:3000/admin"