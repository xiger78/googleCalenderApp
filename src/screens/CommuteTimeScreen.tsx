import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { TimeInput } from '../components/TimeInput';
import { Button } from '../components/Button';
import { Picker } from '../components/Picker';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkDaysInMonth, getRemoteDaysInMonth } from '../utils/storage';
import {
  formatTime,
  getDaysInMonth,
  isValidTime,
  formatYYYYMMDD,
  parseTime,
} from '../utils/dateUtils';
import { getBulkApplyDateKeys, isNonWorkingDay } from '../utils/japaneseHolidays';
import { CommuteTime } from '../types';

type PreviewItem = {
  date: string;
  type: string;
  clockIn: string;
  clockOut: string;
};

function DayTimeCard({
  dateKey,
  typeLabel,
  isRemote,
  isOffDay,
  times,
  onUpdateTime,
  clockInLabel,
  clockOutLabel,
}: {
  dateKey: string;
  typeLabel: string;
  isRemote: boolean;
  isOffDay: boolean;
  times: CommuteTime;
  onUpdateTime: (
    dateKey: string,
    field: 'clockIn' | 'clockOut',
    part: 'hour' | 'minute',
    value: string
  ) => void;
  clockInLabel: string;
  clockOutLabel: string;
}) {
  const clockIn = parseTime(times.clockIn);
  const clockOut = parseTime(times.clockOut);

  const cardStyle = isOffDay
    ? styles.offDayCard
    : isRemote
      ? styles.remoteCard
      : styles.dayCard;

  return (
    <View style={cardStyle}>
      <Text style={styles.dayLabel}>
        {formatYYYYMMDD(dateKey)} · {typeLabel}
      </Text>
      <TimeInput
        label={clockInLabel}
        hour={clockIn.hour}
        minute={clockIn.minute}
        onHourChange={(v) => onUpdateTime(dateKey, 'clockIn', 'hour', v)}
        onMinuteChange={(v) => onUpdateTime(dateKey, 'clockIn', 'minute', v)}
      />
      <TimeInput
        label={clockOutLabel}
        hour={clockOut.hour}
        minute={clockOut.minute}
        onHourChange={(v) => onUpdateTime(dateKey, 'clockOut', 'hour', v)}
        onMinuteChange={(v) => onUpdateTime(dateKey, 'clockOut', 'minute', v)}
      />
    </View>
  );
}

export function CommuteTimeScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState(now.getDate());

  const [clockInHour, setClockInHour] = useState('09');
  const [clockInMinute, setClockInMinute] = useState('00');
  const [clockOutHour, setClockOutHour] = useState('18');
  const [clockOutMinute, setClockOutMinute] = useState('00');

  const [draftTimes, setDraftTimes] = useState<Record<string, CommuteTime>>({});
  const [preview, setPreview] = useState<PreviewItem[]>([]);

  const { data, setCommuteTimes } = useWorkDataContext();
  const { tr } = useLanguage();
  const monthWorkDays = getWorkDaysInMonth(data.workDays, year, month);
  const monthRemoteDays = getRemoteDaysInMonth(data.workDays, year, month);
  const bulkApplyDays = getBulkApplyDateKeys(year, month);
  const daysInMonth = getDaysInMonth(year, month);

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

  const applyBulkClockIn = () => {
    if (!isValidTime(clockInHour, clockInMinute)) {
      Alert.alert(tr('alertInputError'), tr('alertInvalidClockIn'));
      return;
    }
    const time = formatTime(clockInHour, clockInMinute);
    const next = { ...draftTimes };
    if (bulkApplyDays.length === 0) {
      Alert.alert(tr('alertNotice'), tr('alertBulkNoDays'));
      return;
    }
    bulkApplyDays.forEach((dateKey) => {
      const current = getTimeForDate(dateKey);
      next[dateKey] = { ...current, clockIn: time };
    });
    setDraftTimes(next);
    Alert.alert(tr('alertDone'), tr('alertBulkClockIn', { month, count: bulkApplyDays.length }));
  };

  const applyBulkClockOut = () => {
    if (!isValidTime(clockOutHour, clockOutMinute)) {
      Alert.alert(tr('alertInputError'), tr('alertInvalidClockOut'));
      return;
    }
    const time = formatTime(clockOutHour, clockOutMinute);
    const next = { ...draftTimes };
    if (bulkApplyDays.length === 0) {
      Alert.alert(tr('alertNotice'), tr('alertBulkNoDays'));
      return;
    }
    bulkApplyDays.forEach((dateKey) => {
      const current = getTimeForDate(dateKey);
      next[dateKey] = { ...current, clockOut: time };
    });
    setDraftTimes(next);
    Alert.alert(tr('alertDone'), tr('alertBulkClockOut', { month, count: bulkApplyDays.length }));
  };

  const handleReset = async () => {
    const allDays = [...new Set([...monthWorkDays, ...monthRemoteDays])];
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
    const workSet = new Set(monthWorkDays);

    const savedList: PreviewItem[] = [...monthWorkDays, ...monthRemoteDays]
      .sort()
      .map((dateKey) => ({
        date: formatYYYYMMDD(dateKey),
        type: workSet.has(dateKey) ? tr('office') : tr('remote'),
        clockIn: merged[dateKey]?.clockIn ?? '-',
        clockOut: merged[dateKey]?.clockOut ?? '-',
      }))
      .filter((item) => item.clockIn !== '-' || item.clockOut !== '-');

    await setCommuteTimes(merged);
    setPreview(savedList);
    setDraftTimes({});
    Alert.alert(tr('alertSaved'), tr('alertCommuteSaved'));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{tr('commuteTitle')}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
          <Text style={styles.resetBtnText}>{tr('resetAll')}</Text>
        </TouchableOpacity>
      </View>

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.dayPicker}>
        <Text style={styles.label}>{tr('day')}</Text>
        <Picker
          selectedValue={day}
          onValueChange={(v) => setDay(Number(v))}
          items={Array.from({ length: daysInMonth }, (_, i) => ({
            label: `${i + 1}${tr('day')}`,
            value: i + 1,
          }))}
        />
      </View>

      <View style={styles.bulkSection}>
        <Text style={styles.bulkGroupTitle}>
          {tr('bulkTitle', { office: monthWorkDays.length, remote: monthRemoteDays.length })}
        </Text>
        <Text style={styles.bulkNote}>{tr('bulkExcludeNote', { count: bulkApplyDays.length })}</Text>
        <View style={styles.bulkRow}>
          <View style={styles.bulkInput}>
            <TimeInput
              label={tr('clockIn')}
              hour={clockInHour}
              minute={clockInMinute}
              onHourChange={setClockInHour}
              onMinuteChange={setClockInMinute}
            />
          </View>
          <Button title={tr('bulkRegister')} onPress={applyBulkClockIn} variant="success" />
        </View>
        <View style={styles.bulkRow}>
          <View style={styles.bulkInput}>
            <TimeInput
              label={tr('clockOut')}
              hour={clockOutHour}
              minute={clockOutMinute}
              onHourChange={setClockOutHour}
              onMinuteChange={setClockOutMinute}
            />
          </View>
          <Button title={tr('bulkRegister')} onPress={applyBulkClockOut} variant="success" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        {tr('officeEditTitle', { count: monthWorkDays.length })}
      </Text>
      {monthWorkDays.length === 0 ? (
        <Text style={styles.empty}>{tr('commuteOfficeEmpty')}</Text>
      ) : (
        monthWorkDays.map((dateKey) => (
          <DayTimeCard
            key={dateKey}
            dateKey={dateKey}
            typeLabel={tr('office')}
            isRemote={false}
            isOffDay={isNonWorkingDay(dateKey)}
            times={getTimeForDate(dateKey)}
            onUpdateTime={updateTimePart}
            clockInLabel={tr('clockIn')}
            clockOutLabel={tr('clockOut')}
          />
        ))
      )}

      <Text style={styles.sectionTitle}>
        {tr('remoteEditTitle', { count: monthRemoteDays.length })}
      </Text>
      {monthRemoteDays.map((dateKey) => (
        <DayTimeCard
          key={dateKey}
          dateKey={dateKey}
          typeLabel={tr('remote')}
          isRemote
          isOffDay={isNonWorkingDay(dateKey)}
          times={getTimeForDate(dateKey)}
          onUpdateTime={updateTimePart}
          clockInLabel={tr('clockIn')}
          clockOutLabel={tr('clockOut')}
        />
      ))}

      <View style={styles.saveRow}>
        <Button title={tr('save')} onPress={handleSave} />
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
    marginBottom: 16,
    gap: 8,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#222' },
  resetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: '#555' },
  dayPicker: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#333' },
  bulkSection: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 4,
  },
  bulkGroupTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, color: '#333' },
  bulkNote: { fontSize: 12, color: '#666', marginBottom: 8 },
  bulkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  bulkInput: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  empty: { fontSize: 14, color: '#999', marginBottom: 16 },
  dayCard: { backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12, marginBottom: 8 },
  remoteCard: { backgroundColor: '#e3f2fd', borderRadius: 10, padding: 12, marginBottom: 8 },
  offDayCard: { backgroundColor: '#e0e0e0', borderRadius: 10, padding: 12, marginBottom: 8 },
  dayLabel: { fontWeight: '600', marginBottom: 4, color: '#333' },
  saveRow: { marginTop: 16, alignItems: 'flex-start' },
  preview: { marginTop: 24, padding: 16, backgroundColor: '#f3e5f5', borderRadius: 12 },
  previewTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#6a1b9a' },
  previewItem: { fontSize: 14, color: '#333', lineHeight: 22 },
});
