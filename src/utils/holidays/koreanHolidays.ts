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

export function getKoreanHolidayDetailsForYear(year: number): HolidayDetail[] {
  const cached = cache.get(year);
  if (cached) return cached;

  const map = new Map<string, string>();
  addFixedHoliday(map, year, 1, 1, 'holidayKrNewYear');
  addFixedHoliday(map, year, 3, 1, 'holidayKrIndependence');
  addFixedHoliday(map, year, 5, 5, 'holidayKrChildrens');
  addFixedHoliday(map, year, 6, 6, 'holidayKrMemorial');
  addFixedHoliday(map, year, 8, 15, 'holidayKrLiberation');
  addFixedHoliday(map, year, 10, 3, 'holidayKrNationalFoundation');
  addFixedHoliday(map, year, 10, 9, 'holidayKrHangeul');
  addFixedHoliday(map, year, 12, 25, 'holidayKrChristmas');

  const lunar = LUNAR_HOLIDAY_TABLE[nearestLunarTableYear(year)];
  if (lunar?.krSeollal) addHolidayRange(map, lunar.krSeollal, 3, 'holidayKrSeollal');
  if (lunar?.krBuddha) {
    const { year: y, month, day } = parseDateKey(lunar.krBuddha);
    addFixedHoliday(map, y, month, day, 'holidayKrBuddha');
  }
  if (lunar?.krChuseok) addHolidayRange(map, lunar.krChuseok, 3, 'holidayKrChuseok');

  const details = mapToHolidayDetails(map);
  cache.set(year, details);
  return details;
}

export function getKoreanHolidaysForMonth(year: number, month: number): HolidayDetail[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return getKoreanHolidayDetailsForYear(year).filter((d) => d.dateKey.startsWith(prefix));
}
