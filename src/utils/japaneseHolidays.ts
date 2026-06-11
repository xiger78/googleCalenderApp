import { formatDateKey, getDaysInMonth, getMonthDateKeys, parseDateKey } from './dateUtils';

export type HolidayKind = 'fixed' | 'substitute' | 'citizens';

export type HolidayNameKey =
  | 'holidayNewYear'
  | 'holidayNationalFoundation'
  | 'holidayEmperorsBirthday'
  | 'holidayVernalEquinox'
  | 'holidayShowaDay'
  | 'holidayConstitutionDay'
  | 'holidayGreeneryDay'
  | 'holidayChildrensDay'
  | 'holidayMarineDay'
  | 'holidayMountainDay'
  | 'holidayRespectForAged'
  | 'holidayAutumnalEquinox'
  | 'holidaySportsDay'
  | 'holidayCultureDay'
  | 'holidayLaborThanksgiving'
  | 'holidaySubstitute'
  | 'holidayCitizens';

export interface JapaneseHolidayDetail {
  dateKey: string;
  kind: HolidayKind;
  nameKey: HolidayNameKey;
}

const holidaySetCache = new Map<number, Set<string>>();
const holidayDetailsCache = new Map<number, JapaneseHolidayDetail[]>();

function nthMonday(year: number, month: number, n: number): number {
  let count = 0;
  const days = getDaysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() === 1) {
      count++;
      if (count === n) return d;
    }
  }
  return 0;
}

function vernalEquinoxDay(year: number): number {
  if (year <= 1980) return 21;
  if (year <= 2099) {
    return (
      Math.floor(20.8431 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4)
    );
  }
  return Math.floor(21.851 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4);
}

function autumnalEquinoxDay(year: number): number {
  if (year <= 1980) return 23;
  if (year <= 2099) {
    return (
      Math.floor(23.2488 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4)
    );
  }
  return Math.floor(24.2488 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4);
}

function shiftDateKey(year: number, month: number, day: number, offset: number): string {
  const d = new Date(year, month - 1, day + offset);
  return formatDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 0 || dow === 6;
}

function buildBaseHolidayDetails(year: number): Map<string, HolidayNameKey> {
  const map = new Map<string, HolidayNameKey>();
  const add = (month: number, day: number, nameKey: HolidayNameKey) => {
    if (day >= 1 && day <= getDaysInMonth(year, month)) {
      map.set(formatDateKey(year, month, day), nameKey);
    }
  };

  add(1, 1, 'holidayNewYear');
  add(2, 11, 'holidayNationalFoundation');
  add(2, 23, 'holidayEmperorsBirthday');
  add(3, vernalEquinoxDay(year), 'holidayVernalEquinox');
  add(4, 29, 'holidayShowaDay');
  add(5, 3, 'holidayConstitutionDay');
  add(5, 4, 'holidayGreeneryDay');
  add(5, 5, 'holidayChildrensDay');
  add(7, nthMonday(year, 7, 3), 'holidayMarineDay');
  add(8, 11, 'holidayMountainDay');
  add(9, nthMonday(year, 9, 3), 'holidayRespectForAged');
  add(9, autumnalEquinoxDay(year), 'holidayAutumnalEquinox');
  add(10, nthMonday(year, 10, 2), 'holidaySportsDay');
  add(11, 3, 'holidayCultureDay');
  add(11, 23, 'holidayLaborThanksgiving');

  return map;
}

function applySubstituteHolidays(
  year: number,
  details: Map<string, JapaneseHolidayDetail>
): void {
  const fixedKeys = [...details.keys()].filter((k) => details.get(k)?.kind === 'fixed').sort();
  for (const key of fixedKeys) {
    const { month, day } = parseDateKey(key);
    if (new Date(year, month - 1, day).getDay() !== 0) continue;

    for (let offset = 1; offset <= 7; offset++) {
      const subKey = shiftDateKey(year, month, day, offset);
      if (!details.has(subKey)) {
        details.set(subKey, {
          dateKey: subKey,
          kind: 'substitute',
          nameKey: 'holidaySubstitute',
        });
        break;
      }
    }
  }
}

function applyCitizensHolidays(
  year: number,
  details: Map<string, JapaneseHolidayDetail>
): void {
  for (let month = 1; month <= 12; month++) {
    const days = getDaysInMonth(year, month);
    for (let day = 1; day <= days; day++) {
      if (isWeekend(year, month, day)) continue;
      const key = formatDateKey(year, month, day);
      if (details.has(key)) continue;

      const prevKey = shiftDateKey(year, month, day, -1);
      const nextKey = shiftDateKey(year, month, day, 1);
      if (details.has(prevKey) && details.has(nextKey)) {
        details.set(key, {
          dateKey: key,
          kind: 'citizens',
          nameKey: 'holidayCitizens',
        });
      }
    }
  }
}

function buildHolidayDetails(year: number): JapaneseHolidayDetail[] {
  const base = buildBaseHolidayDetails(year);
  const details = new Map<string, JapaneseHolidayDetail>();
  base.forEach((nameKey, dateKey) => {
    details.set(dateKey, { dateKey, kind: 'fixed', nameKey });
  });

  applySubstituteHolidays(year, details);
  applyCitizensHolidays(year, details);
  applyCitizensHolidays(year, details);

  return [...details.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function getJapaneseHolidayDetailsForYear(year: number): JapaneseHolidayDetail[] {
  const cached = holidayDetailsCache.get(year);
  if (cached) return cached;

  const details = buildHolidayDetails(year);
  holidayDetailsCache.set(year, details);
  holidaySetCache.set(year, new Set(details.map((d) => d.dateKey)));
  return details;
}

export function getJapaneseHolidaysForYear(year: number): Set<string> {
  const cached = holidaySetCache.get(year);
  if (cached) return cached;

  getJapaneseHolidayDetailsForYear(year);
  return holidaySetCache.get(year) ?? new Set();
}

export function getJapaneseHolidayDetail(
  year: number,
  dateKey: string
): JapaneseHolidayDetail | undefined {
  return getJapaneseHolidayDetailsForYear(year).find((d) => d.dateKey === dateKey);
}

export function getJapaneseHolidaysForMonth(
  year: number,
  month: number
): JapaneseHolidayDetail[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return getJapaneseHolidayDetailsForYear(year).filter((d) => d.dateKey.startsWith(prefix));
}

export function isJapaneseHoliday(dateKey: string): boolean {
  const { year } = parseDateKey(dateKey);
  return getJapaneseHolidaysForYear(year).has(dateKey);
}

export function isWeekendDate(dateKey: string): boolean {
  const { year, month, day } = parseDateKey(dateKey);
  return isWeekend(year, month, day);
}

export function isNonWorkingDay(dateKey: string): boolean {
  return isWeekendDate(dateKey) || isJapaneseHoliday(dateKey);
}

/** 일괄등록 대상: 토·일 및 일본 공휴일 제외 */
export function getBulkApplyDateKeys(year: number, month: number): string[] {
  const holidays = getJapaneseHolidaysForYear(year);
  return getMonthDateKeys(year, month).filter((dateKey) => {
    const { year: y, month: m, day: d } = parseDateKey(dateKey);
    if (isWeekend(y, m, d)) return false;
    if (holidays.has(dateKey)) return false;
    return true;
  });
}
