export type Language = 'pt' | 'en';

export const translations = {
  pt: {
    // Footer
    privacy: 'Privacidade',
    terms: 'Termos',
    support: 'Apoiar',

    // Support Modal
    supportTitle: 'Apoie o Projeto',
    supportMessage: 'Se você está se divertindo, considere fazer uma doação! Isso ajuda a manter o projeto no ar.',
    copyKey: 'Copiar',
    pixKeyCopied: 'Chave copiada!',
    pixKey: 'Chave Pix (E-mail ou UUID)', // Placeholder, will use actual key
    donatePayPal: 'Doar via PayPal',
    donorCode: 'Código de Doador',
    donorCodePlaceholder: 'Opcional (ex: isenção de anúncios)',

    // Legal Modals
    close: 'Fechar',
    termsTitle: 'Termos de Uso',
    privacyTitle: 'Política de Privacidade',
    legalPlaceholder: 'Em breve / Texto legal virá aqui.',
    
    // Fallback UI
    loading: 'Carregando...',
  },
  en: {
    // Footer
    privacy: 'Privacy',
    terms: 'Terms',
    support: 'Support',

    // Support Modal
    supportTitle: 'Support the Project',
    supportMessage: 'If you are having fun, consider making a donation! It helps keep the project running.',
    copyKey: 'Copy',
    pixKeyCopied: 'Key copied!',
    pixKey: 'Pix Key', 
    donatePayPal: 'Donate via PayPal',
    donorCode: 'Donor Code',
    donorCodePlaceholder: 'Optional (e.g., ad-free code)',

    // Legal Modals
    close: 'Close',
    termsTitle: 'Terms of Use',
    privacyTitle: 'Privacy Policy',
    legalPlaceholder: 'Coming soon / Legal text will go here.',
    
    // Fallback UI
    loading: 'Loading...',
  }
};

export type TranslationKey = keyof typeof translations.pt;
