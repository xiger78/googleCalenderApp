import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrivalTypeConfig } from '../types';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  Language,
  SETTINGS_STORAGE_KEY,
} from '../i18n/types';
import { DEFAULT_ARRIVAL_CONFIGS } from '../utils/arrivalSettings';
import { t, TranslationKey } from '../i18n/translations';

function mergeSettings(parsed: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_APP_SETTINGS,
    ...parsed,
    lunchBreakMinutes: parsed.lunchBreakMinutes ?? 60,
    eveningBreakMinutes: parsed.eveningBreakMinutes ?? 0,
    normalArrival: { ...DEFAULT_ARRIVAL_CONFIGS.normal, ...parsed.normalArrival },
    earlyArrival: { ...DEFAULT_ARRIVAL_CONFIGS.early, ...parsed.earlyArrival },
    lateArrival: { ...DEFAULT_ARRIVAL_CONFIGS.late, ...parsed.lateArrival },
  };
}

interface LanguageContextType {
  language: Language;
  lunchBreakMinutes: number;
  eveningBreakMinutes: number;
  normalArrival: ArrivalTypeConfig;
  earlyArrival: ArrivalTypeConfig;
  lateArrival: ArrivalTypeConfig;
  setLanguage: (lang: Language) => Promise<void>;
  setLunchBreakMinutes: (minutes: number) => Promise<void>;
  setEveningBreakMinutes: (minutes: number) => Promise<void>;
  setBreakTimes: (lunchBreakMinutes: number, eveningBreakMinutes: number) => Promise<void>;
  setArrivalSettings: (
    normal: ArrivalTypeConfig,
    early: ArrivalTypeConfig,
    late: ArrivalTypeConfig
  ) => Promise<void>;
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          setSettings(mergeSettings(parsed));
        } catch {
          /* use defaults */
        }
      }
      setLoading(false);
    });
  }, []);

  const setLanguage = useCallback(
    async (language: Language) => {
      setSettings((prev) => {
        const next = { ...prev, language };
        AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

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

  const setBreakTimes = useCallback(
    async (lunchBreakMinutes: number, eveningBreakMinutes: number) => {
      setSettings((prev) => {
        const next = { ...prev, lunchBreakMinutes, eveningBreakMinutes };
        AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const setArrivalSettings = useCallback(
    async (normal: ArrivalTypeConfig, early: ArrivalTypeConfig, late: ArrivalTypeConfig) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          normalArrival: normal,
          earlyArrival: early,
          lateArrival: late,
        };
        AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

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
        normalArrival: settings.normalArrival,
        earlyArrival: settings.earlyArrival,
        lateArrival: settings.lateArrival,
        setLanguage,
        setLunchBreakMinutes,
        setEveningBreakMinutes,
        setBreakTimes,
        setArrivalSettings,
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
