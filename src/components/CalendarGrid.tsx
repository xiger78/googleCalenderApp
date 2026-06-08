import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  formatDateKey,
  getDaysInMonth,
  getFirstDayOfWeek,
} from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { getWeekdays } from '../i18n/translations';

interface Props {
  year: number;
  month: number;
  selectedDates: string[];
  onDatePress: (dateKey: string) => void;
  highlightColor?: string;
}

const DOUBLE_TAP_DELAY = 300;

export function CalendarGrid({
  year,
  month,
  selectedDates,
  onDatePress,
  highlightColor = '#A5D6A7',
}: Props) {
  const { language, tr } = useLanguage();
  const weekdays = getWeekdays(language);
  const lastTap = useRef<{ dateKey: string; time: number } | null>(null);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePress = (day: number) => {
    const dateKey = formatDateKey(year, month, day);
    const now = Date.now();
    const isSelected = selectedDates.includes(dateKey);

    if (
      lastTap.current &&
      lastTap.current.dateKey === dateKey &&
      now - lastTap.current.time < DOUBLE_TAP_DELAY
    ) {
      if (isSelected) {
        onDatePress(dateKey);
      }
      lastTap.current = null;
      return;
    }

    lastTap.current = { dateKey, time: now };

    if (!isSelected) {
      onDatePress(dateKey);
    }
  };

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
          const selected = selectedDates.includes(dateKey);
          const dow = (firstDay + day - 1) % 7;
          return (
            <TouchableOpacity
              key={day}
              style={styles.cell}
              onPress={() => handlePress(day)}
              activeOpacity={0.7}
            >
              <View style={[styles.dayCircle, selected && { backgroundColor: highlightColor }]}>
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.selectedText,
                    dow === 0 && !selected && styles.sunday,
                    dow === 6 && !selected && styles.saturday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: highlightColor }]} />
          <Text style={styles.legendText}>{tr('legendOfficeDay')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotOutline} />
          <Text style={styles.legendText}>{tr('legendHoliday')}</Text>
        </View>
      </View>
      <Text style={styles.hint}>{tr('calendarHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
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
  dayText: {
    fontSize: 15,
    color: '#333',
  },
  selectedText: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotOutline: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
    backgroundColor: '#fff',
  },
  legendText: {
    fontSize: 13,
    color: '#555',
  },
  sunday: {
    color: '#e53935',
  },
  saturday: {
    color: '#1e88e5',
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
