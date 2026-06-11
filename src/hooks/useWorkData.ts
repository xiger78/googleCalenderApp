import { useCallback, useEffect, useState } from 'react';
import { ArrivalTypeConfig, HolidayWorkType, WorkArrivalType, WorkData } from '../types';
import { configToCommuteTimes } from '../utils/arrivalSettings';
import { loadWorkData, saveWorkData } from '../utils/storage';

export function useWorkData() {
  const [data, setData] = useState<WorkData>({
    workDays: [],
    commuteTimes: {},
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
      const holidayWorkTypes = { ...data.holidayWorkTypes };
      const workDayTypes = { ...data.workDayTypes };
      delete commuteTimes[dateKey];
      delete holidayWorkTypes[dateKey];
      delete workDayTypes[dateKey];
      await persist({ ...data, workDays, commuteTimes, holidayWorkTypes, workDayTypes });
    },
    [data, persist]
  );

  const setWorkDayArrival = useCallback(
    async (dateKey: string, arrivalType: WorkArrivalType, config: ArrivalTypeConfig) => {
      const workDays = data.workDays.includes(dateKey)
        ? data.workDays
        : [...data.workDays, dateKey].sort();
      const times = configToCommuteTimes(config);
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

  const setCommuteTimes = useCallback(
    async (commuteTimes: WorkData['commuteTimes']) => {
      await persist({ ...data, commuteTimes });
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

  return {
    data,
    loading,
    toggleWorkDay,
    setWorkDayArrival,
    clearWorkDay,
    setCommuteTimes,
    setHolidayWorkType,
    isWorkDay,
    persist,
  };
}
