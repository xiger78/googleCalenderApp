import { useCallback, useEffect, useState } from 'react';
import { WorkData } from '../types';
import { loadWorkData, saveWorkData } from '../utils/storage';

export function useWorkData() {
  const [data, setData] = useState<WorkData>({ workDays: [], commuteTimes: {} });
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
      if (exists) {
        delete commuteTimes[dateKey];
      }
      await persist({ workDays, commuteTimes });
    },
    [data, persist]
  );

  const setCommuteTimes = useCallback(
    async (commuteTimes: WorkData['commuteTimes']) => {
      await persist({ ...data, commuteTimes });
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
    isWorkDay,
    persist,
  };
}
