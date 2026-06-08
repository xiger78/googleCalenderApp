import { formatDateKey, getDaysInMonth, getMonthDateKeys, parseDateKey } from './dateUtils';

const holidayCache = new Map<number, Set<string>>();

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

function buildBaseHolidays(year: number): Set<string> {
  const holidays = new Set<string>();
  const add = (month: number, day: number) => {
    if (day >= 1 && day <= getDaysInMonth(year, month)) {
      holidays.add(formatDateKey(year, month, day));
    }
  };

  add(1, 1);
  add(2, 11);
  add(2, 23);
  add(3, vernalEquinoxDay(year));
  add(4, 29);
  add(5, 3);
  add(5, 4);
  add(5, 5);
  add(7, nthMonday(year, 7, 3));
  add(8, 11);
  add(9, nthMonday(year, 9, 3));
  add(9, autumnalEquinoxDay(year));
  add(10, nthMonday(year, 10, 2));
  add(11, 3);
  add(11, 23);

  return holidays;
}

/** 振替休日: 日曜日の祝日 → 翌日以降の最初の非祝日日 */
function applySubstituteHolidays(year: number, holidays: Set<string>): void {
  const keys = [...holidays].sort();
  for (const key of keys) {
    const { month, day } = parseDateKey(key);
    if (new Date(year, month - 1, day).getDay() !== 0) continue;

    for (let offset = 1; offset <= 7; offset++) {
      const subKey = shiftDateKey(year, month, day, offset);
      if (!holidays.has(subKey)) {
        holidays.add(subKey);
        break;
      }
    }
  }
}

/** 国民の休日: 祝日に挟まれた平日 */
function applyCitizensHolidays(year: number, holidays: Set<string>): void {
  for (let month = 1; month <= 12; month++) {
    const days = getDaysInMonth(year, month);
    for (let day = 1; day <= days; day++) {
      if (isWeekend(year, month, day)) continue;
      const key = formatDateKey(year, month, day);
      if (holidays.has(key)) continue;

      const prevKey = shiftDateKey(year, month, day, -1);
      const nextKey = shiftDateKey(year, month, day, 1);
      if (holidays.has(prevKey) && holidays.has(nextKey)) {
        holidays.add(key);
      }
    }
  }
}

export function getJapaneseHolidaysForYear(year: number): Set<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const holidays = buildBaseHolidays(year);
  applySubstituteHolidays(year, holidays);
  applyCitizensHolidays(year, holidays);
  // 振替休日追加後に国民の休日が生じる場合があるため 1 回再適用
  applyCitizensHolidays(year, holidays);

  holidayCache.set(year, holidays);
  return holidays;
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
