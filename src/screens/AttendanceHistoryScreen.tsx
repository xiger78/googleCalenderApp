import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatYYYYMMDD, getDaysInMonth, formatDateKey } from '../utils/dateUtils';

export function AttendanceHistoryScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [history, setHistory] = useState<{ date: string; status: string; isOffice: boolean }[]>([]);
  const { data } = useWorkDataContext();
  const { language, tr } = useLanguage();

  const loadHistory = () => {
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

  useEffect(() => {
    loadHistory();
  }, [year, month, data.workDays, language]);

  const handleViewItem = (item: { date: string; status: string; isOffice: boolean }) => {
    const dateKey = `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`;
    const commute = data.commuteTimes[dateKey];
    const detail =
      commute?.clockIn || commute?.clockOut
        ? `${tr('clockIn')} ${commute.clockIn || '-'} · ${tr('clockOut')} ${commute.clockOut || '-'}`
        : tr('historyDesc');
    Alert.alert(`${item.date} · ${item.status}`, detail);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={tr('historyTitle')} subtitle={tr('historyDescLong')} />

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.list}>
        {history.map((item) => (
          <View key={item.date} style={styles.listRow}>
            <Text style={styles.listDate}>{item.date}</Text>
            <Text style={[styles.listStatus, item.isOffice ? styles.office : styles.remote]}>
              {item.status}
            </Text>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => handleViewItem(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewBtnText}>{tr('view')}</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  listDate: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  listStatus: { fontSize: 14, fontWeight: '600', marginRight: 12 },
  office: { color: '#1976D2' },
  remote: { color: '#4CAF50' },
  viewBtn: {
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600', color: '#1976D2' },
});
