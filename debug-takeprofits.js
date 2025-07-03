// Script para debugar take profits no console do browser
// Execute no console do navegador na página do admin

// Dados de teste
const testData = {
  calculation_data: '{"takeProfits":[{"level":1,"percentage":25,"price":109941.5,"profit":279.81},{"level":2,"percentage":50,"price":113294,"profit":559.62},{"level":3,"percentage":75,"price":116646.5,"profit":839.43},{"level":4,"percentage":100,"price":119999,"profit":1119.25}],"positionSize":0.0834634974533107,"positionValue":8896.290730050934}'
};

// Testar parsing
try {
  const calcData = JSON.parse(testData.calculation_data);
  const takeProfits = calcData.takeProfits || [];
  
  console.log('🧮 Dados de cálculo:', calcData);
  console.log('🎯 Take Profits:', takeProfits);
  console.log('📊 Número de TPs:', takeProfits.length);
  
  if (takeProfits.length > 0) {
    console.log('✅ Take profits encontrados!');
    takeProfits.forEach((tp, idx) => {
      console.log(`TP${tp.level || idx + 1}: $${tp.price} (${tp.percentage}% - $${tp.profit})`);
    });
  } else {
    console.log('❌ Nenhum take profit encontrado');
  }
  
} catch (e) {
  console.error('❌ Erro ao parsear calculation_data:', e);
}

// Verificar se elementos existem no DOM
console.log('🔍 Verificando elementos no DOM...');
const tpElements = document.querySelectorAll('.take-profits');
console.log('Take-profits elements:', tpElements.length);

const tpItems = document.querySelectorAll('.tp-item');
console.log('TP items:', tpItems.length);

if (tpElements.length === 0) {
  console.log('❌ Elementos .take-profits não encontrados no DOM');
} else {
  console.log('✅ Elementos .take-profits encontrados');
}