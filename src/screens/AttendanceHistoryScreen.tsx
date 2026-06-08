import React, { useState, useEffect } from 'react';
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
import { getCommuteDayType } from '../utils/commuteDayType';
import { getWeekdays } from '../i18n/translations';

type HistoryItem = {
  dateKey: string;
  line: string;
  dayType: 'office' | 'remote' | 'holiday';
};

export function AttendanceHistoryScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { data } = useWorkDataContext();
  const { language, tr } = useLanguage();
  const weekdays = getWeekdays(language);

  const loadHistory = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const result = Array.from({ length: daysInMonth }, (_, i) => {
      const dateKey = formatDateKey(year, month, i + 1);
      const commute = data.commuteTimes[dateKey];
      const clockIn = commute?.clockIn || '--:--';
      const clockOut = commute?.clockOut || '--:--';
      const dateLabel = formatSlashDateWithWeekday(dateKey, weekdays);
      const dayType = getCommuteDayType(dateKey, data.workDays, data.holidayWorkTypes);

      return {
        dateKey,
        line: `${dateLabel} ${clockIn}-${clockOut}`,
        dayType,
      };
    });

    setHistory(result);
  };

  useEffect(() => {
    loadHistory();
  }, [year, month, data.workDays, data.commuteTimes, data.holidayWorkTypes, language]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={tr('historyTitle')} subtitle={tr('historyDescLong')} />

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.list}>
        {history.map((item) => (
          <View
            key={item.dateKey}
            style={[
              styles.listRow,
              item.dayType === 'holiday'
                ? styles.holidayRow
                : item.dayType === 'office'
                  ? styles.officeRow
                  : styles.remoteRow,
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
  listRow: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  officeRow: { backgroundColor: '#F1F8E9', borderColor: '#A5D6A7' },
  remoteRow: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },
  holidayRow: { backgroundColor: '#FCE4EC', borderColor: '#F8BBD0' },
  listLine: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
  },
});
