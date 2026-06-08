import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { Button } from '../components/Button';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatYYYYMMDD, getDaysInMonth, formatDateKey } from '../utils/dateUtils';

export function AttendanceHistoryScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [history, setHistory] = useState<{ date: string; status: string; isOffice: boolean }[]>([]);
  const { data } = useWorkDataContext();
  const { tr } = useLanguage();

  const handleView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const workDaySet = new Set(
      data.workDays.filter((d) => d.startsWith(`${year}-${String(month).padStart(2, '0')}`))
    );

    const result = Array.from({ length: daysInMonth }, (_, i) => {
      const dateKey = formatDateKey(year, month, i + 1);
      const yyyymmdd = formatYYYYMMDD(dateKey);
      const isOffice = workDaySet.has(dateKey);
      return { date: yyyymmdd, status: isOffice ? tr('office') : tr('remote'), isOffice };
    });

    setHistory(result);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{tr('historyTitle')}</Text>
      <Text style={styles.desc}>{tr('historyDesc')}</Text>

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <Button title={tr('view')} onPress={handleView} />

      {history.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.listTitle}>{tr('historyListTitle', { year, month })}</Text>
          {history.map((item) => (
            <Text
              key={item.date}
              style={[styles.listItem, item.isOffice ? styles.office : styles.remote]}
            >
              {item.date}:{item.status}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, color: '#222' },
  desc: { fontSize: 14, color: '#666', marginBottom: 16 },
  list: { marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 12 },
  listTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12, color: '#333' },
  listItem: { fontSize: 14, lineHeight: 24, fontFamily: 'monospace' },
  office: { color: '#2e7d32' },
  remote: { color: '#1565c0' },
});
