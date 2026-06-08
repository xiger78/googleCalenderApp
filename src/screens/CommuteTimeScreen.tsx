import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { YearMonthSelector } from '../components/YearMonthSelector';
import { TimeInput } from '../components/TimeInput';
import { TimeRangeInput } from '../components/TimeRangeInput';
import { Button } from '../components/Button';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkDaysInMonth } from '../utils/storage';
import {
  formatTime,
  getDaysInMonth,
  isValidTime,
  formatYYYYMMDD,
  parseTime,
  formatDateKey,
  isWeekend,
  formatDateWithTypeLabel,
} from '../utils/dateUtils';
import { getBulkApplyDateKeys, isNonWorkingDay } from '../utils/japaneseHolidays';
import { getWeekdays } from '../i18n/translations';
import { CommuteTime } from '../types';

type PreviewItem = {
  date: string;
  type: string;
  clockIn: string;
  clockOut: string;
};

function DayTimeRow({
  dateKey,
  isOffice,
  isOffDay,
  isJpHoliday,
  times,
  onUpdateTime,
  tr,
  weekdays,
}: {
  dateKey: string;
  isOffice: boolean;
  isOffDay: boolean;
  isJpHoliday: boolean;
  times: CommuteTime;
  onUpdateTime: (
    dateKey: string,
    field: 'clockIn' | 'clockOut',
    part: 'hour' | 'minute',
    value: string
  ) => void;
  tr: (key: string, params?: Record<string, string | number>) => string;
  weekdays: string[];
}) {
  const clockIn = parseTime(times.clockIn);
  const clockOut = parseTime(times.clockOut);

  const rowStyle = isJpHoliday
    ? styles.holidayRow
    : isOffDay
      ? styles.offDayRow
      : isOffice
        ? styles.officeRow
        : styles.remoteRow;

  const typeLabel = isOffice ? tr('office') : tr('remote');
  const dateLabel = formatDateWithTypeLabel(dateKey, weekdays, typeLabel);

  return (
    <View style={[styles.dayCard, rowStyle]}>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
      <TimeRangeInput
        compact
        clockInHour={clockIn.hour || '00'}
        clockInMinute={clockIn.minute || '00'}
        clockOutHour={clockOut.hour || '00'}
        clockOutMinute={clockOut.minute || '00'}
        onClockInHourChange={(v) => onUpdateTime(dateKey, 'clockIn', 'hour', v)}
        onClockInMinuteChange={(v) => onUpdateTime(dateKey, 'clockIn', 'minute', v)}
        onClockOutHourChange={(v) => onUpdateTime(dateKey, 'clockOut', 'hour', v)}
        onClockOutMinuteChange={(v) => onUpdateTime(dateKey, 'clockOut', 'minute', v)}
      />
    </View>
  );
}

export function CommuteTimeScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [clockInHour, setClockInHour] = useState('09');
  const [clockInMinute, setClockInMinute] = useState('00');
  const [clockOutHour, setClockOutHour] = useState('18');
  const [clockOutMinute, setClockOutMinute] = useState('00');

  const [draftTimes, setDraftTimes] = useState<Record<string, CommuteTime>>({});
  const [preview, setPreview] = useState<PreviewItem[]>([]);

  const { data, setCommuteTimes } = useWorkDataContext();
  const { language, tr } = useLanguage();
  const monthWorkDays = getWorkDaysInMonth(data.workDays, year, month);
  const workSet = new Set(monthWorkDays);
  const bulkApplyDays = getBulkApplyDateKeys(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const weekdays = getWeekdays(language);

  const getTimeForDate = (dateKey: string): CommuteTime => {
    return draftTimes[dateKey] ?? data.commuteTimes[dateKey] ?? { clockIn: '', clockOut: '' };
  };

  const updateDraft = (dateKey: string, field: 'clockIn' | 'clockOut', value: string) => {
    const current = getTimeForDate(dateKey);
    setDraftTimes((prev) => ({ ...prev, [dateKey]: { ...current, [field]: value } }));
  };

  const updateTimePart = (
    dateKey: string,
    field: 'clockIn' | 'clockOut',
    part: 'hour' | 'minute',
    value: string
  ) => {
    const current = getTimeForDate(dateKey);
    const parsed = parseTime(current[field]);
    const hour = part === 'hour' ? value : parsed.hour;
    const minute = part === 'minute' ? value : parsed.minute;

    if (!hour && !minute) {
      updateDraft(dateKey, field, '');
      return;
    }
    updateDraft(dateKey, field, formatTime(hour || '0', minute || '0'));
  };

  const applyBulk = () => {
    if (!isValidTime(clockInHour, clockInMinute)) {
      Alert.alert(tr('alertInputError'), tr('alertInvalidClockIn'));
      return;
    }
    if (!isValidTime(clockOutHour, clockOutMinute)) {
      Alert.alert(tr('alertInputError'), tr('alertInvalidClockOut'));
      return;
    }
    if (bulkApplyDays.length === 0) {
      Alert.alert(tr('alertNotice'), tr('alertBulkNoDays'));
      return;
    }

    const clockIn = formatTime(clockInHour, clockInMinute);
    const clockOut = formatTime(clockOutHour, clockOutMinute);
    const next = { ...draftTimes };
    bulkApplyDays.forEach((dateKey) => {
      const current = getTimeForDate(dateKey);
      next[dateKey] = { ...current, clockIn, clockOut };
    });
    setDraftTimes(next);
    Alert.alert(
      tr('alertDone'),
      tr('alertBulkClockIn', { month, count: bulkApplyDays.length })
    );
  };

  const handleReset = async () => {
    const allDays = Array.from({ length: daysInMonth }, (_, i) =>
      formatDateKey(year, month, i + 1)
    );

    const zeroTime: CommuteTime = { clockIn: '00:00', clockOut: '00:00' };
    const nextCommute = { ...data.commuteTimes };
    const nextDraft: Record<string, CommuteTime> = {};

    allDays.forEach((dateKey) => {
      nextCommute[dateKey] = zeroTime;
      nextDraft[dateKey] = zeroTime;
    });

    setClockInHour('00');
    setClockInMinute('00');
    setClockOutHour('00');
    setClockOutMinute('00');
    setDraftTimes(nextDraft);
    setPreview([]);
    await setCommuteTimes(nextCommute);
  };

  const handleSave = async () => {
    const merged = { ...data.commuteTimes, ...draftTimes };

    const savedList: PreviewItem[] = Array.from({ length: daysInMonth }, (_, i) => {
      const dateKey = formatDateKey(year, month, i + 1);
      const isOffice = workSet.has(dateKey);
      const times = merged[dateKey];
      if (!times?.clockIn && !times?.clockOut) return null;
      return {
        date: formatYYYYMMDD(dateKey),
        type: isOffice ? tr('office') : tr('remote'),
        clockIn: times.clockIn ?? '-',
        clockOut: times.clockOut ?? '-',
      };
    }).filter(Boolean) as PreviewItem[];

    await setCommuteTimes(merged);
    setPreview(savedList);
    setDraftTimes({});
    Alert.alert(tr('alertSaved'), tr('alertCommuteSaved'));
  };

  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    formatDateKey(year, month, i + 1)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <MaterialCommunityIcons name="clock-outline" size={22} color="#1976D2" />
          <Text style={styles.title}>{tr('commuteTitle')}</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="refresh" size={14} color="#555" />
          <Text style={styles.resetBtnText}>{tr('resetAll')}</Text>
        </TouchableOpacity>
      </View>

      <YearMonthSelector year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.bulkBox}>
        <View style={styles.bulkHeader}>
          <MaterialCommunityIcons name="star-four-points" size={18} color="#1976D2" />
          <Text style={styles.bulkTitle}>{tr('bulkApplyTitle')}</Text>
        </View>
        <Text style={styles.bulkDesc}>{tr('bulkApplyInlineDesc')}</Text>

        <View style={styles.bulkTimeRow}>
          <View style={styles.bulkTimeCol}>
            <Text style={styles.bulkLabel}>{tr('clockIn')}</Text>
            <TimeInput
              label=""
              hour={clockInHour}
              minute={clockInMinute}
              onHourChange={setClockInHour}
              onMinuteChange={setClockInMinute}
            />
          </View>
          <View style={styles.bulkTimeCol}>
            <Text style={styles.bulkLabel}>{tr('clockOut')}</Text>
            <TimeInput
              label=""
              hour={clockOutHour}
              minute={clockOutMinute}
              onHourChange={setClockOutHour}
              onMinuteChange={setClockOutMinute}
            />
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={applyBulk} activeOpacity={0.8}>
            <Text style={styles.applyBtnText}>{tr('bulkApplyAction')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bulkNote}>{tr('bulkExcludeNote', { count: bulkApplyDays.length })}</Text>
      </View>

      <View style={styles.dayList}>
        {monthDays.map((dateKey) => {
          const offDay = isNonWorkingDay(dateKey);
          const jpHoliday = offDay && !isWeekend(dateKey);
          return (
            <DayTimeRow
              key={dateKey}
              dateKey={dateKey}
              isOffice={workSet.has(dateKey)}
              isOffDay={offDay}
              isJpHoliday={jpHoliday}
              times={getTimeForDate(dateKey)}
              onUpdateTime={updateTimePart}
              tr={tr}
              weekdays={weekdays}
            />
          );
        })}
      </View>

      <View style={styles.saveRow}>
        <Button title={tr('save')} onPress={handleSave} fullWidth />
      </View>

      {preview.length > 0 && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>{tr('previewTitle')}</Text>
          {preview.map((item) => (
            <Text key={item.date} style={styles.previewItem}>
              {item.date} · {item.type} | {tr('clockIn')} {item.clockIn} · {tr('clockOut')}{' '}
              {item.clockOut}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#222' },
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
  bulkBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  bulkHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  bulkTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  bulkDesc: { fontSize: 12, color: '#666', marginBottom: 12 },
  bulkTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkTimeCol: { flex: 1, minWidth: 120 },
  bulkLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4 },
  applyBtn: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bulkNote: { fontSize: 11, color: '#888', marginTop: 8 },
  dayList: { gap: 10 },
  dayCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  officeRow: { backgroundColor: '#F1F8E9', borderColor: '#C8E6C9' },
  remoteRow: { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' },
  offDayRow: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  holidayRow: { backgroundColor: '#FCE4EC', borderColor: '#F8BBD0' },
  dateLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  saveRow: { marginTop: 20 },
  preview: { marginTop: 24, padding: 16, backgroundColor: '#f3e5f5', borderRadius: 12 },
  previewTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#6a1b9a' },
  previewItem: { fontSize: 14, color: '#333', lineHeight: 22 },
});
