
import { useState, useEffect } from 'react';

export const useLanguage = () => {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('clmp-language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('clmp-language', language);
  }, [language]);

  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  return {
    language,
    changeLanguage,
    isEnglish: language === 'en',
    isFrench: language === 'fr'
  };
};
