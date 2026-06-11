import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatSlashDateWithWeekday } from '../utils/dateUtils';
import { getWeekdays, TranslationKey } from '../i18n/translations';
import { ArrivalTypeConfig, WorkArrivalType } from '../types';

type NotificationItem = {
  dateKey: string;
  dateLine: string;
  memo: string;
};

function arrivalTypeLabel(
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string,
  type: WorkArrivalType
): string {
  if (type === 'early') return tr('arrivalEarly');
  if (type === 'late') return tr('arrivalLate');
  if (type === 'remote') return tr('arrivalRemote');
  if (type === 'vacation') return tr('arrivalVacation');
  return tr('arrivalNormal');
}

function clockInForDate(
  dateKey: string,
  arrivalType: WorkArrivalType,
  commuteTimes: Record<string, { clockIn?: string; clockOut?: string }>,
  arrivalConfigs: Record<WorkArrivalType, ArrivalTypeConfig>
): string {
  const saved = commuteTimes[dateKey]?.clockIn?.trim();
  if (saved) return saved;
  if (arrivalType === 'vacation') return '--:--';
  return arrivalConfigs[arrivalType].clockIn || '--:--';
}

export function NotificationScreen() {
  const { data } = useWorkDataContext();
  const {
    language,
    tr,
    normalArrival,
    earlyArrival,
    lateArrival,
    remoteArrival,
    vacationArrival,
  } = useLanguage();
  const weekdays = getWeekdays(language);

  const arrivalConfigs = useMemo<Record<WorkArrivalType, ArrivalTypeConfig>>(
    () => ({
      normal: normalArrival,
      early: earlyArrival,
      late: lateArrival,
      remote: remoteArrival,
      vacation: vacationArrival,
    }),
    [normalArrival, earlyArrival, lateArrival, remoteArrival, vacationArrival]
  );

  const items = useMemo<NotificationItem[]>(() => {
    return data.workDays
      .filter((dateKey) => {
        const memo = data.dayMemos[dateKey]?.trim();
        return Boolean(memo);
      })
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => {
        const arrivalType = data.workDayTypes[dateKey] ?? 'normal';
        const dateLabel = formatSlashDateWithWeekday(dateKey, weekdays);
        const clockIn = clockInForDate(
          dateKey,
          arrivalType,
          data.commuteTimes,
          arrivalConfigs
        );
        return {
          dateKey,
          dateLine: `${dateLabel}:${arrivalTypeLabel(tr, arrivalType)}(${clockIn})`,
          memo: data.dayMemos[dateKey].trim(),
        };
      });
  }, [
    data.workDays,
    data.dayMemos,
    data.workDayTypes,
    data.commuteTimes,
    arrivalConfigs,
    weekdays,
    tr,
    language,
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={tr('notificationTitle')} subtitle={tr('notificationDesc')} />

      {items.length === 0 ? (
        <Text style={styles.empty}>{tr('notificationEmpty')}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.dateKey} style={styles.card}>
              <Text style={styles.dateLine}>{item.dateLine}</Text>
              <Text style={styles.memoLine}>{tr('notificationMemoLine', { memo: item.memo })}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  empty: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 22,
  },
  list: { gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
    gap: 8,
  },
  dateLine: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    lineHeight: 20,
  },
  memoLine: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
