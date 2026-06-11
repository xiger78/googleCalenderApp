import { WorkArrivalType } from '../types';
import { isNonWorkingDay } from './japaneseHolidays';

export type CommuteDayType = 'office' | 'remote' | 'holiday';
export type HolidayWorkType = 'office' | 'remote';

export function getCommuteDayType(
  dateKey: string,
  workDays: string[],
  holidayWorkTypes: Record<string, HolidayWorkType> = {},
  workDayTypes: Record<string, WorkArrivalType> = {}
): CommuteDayType {
  const isWorkDay = workDays.includes(dateKey);
  const isOff = isNonWorkingDay(dateKey);
  const arrivalType = workDayTypes[dateKey];

  if (isOff) {
    if (!isWorkDay) return 'holiday';
    if (arrivalType === 'remote') return 'remote';
    return holidayWorkTypes[dateKey] ?? 'office';
  }

  if (!isWorkDay) return 'remote';
  if (arrivalType === 'remote') return 'remote';
  return 'office';
}

export function canChangeHolidayWorkType(dateKey: string, workDays: string[]): boolean {
  return isNonWorkingDay(dateKey) && workDays.includes(dateKey);
}
