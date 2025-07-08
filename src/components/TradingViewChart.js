import React, { useState, useEffect, useRef } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

const TradingViewChart = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  entryPrice = null,
  stopLoss = null,
  targetPrice = null,
  tradeDirection = null,
  currentPrice = null
}) => {
  const [chartReady, setChartReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const chartContainerRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [realChartRange, setRealChartRange] = useState({ min: 0, max: 0 });
  const [priceScaleData, setPriceScaleData] = useState([]);
  const iframeRef = useRef(null);

  // Configurações avançadas do widget TradingView com linhas de trade
  const widgetConfig = {
    symbol: symbol,
    autosize: true,
    interval: "5",
    timezone: "America/Sao_Paulo",
    theme: theme === "dark" ? "dark" : "light",
    locale: "pt_BR",
    hide_side_toolbar: false,
    allow_symbol_change: false,
    save_image: false,
    container_id: `tradingview_${symbol}`,
    studies: entryPrice ? [
      "MASimple@tv-basicstudies",
    ] : [],
    // Configurações para desenhos automáticos
    drawings_access: {
      type: "black",
      tools: [
        { name: "LineToolHorzLine" }
      ]
    }
  };

  // Effect para monitorar dimensões do gráfico
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartReady(true);
    }, 3000);

    // Monitorar redimensionamento e dimensões
    const handleResize = () => {
      if (chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        setChartDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Observer para mudanças no DOM
    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    window.addEventListener('resize', handleResize);
    // Delay para garantir que o gráfico carregou
    setTimeout(handleResize, 1000);
    setTimeout(handleResize, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Função para analisar visualmente a escala de preços do TradingView
  const analyzePriceScale = async () => {
    console.log('🎯 analyzePriceScale INICIANDO...', {
      currentPrice,
      entryPrice,
      stopLoss,
      targetPrice,
      chartContainer: !!chartContainerRef.current
    });
    
    try {
      const iframe = chartContainerRef.current?.querySelector('iframe');
      console.log('🎯 iframe encontrado:', !!iframe);
      if (!iframe) {
        console.log('❌ Nenhum iframe encontrado no container');
        return null;
      }

      // Método alternativo: usar intersecção baseada no preço atual conhecido
      if (currentPrice) {
        const currentPriceFloat = parseFloat(currentPrice);
        const containerRect = chartContainerRef.current.getBoundingClientRect();
        
        // Tentar detectar a posição real do preço atual no gráfico
        let estimatedCurrentY = containerRect.height * 0.5; // Default: meio do gráfico
        
        // Método 1: Procurar pelo preço atual exibido no gráfico
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const priceText = Math.floor(currentPriceFloat).toString();
            const elements = Array.from(iframeDoc.querySelectorAll('*'));
            
            for (let element of elements) {
              const text = element.textContent || '';
              if (text.includes(priceText) && text.length < 20) {
                const rect = element.getBoundingClientRect();
                if (rect.height > 0 && rect.width > 0) {
                  estimatedCurrentY = rect.top + rect.height / 2;
                  console.log('🎯 Posição real do preço atual detectada:', estimatedCurrentY);
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.log('Não foi possível detectar posição real, usando estimativa');
        }
        
        // Criar dados sintéticos da escala baseados no preço atual e preços de trade
        const syntheticScale = [];
        
        // Coletar todos os preços relevantes
        const allPrices = [currentPriceFloat];
        if (entryPrice) allPrices.push(parseFloat(entryPrice));
        if (stopLoss) allPrices.push(parseFloat(stopLoss));
        if (targetPrice) allPrices.push(parseFloat(targetPrice));
        
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        const priceRange = maxPrice - minPrice;
        
        // Se há um range significativo nos preços de trade, usar isso
        if (priceRange > currentPriceFloat * 0.01) { // Mais de 1% de diferença
          // Criar escala que cobre todo o range dos preços + margem
          const margin = priceRange * 0.2; // 20% de margem
          const scaledMinPrice = minPrice - margin;
          const scaledMaxPrice = maxPrice + margin;
          const totalRange = scaledMaxPrice - scaledMinPrice;
          
          // Estimar onde o preço atual aparece no gráfico
          const currentPriceRatio = (currentPriceFloat - scaledMinPrice) / totalRange;
          const currentPriceY = containerRect.height * (1 - currentPriceRatio); // Inverter Y
          
          // Criar 7 pontos da escala
          for (let i = 0; i <= 6; i++) {
            const priceRatio = i / 6;
            const price = scaledMinPrice + (priceRatio * totalRange);
            const y = containerRect.height * (1 - priceRatio);
            syntheticScale.push({ price, y });
          }
          
          console.log('🎯 Escala sintética baseada no range de trade:', {
            minPrice: scaledMinPrice,
            maxPrice: scaledMaxPrice,
            currentPriceY,
            estimatedCurrentY
          });
        } else {
          // Fallback: usar método original centrado no preço atual
          const priceStep = currentPriceFloat * 0.015; // 1.5% steps (mais fino)
          
          for (let i = -3; i <= 3; i++) {
            const price = currentPriceFloat + (i * priceStep);
            const y = estimatedCurrentY - (i * containerRect.height * 0.08); // 8% da altura por step
            syntheticScale.push({ price, y });
          }
        }
        
        console.log('Escala sintética criada baseada no preço atual:', syntheticScale);
        setPriceScaleData(syntheticScale);
        return syntheticScale;
      }
      
      // Fallback: tentar acessar iframe (pode ser bloqueado por CORS)
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Procurar elementos que contenham preços
          const priceElements = iframeDoc.querySelectorAll('*');
          const detectedPrices = [];
          
          for (let element of priceElements) {
            const text = element.textContent || element.innerText || '';
            const priceMatch = text.match(/^[\d,]+\.?\d{0,4}$/);
            
            if (priceMatch && text.length < 15) { // Filtrar textos muito longos
              const rect = element.getBoundingClientRect();
              const price = parseFloat(priceMatch[0].replace(/,/g, ''));
              
              if (price > 0 && rect.width > 0 && rect.height > 0) {
                detectedPrices.push({
                  price,
                  y: rect.top + rect.height / 2
                });
              }
            }
          }
          
          if (detectedPrices.length >= 2) {
            // Ordenar por posição Y e remover duplicatas
            const uniquePrices = detectedPrices.filter((item, index, arr) => 
              arr.findIndex(other => Math.abs(other.price - item.price) < item.price * 0.001) === index
            );
            uniquePrices.sort((a, b) => a.y - b.y);
            
            console.log('Preços detectados na escala:', uniquePrices);
            setPriceScaleData(uniquePrices);
            return uniquePrices;
          }
        }
      } catch (corsError) {
        console.log('CORS impediu acesso ao iframe, usando dados sintéticos');
      }
      
    } catch (error) {
      console.log('Erro ao analisar escala de preços:', error);
    }
    
    return null;
  };

  // Função para interpolar preço baseado nos dados da escala real
  const interpolatePricePosition = (targetPrice) => {
    if (priceScaleData.length < 2) return null;
    
    const target = parseFloat(targetPrice);
    
    // Encontrar os dois pontos mais próximos na escala
    let lowerPoint = null;
    let upperPoint = null;
    
    for (let i = 0; i < priceScaleData.length - 1; i++) {
      const current = priceScaleData[i];
      const next = priceScaleData[i + 1];
      
      if (target >= current.price && target <= next.price) {
        lowerPoint = current;
        upperPoint = next;
        break;
      }
    }
    
    // Se não encontrou dentro do range, usar extrapolação
    if (!lowerPoint || !upperPoint) {
      if (target < priceScaleData[0].price) {
        // Extrapolação abaixo
        lowerPoint = priceScaleData[1];
        upperPoint = priceScaleData[0];
      } else {
        // Extrapolação acima
        lowerPoint = priceScaleData[priceScaleData.length - 2];
        upperPoint = priceScaleData[priceScaleData.length - 1];
      }
    }
    
    // Interpolação linear
    const priceRange = upperPoint.price - lowerPoint.price;
    const yRange = upperPoint.y - lowerPoint.y;
    const priceRatio = (target - lowerPoint.price) / priceRange;
    const interpolatedY = lowerPoint.y + (priceRatio * yRange);
    
    console.log('Interpolação de preço:', {
      target,
      lowerPoint,
      upperPoint,
      interpolatedY
    });
    
    return interpolatedY;
  };

  // Tentar detectar o range real do gráfico TradingView
  const detectRealChartRange = () => {
    if (!currentPrice) return null;
    
    // Método 1: Tentar acessar API TradingView global (se disponível)
    try {
      if (window.TradingView && window.TradingView.chart) {
        const chart = window.TradingView.chart();
        if (chart && chart.getPriceScale) {
          const priceScale = chart.getPriceScale();
          if (priceScale) {
            const range = {
              min: priceScale.getVisibleRange().from,
              max: priceScale.getVisibleRange().to
            };
            console.log('Range detectado via API TradingView:', range);
            setRealChartRange(range);
            return range;
          }
        }
      }
    } catch (error) {
      console.log('API TradingView não disponível:', error);
    }
    
    // Método 2: Tentar acessar o iframe do TradingView
    try {
      const iframe = chartContainerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        // Tentar comunicar com o iframe
        iframe.contentWindow.postMessage({
          type: 'GET_PRICE_RANGE',
          id: 'price-levels'
        }, '*');
      }
    } catch (error) {
      console.log('Não foi possível acessar iframe TradingView:', error);
    }
    
    // Método 3: Estimativa inteligente baseada no preço atual
    const currentPriceFloat = parseFloat(currentPrice);
    if (currentPriceFloat > 0) {
      // Coletar todos os preços relevantes
      const allPrices = [currentPriceFloat];
      if (entryPrice) allPrices.push(parseFloat(entryPrice));
      if (stopLoss) allPrices.push(parseFloat(stopLoss));
      if (targetPrice) allPrices.push(parseFloat(targetPrice));
      
      const minTradePrice = Math.min(...allPrices);
      const maxTradePrice = Math.max(...allPrices);
      const priceSpread = maxTradePrice - minTradePrice;
      
      // Se há spread significativo entre os preços, usar isso como base
      if (priceSpread > currentPriceFloat * 0.02) { // 2% ou mais de spread
        const margin = priceSpread * 0.2; // 20% de margem
        const estimatedRange = {
          min: minTradePrice - margin,
          max: maxTradePrice + margin
        };
        console.log('Range estimado baseado no spread dos preços:', estimatedRange);
        return estimatedRange;
      } else {
        // Usar range padrão centrado no preço atual
        const volatilityFactor = 0.05; // 5% para cada lado (mais conservador)
        const estimatedRange = {
          min: currentPriceFloat * (1 - volatilityFactor),
          max: currentPriceFloat * (1 + volatilityFactor)
        };
        console.log('Range estimado baseado no preço atual:', estimatedRange);
        return estimatedRange;
      }
    }
    
    return null;
  };

  // Listener para respostas do iframe TradingView
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PRICE_RANGE_RESPONSE') {
        setRealChartRange(event.data.range);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Calcular range de preços usando detecção do range real do gráfico
  const calculatePriceRange = () => {
    // Primeiro: tentar usar o range real detectado do TradingView
    if (realChartRange.min > 0 && realChartRange.max > realChartRange.min) {
      return realChartRange;
    }
    
    // Segundo: usar detecção inteligente baseada no preço atual
    const detectedRange = detectRealChartRange();
    if (detectedRange) {
      return detectedRange;
    }
    
    // Fallback: método original como último recurso
    const prices = [];
    if (currentPrice) prices.push(parseFloat(currentPrice));
    if (entryPrice) prices.push(parseFloat(entryPrice));
    if (stopLoss) prices.push(parseFloat(stopLoss));
    if (targetPrice) prices.push(parseFloat(targetPrice));
    
    if (prices.length === 0) return { min: 0, max: 0 };
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const margin = (maxPrice - minPrice) * 0.15; // 15% margin para fallback
    
    return {
      min: minPrice - margin,
      max: maxPrice + margin
    };
  };

  // Converter preço para posição Y no gráfico com máxima precisão
  const priceToY = (price, chartHeight) => {
    // Método 1: Usar interpolação baseada na escala real detectada
    const interpolatedY = interpolatePricePosition(price);
    if (interpolatedY !== null) {
      console.log('Usando posição interpolada real:', { price, y: interpolatedY });
      return interpolatedY;
    }
    
    // Método 2: Fallback para estimativa
    const range = calculatePriceRange();
    if (range.max === range.min || chartHeight === 0) return chartHeight / 2;
    
    // Normalizar o preço dentro do range (0 a 1)
    const normalizedPrice = (price - range.min) / (range.max - range.min);
    
    // Configurações específicas para o TradingView widget
    const headerHeight = 0; // Sem header agora
    const footerHeight = chartHeight * 0.05; // 5% para footer/controls
    const usableHeight = chartHeight - headerHeight - footerHeight;
    const topOffset = headerHeight;
    
    // Inverter Y porque no CSS, 0 é no topo e preços altos ficam em cima
    const yPosition = topOffset + ((1 - normalizedPrice) * usableHeight);
    
    // Log para debug
    console.log('Usando estimativa de posição:', {
      price,
      range,
      normalizedPrice,
      chartHeight,
      yPosition,
      usableHeight
    });
    
    // Garantir que a posição está dentro dos limites
    return Math.max(topOffset, Math.min(yPosition, chartHeight - footerHeight));
  };

  // Effect para detectar range do gráfico quando carrega
  useEffect(() => {
    console.log('🎯 TradingView Chart Effect - chartReady:', chartReady);
    if (chartReady) {
      console.log('🎯 Iniciando detecção de range e análise de escala...');
      
      // Tentar detectar range real após gráfico carregar
      const detectTimer = setTimeout(() => {
        console.log('🎯 Executando detectRealChartRange...');
        detectRealChartRange();
      }, 2000);
      
      // Tentar analisar escala visual após um delay maior
      const analyzeTimer = setTimeout(() => {
        console.log('🎯 Executando analyzePriceScale...');
        analyzePriceScale();
      }, 4000);
      
      return () => {
        clearTimeout(detectTimer);
        clearTimeout(analyzeTimer);
      };
    }
  }, [chartReady]);

  // Effect para atualizar range quando preços mudam
  useEffect(() => {
    const newRange = calculatePriceRange();
    setPriceRange(newRange);
    
    // Reanalizar escala se mudou significativamente
    if (chartReady && (entryPrice || stopLoss || targetPrice)) {
      const reanalyzeTimer = setTimeout(() => {
        analyzePriceScale();
      }, 1000);
      
      return () => clearTimeout(reanalyzeTimer);
    }
  }, [entryPrice, stopLoss, targetPrice, currentPrice, realChartRange, chartReady]);

  // Componente para renderizar linhas de preço com posicionamento preciso
  const PriceLevelsOverlay = () => {
    console.log('🎯 PriceLevelsOverlay renderizando...', {
      entryPrice,
      stopLoss,
      targetPrice,
      chartDimensions,
      priceScaleData: priceScaleData.length
    });
    
    if (!entryPrice && !stopLoss && !targetPrice) {
      console.log('❌ Nenhum preço fornecido para renderizar linhas');
      return null;
    }
    if (!chartDimensions.height || chartDimensions.height === 0) {
      console.log('❌ Dimensões do gráfico inválidas:', chartDimensions);
      return null;
    }
    
    const levels = [];
    
    if (entryPrice) {
      levels.push({
        price: parseFloat(entryPrice),
        type: 'entry',
        color: '#28a745',
        label: '🟢 Entrada',
        value: `$${parseFloat(entryPrice).toFixed(4)}`
      });
    }
    
    if (stopLoss) {
      levels.push({
        price: parseFloat(stopLoss),
        type: 'stop',
        color: '#dc3545',
        label: '🛑 Stop',
        value: `$${parseFloat(stopLoss).toFixed(4)}`
      });
    }
    
    if (targetPrice) {
      levels.push({
        price: parseFloat(targetPrice),
        type: 'target',
        color: '#17a2b8',
        label: '🎯 Alvo',
        value: `$${parseFloat(targetPrice).toFixed(4)}`
      });
    }
    
    return (
      <div className="price-levels-overlay">
        {levels.map((level, index) => {
          const yPosition = priceToY(level.price, chartDimensions.height);
          
          return (
            <div
              key={index}
              className={`price-level-line ${level.type}`}
              style={{
                borderColor: level.color,
                top: `${yPosition}px`
              }}
            >
              <div className="price-level-label" style={{ backgroundColor: level.color }}>
                <span className="level-icon">{level.label.split(' ')[0]}</span>
                <span className="level-text">{level.label.split(' ')[1]}</span>
                <span className="level-price">{level.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChart = () => {
    try {
      return (
        <AdvancedRealTimeChart
          symbol={widgetConfig.symbol}
          autosize={widgetConfig.autosize}
          interval={widgetConfig.interval}
          timezone={widgetConfig.timezone}
          theme={widgetConfig.theme}
          locale={widgetConfig.locale}
        />
      );
    } catch (error) {
      console.error('TradingView widget error:', error);
      setHasError(true);
      return (
        <div className="chart-error">
          <div>❌ Erro ao carregar gráfico</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
            Verifique a conexão e tente novamente
          </div>
        </div>
      );
    }
  };

  return (
    <div className="tradingview-chart-container" ref={chartContainerRef}>
      {/* Widget TradingView */}
      <div className="chart-widget">
        {hasError ? (
          <div className="chart-error">
            <div>❌ Erro ao carregar gráfico</div>
            <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
              Verifique a conexão e tente novamente
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Price Levels Overlay - Linhas desenhadas no gráfico */}
      {chartReady && <PriceLevelsOverlay />}

      {/* Overlay para loading */}
      {!chartReady && !hasError && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando gráfico...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;