import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkDaysInMonth } from '../utils/storage';
import {
  formatYYYYMMDD,
  getDaysInMonth,
  formatDateKey,
  formatShortDateLabel,
} from '../utils/dateUtils';
import { getWeekdays } from '../i18n/translations';
import { authenticateGoogle, createCalendarEvents } from '../services/googleCalendar';

export function GoogleCalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const { data } = useWorkDataContext();
  const { language, tr } = useLanguage();
  const weekdays = getWeekdays(language);

  const monthWorkDays = getWorkDaysInMonth(data.workDays, year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const workSet = new Set(monthWorkDays);

  const remoteDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dateKey = formatDateKey(year, month, i + 1);
    return !workSet.has(dateKey) ? dateKey : null;
  }).filter(Boolean) as string[];

  const formatScheduleLine = (dateKey: string, isOffice: boolean) => {
    const label = formatShortDateLabel(dateKey, weekdays);
    if (!isOffice) {
      return `${label} ${tr('allDay')}`;
    }
    const commute = data.commuteTimes[dateKey];
    if (commute?.clockIn && commute?.clockOut) {
      return `${label} ${commute.clockIn} - ${commute.clockOut}`;
    }
    return formatYYYYMMDD(dateKey);
  };

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
      <ScreenHeader title={tr('googleTitle')} subtitle={tr('googleDescLong')} />

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.registerSection}>
        <MaterialCommunityIcons name="calendar-month" size={40} color="#1976D2" style={styles.calIcon} />
        <TouchableOpacity
          style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
          onPress={handleRegister}
          disabled={loading || monthWorkDays.length === 0}
          activeOpacity={0.8}
        >
          <View style={styles.googleBadge}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.registerBtnText}>{tr('googleRegister')}</Text>
        </TouchableOpacity>
        <Text style={styles.privacy}>{tr('googlePrivacy')}</Text>
      </View>

      <TouchableOpacity style={styles.scheduleCard} activeOpacity={0.9}>
        <View style={[styles.cardIcon, styles.officeIcon]}>
          <MaterialCommunityIcons name="office-building" size={22} color="#2E7D32" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{tr('office')}</Text>
          <Text style={styles.cardCount}>
            {tr('registeredSchedules', { count: monthWorkDays.length })}
          </Text>
          {monthWorkDays.length > 0 ? (
            monthWorkDays.slice(0, 5).map((d) => (
              <View key={d} style={styles.scheduleLine}>
                <View style={[styles.dot, styles.officeDot]} />
                <Text style={styles.scheduleText}>{formatScheduleLine(d, true)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>{tr('googleOfficeEmpty')}</Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#bbb" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.scheduleCard} activeOpacity={0.9}>
        <View style={[styles.cardIcon, styles.remoteIcon]}>
          <MaterialCommunityIcons name="home-outline" size={22} color="#1565C0" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{tr('remote')}</Text>
          <Text style={styles.cardCount}>
            {tr('registeredSchedules', { count: remoteDays.length })}
          </Text>
          {remoteDays.slice(0, 5).map((d) => (
            <View key={d} style={styles.scheduleLine}>
              <View style={[styles.dot, styles.remoteDot]} />
              <Text style={styles.scheduleText}>{formatScheduleLine(d, false)}</Text>
            </View>
          ))}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#bbb" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  registerSection: { alignItems: 'center', marginBottom: 24 },
  calIcon: { marginBottom: 12 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 10,
    minWidth: 240,
    justifyContent: 'center',
  },
  registerBtnDisabled: { opacity: 0.6 },
  googleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  privacy: { fontSize: 11, color: '#888', marginTop: 10, textAlign: 'center' },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officeIcon: { backgroundColor: '#E8F5E9' },
  remoteIcon: { backgroundColor: '#E3F2FD' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardCount: { fontSize: 12, color: '#888', marginBottom: 8 },
  scheduleLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  officeDot: { backgroundColor: '#4CAF50' },
  remoteDot: { backgroundColor: '#42A5F5' },
  scheduleText: { fontSize: 13, color: '#444' },
  empty: { fontSize: 13, color: '#999' },
});
