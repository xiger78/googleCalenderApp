export type Language = 'ja' | 'ko' | 'en';

export const LANGUAGE_OPTIONS: { value: Language; labelKey: 'langJa' | 'langKo' | 'langEn' }[] = [
  { value: 'ja', labelKey: 'langJa' },
  { value: 'ko', labelKey: 'langKo' },
  { value: 'en', labelKey: 'langEn' },
];

export const SETTINGS_STORAGE_KEY = '@app_settings';

export interface AppSettings {
  language: Language;
  lunchBreakMinutes: number;
  eveningBreakMinutes: number;
}
