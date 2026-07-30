import {
  getJapaneseHolidayDetailsForYear,
  getJapaneseHolidaysForMonth,
  JapaneseHolidayDetail,
} from '../japaneseHolidays';
import { getChineseHolidayDetailsForYear, getChineseHolidaysForMonth } from './chineseHolidays';
import { HolidayCountry, HolidayDetail } from './common';
import { getKoreanHolidayDetailsForYear, getKoreanHolidaysForMonth } from './koreanHolidays';
import { getUsHolidayDetailsForYear, getUsHolidaysForMonth } from './usHolidays';

export type { HolidayCountry, HolidayDetail } from './common';

export const HOLIDAY_COUNTRIES: HolidayCountry[] = ['jp', 'kr', 'cn', 'us'];

function fromJapanese(details: JapaneseHolidayDetail[]): HolidayDetail[] {
  return details.map((d) => ({ dateKey: d.dateKey, nameKey: d.nameKey }));
}

export function getHolidayDetailsForYear(country: HolidayCountry, year: number): HolidayDetail[] {
  if (country === 'jp') return fromJapanese(getJapaneseHolidayDetailsForYear(year));
  if (country === 'kr') return getKoreanHolidayDetailsForYear(year);
  if (country === 'cn') return getChineseHolidayDetailsForYear(year);
  return getUsHolidayDetailsForYear(year);
}

export function getHolidaysForMonth(
  country: HolidayCountry,
  year: number,
  month: number
): HolidayDetail[] {
  if (country === 'jp') return fromJapanese(getJapaneseHolidaysForMonth(year, month));
  if (country === 'kr') return getKoreanHolidaysForMonth(year, month);
  if (country === 'cn') return getChineseHolidaysForMonth(year, month);
  return getUsHolidaysForMonth(year, month);
}
