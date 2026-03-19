import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';

i18next.use(initReactI18next).init({
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  resources: {
    'pt-BR': {
      translation: ptBR,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
