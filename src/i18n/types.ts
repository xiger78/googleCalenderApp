export type Language = 'ja' | 'ko' | 'en';

export const LANGUAGE_OPTIONS: { value: Language; labelKey: 'langJa' | 'langKo' | 'langEn' }[] = [
  { value: 'ja', labelKey: 'langJa' },
  { value: 'ko', labelKey: 'langKo' },
  { value: 'en', labelKey: 'langEn' },
];

import { ArrivalTypeConfig, WorkArrivalType } from '../types';
import { DEFAULT_ARRIVAL_CONFIGS } from '../utils/arrivalSettings';

export const SETTINGS_STORAGE_KEY = '@app_settings';

export interface AppSettings {
  language: Language;
  lunchBreakMinutes: number;
  eveningBreakMinutes: number;
  normalArrival: ArrivalTypeConfig;
  earlyArrival: ArrivalTypeConfig;
  lateArrival: ArrivalTypeConfig;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'ja',
  lunchBreakMinutes: 60,
  eveningBreakMinutes: 0,
  normalArrival: DEFAULT_ARRIVAL_CONFIGS.normal,
  earlyArrival: DEFAULT_ARRIVAL_CONFIGS.early,
  lateArrival: DEFAULT_ARRIVAL_CONFIGS.late,
};

export function getArrivalConfig(
  settings: AppSettings,
  type: WorkArrivalType
): ArrivalTypeConfig {
  if (type === 'early') return settings.earlyArrival;
  if (type === 'late') return settings.lateArrival;
  return settings.normalArrival;
}
