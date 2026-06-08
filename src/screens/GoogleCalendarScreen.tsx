import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { Button } from '../components/Button';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkDaysInMonth } from '../utils/storage';
import { formatYYYYMMDD, getDaysInMonth, formatDateKey } from '../utils/dateUtils';
import { authenticateGoogle, createCalendarEvents } from '../services/googleCalendar';

export function GoogleCalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const { data } = useWorkDataContext();
  const { tr } = useLanguage();

  const monthWorkDays = getWorkDaysInMonth(data.workDays, year, month);
  const daysInMonth = getDaysInMonth(year, month);

  const remoteDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dateKey = formatDateKey(year, month, i + 1);
    return !monthWorkDays.includes(dateKey) ? formatYYYYMMDD(dateKey) : null;
  }).filter(Boolean) as string[];

  const handleRegister = async () => {
    if (monthWorkDays.length === 0) {
      Alert.alert(tr('alertNotice'), tr('alertNoWorkDays'));
      return;
    }

    setLoading(true);
    try {
      const token = await authenticateGoogle();
      if (!token) {
        Alert.alert(tr('alertCancel'), tr('alertGoogleCancel'));
        return;
      }

      const events = monthWorkDays.map((dateKey) => ({
        dateKey,
        commute: data.commuteTimes[dateKey],
      }));

      const result = await createCalendarEvents(token, events);
      Alert.alert(
        tr('alertDone'),
        tr('alertGoogleDone', {
          success: result.success,
          failed: result.failed > 0 ? tr('alertGoogleFailed', { count: result.failed }) : '',
        })
      );
    } catch (e) {
      Alert.alert(tr('alertError'), e instanceof Error ? e.message : tr('alertGoogleError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{tr('googleTitle')}</Text>
      <Text style={styles.desc}>{tr('googleDesc')}</Text>

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.registerRow}>
        <Button
          title={tr('googleRegister')}
          onPress={handleRegister}
          loading={loading}
          disabled={monthWorkDays.length === 0}
        />
      </View>

      <View style={styles.statusSection}>
        <View style={[styles.statusBox, styles.officeBox]}>
          <Text style={styles.statusTitle}>{tr('googleOffice', { count: monthWorkDays.length })}</Text>
          {monthWorkDays.length > 0 ? (
            monthWorkDays.map((d) => (
              <Text key={d} style={styles.statusItem}>
                {formatYYYYMMDD(d)}
              </Text>
            ))
          ) : (
            <Text style={styles.empty}>{tr('googleOfficeEmpty')}</Text>
          )}
        </View>

        <View style={[styles.statusBox, styles.remoteBox]}>
          <Text style={styles.statusTitle}>{tr('googleRemote', { count: remoteDays.length })}</Text>
          {remoteDays.map((d) => (
            <Text key={d} style={styles.statusItem}>
              {d}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, color: '#222' },
  desc: { fontSize: 14, color: '#666', marginBottom: 16 },
  registerRow: { marginBottom: 24, alignItems: 'flex-start' },
  statusSection: { gap: 16 },
  statusBox: { padding: 16, borderRadius: 12 },
  officeBox: { backgroundColor: '#e8f5e9' },
  remoteBox: { backgroundColor: '#e3f2fd' },
  statusTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, color: '#333' },
  statusItem: { fontSize: 14, lineHeight: 22, color: '#444' },
  empty: { fontSize: 14, color: '#999' },
});
