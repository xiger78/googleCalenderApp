import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getDaysInMonth,
  formatDateKey,
  formatSlashDateWithWeekday,
} from '../utils/dateUtils';
import {
  formatTotalWorkHoursDecimal,
  getWorkHoursParenthetical,
  sumWorkMinutes,
} from '../utils/workDuration';
import { getWeekdays } from '../i18n/translations';
import { ArrivalTypeConfig, WorkArrivalType } from '../types';
import { getCommuteRowColors } from '../utils/arrivalSettings';

type HistoryItem = {
  dateKey: string;
  line: string;
  rowColors: { backgroundColor: string; borderColor: string };
};

export function AttendanceHistoryScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalWorkHours, setTotalWorkHours] = useState<string>('0.0');
  const { data } = useWorkDataContext();
  const {
    language,
    lunchBreakMinutes,
    eveningBreakMinutes,
    normalArrival,
    earlyArrival,
    lateArrival,
    remoteArrival,
    vacationArrival,
    tr,
  } = useLanguage();
  const totalBreakMinutes = lunchBreakMinutes + eveningBreakMinutes;
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

  const loadHistory = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const timeEntries: { clockIn: string; clockOut: string }[] = [];
    const result = Array.from({ length: daysInMonth }, (_, i) => {
      const dateKey = formatDateKey(year, month, i + 1);
      const commute = data.commuteTimes[dateKey];
      const clockIn = commute?.clockIn || '--:--';
      const clockOut = commute?.clockOut || '--:--';
      timeEntries.push({ clockIn, clockOut });
      const dateLabel = formatSlashDateWithWeekday(dateKey, weekdays);
      const rowColors = getCommuteRowColors(
        dateKey,
        data.workDays,
        data.workDayTypes,
        arrivalConfigs
      );
      const workHours = getWorkHoursParenthetical(clockIn, clockOut, totalBreakMinutes);

      return {
        dateKey,
        line: `${dateLabel} ${clockIn}-${clockOut}${workHours}`,
        rowColors,
      };
    });

    const totalMinutes = sumWorkMinutes(timeEntries, totalBreakMinutes);
    setTotalWorkHours(formatTotalWorkHoursDecimal(totalMinutes));
    setHistory(result);
  };

  useEffect(() => {
    loadHistory();
  }, [
    year,
    month,
    data.workDays,
    data.commuteTimes,
    data.workDayTypes,
    language,
    lunchBreakMinutes,
    eveningBreakMinutes,
    arrivalConfigs,
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={tr('historyTitle')} subtitle={tr('historyDescLong')} />

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.list}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLine}>{tr('totalWorkHoursLine', { hours: totalWorkHours })}</Text>
        </View>
        {history.map((item) => (
          <View
            key={item.dateKey}
            style={[
              styles.listRow,
              {
                backgroundColor: item.rowColors.backgroundColor,
                borderColor: item.rowColors.borderColor,
              },
            ]}
          >
            <Text style={styles.listLine}>{item.line}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  list: { marginTop: 8, gap: 8 },
  totalRow: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CE93D8',
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
  },
  totalLine: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a1b9a',
    textAlign: 'center',
  },
  listRow: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  listLine: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
  },
});
