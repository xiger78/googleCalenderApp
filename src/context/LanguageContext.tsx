import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, Language, SETTINGS_STORAGE_KEY } from '../i18n/types';
import { t, TranslationKey } from '../i18n/translations';

const defaultSettings: AppSettings = {
  language: 'ja',
  lunchBreakMinutes: 60,
  eveningBreakMinutes: 0,
};

interface LanguageContextType {
  language: Language;
  lunchBreakMinutes: number;
  eveningBreakMinutes: number;
  setLanguage: (lang: Language) => Promise<void>;
  setLunchBreakMinutes: (minutes: number) => Promise<void>;
  setEveningBreakMinutes: (minutes: number) => Promise<void>;
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AppSettings;
          setSettings({
            ...defaultSettings,
            ...parsed,
            lunchBreakMinutes: parsed.lunchBreakMinutes ?? 60,
            eveningBreakMinutes: parsed.eveningBreakMinutes ?? 0,
          });
        } catch {
          /* use defaults */
        }
      }
      setLoading(false);
    });
  }, []);

  const setLanguage = useCallback(async (language: Language) => {
    setSettings((prev) => {
      const next = { ...prev, language };
      AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setLunchBreakMinutes = useCallback(async (lunchBreakMinutes: number) => {
    setSettings((prev) => {
      const next = { ...prev, lunchBreakMinutes };
      AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setEveningBreakMinutes = useCallback(async (eveningBreakMinutes: number) => {
    setSettings((prev) => {
      const next = { ...prev, eveningBreakMinutes };
      AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const tr = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      t(settings.language, key, params),
    [settings.language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language: settings.language,
        lunchBreakMinutes: settings.lunchBreakMinutes,
        eveningBreakMinutes: settings.eveningBreakMinutes ?? 0,
        setLanguage,
        setLunchBreakMinutes,
        setEveningBreakMinutes,
        tr,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
