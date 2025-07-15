import React, { useState, useEffect } from 'react';

const CandleTimer = ({ interval = '30' }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [nextCandleTime, setNextCandleTime] = useState('');

  useEffect(() => {
    const calculateTimeToNextCandle = () => {
      // Converter intervalo para minutos
      const getIntervalMinutes = (interval) => {
        switch (interval) {
          case '1': return 1;
          case '3': return 3;
          case '5': return 5;
          case '15': return 15;
          case '30': return 30;
          case '60': return 60;
          case '120': return 120;
          case '180': return 180;
          case '240': return 240;
          case '360': return 360;
          case '720': return 720;
          case '1D': return 1440; // 24 horas
          case '5D': return 7200; // 5 dias
          case '1W': return 10080; // 7 dias
          case '1M': return 43200; // 30 dias
          default: return 30;
        }
      };

      const intervalMinutes = getIntervalMinutes(interval);
      
      // Usar timezone do Brasil (São Paulo)
      const now = new Date();
      const brasilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      // Para intervalos diários, semanal e mensal
      if (interval === '1D') {
        const tomorrow = new Date(brasilTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeDiff = tomorrow.getTime() - brasilTime.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        setNextCandleTime(tomorrow.toLocaleTimeString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit', 
          minute: '2-digit' 
        }));
        return;
      }
      
      if (interval === '1W') {
        const nextWeek = new Date(brasilTime);
        const daysUntilMonday = (7 - brasilTime.getDay() + 1) % 7 || 7;
        nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
        nextWeek.setHours(0, 0, 0, 0);
        
        const timeDiff = nextWeek.getTime() - brasilTime.getTime();
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        setNextCandleTime(nextWeek.toLocaleDateString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', 
          month: '2-digit' 
        }));
        return;
      }
      
      if (interval === '1M') {
        const nextMonth = new Date(brasilTime);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        
        const timeDiff = nextMonth.getTime() - brasilTime.getTime();
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        setTimeLeft(`${days}d ${hours}h`);
        setNextCandleTime(nextMonth.toLocaleDateString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', 
          month: '2-digit' 
        }));
        return;
      }
      
      // Para intervalos em minutos e horas
      const currentMinutes = brasilTime.getMinutes();
      const currentSeconds = brasilTime.getSeconds();
      const currentHours = brasilTime.getHours();
      
      let nextCandleMinute;
      let nextCandleHour = currentHours;
      let nextCandleDate = new Date(brasilTime);
      
      if (intervalMinutes >= 60) {
        // Para intervalos de horas
        const intervalHours = intervalMinutes / 60;
        const hoursSinceStart = currentHours % intervalHours;
        const nextHour = currentHours + (intervalHours - hoursSinceStart);
        
        if (nextHour >= 24) {
          nextCandleDate.setDate(nextCandleDate.getDate() + 1);
          nextCandleHour = nextHour - 24;
        } else {
          nextCandleHour = nextHour;
        }
        nextCandleMinute = 0;
      } else {
        // Para intervalos de minutos
        const minutesSinceStart = currentMinutes % intervalMinutes;
        nextCandleMinute = currentMinutes + (intervalMinutes - minutesSinceStart);
        
        if (nextCandleMinute >= 60) {
          nextCandleMinute = nextCandleMinute - 60;
          nextCandleHour = currentHours + 1;
          
          if (nextCandleHour >= 24) {
            nextCandleDate.setDate(nextCandleDate.getDate() + 1);
            nextCandleHour = 0;
          }
        }
      }
      
      const nextCandle = new Date(nextCandleDate);
      nextCandle.setHours(nextCandleHour, nextCandleMinute, 0, 0);
      
      const timeDiff = nextCandle.getTime() - brasilTime.getTime();
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      setNextCandleTime(nextCandle.toLocaleTimeString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };

    // Calcular imediatamente
    calculateTimeToNextCandle();

    // Atualizar a cada segundo
    const timer = setInterval(calculateTimeToNextCandle, 1000);

    return () => clearInterval(timer);
  }, [interval]);

  const getIntervalLabel = (interval) => {
    switch (interval) {
      case '1': return '1min';
      case '3': return '3min';
      case '5': return '5min';
      case '15': return '15min';
      case '30': return '30min';
      case '60': return '1h';
      case '120': return '2h';
      case '180': return '3h';
      case '240': return '4h';
      case '360': return '6h';
      case '720': return '12h';
      case '1D': return '1D';
      case '5D': return '5D';
      case '1W': return '1W';
      case '1M': return '1M';
      default: return interval;
    }
  };

  return (
    <div className="candle-timer">
      <div className="timer-info">
        <span className="timer-label">🕒 Próxima vela {getIntervalLabel(interval)}:</span>
        <span className="timer-countdown">{timeLeft}</span>
      </div>
      <div className="next-candle-time">
        Às {nextCandleTime} (Horário de Brasília)
      </div>
    </div>
  );
};

export default CandleTimer;