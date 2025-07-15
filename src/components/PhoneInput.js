import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { countryCodes, validatePhoneNumber } from '../utils/countryCodes';

const PhoneInput = ({ 
  value = '', 
  countryCode = '+55', 
  onChange, 
  onCountryCodeChange,
  placeholder = 'Digite seu telefone',
  required = false,
  disabled = false,
  error = ''
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);

  // Filtrar países baseado na busca
  const filteredCountries = countryCodes.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.includes(searchTerm) ||
    country.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // País selecionado
  const selectedCountry = countryCodes.find(country => country.code === countryCode) || countryCodes[0];

  const handleCountrySelect = (country) => {
    if (onCountryCodeChange) {
      onCountryCodeChange(value, country.code);
    }
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handlePhoneChange = (e) => {
    const phoneValue = e.target.value;
    onChange(phoneValue);
  };

  // Validação visual
  const isValid = !value || validatePhoneNumber(value);

  const toggleDropdown = () => {
    if (!disabled) {
      if (!isDropdownOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Componente do dropdown que será renderizado como portal
  const DropdownPortal = () => {
    if (!isDropdownOpen) return null;

    return ReactDOM.createPortal(
      <div 
        style={{
          position: 'absolute',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 999999,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Campo de busca */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#f8fafc',
              color: '#1a202c',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>

        {/* Lista de países */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '200px'
          }}
        >
          {filteredCountries.map((country, index) => (
            <button
              key={`${country.country}-${index}`}
              type="button"
              onClick={() => handleCountrySelect(country)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: country.code === countryCode ? '#3b82f6' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: country.code === countryCode ? 'white' : '#1a202c',
                width: '100%',
                textAlign: 'left',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (country.code !== countryCode) {
                  e.target.style.background = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (country.code !== countryCode) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{country.flag}</span>
              <span style={{ flex: 1, fontWeight: '500' }}>{country.name}</span>
              <span style={{ fontWeight: '600', fontSize: '0.85rem', opacity: 0.8 }}>
                {country.code}
              </span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Container principal */}
      <div 
        style={{
          display: 'flex',
          border: `2px solid ${error ? '#dc2626' : (!isValid ? '#f59e0b' : '#e2e8f0')}`,
          borderRadius: '10px',
          background: '#ffffff',
          transition: 'border-color 0.3s ease',
          overflow: 'hidden'
        }}
      >
        {/* Botão seletor de país */}
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            background: '#f8fafc',
            border: 'none',
            borderRight: '1px solid #e2e8f0',
            cursor: disabled ? 'not-allowed' : 'pointer',
            minWidth: '120px',
            justifyContent: 'space-between',
            color: '#1a202c'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{selectedCountry.flag}</span>
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCountry.code}</span>
          </div>
          <span style={{ fontSize: '0.8rem' }}>
            {isDropdownOpen ? '▲' : '▼'}
          </span>
        </button>

        {/* Input do telefone */}
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: 'transparent',
            color: '#1a202c',
            fontSize: '1rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Dropdown renderizado como portal */}
      <DropdownPortal />

      {/* Mensagens de feedback */}
      <div style={{ marginTop: '0.5rem', minHeight: '1.2rem' }}>
        {error && (
          <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '500' }}>
            ⚠️ {error}
          </span>
        )}
        {value && !isValid && !error && (
          <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: '500' }}>
            ⚠️ Número de telefone inválido
          </span>
        )}
        {value && isValid && !error && (
          <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '500' }}>
            ✓ Número válido
          </span>
        )}
      </div>

      {/* Preview do número completo */}
      {value && isValid && (
        <div 
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
            Número completo:
          </span>
          <span style={{ fontSize: '0.9rem', color: '#1a202c', fontWeight: '600', fontFamily: 'monospace' }}>
            {selectedCountry.code} {value}
          </span>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;