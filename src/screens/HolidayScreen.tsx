import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HolidayMonthCalendar } from '../components/HolidayMonthCalendar';
import { useLanguage } from '../context/LanguageContext';
import { formatSlashDateWithWeekday, MONTHS } from '../utils/dateUtils';
import {
  getJapaneseHolidayDetailsForYear,
  getJapaneseHolidaysForMonth,
  JapaneseHolidayDetail,
} from '../utils/japaneseHolidays';
import { getWeekdays, TranslationKey } from '../i18n/translations';

export function HolidayScreen() {
  const { language, tr } = useLanguage();
  const weekdays = getWeekdays(language);
  const now = new Date();

  const [year, setYear] = React.useState<number | null>(null);
  const [month, setMonth] = React.useState<number | null>(null);

  const holidayName = (detail: JapaneseHolidayDetail) => tr(detail.nameKey as TranslationKey);

  const yearHolidays = useMemo(() => {
    if (year === null) return [];
    return getJapaneseHolidayDetailsForYear(year);
  }, [year]);

  const monthHolidays = useMemo(() => {
    if (year === null || month === null) return [];
    return getJapaneseHolidaysForMonth(year, month);
  }, [year, month]);

  const displayHolidays = month !== null ? monthHolidays : yearHolidays;

  const handleReset = () => {
    setYear(null);
    setMonth(null);
  };

  const handlePrevYear = () => {
    setYear((prev) => {
      if (prev === null) return now.getFullYear();
      return prev - 1;
    });
  };

  const handleNextYear = () => {
    setYear((prev) => {
      if (prev === null) return now.getFullYear();
      return prev + 1;
    });
  };

  const handleMonthPress = (m: number) => {
    if (year === null) return;
    setMonth((prev) => (prev === m ? null : m));
  };

  const formatLine = (detail: JapaneseHolidayDetail) => {
    const dateLabel = formatSlashDateWithWeekday(detail.dateKey, weekdays);
    return `${dateLabel}:${holidayName(detail)}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{tr('holidayScreenTitle')}</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="refresh" size={14} color="#555" />
            <Text style={styles.resetBtnText}>{tr('resetWorkDates')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.yearRow}>
          <TouchableOpacity onPress={handlePrevYear} style={styles.arrowBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.yearText}>
            {year === null ? tr('holidayYearUnselected') : `${year}${tr('year')}`}
          </Text>
          <TouchableOpacity onPress={handleNextYear} style={styles.arrowBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#1976D2" />
          </TouchableOpacity>
        </View>

        {year !== null && (
          <View style={styles.monthRow}>
            {MONTHS.map((m) => {
              const active = month === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthChip, active && styles.monthChipActive]}
                  onPress={() => handleMonthPress(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {year === null && (
          <Text style={styles.emptyHint}>{tr('holidaySelectYearHint')}</Text>
        )}

        {year !== null && month !== null && (
          <View style={styles.calendarBox}>
            <Text style={styles.sectionTitle}>
              {tr('holidayMonthCalendarTitle', { year, month })}
            </Text>
            <HolidayMonthCalendar year={year} month={month} holidays={monthHolidays} />
          </View>
        )}

        {year !== null && displayHolidays.length > 0 && (
          <View style={styles.listBox}>
            <Text style={styles.sectionTitle}>
              {month !== null
                ? tr('holidayMonthListTitle', { year, month })
                : tr('holidayYearListTitle', { year })}
            </Text>
            {displayHolidays.map((detail) => (
              <Text key={detail.dateKey} style={styles.listLine}>
                {formatLine(detail)}
              </Text>
            ))}
          </View>
        )}

        {year !== null && displayHolidays.length === 0 && (
          <Text style={styles.emptyHint}>{tr('holidayNoHolidays')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#222', flex: 1 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetBtnText: { fontSize: 12, fontWeight: '600', color: '#555' },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  arrowBtn: { padding: 4 },
  yearText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1976D2',
    minWidth: 120,
    textAlign: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  monthChip: {
    width: 40,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  monthChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  monthChipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  monthChipTextActive: { color: '#1976D2', fontWeight: '700' },
  calendarBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
  },
  listBox: { gap: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  listLine: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emptyHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 22,
  },
});
