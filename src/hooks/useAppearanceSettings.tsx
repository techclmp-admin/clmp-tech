import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: 'light',
  language: 'en',
  currency: 'CAD'
};

// Safe localStorage access
const getStoredSettings = (): AppearanceSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const savedTheme = localStorage.getItem('clmp-theme') as 'light' | 'dark' | 'system' | null;
    const savedLanguage = localStorage.getItem('clmp-language');
    const savedCurrency = localStorage.getItem('clmp-currency');
    
    return {
      theme: savedTheme || 'light',
      language: savedLanguage || 'en',
      currency: savedCurrency || 'CAD'
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const useAppearanceSettings = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const applyTheme = useCallback((theme: string) => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    try {
      localStorage.setItem('clmp-theme', theme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage');
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = getStoredSettings();
    setSettings(stored);
    applyTheme(stored.theme);
    setLoading(false);
  }, [applyTheme]);

  const updateSettings = useCallback((newSettings: Partial<AppearanceSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      
      try {
        localStorage.setItem('clmp-theme', updatedSettings.theme);
        localStorage.setItem('clmp-language', updatedSettings.language);
        localStorage.setItem('clmp-currency', updatedSettings.currency);
      } catch (e) {
        console.warn('Failed to save settings to localStorage');
      }
      
      if (newSettings.theme) {
        applyTheme(newSettings.theme);
      }

      return updatedSettings;
    });

    toast({
      title: "Settings Updated",
      description: "Your appearance preferences have been saved."
    });
  }, [applyTheme, toast]);

  return {
    settings,
    loading,
    updateSettings
  };
};
