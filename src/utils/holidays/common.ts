import { formatDateKey, getDaysInMonth, parseDateKey } from '../dateUtils';

export type HolidayCountry = 'jp' | 'kr' | 'cn' | 'us';

export interface HolidayDetail {
  dateKey: string;
  nameKey: string;
}

export function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number
): number {
  let count = 0;
  const days = getDaysInMonth(year, month);
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() === weekday) {
      count++;
      if (count === n) return d;
    }
  }
  return 0;
}

export function lastWeekday(year: number, month: number, weekday: number): number {
  const days = getDaysInMonth(year, month);
  for (let d = days; d >= 1; d--) {
    if (new Date(year, month - 1, d).getDay() === weekday) return d;
  }
  return 0;
}

export function shiftDateKey(year: number, month: number, day: number, offset: number): string {
  const d = new Date(year, month - 1, day + offset);
  return formatDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function addFixedHoliday(
  map: Map<string, string>,
  year: number,
  month: number,
  day: number,
  nameKey: string
): void {
  if (day >= 1 && day <= getDaysInMonth(year, month)) {
    map.set(formatDateKey(year, month, day), nameKey);
  }
}

export function addHolidayRange(
  map: Map<string, string>,
  startKey: string,
  days: number,
  nameKey: string
): void {
  const { year, month, day } = parseDateKey(startKey);
  for (let offset = 0; offset < days; offset++) {
    map.set(shiftDateKey(year, month, day, offset), nameKey);
  }
}

export function mapToHolidayDetails(map: Map<string, string>): HolidayDetail[] {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, nameKey]) => ({ dateKey, nameKey }));
}

/** Lunar-based holidays by year (approximate official dates). */
export const LUNAR_HOLIDAY_TABLE: Record<
  number,
  { krSeollal?: string; krBuddha?: string; krChuseok?: string; cnSpring?: string; cnQingming?: string; cnDragonBoat?: string; cnMidAutumn?: string }
> = {
  2024: { krSeollal: '2024-02-10', krBuddha: '2024-05-15', krChuseok: '2024-09-17', cnSpring: '2024-02-10', cnQingming: '2024-04-04', cnDragonBoat: '2024-06-10', cnMidAutumn: '2024-09-17' },
  2025: { krSeollal: '2025-01-29', krBuddha: '2025-05-05', krChuseok: '2025-10-06', cnSpring: '2025-01-29', cnQingming: '2025-04-04', cnDragonBoat: '2025-05-31', cnMidAutumn: '2025-10-06' },
  2026: { krSeollal: '2026-02-17', krBuddha: '2026-05-24', krChuseok: '2026-09-25', cnSpring: '2026-02-17', cnQingming: '2026-04-05', cnDragonBoat: '2026-06-19', cnMidAutumn: '2026-09-25' },
  2027: { krSeollal: '2027-02-06', krBuddha: '2027-05-13', krChuseok: '2027-09-15', cnSpring: '2027-02-06', cnQingming: '2027-04-05', cnDragonBoat: '2027-06-09', cnMidAutumn: '2027-09-15' },
  2028: { krSeollal: '2028-01-26', krBuddha: '2028-05-02', krChuseok: '2028-10-03', cnSpring: '2028-01-26', cnQingming: '2028-04-04', cnDragonBoat: '2028-06-28', cnMidAutumn: '2028-10-03' },
  2029: { krSeollal: '2029-02-13', krBuddha: '2029-05-20', krChuseok: '2029-09-22', cnSpring: '2029-02-13', cnQingming: '2029-04-04', cnDragonBoat: '2029-06-16', cnMidAutumn: '2029-09-22' },
  2030: { krSeollal: '2030-02-03', krBuddha: '2030-05-09', krChuseok: '2030-09-12', cnSpring: '2030-02-03', cnQingming: '2030-04-05', cnDragonBoat: '2030-06-05', cnMidAutumn: '2030-09-12' },
};

export function nearestLunarTableYear(year: number): number {
  if (LUNAR_HOLIDAY_TABLE[year]) return year;
  const years = Object.keys(LUNAR_HOLIDAY_TABLE).map(Number).sort((a, b) => a - b);
  let closest = years[0];
  for (const y of years) {
    if (Math.abs(y - year) < Math.abs(closest - year)) closest = y;
  }
  return closest;
}
