import React, { useState } from 'react';
import { countryCodes, validatePhoneNumber } from '../utils/countryCodes';
import '../styles/PhoneInput.css';

const PhoneInput = ({ 
  value = '', 
  countryCode = '+55', 
  onChange, 
  onCountryCodeChange,
  placeholder = 'Digite seu telefone',
  required = false,
  error = ''
}) => {
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar países baseado na busca
  const filteredCountries = countryCodes.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.includes(searchTerm) ||
    country.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // País selecionado
  const selectedCountry = countryCodes.find(country => country.code === countryCode) || countryCodes[0];

  const handleCountrySelect = (country) => {
    onCountryCodeChange(country.code);
    setIsCountryDropdownOpen(false);
    setSearchTerm('');
  };

  const handlePhoneChange = (e) => {
    const phoneValue = e.target.value;
    onChange(phoneValue);
  };

  // Validação visual
  const isValid = !value || validatePhoneNumber(value);

  return (
    <div className="phone-input-container">
      <div className={`phone-input-wrapper ${error ? 'error' : ''} ${!isValid ? 'invalid' : ''}`}>
        {/* Seletor de País */}
        <div className="country-selector">
          <button
            type="button"
            className="country-button"
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
          >
            <span className="country-flag">{selectedCountry.flag}</span>
            <span className="country-code">{selectedCountry.code}</span>
            <span className="dropdown-arrow">
              {isCountryDropdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Dropdown de países */}
          {isCountryDropdownOpen && (
            <div className="country-dropdown">
              <div className="country-search">
                <input
                  type="text"
                  placeholder="Buscar país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="country-search-input"
                />
              </div>
              <div className="country-list">
                {filteredCountries.map((country, index) => (
                  <button
                    key={`${country.country}-${index}`}
                    type="button"
                    className={`country-option ${country.code === countryCode ? 'selected' : ''}`}
                    onClick={() => handleCountrySelect(country)}
                  >
                    <span className="country-flag">{country.flag}</span>
                    <span className="country-name">{country.name}</span>
                    <span className="country-code">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input do telefone */}
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          className="phone-number-input"
        />
      </div>

      {/* Feedback visual */}
      <div className="phone-input-feedback">
        {error && (
          <span className="phone-error-message">
            {error}
          </span>
        )}
        {value && !isValid && !error && (
          <span className="phone-validation-message">
            Número de telefone inválido
          </span>
        )}
        {value && isValid && !error && (
          <span className="phone-success-message">
            ✓ Número válido
          </span>
        )}
      </div>

      {/* Preview do número completo */}
      {value && isValid && (
        <div className="phone-preview">
          <span className="phone-preview-label">Número completo:</span>
          <span className="phone-preview-number">
            {selectedCountry.code} {value}
          </span>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;