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
import { YearMonthPicker } from '../components/YearMonthPicker';
import { TimeInput } from '../components/TimeInput';
import { TimeRangeInput } from '../components/TimeRangeInput';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
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
  formatShortDateLabel,
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
  offDay,
  times,
  onUpdateTime,
  tr,
  weekdays,
}: {
  dateKey: string;
  isOffice: boolean;
  offDay: boolean;
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

  const rowStyle = offDay
    ? styles.offDayRow
    : isOffice
      ? styles.officeRow
      : styles.remoteRow;

  return (
    <View style={[styles.dayRow, rowStyle]}>
      <Text style={styles.dayDate}>{formatShortDateLabel(dateKey, weekdays)}</Text>
      <View
        style={[
          styles.typeBadge,
          offDay
            ? styles.offDayBadge
            : isOffice
              ? styles.officeBadge
              : styles.remoteBadge,
        ]}
      >
        <MaterialCommunityIcons
          name={offDay ? 'calendar-remove' : isOffice ? 'office-building' : 'home-outline'}
          size={14}
          color={offDay ? '#757575' : isOffice ? '#2E7D32' : '#1565C0'}
        />
        <Text
          style={[
            styles.typeText,
            offDay ? styles.offDayText : isOffice ? styles.officeText : styles.remoteText,
          ]}
        >
          {offDay ? tr('weekendHoliday') : isOffice ? tr('officeWork') : tr('remoteWork')}
        </Text>
      </View>
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
  const [bulkOpen, setBulkOpen] = useState(false);

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
      <ScreenHeader
        title={tr('commuteTitle')}
        right={
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="refresh" size={14} color="#555" />
            <Text style={styles.resetBtnText}>{tr('resetAll')}</Text>
          </TouchableOpacity>
        }
      />

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <TouchableOpacity
        style={styles.bulkCard}
        onPress={() => setBulkOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.bulkIconWrap}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={22} color="#2E7D32" />
        </View>
        <View style={styles.bulkTextWrap}>
          <Text style={styles.bulkTitle}>{tr('bulkRegister')}</Text>
          <Text style={styles.bulkDesc}>{tr('bulkApplyDesc')}</Text>
        </View>
        <MaterialCommunityIcons
          name={bulkOpen ? 'chevron-up' : 'chevron-right'}
          size={22}
          color="#888"
        />
      </TouchableOpacity>

      {bulkOpen && (
        <View style={styles.bulkPanel}>
          <Text style={styles.bulkNote}>
            {tr('bulkExcludeNote', { count: bulkApplyDays.length })}
          </Text>
          <TimeInput
            label={tr('clockIn')}
            hour={clockInHour}
            minute={clockInMinute}
            onHourChange={setClockInHour}
            onMinuteChange={setClockInMinute}
          />
          <TimeInput
            label={tr('clockOut')}
            hour={clockOutHour}
            minute={clockOutMinute}
            onHourChange={setClockOutHour}
            onMinuteChange={setClockOutMinute}
          />
          <Button title={tr('bulkRegister')} onPress={applyBulk} variant="success" fullWidth />
        </View>
      )}

      <View style={styles.dayList}>
        {monthDays.map((dateKey) => (
          <DayTimeRow
            key={dateKey}
            dateKey={dateKey}
            isOffice={workSet.has(dateKey)}
            offDay={isNonWorkingDay(dateKey)}
            times={getTimeForDate(dateKey)}
            onUpdateTime={updateTimePart}
            tr={tr}
            weekdays={weekdays}
          />
        ))}
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
  bulkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  bulkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkTextWrap: { flex: 1 },
  bulkTitle: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  bulkDesc: { fontSize: 12, color: '#558B2F', marginTop: 2 },
  bulkPanel: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    marginTop: -4,
  },
  bulkNote: { fontSize: 12, color: '#666', marginBottom: 10 },
  dayList: { gap: 8 },
  dayRow: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  officeRow: { backgroundColor: '#F1F8E9' },
  remoteRow: { backgroundColor: '#E3F2FD' },
  offDayRow: { backgroundColor: '#EEEEEE' },
  dayDate: { fontSize: 14, fontWeight: '600', color: '#333' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  officeBadge: { backgroundColor: '#fff', borderColor: '#A5D6A7' },
  remoteBadge: { backgroundColor: '#fff', borderColor: '#90CAF9' },
  offDayBadge: { backgroundColor: '#fff', borderColor: '#BDBDBD' },
  typeText: { fontSize: 12, fontWeight: '600' },
  officeText: { color: '#2E7D32' },
  remoteText: { color: '#1565C0' },
  offDayText: { color: '#757575' },
  saveRow: { marginTop: 20 },
  preview: { marginTop: 24, padding: 16, backgroundColor: '#f3e5f5', borderRadius: 12 },
  previewTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#6a1b9a' },
  previewItem: { fontSize: 14, color: '#333', lineHeight: 22 },
});
