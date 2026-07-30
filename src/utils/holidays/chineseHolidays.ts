import { parseDateKey } from '../dateUtils';
import {
  addFixedHoliday,
  addHolidayRange,
  HolidayDetail,
  LUNAR_HOLIDAY_TABLE,
  mapToHolidayDetails,
  nearestLunarTableYear,
} from './common';

const cache = new Map<number, HolidayDetail[]>();

export function getChineseHolidayDetailsForYear(year: number): HolidayDetail[] {
  const cached = cache.get(year);
  if (cached) return cached;

  const map = new Map<string, string>();
  addFixedHoliday(map, year, 1, 1, 'holidayCnNewYear');
  addFixedHoliday(map, year, 5, 1, 'holidayCnLaborDay');
  addHolidayRange(map, `${year}-10-01`, 3, 'holidayCnNationalDay');

  const lunar = LUNAR_HOLIDAY_TABLE[nearestLunarTableYear(year)];
  if (lunar?.cnSpring) addHolidayRange(map, lunar.cnSpring, 3, 'holidayCnSpringFestival');
  if (lunar?.cnQingming) {
    const { year: y, month, day } = parseDateKey(lunar.cnQingming);
    addFixedHoliday(map, y, month, day, 'holidayCnQingming');
  }
  if (lunar?.cnDragonBoat) {
    const { year: y, month, day } = parseDateKey(lunar.cnDragonBoat);
    addFixedHoliday(map, y, month, day, 'holidayCnDragonBoat');
  }
  if (lunar?.cnMidAutumn) {
    const { year: y, month, day } = parseDateKey(lunar.cnMidAutumn);
    addFixedHoliday(map, y, month, day, 'holidayCnMidAutumn');
  }

  const details = mapToHolidayDetails(map);
  cache.set(year, details);
  return details;
}

export function getChineseHolidaysForMonth(year: number, month: number): HolidayDetail[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return getChineseHolidayDetailsForYear(year).filter((d) => d.dateKey.startsWith(prefix));
}
