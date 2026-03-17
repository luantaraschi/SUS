"use client";

import React, { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import { Language, translations, TranslationKey } from "./locales";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "sus_lang";
const LANGUAGE_CHANGE_EVENT = "sus-language-change";

function getBrowserLanguage(): Language {
  if (typeof window === "undefined") {
    return "pt";
  }

  const savedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLang === "en" || savedLang === "pt") {
    return savedLang;
  }

  return window.navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === LANGUAGE_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore<Language>(
    subscribe,
    getBrowserLanguage,
    () => "pt"
  );

  const setLanguage = (lang: Language) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
