import { isNonWorkingDay } from './japaneseHolidays';

export type CommuteDayType = 'office' | 'remote' | 'holiday';
export type HolidayWorkType = 'office' | 'remote';

export function getCommuteDayType(
  dateKey: string,
  workDays: string[],
  holidayWorkTypes: Record<string, HolidayWorkType> = {}
): CommuteDayType {
  const isWorkDay = workDays.includes(dateKey);
  const isOff = isNonWorkingDay(dateKey);

  if (isOff) {
    if (!isWorkDay) return 'holiday';
    return holidayWorkTypes[dateKey] ?? 'office';
  }

  return isWorkDay ? 'office' : 'remote';
}

export function canChangeHolidayWorkType(dateKey: string, workDays: string[]): boolean {
  return isNonWorkingDay(dateKey) && workDays.includes(dateKey);
}
