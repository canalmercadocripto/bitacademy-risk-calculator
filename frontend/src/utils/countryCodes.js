// Lista de códigos de país para telefones
export const countryCodes = [
  { code: '+55', country: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+1', country: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'CO', name: 'Colômbia', flag: '🇨🇴' },
  { code: '+58', country: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+51', country: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: '+593', country: 'EC', name: 'Equador', flag: '🇪🇨' },
  { code: '+598', country: 'UY', name: 'Uruguai', flag: '🇺🇾' },
  { code: '+595', country: 'PY', name: 'Paraguai', flag: '🇵🇾' },
  { code: '+591', country: 'BO', name: 'Bolívia', flag: '🇧🇴' },
  { code: '+34', country: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: '+33', country: 'FR', name: 'França', flag: '🇫🇷' },
  { code: '+49', country: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: '+39', country: 'IT', name: 'Itália', flag: '🇮🇹' },
  { code: '+44', country: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'JP', name: 'Japão', flag: '🇯🇵' },
  { code: '+82', country: 'KR', name: 'Coreia do Sul', flag: '🇰🇷' },
  { code: '+91', country: 'IN', name: 'Índia', flag: '🇮🇳' },
  { code: '+7', country: 'RU', name: 'Rússia', flag: '🇷🇺' },
  { code: '+61', country: 'AU', name: 'Austrália', flag: '🇦🇺' },
  { code: '+27', country: 'ZA', name: 'África do Sul', flag: '🇿🇦' },
  { code: '+52', country: 'MX', name: 'México', flag: '🇲🇽' },
  { code: '+31', country: 'NL', name: 'Países Baixos', flag: '🇳🇱' },
  { code: '+46', country: 'SE', name: 'Suécia', flag: '🇸🇪' },
  { code: '+47', country: 'NO', name: 'Noruega', flag: '🇳🇴' },
  { code: '+45', country: 'DK', name: 'Dinamarca', flag: '🇩🇰' },
  { code: '+358', country: 'FI', name: 'Finlândia', flag: '🇫🇮' },
  { code: '+41', country: 'CH', name: 'Suíça', flag: '🇨🇭' },
  { code: '+43', country: 'AT', name: 'Áustria', flag: '🇦🇹' },
  { code: '+32', country: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: '+353', country: 'IE', name: 'Irlanda', flag: '🇮🇪' },
  { code: '+48', country: 'PL', name: 'Polônia', flag: '🇵🇱' },
  { code: '+420', country: 'CZ', name: 'República Tcheca', flag: '🇨🇿' },
  { code: '+36', country: 'HU', name: 'Hungria', flag: '🇭🇺' },
  { code: '+30', country: 'GR', name: 'Grécia', flag: '🇬🇷' },
  { code: '+90', country: 'TR', name: 'Turquia', flag: '🇹🇷' },
  { code: '+966', country: 'SA', name: 'Arábia Saudita', flag: '🇸🇦' },
  { code: '+971', country: 'AE', name: 'Emirados Árabes Unidos', flag: '🇦🇪' },
  { code: '+65', country: 'SG', name: 'Singapura', flag: '🇸🇬' },
  { code: '+852', country: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+60', country: 'MY', name: 'Malásia', flag: '🇲🇾' },
  { code: '+66', country: 'TH', name: 'Tailândia', flag: '🇹🇭' },
  { code: '+84', country: 'VN', name: 'Vietnã', flag: '🇻🇳' },
  { code: '+63', country: 'PH', name: 'Filipinas', flag: '🇵🇭' },
  { code: '+62', country: 'ID', name: 'Indonésia', flag: '🇮🇩' },
  { code: '+20', country: 'EG', name: 'Egito', flag: '🇪🇬' },
  { code: '+234', country: 'NG', name: 'Nigéria', flag: '🇳🇬' },
  { code: '+254', country: 'KE', name: 'Quênia', flag: '🇰🇪' }
];

// Função para buscar país por código
export const findCountryByCode = (code) => {
  return countryCodes.find(country => country.code === code) || countryCodes[0];
};

// Função para formatar telefone com código do país
export const formatPhoneNumber = (countryCode, phone) => {
  if (!phone) return '';
  return `${countryCode} ${phone}`;
};

// Função para validar número de telefone básico
export const validatePhoneNumber = (phone) => {
  // Remove espaços e caracteres especiais
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Verifica se contém apenas números
  if (!/^\d+$/.test(cleanPhone)) {
    return false;
  }
  
  // Verifica se tem pelo menos 8 dígitos e no máximo 15
  return cleanPhone.length >= 8 && cleanPhone.length <= 15;
};