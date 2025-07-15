import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import ProfitPrintGenerator from './ProfitPrintGenerator';
import { formatPrice, formatCurrency, formatPercentage, formatQuantity } from '../utils/numberFormatter';

const EnhancedResults = ({ results, selectedSymbol, selectedExchange, formData, currentPrice }) => {
  const [fixedEntryPrice, setFixedEntryPrice] = useState(null);
  
  // Obter símbolo para formatação
  const symbolStr = selectedSymbol?.symbol || selectedSymbol?.baseAsset + selectedSymbol?.quoteAsset || 'BTCUSDT';
  
  // Função para classificar nível de risco
  const getRiskLevel = (ratio) => {
    if (!ratio || ratio <= 0) return 'INVÁLIDO';
    if (ratio < 1) return 'ALTO RISCO';
    if (ratio < 1.5) return 'RISCO MODERADO';
    if (ratio < 2) return 'RISCO BAIXO';
    if (ratio < 3) return 'CONSERVADOR';
    return 'MUITO CONSERVADOR';
  };
  
  // Fixar preço de entrada quando cálculo é feito - NÃO MUDA MAIS
  useEffect(() => {
    if (results && formData && formData.entryPrice && !fixedEntryPrice) {
      const entryPrice = parseFloat(formData.entryPrice);
      if (!isNaN(entryPrice)) {
        setFixedEntryPrice(entryPrice);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Preço de entrada FIXADO em:', entryPrice);
        }
      }
    }
  }, [results, formData]);

  const calculateProfitTargets = () => {
    // Verificar múltiplos campos para alvo final
    const finalTarget = formData.exitPrice || formData.targetPrice || formData.target;
    
    if (!fixedEntryPrice || !finalTarget) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Alvos não calculados - dados insuficientes');
      }
      return [];
    }
    
    const entry = fixedEntryPrice;
    const stop = parseFloat(formData.stopLoss);
    const finalTargetValue = parseFloat(finalTarget);
    const isLong = (formData.tradeType === 'long') || (formData.direction === 'LONG');
    
    // Validar que o risco não ultrapasse o limite selecionado
    const riskLimit = parseFloat(formData.riskPercent || 2);
    const accountSize = parseFloat(formData.accountSize);
    const maxRiskAmount = (accountSize * riskLimit) / 100;
    const currentRisk = Math.abs((entry - stop) * displayResults.positionSize);
    
    if (currentRisk > maxRiskAmount) {
      console.warn('⚠️ RISCO EXCEDIDO:', {
        currentRisk: currentRisk.toFixed(2),
        maxAllowed: maxRiskAmount.toFixed(2),
        limit: riskLimit + '%'
      });
    }
    
    const risk = Math.abs(entry - stop);
    const totalMove = Math.abs(finalTargetValue - entry);
    
    // Calcular pontos estratégicos baseados na direção do trade
    const targets = [];
    
    if (isLong) {
      // LONG: alvos ACIMA da entrada até o alvo final
      const alvo1 = entry + (totalMove * 0.33); // 33% do caminho
      const alvo2 = entry + (totalMove * 0.66); // 66% do caminho
      const alvo3 = finalTargetValue; // Alvo final
      
      targets.push({
        level: "Alvo 1 (33%)",
        price: alvo1,
        percentage: 30,
        riskReward: ((alvo1 - entry) / risk).toFixed(1),
        description: "Primeira realização (30%) - Garantir lucro inicial"
      });
      targets.push({
        level: "Alvo 2 (66%)",
        price: alvo2,
        percentage: 50,
        riskReward: ((alvo2 - entry) / risk).toFixed(1),
        description: "Realização principal (50%) - Capturar movimento forte"
      });
      targets.push({
        level: "Alvo Final",
        price: alvo3,
        percentage: 20,
        riskReward: ((alvo3 - entry) / risk).toFixed(1),
        description: "Realização final (20%) - Maximizar lucro"
      });
    } else {
      // SHORT: alvos ABAIXO da entrada até o alvo final
      const alvo1 = entry - (totalMove * 0.33); // 33% do caminho
      const alvo2 = entry - (totalMove * 0.66); // 66% do caminho
      const alvo3 = finalTargetValue; // Alvo final
      
      targets.push({
        level: "Alvo 1 (33%)",
        price: alvo1,
        percentage: 30,
        riskReward: ((entry - alvo1) / risk).toFixed(1),
        description: "Primeira realização (30%) - Garantir lucro inicial"
      });
      targets.push({
        level: "Alvo 2 (66%)",
        price: alvo2,
        percentage: 50,
        riskReward: ((entry - alvo2) / risk).toFixed(1),
        description: "Realização principal (50%) - Capturar movimento forte"
      });
      targets.push({
        level: "Alvo Final",
        price: alvo3,
        percentage: 20,
        riskReward: ((entry - alvo3) / risk).toFixed(1),
        description: "Realização final (20%) - Maximizar lucro"
      });
    }
    
    if (process.env.NODE_ENV === 'development' && targets.length > 0) {
      console.log('✅ Alvos calculados:', targets.length);
    }
    return targets;
  };

  const calculateWinRateNeeded = (riskReward) => {
    // Fórmula: Win Rate = Risk / (Risk + Reward)
    const winRateNeeded = (1 / (1 + riskReward)) * 100;
    
    // Análise detalhada
    const analysis = {
      breakeven: winRateNeeded,
      profitable: winRateNeeded + 10, // 10% acima do breakeven para lucro
      conservative: winRateNeeded + 20, // 20% acima para estratégia conservadora
      classification: getWinRateClassification(winRateNeeded),
      recommendation: getWinRateRecommendation(winRateNeeded, riskReward)
    };
    
    return analysis;
  };

  const getWinRateClassification = (winRate) => {
    if (winRate <= 33) return { level: 'EXCELENTE', color: '#28a745', desc: 'Muito factível' };
    if (winRate <= 50) return { level: 'BOM', color: '#20c997', desc: 'Factível' };
    if (winRate <= 60) return { level: 'MODERADO', color: '#ffc107', desc: 'Desafiador' };
    if (winRate <= 70) return { level: 'DIFÍCIL', color: '#fd7e14', desc: 'Muito desafiador' };
    return { level: 'EXTREMO', color: '#dc3545', desc: 'Quase impossível' };
  };

  const getWinRateRecommendation = (winRate, riskReward) => {
    if (winRate <= 33) {
      return `Excelente R/R! Com ${winRate.toFixed(1)}% de taxa de acerto você já tem lucro. Estratégia muito favorável.`;
    } else if (winRate <= 50) {
      return `Bom R/R. Necesário ${winRate.toFixed(1)}% de acerto para breakeven. Factível para traders experientes.`;
    } else if (winRate <= 60) {
      return `R/R moderado. Taxa de ${winRate.toFixed(1)}% é desafiadora. Considere melhorar o ratio para ${(riskReward + 0.5).toFixed(1)}:1.`;
    } else {
      return `R/R muito baixo! Taxa de ${winRate.toFixed(1)}% é muito alta. RECOMENDADO ajustar alvo ou stop para melhorar ratio.`;
    }
  };

  const organizeResultsByType = () => {
    // Usar rewardAmount como lucro potencial no target
    const profitAmount = displayResults.rewardAmount || 0;
    const isProfit = profitAmount > 0;
    // Calcular % correto do lucro em relação ao capital da conta
    const profitPercentage = displayResults.accountSize ? (profitAmount / displayResults.accountSize) * 100 : 0;
    
    const profitLoss = {
      type: isProfit ? 'LUCRO POTENCIAL' : 'PREJUÍZO POTENCIAL',
      amount: profitAmount,
      percentage: profitPercentage,
      color: isProfit ? '#28a745' : '#dc3545',
      icon: isProfit ? '💰' : '📉',
      bgColor: isProfit ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)',
      borderColor: isProfit ? '#28a745' : '#dc3545',
      status: isProfit ? 'positive' : 'negative'
    };
    
    return profitLoss;
  };


  const copyResult = async () => {
    if (!displayResults || displayResults.positionSize === 0) return;

    const resultText = formatEnhancedResultForCopy();
    
    try {
      await navigator.clipboard.writeText(resultText);
      toast.success('Resultado completo copiado!');
    } catch (err) {
      toast.error('Erro ao copiar resultado');
    }
  };

  const formatEnhancedResultForCopy = () => {
    const symbol = selectedSymbol ? selectedSymbol.symbol : 'N/A';
    const exchange = selectedExchange ? selectedExchange.name : 'N/A';
    const profitLoss = organizeResultsByType();
    const targets = calculateProfitTargets();
    
    return `
🎯 ANÁLISE COMPLETA DE RISK MANAGEMENT
📊 Corretora: ${exchange} | Símbolo: ${symbol}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

📍 PONTOS DE OPERAÇÃO:
🟢 Entrada: $${fixedEntryPrice ? formatPrice(fixedEntryPrice, symbolStr) : 'N/A'}
🎯 Saída: $${formData?.exitPrice || 'N/A'}
🛑 Stop Loss: $${formData?.stopLoss || 'N/A'}
💰 Risco por Trade: ${formData?.riskPercentage || 'N/A'}%

💼 POSIÇÃO:
🪙 Quantidade: ${formatQuantity(displayResults.positionSize)} moedas
💵 Valor Total: ${formatCurrency(displayResults.positionValue)}
📈 Direção: ${displayResults.direction}

${profitLoss.icon} ${profitLoss.type.toUpperCase()}:
💰 Valor: ${formatCurrency(profitLoss.amount)}
📊 Percentual: ${formatPercentage(profitLoss.percentage, 1)} da conta
🛡️ Risco Máximo: ${formatCurrency(displayResults.riskAmount)}

⚖️ ANÁLISE RISK/REWARD:
🎯 Ratio: ${formatPercentage(displayResults.riskRewardRatio, 1).replace('%', '')}/1
📋 Classificação: ${getRiskLevel(displayResults.riskRewardRatio)}

🎯 PONTOS DE REALIZAÇÃO ESTRATÉGICOS:
${targets.map(target => 
  `${target.level}: $${target.price.toFixed(4)} (${target.description})`
).join('\n')}


📱 Generated by BitAcademy Risk Calculator
    `.trim();
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'EXCELENTE': return '#28a745';
      case 'BOM': return '#20c997';  
      case 'ACEITÁVEL': return '#ffc107';
      case 'RUIM': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Criar objeto de resultados padrão se não existir
  const displayResults = results || {
    positionSize: 0,
    positionValue: 0,
    direction: formData?.direction || 'LONG',
    riskAmount: 0,
    riskPercent: 0,
    rewardAmount: 0,
    riskRewardRatio: 0,
    accountSize: parseFloat(formData?.accountSize || 0),
    entryPrice: parseFloat(formData?.entryPrice || 0),
    stopLoss: parseFloat(formData?.stopLoss || 0),
    targetPrice: parseFloat(formData?.targetPrice || formData?.exitPrice || 0)
  };

  // Otimizar cálculos com useMemo para evitar re-renders constantes
  const profitLoss = useMemo(() => organizeResultsByType(), [displayResults, currentPrice, selectedSymbol]);
  
  const targets = useMemo(() => {
    const calculated = calculateProfitTargets();
    if (process.env.NODE_ENV === 'development' && calculated.length === 0) {
      console.log('🔍 No targets calculated');
    }
    return calculated;
  }, [displayResults, fixedEntryPrice, formData.stopLoss, formData.exitPrice, formData.targetPrice, formData.target]);


  return (
    <div className="enhanced-results">
      <div className="results-grid">
        
        {/* 1. POSIÇÃO */}
        <div className="section-card">
          <h4 className="section-card-title">💼 Detalhes da Posição</h4>
          <div className="position-grid-vertical">
            <div className="position-item">
              <span className="item-label">Quantidade:</span>
              <span className="item-value">{displayResults.positionSize ? formatQuantity(displayResults.positionSize) : '0.0000'}</span>
            </div>
            <div className="position-item">
              <span className="item-label">Valor Total:</span>
              <span className="item-value">{displayResults.positionValue ? formatCurrency(displayResults.positionValue) : '$0.00'}</span>
            </div>
            <div className="position-item">
              <span className="item-label">Direção:</span>
              <span className={`item-value direction ${displayResults.direction.toLowerCase()}`}>
                {displayResults.direction} {displayResults.direction === 'LONG' ? '📈' : '📉'}
              </span>
            </div>
            <div className="position-item">
              <span className="item-label">Tamanho da Conta:</span>
              <span className="item-value">${formData?.accountSize || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* 2. GESTÃO DE RISCO */}
        <div className="section-card">
          <h4 className="section-card-title">🛡️ Gestão de Risco</h4>
          
          {/* Risk & Reward Detalhado */}
          <div className="risk-reward-detailed">
            <div className="rr-section">
              <div className="rr-grid">
                <div className="rr-card risk">
                  <div className="rr-card-label">Risco Máximo</div>
                  <div className="rr-card-value">-{displayResults.riskAmount ? formatCurrency(displayResults.riskAmount) : '$0.00'}</div>
                  <div className="rr-card-desc">{displayResults.riskPercent ? formatPercentage(displayResults.riskPercent, 1) : '0.0%'} da conta</div>
                </div>
                <div className="rr-card reward">
                  <div className="rr-card-label">Potencial de Lucro</div>
                  <div className="rr-card-value">+{formatCurrency(profitLoss.amount)}</div>
                  <div className="rr-card-desc">{formatPercentage(profitLoss.percentage, 1)} da conta</div>
                </div>
              </div>
            </div>
            
            <div className="rr-section">
              <h5>⚖️ Avaliação Risk/Reward</h5>
              <div className="rr-analysis-card">
                <div className="rr-ratio-big">
                  <span className="ratio-number">{displayResults.riskRewardRatio ? displayResults.riskRewardRatio.toFixed(1) : '0.0'}</span>
                  <span className="ratio-separator">:</span>
                  <span className="ratio-base">1</span>
                </div>
                <div className="rr-classification">
                  <span className="classification-label">Classificação:</span>
                  <span className="classification-value" style={{ color: getRiskLevelColor(getRiskLevel(displayResults.riskRewardRatio || 0)) }}>
                    {getRiskLevel(displayResults.riskRewardRatio || 0)}
                  </span>
                </div>
                <div className="rr-explanation">
                  Para cada $1 arriscado, o potencial é de ${displayResults.riskRewardRatio ? displayResults.riskRewardRatio.toFixed(1) : '0.0'} de lucro
                </div>
                {displayResults.riskRewardRatio > 0 && (
                  <div className="win-rate-needed" style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', border: `1px solid ${calculateWinRateNeeded(displayResults.riskRewardRatio).classification.color}` }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.85em' }}>Taxa de Acerto Necessária:</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.75em' }}>
                      <div>
                        <span style={{ color: '#6c757d' }}>Breakeven:</span><br/>
                        <strong>{calculateWinRateNeeded(displayResults.riskRewardRatio).breakeven.toFixed(1)}%</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6c757d' }}>Lucro:</span><br/>
                        <strong>{calculateWinRateNeeded(displayResults.riskRewardRatio).profitable.toFixed(1)}%</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6c757d' }}>Conservador:</span><br/>
                        <strong>{calculateWinRateNeeded(displayResults.riskRewardRatio).conservative.toFixed(1)}%</strong>
                      </div>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.7em', fontWeight: '600', color: calculateWinRateNeeded(displayResults.riskRewardRatio).classification.color }}>
                      {calculateWinRateNeeded(displayResults.riskRewardRatio).classification.level} - {calculateWinRateNeeded(displayResults.riskRewardRatio).classification.desc}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. PONTOS DA OPERAÇÃO */}
        <div className="section-card">
          <h4 className="section-card-title">📍 Pontos da Operação</h4>
          <div className="points-layout">
            <div className="points-main">
              <div className="point-item entry">
                <span className="point-icon">🟢</span>
                <span className="point-label">Entrada</span>
                <span className="point-price">${fixedEntryPrice ? formatPrice(fixedEntryPrice, symbolStr) : 'N/A'}</span>
              </div>
              <div className="point-item target">
                <span className="point-icon">🎯</span>
                <span className="point-label">Alvo Final</span>
                <span className="point-price">${formData?.exitPrice || formData?.targetPrice || 'N/A'}</span>
              </div>
              <div className="point-item stop">
                <span className="point-icon">🛑</span>
                <span className="point-label">Stop Loss</span>
                <span className="point-price">${formData?.stopLoss || 'N/A'}</span>
              </div>
            </div>
            
            {/* Alvos de Realização Baseados na Entrada */}
            <div className="targets-smart">
              <h5>🎯 Alvos Inteligentes de Saída</h5>
              <div className="targets-list">
                {targets.map((target, index) => (
                  <div key={index} className="target-item-smart">
                    <div className="target-header-smart">
                      <div className="target-level">{target.level}</div>
                      <div className="target-price">${formatPrice(target.price, symbolStr)}</div>
                      <div className="target-rr">R/R {target.riskReward}:1</div>
                    </div>
                    <div className="target-desc">{target.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
};

export default EnhancedResults;