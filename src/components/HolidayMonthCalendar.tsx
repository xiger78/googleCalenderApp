import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  formatDateKey,
  getDaysInMonth,
  getFirstDayOfWeek,
} from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { getWeekdays } from '../i18n/translations';
import { JapaneseHolidayDetail } from '../utils/japaneseHolidays';

interface Props {
  year: number;
  month: number;
  holidays: JapaneseHolidayDetail[];
}

export function HolidayMonthCalendar({ year, month, holidays }: Props) {
  const { language } = useLanguage();
  const weekdays = getWeekdays(language);
  const holidayMap = new Map(holidays.map((h) => [h.dateKey, h]));
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        {weekdays.map((wd, i) => (
          <Text
            key={wd}
            style={[styles.weekday, i === 0 && styles.sunday, i === 6 && styles.saturday]}
          >
            {wd}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {blanks.map((b) => (
          <View key={`blank-${b}`} style={styles.cell} />
        ))}
        {days.map((day) => {
          const dateKey = formatDateKey(year, month, day);
          const holiday = holidayMap.get(dateKey);
          const dow = (firstDay + day - 1) % 7;

          return (
            <View key={day} style={styles.cell}>
              <View style={[styles.dayCircle, holiday && styles.holidayCircle]}>
                <Text
                  style={[
                    styles.dayText,
                    holiday && styles.holidayText,
                    dow === 0 && !holiday && styles.sunday,
                    dow === 6 && !holiday && styles.saturday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    color: '#666',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holidayCircle: {
    backgroundColor: '#FFEBEE',
  },
  dayText: { fontSize: 15, color: '#333' },
  holidayText: { color: '#e53935', fontWeight: '700' },
  sunday: { color: '#e53935' },
  saturday: { color: '#1e88e5' },
});
