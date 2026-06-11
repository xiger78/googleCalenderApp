import { ArrivalColor, ArrivalTypeConfig, WorkArrivalType } from '../types';
import { formatTime, parseTime } from './dateUtils';

export const ARRIVAL_COLOR_HEX: Record<ArrivalColor, string> = {
  green: '#A5D6A7',
  yellow: '#FFF176',
  blue: '#90CAF9',
  red: '#EF9A9A',
};

export const ARRIVAL_COLOR_OPTIONS: ArrivalColor[] = ['green', 'yellow', 'blue', 'red'];

export const DEFAULT_ARRIVAL_CONFIGS: Record<WorkArrivalType, ArrivalTypeConfig> = {
  normal: { color: 'green', clockIn: '08:40' },
  early: { color: 'yellow', clockIn: '06:00' },
  late: { color: 'blue', clockIn: '11:00' },
  remote: { color: 'blue', clockIn: '08:40' },
};

export const WORK_HOURS_PER_DAY = 8;

export function getArrivalColorHex(color: ArrivalColor): string {
  return ARRIVAL_COLOR_HEX[color];
}

export function clockInToClockOut(clockIn: string, workHours = WORK_HOURS_PER_DAY): string {
  const { hour, minute } = parseTime(clockIn);
  const h = parseInt(hour, 10) || 0;
  const m = parseInt(minute, 10) || 0;
  const totalMinutes = h * 60 + m + workHours * 60;
  const outH = Math.floor(totalMinutes / 60) % 24;
  const outM = totalMinutes % 60;
  return formatTime(String(outH), String(outM));
}

export function configToCommuteTimes(config: ArrivalTypeConfig): {
  clockIn: string;
  clockOut: string;
} {
  const clockIn = config.clockIn || '00:00';
  return { clockIn, clockOut: clockInToClockOut(clockIn) };
}

export function parseClockInToDraft(clockIn: string): { hour: string; minute: string } {
  const parsed = parseTime(clockIn);
  return { hour: parsed.hour, minute: parsed.minute };
}
