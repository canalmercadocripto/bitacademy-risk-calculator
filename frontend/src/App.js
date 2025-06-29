import React from 'react';
import { Toaster } from 'react-hot-toast';
import RiskCalculator from './components/RiskCalculator';
import './styles/App.css';
import './styles/EnhancedResults.css';
import './styles/TradeMonitor.css';

function App() {
  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <RiskCalculator />
    </div>
  );
}

export default App;