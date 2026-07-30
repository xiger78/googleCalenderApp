import { useCallback, useEffect, useState } from 'react';
import { ArrivalTypeConfig, HolidayWorkType, WorkArrivalType, WorkData } from '../types';
import { configToCommuteTimes, shouldClearHolidayCommuteTime } from '../utils/arrivalSettings';
import { BreakSettings, isValidCommutePair } from '../utils/workDuration';
import { getMonthDateKeys } from '../utils/dateUtils';
import { loadWorkData, saveWorkData } from '../utils/storage';

function sanitizeLoadedWorkData(data: WorkData): { data: WorkData; changed: boolean } {
  const commuteTimes = { ...data.commuteTimes };
  let changed = false;
  Object.keys(commuteTimes).forEach((dateKey) => {
    const times = commuteTimes[dateKey];
    const clockIn = times?.clockIn ?? '';
    const clockOut = times?.clockOut ?? '';
    if (isValidCommutePair(clockIn, clockOut)) return;
    if (shouldClearHolidayCommuteTime(dateKey, data.workDays)) {
      delete commuteTimes[dateKey];
      changed = true;
    }
  });
  return { data: { ...data, commuteTimes }, changed };
}

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
      const { data: sanitized, changed } = sanitizeLoadedWorkData(loaded);
      setData(sanitized);
      if (changed) {
        void saveWorkData(sanitized);
      }
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
    async (
      dateKey: string,
      arrivalType: WorkArrivalType,
      config: ArrivalTypeConfig,
      breakSettings: BreakSettings
    ) => {
      const workDays = data.workDays.includes(dateKey)
        ? data.workDays
        : [...data.workDays, dateKey].sort();
      const times =
        arrivalType === 'vacation'
          ? { clockIn: '', clockOut: '' }
          : configToCommuteTimes(config, arrivalType, breakSettings);
      await persist({
        ...data,
        workDays,
        workDayTypes: { ...data.workDayTypes, [dateKey]: arrivalType },
        commuteTimes: { ...data.commuteTimes, [dateKey]: times },
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

  const setCommuteTimes = useCallback(async (commuteTimes: WorkData['commuteTimes']) => {
    await new Promise<void>((resolve) => {
      setData((prev) => {
        const next = { ...prev, commuteTimes };
        void saveWorkData(next).then(resolve);
        return next;
      });
    });
  }, []);

  const updateCommuteTimeForDate = useCallback(async (dateKey: string, times: WorkData['commuteTimes'][string]) => {
    await new Promise<void>((resolve) => {
      setData((prev) => {
        const next = {
          ...prev,
          commuteTimes: { ...prev.commuteTimes, [dateKey]: times },
        };
        void saveWorkData(next).then(resolve);
        return next;
      });
    });
  }, []);

  const saveDayCommuteAndMemo = useCallback(
    async (dateKey: string, times: WorkData['commuteTimes'][string], memo: string) => {
      await new Promise<void>((resolve) => {
        setData((prev) => {
          const dayMemos = { ...prev.dayMemos };
          const trimmed = memo.trim();
          if (trimmed) {
            dayMemos[dateKey] = trimmed;
          } else {
            delete dayMemos[dateKey];
          }
          const next = {
            ...prev,
            commuteTimes: { ...prev.commuteTimes, [dateKey]: times },
            dayMemos,
          };
          void saveWorkData(next).then(resolve);
          return next;
        });
      });
    },
    []
  );

  const clearDayCommuteAndMemo = useCallback(async (dateKey: string) => {
    await new Promise<void>((resolve) => {
      setData((prev) => {
        const commuteTimes = { ...prev.commuteTimes };
        const dayMemos = { ...prev.dayMemos };
        delete commuteTimes[dateKey];
        delete dayMemos[dateKey];
        const next = { ...prev, commuteTimes, dayMemos };
        void saveWorkData(next).then(resolve);
        return next;
      });
    });
  }, []);

  const setDayMemos = useCallback(async (dayMemos: WorkData['dayMemos']) => {
    await new Promise<void>((resolve) => {
      setData((prev) => {
        const next = { ...prev, dayMemos };
        void saveWorkData(next).then(resolve);
        return next;
      });
    });
  }, []);

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
    updateCommuteTimeForDate,
    saveDayCommuteAndMemo,
    clearDayCommuteAndMemo,
    setDayMemos,
    setHolidayWorkType,
    isWorkDay,
    persist,
  };
}
