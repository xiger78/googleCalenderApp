import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Language } from '../i18n/types';
import { WorkData } from '../types';
import { formatDateKey, getDaysInMonth } from './dateUtils';

function timeToMinutes(time: string): number | null {
  if (!time || !time.includes(':')) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(minutes: number, lang: Language): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');

  if (lang === 'ko') return `${hh}시간${mm}분`;
  if (lang === 'ja') return `${hh}時間${mm}分`;
  return `${hh}h${mm}m`;
}

function calcWorkMinutes(
  clockIn: string,
  clockOut: string,
  lunchMinutes: number
): number | null {
  const inMin = timeToMinutes(clockIn);
  const outMin = timeToMinutes(clockOut);
  if (inMin === null || outMin === null || outMin <= inMin) return null;
  return Math.max(0, outMin - inMin - lunchMinutes);
}

function formatTimeDisplay(time: string): string {
  return time && time.includes(':') ? time : '--:--';
}

function buildHeader(year: number, month: number, lang: Language): string {
  const mm = String(month).padStart(2, '0');
  if (lang === 'ko') return `${year}년 ${mm}월 출근 이력`;
  if (lang === 'ja') return `${year}年 ${mm}月 出勤履歴`;
  return `${year} ${mm} Attendance History`;
}

function buildDayLine(
  day: number,
  clockIn: string,
  clockOut: string,
  workMinutes: number | null,
  lang: Language
): string {
  const dd = String(day).padStart(2, '0');
  const inStr = formatTimeDisplay(clockIn);
  const outStr = formatTimeDisplay(clockOut);
  const duration = workMinutes !== null ? formatDuration(workMinutes, lang) : '--';

  if (lang === 'ko') {
    return `${dd}일: 출근시각:${inStr}、퇴근시각:${outStr}、가동시간:${duration}`;
  }
  if (lang === 'ja') {
    return `${dd}日: 出勤時刻:${inStr}、退勤時刻:${outStr}、稼働時間:${duration}`;
  }
  return `${dd}: Clock-in:${inStr}, Clock-out:${outStr}, Work hours:${duration}`;
}

function buildTotalLine(totalMinutes: number, lang: Language): string {
  const duration = formatDuration(totalMinutes, lang);
  if (lang === 'ko') return `[총근무시간:${duration}]`;
  if (lang === 'ja') return `[総勤務時間:${duration}]`;
  return `[Total work hours:${duration}]`;
}

export function generateAttendanceCsv(
  data: WorkData,
  year: number,
  month: number,
  lang: Language,
  lunchBreakMinutes: number
): string {
  const daysInMonth = getDaysInMonth(year, month);
  const lines: string[] = [buildHeader(year, month, lang)];
  let totalMinutes = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(year, month, day);
    const commute = data.commuteTimes[dateKey];
    const clockIn = commute?.clockIn ?? '';
    const clockOut = commute?.clockOut ?? '';
    const workMin = calcWorkMinutes(clockIn, clockOut, lunchBreakMinutes);
    if (workMin !== null) totalMinutes += workMin;
    lines.push(buildDayLine(day, clockIn, clockOut, workMin, lang));
  }

  lines.push(buildTotalLine(totalMinutes, lang));
  return lines.join('\n');
}

export async function exportAttendanceCsv(
  data: WorkData,
  year: number,
  month: number,
  lang: Language,
  lunchBreakMinutes: number
): Promise<string> {
  const csv = generateAttendanceCsv(data, year, month, lang, lunchBreakMinutes);
  const fileName = `attendance_${year}${String(month).padStart(2, '0')}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: fileName,
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
}
