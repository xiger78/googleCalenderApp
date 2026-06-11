export interface CommuteTime {
  clockIn: string;
  clockOut: string;
}

export type HolidayWorkType = 'office' | 'remote';

export type WorkArrivalType = 'normal' | 'early' | 'late';

export type ArrivalColor = 'green' | 'yellow' | 'blue' | 'red';

export interface ArrivalTypeConfig {
  color: ArrivalColor;
  clockIn: string;
}

export interface WorkData {
  workDays: string[];
  commuteTimes: Record<string, CommuteTime>;
  /** 토·일·공휴일을 출근일로 지정한 날의 출근/재택 선택 */
  holidayWorkTypes: Record<string, HolidayWorkType>;
  /** 출근일별 정상/일찍/늦게 출근 유형 */
  workDayTypes: Record<string, WorkArrivalType>;
}

export const STORAGE_KEY = '@work_data';
