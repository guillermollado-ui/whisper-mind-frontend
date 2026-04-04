import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization'; // 👈 Ahora ya funciona perfectamente
import { translations } from '../../utils/translations'; 

type Language = 'en' | 'es';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en'); 

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      // 1. ¿El usuario ya eligió un idioma manualmente antes?
      const savedLang = await SecureStore.getItemAsync('user_language');
      
      if (savedLang === 'es' || savedLang === 'en') {
        setLanguageState(savedLang as Language);
      } else {
        // 2. Si es la primera vez, detectamos el idioma del móvil
        const locales = Localization.getLocales();
        const deviceLanguage = locales[0]?.languageCode;
        
        // Si el idioma empieza por 'es' (es, es-ES, es-MX...), ponemos español
        if (deviceLanguage?.startsWith('es')) {
          setLanguageState('es');
        } else {
          setLanguageState('en'); 
        }
      }
    } catch (e) {
      console.log("Error detectando idioma", e);
      setLanguageState('en');
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await SecureStore.setItemAsync('user_language', lang);
  };

  const t = (path: string) => {
    const keys = path.split('.');
    let current: any = translations[language];
    
    for (const key of keys) {
      if (!current || current[key] === undefined) {
        // Si no encuentra la traducción, intenta buscarla en inglés por lo menos
        let fallback: any = translations['en'];
        for (const fKey of keys) {
            if (!fallback || fallback[fKey] === undefined) return path;
            fallback = fallback[fKey];
        }
        return fallback;
      }
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};