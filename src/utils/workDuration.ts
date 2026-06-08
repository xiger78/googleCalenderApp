export function timeToMinutes(time: string): number | null {
  if (!time || !time.includes(':')) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function calcWorkMinutes(
  clockIn: string,
  clockOut: string,
  breakMinutes = 0
): number | null {
  const inMin = timeToMinutes(clockIn);
  const outMin = timeToMinutes(clockOut);
  if (inMin === null || outMin === null || outMin <= inMin) return null;
  return Math.max(0, outMin - inMin - breakMinutes);
}

/** 9시간 → "9.0", 9시간 30분 → "9.5" */
export function formatWorkHoursDecimal(workMinutes: number | null): string | null {
  if (workMinutes === null) return null;
  return (workMinutes / 60).toFixed(1);
}

export function getWorkHoursParenthetical(
  clockIn: string,
  clockOut: string,
  breakMinutes = 0
): string {
  const decimal = formatWorkHoursDecimal(calcWorkMinutes(clockIn, clockOut, breakMinutes));
  return decimal ? ` (${decimal})` : '';
}

export function sumWorkMinutes(
  entries: { clockIn: string; clockOut: string }[],
  breakMinutes = 0
): number {
  return entries.reduce((sum, { clockIn, clockOut }) => {
    const mins = calcWorkMinutes(clockIn, clockOut, breakMinutes);
    return sum + (mins ?? 0);
  }, 0);
}

export function formatTotalWorkHoursDecimal(totalMinutes: number): string {
  return (totalMinutes / 60).toFixed(1);
}
