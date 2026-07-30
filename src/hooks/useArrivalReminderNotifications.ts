import { useEffect } from 'react';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { syncArrivalReminders } from '../utils/arrivalNotifications';

export function useArrivalReminderNotifications() {
  const { data, loading } = useWorkDataContext();
  const { language } = useLanguage();

  useEffect(() => {
    if (loading) return;
    syncArrivalReminders(data, language).catch(() => {
      /* ignore scheduling errors */
    });
  }, [data.workDays, data.workDayTypes, language, loading]);
}
