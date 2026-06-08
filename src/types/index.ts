export interface CommuteTime {
  clockIn: string;
  clockOut: string;
}

export type HolidayWorkType = 'office' | 'remote';

export interface WorkData {
  workDays: string[];
  commuteTimes: Record<string, CommuteTime>;
  /** 토·일·공휴일을 출근일로 지정한 날의 출근/재택 선택 */
  holidayWorkTypes: Record<string, HolidayWorkType>;
}

export const STORAGE_KEY = '@work_data';
