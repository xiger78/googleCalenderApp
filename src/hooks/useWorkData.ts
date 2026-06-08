import { useCallback, useEffect, useState } from 'react';
import { HolidayWorkType, WorkData } from '../types';
import { loadWorkData, saveWorkData } from '../utils/storage';

export function useWorkData() {
  const [data, setData] = useState<WorkData>({
    workDays: [],
    commuteTimes: {},
    holidayWorkTypes: {},
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

  const toggleWorkDay = useCallback(
    async (dateKey: string) => {
      const exists = data.workDays.includes(dateKey);
      const workDays = exists
        ? data.workDays.filter((d) => d !== dateKey)
        : [...data.workDays, dateKey].sort();
      const commuteTimes = { ...data.commuteTimes };
      const holidayWorkTypes = { ...data.holidayWorkTypes };
      if (exists) {
        delete commuteTimes[dateKey];
        delete holidayWorkTypes[dateKey];
      }
      await persist({ ...data, workDays, commuteTimes, holidayWorkTypes });
    },
    [data, persist]
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
    setCommuteTimes,
    setHolidayWorkType,
    isWorkDay,
    persist,
  };
}
