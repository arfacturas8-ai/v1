/**
 * i18n Configuration for CRYB Platform
 * Multi-language support with i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Import translation files
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';
import deTranslation from './locales/de/translation.json';
import jaTranslation from './locales/ja/translation.json';
import zhTranslation from './locales/zh/translation.json';
import ptTranslation from './locales/pt/translation.json';
import ruTranslation from './locales/ru/translation.json';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
];

// Resources
const resources = {
  en: { translation: enTranslation },
  es: { translation: esTranslation },
  fr: { translation: frTranslation },
  de: { translation: deTranslation },
  ja: { translation: jaTranslation },
  zh: { translation: zhTranslation },
  pt: { translation: ptTranslation },
  ru: { translation: ruTranslation }
};

i18n
  // Load translation using http backend
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0
    },

    interpolation: {
      escapeValue: false // React already escapes values
    },

    // Backend options
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/{{lng}}/{{ns}}.missing.json'
    },

    // React options
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
    },

    // Save missing translations
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation: [${lng}] ${ns}.${key}`);
      }
    },

    // Pluralization
    pluralSeparator: '_',

    // Context
    contextSeparator: '_',

    // Namespaces
    ns: ['translation'],
    defaultNS: 'translation'
  });

// Get current language
export function getCurrentLanguage() {
  return i18n.language || 'en';
}

// Change language
export async function changeLanguage(lng) {
  try {
    await i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    document.documentElement.lang = lng;
    return true;
  } catch (error) {
    console.error('Failed to change language:', error);
    return false;
  }
}

// Get language direction (LTR/RTL)
export function getLanguageDirection(lng = i18n.language) {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
}

// Format number with locale
export function formatNumber(number, options = {}) {
  const lng = getCurrentLanguage();
  return new Intl.NumberFormat(lng, options).format(number);
}

// Format date with locale
export function formatDate(date, options = {}) {
  const lng = getCurrentLanguage();
  return new Intl.DateTimeFormat(lng, options).format(new Date(date));
}

// Format relative time
export function formatRelativeTime(date) {
  const lng = getCurrentLanguage();
  const rtf = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' });

  const now = Date.now();
  const diffInSeconds = Math.floor((new Date(date).getTime() - now) / 1000);

  const units = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  for (const { unit, seconds } of units) {
    const value = Math.floor(diffInSeconds / seconds);
    if (Math.abs(value) >= 1) {
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}

// Format currency
export function formatCurrency(amount, currency = 'USD') {
  const lng = getCurrentLanguage();
  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency
  }).format(amount);
}

export default i18n;
