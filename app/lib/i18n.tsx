import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Translations = Record<string, string>;

type LanguageCode = 'ar' | 'en';

interface I18nContextValue {
  language: LanguageCode;
  t: (key: string) => string;
  setLanguage: (lang: LanguageCode) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

async function loadTranslations(lang: LanguageCode): Promise<Translations> {
  switch (lang) {
    case 'ar':
      return (await import('~/locales/ar.json')).default as Translations;
    case 'en':
    default:
      return (await import('~/locales/en.json')).default as Translations;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const initialLangAttr = (typeof document !== 'undefined' && document.documentElement.lang) || 'ar';
  const initialLanguage: LanguageCode = initialLangAttr.startsWith('ar') ? 'ar' : 'en';
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);
  const [messages, setMessages] = useState<Translations>({});

  useEffect(() => {
    loadTranslations(language).then(setMessages);
    document.documentElement.lang = language;
    // Keep LTR layout regardless of language
    setCookie('lang', language);
  }, [language]);

  const t = useMemo(() => {
    return (key: string) => messages[key] ?? key;
  }, [messages]);

  const value = useMemo<I18nContextValue>(
    () => ({ language, t, setLanguage: (lang) => setLanguageState(lang) }),
    [language, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}