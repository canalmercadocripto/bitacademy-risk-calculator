import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { useDebounce } from '../hooks/useDebounce';

const SymbolSelector = ({ 
  symbols, 
  selectedSymbol, 
  onSymbolSelect, 
  loading, 
  selectedExchange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrar símbolos baseado na busca
  const filteredSymbols = useMemo(() => {
    if (!debouncedSearchTerm) {
      // Mostrar apenas os primeiros 50 se não há busca
      return symbols.slice(0, 50);
    }

    const searchUpper = debouncedSearchTerm.toUpperCase();
    
    // Busca inteligente: primeiro exact match, depois contains
    const exactMatches = symbols.filter(symbol => 
      symbol.baseAsset === searchUpper || 
      symbol.symbol === searchUpper
    );
    
    const partialMatches = symbols.filter(symbol => 
      (symbol.symbol.includes(searchUpper) || 
       symbol.baseAsset.includes(searchUpper)) &&
      !exactMatches.includes(symbol)
    );
    
    return [...exactMatches, ...partialMatches].slice(0, 100);
  }, [symbols, debouncedSearchTerm]);

  const formatSymbolOptions = () => {
    return filteredSymbols.map(symbol => ({
      value: symbol,
      label: (
        <div className="symbol-option">
          <span className="symbol-main">{symbol.baseAsset}</span>
          <span className="symbol-pair">{symbol.symbol}</span>
          <span className="symbol-exchange">{symbol.exchange}</span>
        </div>
      ),
      symbol: symbol.symbol,
      searchValue: `${symbol.symbol} ${symbol.baseAsset}`
    }));
  };

  const customFilterOption = (option, inputValue) => {
    // Não filtrar aqui, já fazemos isso no useMemo
    return true;
  };

  const handleInputChange = (inputValue, { action }) => {
    if (action === 'input-change') {
      setSearchTerm(inputValue);
    }
  };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      padding: '10px 15px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: state.isFocused ? 'var(--bg-gradient-light)' : 'transparent',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      '&:last-child': {
        borderBottom: 'none'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--bg-section)',
      border: '2px solid var(--border-color)',
      borderRadius: '10px',
      boxShadow: 'var(--shadow-light)',
      maxHeight: '300px'
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '300px',
      overflowY: 'auto'
    }),
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'var(--bg-input)',
      border: `2px solid ${state.isFocused ? 'var(--border-focus)' : 'var(--border-color)'}`,
      borderRadius: '10px',
      minHeight: '50px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
      '&:hover': {
        borderColor: 'var(--border-focus)'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-placeholder)'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-primary)'
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-primary)'
    })
  };

  const noOptionsMessage = ({ inputValue }) => {
    if (loading.symbols) return "Carregando símbolos...";
    if (!selectedExchange) return "Selecione uma corretora primeiro";
    if (inputValue && inputValue.length > 0) return `Nenhum resultado para "${inputValue}"`;
    return "Digite para buscar símbolos";
  };

  const loadingMessage = () => "Carregando símbolos...";

  return (
    <div className="input-group">
      <label>Par de Moedas:</label>
      <Select
        className="react-select-container symbol-selector"
        classNamePrefix="react-select"
        placeholder={selectedExchange ? "Digite para buscar..." : "Selecione uma corretora primeiro"}
        options={formatSymbolOptions()}
        value={selectedSymbol ? {
          value: selectedSymbol,
          label: (
            <div className="symbol-option">
              <span className="symbol-main">{selectedSymbol.baseAsset}</span>
              <span className="symbol-pair">{selectedSymbol.symbol}</span>
              <span className="symbol-exchange">{selectedSymbol.exchange}</span>
            </div>
          )
        } : null}
        onChange={(option) => onSymbolSelect(option?.value || null)}
        onInputChange={handleInputChange}
        filterOption={customFilterOption}
        isLoading={loading.symbols}
        isDisabled={!selectedExchange || loading.symbols}
        isClearable
        isSearchable
        styles={customStyles}
        noOptionsMessage={noOptionsMessage}
        loadingMessage={loadingMessage}
        menuPlacement="auto"
        maxMenuHeight={300}
      />
      {symbols.length > 0 && (
        <div className="symbol-count">
          {filteredSymbols.length} de {symbols.length} símbolos
          {searchTerm && ` • Busca: "${searchTerm}"`}
        </div>
      )}
    </div>
  );
};

export default SymbolSelector;