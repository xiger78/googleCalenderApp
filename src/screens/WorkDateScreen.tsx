import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { CalendarGrid } from '../components/CalendarGrid';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkDaysInMonth } from '../utils/storage';

export function WorkDateScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data, toggleWorkDay } = useWorkDataContext();
  const { tr } = useLanguage();

  const monthWorkDays = getWorkDaysInMonth(data.workDays, year, month);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{tr('workDateTitle')}</Text>
      <Text style={styles.desc}>{tr('workDateDesc')}</Text>

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <CalendarGrid
        year={year}
        month={month}
        selectedDates={monthWorkDays}
        onDatePress={toggleWorkDay}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          {tr('workDateSummary', { year, month, count: monthWorkDays.length })}
        </Text>
        {monthWorkDays.length > 0 ? (
          monthWorkDays.map((d) => (
            <Text key={d} style={styles.summaryItem}>
              · {d.replace(/-/g, '')}
            </Text>
          ))
        ) : (
          <Text style={styles.empty}>{tr('workDateEmpty')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 4 },
  desc: { fontSize: 14, color: '#666', marginBottom: 16 },
  summary: { marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 12 },
  summaryTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333' },
  summaryItem: { fontSize: 14, color: '#444', lineHeight: 22 },
  empty: { fontSize: 14, color: '#999' },
});
