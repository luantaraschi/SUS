"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Language, translations, TranslationKey } from './locales';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt'); // Default until mounted
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Client-side detection
    const savedLang = localStorage.getItem('sus_lang') as Language;
    let initialLang: Language = 'pt';
    
    if (savedLang && (savedLang === 'en' || savedLang === 'pt')) {
      initialLang = savedLang;
    } else {
      const browserLang = navigator.language.toLowerCase();
      // If starts with pt (like pt-BR), use PT, else EN
      if (!browserLang.startsWith('pt')) {
        initialLang = 'en';
      }
    }
    
    setTimeout(() => {
        if (initialLang !== 'pt') {
            setLanguageState(initialLang);
        }
        setMounted(true);
    }, 0);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sus_lang', lang);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  // Avoid hydration mismatch by not rendering translating content until mounted
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>; // Or a standard loader
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
