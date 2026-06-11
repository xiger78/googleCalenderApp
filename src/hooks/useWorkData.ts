import { useCallback, useEffect, useState } from 'react';
import { ArrivalTypeConfig, HolidayWorkType, WorkArrivalType, WorkData } from '../types';
import { configToCommuteTimes } from '../utils/arrivalSettings';
import { isNonWorkingDay } from '../utils/japaneseHolidays';
import { getMonthDateKeys } from '../utils/dateUtils';
import { loadWorkData, saveWorkData } from '../utils/storage';

export function useWorkData() {
  const [data, setData] = useState<WorkData>({
    workDays: [],
    commuteTimes: {},
    dayMemos: {},
    holidayWorkTypes: {},
    workDayTypes: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkData().then((loaded) => {
      setData(loaded);
      setLoading(false);
    });
  }, []);

  const persist = useCallback(async (next: WorkData) => {
    setData(next);
    await saveWorkData(next);
  }, []);

  const clearWorkDay = useCallback(
    async (dateKey: string) => {
      const workDays = data.workDays.filter((d) => d !== dateKey);
      const commuteTimes = { ...data.commuteTimes };
      const dayMemos = { ...data.dayMemos };
      const holidayWorkTypes = { ...data.holidayWorkTypes };
      const workDayTypes = { ...data.workDayTypes };
      delete commuteTimes[dateKey];
      delete dayMemos[dateKey];
      delete holidayWorkTypes[dateKey];
      delete workDayTypes[dateKey];
      await persist({ ...data, workDays, commuteTimes, dayMemos, holidayWorkTypes, workDayTypes });
    },
    [data, persist]
  );

  const setWorkDayArrival = useCallback(
    async (dateKey: string, arrivalType: WorkArrivalType, config: ArrivalTypeConfig) => {
      const workDays = data.workDays.includes(dateKey)
        ? data.workDays
        : [...data.workDays, dateKey].sort();
      const times =
        arrivalType === 'vacation'
          ? { clockIn: '', clockOut: '' }
          : configToCommuteTimes(config);
      const holidayWorkTypes = { ...data.holidayWorkTypes };
      if (isNonWorkingDay(dateKey)) {
        if (arrivalType === 'remote') {
          holidayWorkTypes[dateKey] = 'remote';
        } else if (arrivalType !== 'vacation') {
          holidayWorkTypes[dateKey] = 'office';
        }
      }
      await persist({
        ...data,
        workDays,
        workDayTypes: { ...data.workDayTypes, [dateKey]: arrivalType },
        commuteTimes: { ...data.commuteTimes, [dateKey]: times },
        holidayWorkTypes,
      });
    },
    [data, persist]
  );

  const toggleWorkDay = useCallback(
    async (dateKey: string) => {
      const exists = data.workDays.includes(dateKey);
      if (exists) {
        await clearWorkDay(dateKey);
      }
    },
    [data.workDays, clearWorkDay]
  );

  const setCommuteTimes = useCallback(
    async (commuteTimes: WorkData['commuteTimes']) => {
      await persist({ ...data, commuteTimes });
    },
    [data, persist]
  );

  const setDayMemos = useCallback(
    async (dayMemos: WorkData['dayMemos']) => {
      await persist({ ...data, dayMemos });
    },
    [data, persist]
  );

  const setHolidayWorkType = useCallback(
    async (dateKey: string, workType: HolidayWorkType) => {
      await persist({
        ...data,
        holidayWorkTypes: { ...data.holidayWorkTypes, [dateKey]: workType },
      });
    },
    [data, persist]
  );

  const isWorkDay = useCallback(
    (dateKey: string) => data.workDays.includes(dateKey),
    [data.workDays]
  );

  const clearMonthWorkDays = useCallback(
    async (year: number, month: number) => {
      const monthKeys = new Set(getMonthDateKeys(year, month));
      const workDays = data.workDays.filter((d) => !monthKeys.has(d));
      const commuteTimes = { ...data.commuteTimes };
      const dayMemos = { ...data.dayMemos };
      const holidayWorkTypes = { ...data.holidayWorkTypes };
      const workDayTypes = { ...data.workDayTypes };
      monthKeys.forEach((dateKey) => {
        delete commuteTimes[dateKey];
        delete dayMemos[dateKey];
        delete holidayWorkTypes[dateKey];
        delete workDayTypes[dateKey];
      });
      await persist({ ...data, workDays, commuteTimes, dayMemos, holidayWorkTypes, workDayTypes });
    },
    [data, persist]
  );

  return {
    data,
    loading,
    toggleWorkDay,
    setWorkDayArrival,
    clearWorkDay,
    clearMonthWorkDays,
    setCommuteTimes,
    setDayMemos,
    setHolidayWorkType,
    isWorkDay,
    persist,
  };
}
