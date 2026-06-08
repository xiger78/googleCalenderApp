import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkData, STORAGE_KEY } from '../types';
import { getMonthDateKeys } from './dateUtils';

const defaultData: WorkData = {
  workDays: [],
  commuteTimes: {},
  holidayWorkTypes: {},
};

export async function loadWorkData(): Promise<WorkData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as WorkData;
    return {
      workDays: parsed.workDays ?? [],
      commuteTimes: parsed.commuteTimes ?? {},
      holidayWorkTypes: parsed.holidayWorkTypes ?? {},
    };
  } catch {
    return { ...defaultData };
  }
}

export async function saveWorkData(data: WorkData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getWorkDaysInMonth(workDays: string[], year: number, month: number): string[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return workDays.filter((d) => d.startsWith(prefix)).sort();
}

export function getRemoteDaysInMonth(workDays: string[], year: number, month: number): string[] {
  const workSet = new Set(getWorkDaysInMonth(workDays, year, month));
  return getMonthDateKeys(year, month).filter((d) => !workSet.has(d));
}
