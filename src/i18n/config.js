import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import vnTranslations from './locales/vn.json';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      vn: {
        translation: vnTranslations,
      },
    },
    fallbackLng: 'en', // Default language
    lng: 'en', // Initial language
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

