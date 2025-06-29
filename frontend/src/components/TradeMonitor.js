import React, { useState, useEffect, useRef } from 'react';
import TradeHistory from './TradeHistory';
import '../styles/TradeHistory.css';

const TradeMonitor = ({ 
  currentPrice, 
  entryPrice, 
  stopLoss, 
  targets, 
  tradeType, 
  symbol,
  onAlert 
}) => {
  const [alerts, setAlerts] = useState([]);
  const [triggeredLevels, setTriggeredLevels] = useState(new Set());
  const [monitoringStarted, setMonitoringStarted] = useState(false);
  const [initialPrices, setInitialPrices] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const prevPriceRef = useRef(currentPrice);
  const audioContextRef = useRef(null);

  // Inicializar monitoramento
  useEffect(() => {
    if (!monitoringStarted && currentPrice && entryPrice) {
      setInitialPrices({
        current: currentPrice,
        entry: entryPrice,
        stop: stopLoss,
        targets: targets.map(t => t.price)
      });
      setMonitoringStarted(true);
    }
  }, [currentPrice, entryPrice, stopLoss, targets, monitoringStarted]);

  // Inicializar contexto de áudio
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Som de alerta
  const playAlert = (frequency = 800, duration = 200) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
  };

  // LÓGICA DE MONITORAMENTO INTELIGENTE
  useEffect(() => {
    if (!currentPrice || !entryPrice || !monitoringStarted || !initialPrices) return;

    const isLong = tradeType === 'long';
    const newAlerts = [];
    const prevPrice = prevPriceRef.current || initialPrices.current;

    // ENTRADA - Verifica cruzamento inteligente
    if (!triggeredLevels.has('entry')) {
      let crossedEntry = false;
      
      if (isLong) {
        // LONG: preço subindo deve atingir entrada vindo de baixo
        crossedEntry = (prevPrice < entryPrice && currentPrice >= entryPrice) ||
                      (prevPrice > entryPrice && currentPrice <= entryPrice);
      } else {
        // SHORT: preço descendo deve atingir entrada vindo de cima  
        crossedEntry = (prevPrice > entryPrice && currentPrice <= entryPrice) ||
                      (prevPrice < entryPrice && currentPrice >= entryPrice);
      }
      
      if (crossedEntry) {
        const alert = {
          id: Date.now(),
          type: 'success',
          level: 'entry',
          message: `🎯 ENTRADA ATINGIDA! ${symbol?.symbol || ''} @ $${currentPrice.toFixed(4)}`,
          timestamp: new Date(),
          price: currentPrice,
          direction: isLong ? 'LONG' : 'SHORT'
        };
        
        newAlerts.push(alert);
        setTriggeredLevels(prev => new Set(prev).add('entry'));
        playAlert(1000, 300);
        onAlert(alert);
      }
    }

    // STOP LOSS - Verifica cruzamento de risco
    if (!triggeredLevels.has('stop')) {
      let crossedStop = false;
      
      if (isLong) {
        // LONG: stop é atingido quando preço cai abaixo do stop
        crossedStop = (prevPrice > stopLoss && currentPrice <= stopLoss);
      } else {
        // SHORT: stop é atingido quando preço sobe acima do stop
        crossedStop = (prevPrice < stopLoss && currentPrice >= stopLoss);
      }
      
      if (crossedStop) {
        const lossAmount = Math.abs((currentPrice - entryPrice) * (100 / entryPrice)).toFixed(2);
        const alert = {
          id: Date.now() + 1,
          type: 'danger',
          level: 'stop',
          message: `🛑 STOP LOSS ATIVADO! ${symbol?.symbol || ''} @ $${currentPrice.toFixed(4)} (Perda: ${lossAmount}%)`,
          timestamp: new Date(),
          price: currentPrice,
          loss: lossAmount
        };
        
        newAlerts.push(alert);
        setTriggeredLevels(prev => new Set(prev).add('stop'));
        playAlert(400, 600);
        onAlert(alert);
      }
    }

    // ALVOS - Verifica cruzamento de lucro
    targets.forEach((target, index) => {
      const targetKey = `target_${index}`;
      
      if (!triggeredLevels.has(targetKey)) {
        let crossedTarget = false;
        
        if (isLong) {
          // LONG: alvo é atingido quando preço sobe acima do alvo
          crossedTarget = (prevPrice < target.price && currentPrice >= target.price);
        } else {
          // SHORT: alvo é atingido quando preço desce abaixo do alvo  
          crossedTarget = (prevPrice > target.price && currentPrice <= target.price);
        }
        
        if (crossedTarget) {
          const profitAmount = Math.abs((currentPrice - entryPrice) * (100 / entryPrice)).toFixed(2);
          const alert = {
            id: Date.now() + index + 2,
            type: 'success',
            level: targetKey,
            message: `🎯 ${target.level} ATINGIDO! ${symbol?.symbol || ''} @ $${currentPrice.toFixed(4)} (Lucro: ${profitAmount}%)`,
            timestamp: new Date(),
            price: currentPrice,
            target: target,
            profit: profitAmount
          };
          
          newAlerts.push(alert);
          setTriggeredLevels(prev => new Set(prev).add(targetKey));
          playAlert(1200, 400);
          onAlert(alert);
        }
      }
    });

    // Alertas de proximidade (quando está chegando perto)
    if (!triggeredLevels.has('entry_near')) {
      const distanceToEntry = Math.abs((currentPrice - entryPrice) / entryPrice * 100);
      if (distanceToEntry <= 0.5 && distanceToEntry > 0.1) { // Entre 0.1% e 0.5% de distância
        const alert = {
          id: Date.now() + 100,
          type: 'warning',
          level: 'entry_near',
          message: `⚠️ Aproximando da ENTRADA! ${symbol?.symbol || ''} @ $${currentPrice.toFixed(4)} (${distanceToEntry.toFixed(2)}% de distância)`,
          timestamp: new Date(),
          price: currentPrice
        };
        
        newAlerts.push(alert);
        setTriggeredLevels(prev => new Set(prev).add('entry_near'));
        onAlert(alert);
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 15)); // Manter 15 alertas
    }

    // Atualizar preço anterior para próxima comparação
    prevPriceRef.current = currentPrice;
  }, [currentPrice, entryPrice, stopLoss, targets, tradeType, symbol, triggeredLevels, onAlert, monitoringStarted, initialPrices]);

  const calculateDistance = (price1, price2) => {
    const distance = Math.abs(price1 - price2);
    const percentage = ((distance / price1) * 100);
    return { distance, percentage };
  };

  const getStatusForLevel = (levelPrice, levelType) => {
    if (!currentPrice) return { status: 'waiting', distance: null };
    
    const isLong = tradeType === 'long';
    const { distance, percentage } = calculateDistance(currentPrice, levelPrice);
    
    let status = 'waiting';
    let color = '#6c757d';
    
    if (levelType === 'entry') {
      if (Math.abs(currentPrice - levelPrice) <= levelPrice * 0.001) {
        status = 'hit';
        color = '#28a745';
      } else if (percentage <= 1) {
        status = 'near';
        color = '#ffc107';
      }
    } else if (levelType === 'stop') {
      const stopHit = isLong ? currentPrice <= levelPrice : currentPrice >= levelPrice;
      if (stopHit) {
        status = 'hit';
        color = '#dc3545';
      } else if (percentage <= 2) {
        status = 'near';
        color = '#fd7e14';
      }
    } else if (levelType === 'target') {
      const targetHit = isLong ? currentPrice >= levelPrice : currentPrice <= levelPrice;
      if (targetHit) {
        status = 'hit';
        color = '#28a745';
      } else if (percentage <= 1.5) {
        status = 'near';
        color = '#20c997';
      }
    }
    
    return { status, distance: percentage, color };
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const resetMonitor = () => {
    setAlerts([]);
    setTriggeredLevels(new Set());
    setMonitoringStarted(false);
    setInitialPrices(null);
  };

  if (!currentPrice || !entryPrice) {
    return (
      <div className="trade-monitor">
        <div className="monitor-header">
          <h4>📡 Monitor de Trade</h4>
          <div className="monitor-status offline">
            ⚪ Aguardando dados...
          </div>
        </div>
      </div>
    );
  }

  const entryStatus = getStatusForLevel(entryPrice, 'entry');
  const stopStatus = getStatusForLevel(stopLoss, 'stop');

  return (
    <div className="trade-monitor">
      <div className="monitor-header">
        <h4>📡 Monitor de Trade</h4>
        <div className="monitor-status online">
          🟢 Ativo - {symbol?.symbol || 'N/A'}
        </div>
        <div className="monitor-controls">
          <button className="btn-small secondary" onClick={clearAlerts}>
            🗑️ Limpar
          </button>
          <button className="btn-small warning" onClick={resetMonitor}>
            🔄 Reset
          </button>
          {alerts.length > 0 && (
            <button className="btn-small primary" onClick={() => setShowHistory(true)}>
              📊 Histórico
            </button>
          )}
        </div>
      </div>

      <div className="current-price-display">
        <div className="price-label">Preço Atual</div>
        <div className="price-value">
          ${currentPrice.toFixed(4)}
          <span className={`price-change ${currentPrice > prevPriceRef.current ? 'up' : 'down'}`}>
            {currentPrice > prevPriceRef.current ? '↗️' : currentPrice < prevPriceRef.current ? '↘️' : '➡️'}
          </span>
        </div>
      </div>

      <div className="levels-monitor">
        <h5>📊 Níveis Monitorados</h5>
        
        {/* Entrada */}
        <div className={`level-item ${entryStatus.status}`}>
          <div className="level-info">
            <span className="level-label">🟢 Entrada</span>
            <span className="level-price">${entryPrice.toFixed(4)}</span>
          </div>
          <div className="level-status" style={{ color: entryStatus.color }}>
            {entryStatus.status === 'hit' ? '✅ Atingido' : 
             entryStatus.status === 'near' ? `⚠️ ${entryStatus.distance.toFixed(2)}%` :
             `📍 ${entryStatus.distance.toFixed(2)}%`}
          </div>
        </div>

        {/* Stop Loss */}
        <div className={`level-item ${stopStatus.status}`}>
          <div className="level-info">
            <span className="level-label">🛑 Stop Loss</span>
            <span className="level-price">${stopLoss.toFixed(4)}</span>
          </div>
          <div className="level-status" style={{ color: stopStatus.color }}>
            {stopStatus.status === 'hit' ? '❌ Atingido' : 
             stopStatus.status === 'near' ? `⚠️ ${stopStatus.distance.toFixed(2)}%` :
             `🛡️ ${stopStatus.distance.toFixed(2)}%`}
          </div>
        </div>

        {/* Alvos */}
        {targets.map((target, index) => {
          const targetStatus = getStatusForLevel(target.price, 'target');
          return (
            <div key={index} className={`level-item ${targetStatus.status}`}>
              <div className="level-info">
                <span className="level-label">🎯 {target.level}</span>
                <span className="level-price">${target.price.toFixed(4)}</span>
              </div>
              <div className="level-status" style={{ color: targetStatus.color }}>
                {targetStatus.status === 'hit' ? '✅ Atingido' : 
                 targetStatus.status === 'near' ? `🔥 ${targetStatus.distance.toFixed(2)}%` :
                 `🎯 ${targetStatus.distance.toFixed(2)}%`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico de Alertas */}
      {alerts.length > 0 && (
        <div className="alerts-history">
          <h5>🚨 Histórico de Alertas</h5>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.type}`}>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  {alert.timestamp.toLocaleTimeString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Histórico Detalhado */}
      {showHistory && (
        <TradeHistory
          alerts={alerts}
          onClose={() => setShowHistory(false)}
          formData={{
            stopLoss: stopLoss,
            tradeType: tradeType,
            accountSize: "10000", // Valor padrão - pode ser passado como prop
            riskPercent: "2",
            positionSize: "100",
            exitPrice: targets && targets.length > 0 ? targets[targets.length - 1].price : null
          }}
          fixedEntryPrice={entryPrice}
          currentPrice={currentPrice}
          results={{
            position: { size: 100, value: 1000 },
            analysis: { riskRewardRatio: 3, riskLevel: 'BOM' },
            risk: { amount: 50 },
            profit: { amount: 150, percentage: 15 }
          }}
          selectedSymbol={symbol}
          selectedExchange={{ name: 'Demo Exchange' }}
        />
      )}
    </div>
  );
};

export default TradeMonitor;