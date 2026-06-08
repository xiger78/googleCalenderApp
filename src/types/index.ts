export interface CommuteTime {
  clockIn: string;
  clockOut: string;
}

export interface WorkData {
  workDays: string[];
  commuteTimes: Record<string, CommuteTime>;
}

export const STORAGE_KEY = '@work_data';
