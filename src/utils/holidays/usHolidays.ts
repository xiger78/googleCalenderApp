import {
  addFixedHoliday,
  HolidayDetail,
  lastWeekday,
  mapToHolidayDetails,
  nthWeekday,
} from './common';

const cache = new Map<number, HolidayDetail[]>();

export function getUsHolidayDetailsForYear(year: number): HolidayDetail[] {
  const cached = cache.get(year);
  if (cached) return cached;

  const map = new Map<string, string>();
  addFixedHoliday(map, year, 1, 1, 'holidayUsNewYear');
  addFixedHoliday(map, year, 1, nthWeekday(year, 1, 1, 3), 'holidayUsMlkDay');
  addFixedHoliday(map, year, 2, nthWeekday(year, 2, 1, 3), 'holidayUsPresidentsDay');
  addFixedHoliday(map, year, 5, lastWeekday(year, 5, 1), 'holidayUsMemorialDay');
  addFixedHoliday(map, year, 6, 19, 'holidayUsJuneteenth');
  addFixedHoliday(map, year, 7, 4, 'holidayUsIndependenceDay');
  addFixedHoliday(map, year, 9, nthWeekday(year, 9, 1, 1), 'holidayUsLaborDay');
  addFixedHoliday(map, year, 10, nthWeekday(year, 10, 1, 2), 'holidayUsColumbusDay');
  addFixedHoliday(map, year, 11, 11, 'holidayUsVeteransDay');
  addFixedHoliday(map, year, 11, nthWeekday(year, 11, 4, 4), 'holidayUsThanksgiving');
  addFixedHoliday(map, year, 12, 25, 'holidayUsChristmas');

  const details = mapToHolidayDetails(map);
  cache.set(year, details);
  return details;
}

export function getUsHolidaysForMonth(year: number, month: number): HolidayDetail[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return getUsHolidayDetailsForYear(year).filter((d) => d.dateKey.startsWith(prefix));
}
