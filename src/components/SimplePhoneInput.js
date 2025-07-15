import React, { useState } from 'react';

const SimplePhoneInput = ({ 
  value = '', 
  countryCode = '+55', 
  onPhoneChange, 
  onCountryChange,
  placeholder = 'Digite seu telefone',
  required = false,
  disabled = false 
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [phoneNumber, setPhoneNumber] = useState(value);

  const countries = [
    { code: '+55', name: 'Brasil', flag: '🇧🇷' },
    { code: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
    { code: '+33', name: 'França', flag: '🇫🇷' },
    { code: '+49', name: 'Alemanha', flag: '🇩🇪' },
    { code: '+39', name: 'Itália', flag: '🇮🇹' },
    { code: '+34', name: 'Espanha', flag: '🇪🇸' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷' }
  ];

  const handleCountryChange = (e) => {
    const newCountryCode = e.target.value;
    setSelectedCountry(newCountryCode);
    if (onCountryChange) {
      onCountryChange(newCountryCode);
    }
  };

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value;
    setPhoneNumber(newPhone);
    if (onPhoneChange) {
      onPhoneChange(newPhone);
    }
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry) || countries[0];

  return (
    <div className="simple-phone-input">
      <div className="phone-input-container">
        <select 
          value={selectedCountry}
          onChange={handleCountryChange}
          disabled={disabled}
          className="country-select"
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
        
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="phone-number-input"
        />
      </div>
      
      {phoneNumber && (
        <div className="phone-preview">
          <span>Número completo: {selectedCountry} {phoneNumber}</span>
        </div>
      )}
    </div>
  );
};

export default SimplePhoneInput;