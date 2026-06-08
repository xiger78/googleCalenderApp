export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function formatYYYYMMDD(dateKey: string): string {
  return dateKey.replace(/-/g, '');
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function getMonthDateKeys(year: number, month: number): string[] {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => formatDateKey(year, month, i + 1));
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}

export function isValidTime(hour: string, minute: string): boolean {
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  return !isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function formatTime(hour: string, minute: string): string {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

export function parseTime(time: string): { hour: string; minute: string } {
  if (!time || !time.includes(':')) {
    return { hour: '', minute: '' };
  }
  const [hour = '', minute = ''] = time.split(':');
  return { hour, minute };
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatShortDateLabel(
  dateKey: string,
  weekdays: string[]
): string {
  const { month, day } = parseDateKey(dateKey);
  const dow = weekdays[new Date(dateKey).getDay()];
  return `${month}.${day} (${dow})`;
}

export function formatSlashDateWithWeekday(
  dateKey: string,
  weekdays: string[]
): string {
  const { year, month, day } = parseDateKey(dateKey);
  const dow = weekdays[new Date(dateKey).getDay()];
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}/${m}/${d}(${dow})`;
}

export function formatDateWithTypeLabel(
  dateKey: string,
  weekdays: string[],
  typeLabel: string
): string {
  return `${formatSlashDateWithWeekday(dateKey, weekdays)}:${typeLabel}`;
}

export function isWeekend(dateKey: string): boolean {
  const dow = new Date(dateKey).getDay();
  return dow === 0 || dow === 6;
}

export const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
