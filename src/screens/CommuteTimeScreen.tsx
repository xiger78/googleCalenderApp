import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { TimeInput } from '../components/TimeInput';
import { TimeRangeInput } from '../components/TimeRangeInput';
import { Button } from '../components/Button';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import {
  formatTime,
  getDaysInMonth,
  isValidTime,
  parseTime,
  formatDateKey,
  formatDateWithTypeLabel,
  formatSlashDateWithWeekday,
} from '../utils/dateUtils';
import { getBulkApplyDateKeys } from '../utils/japaneseHolidays';
import {
  canChangeHolidayWorkType,
  CommuteDayType,
  getCommuteDayType,
} from '../utils/commuteDayType';
import { getWeekdays, TranslationKey } from '../i18n/translations';
import {
  formatTotalWorkHoursDecimal,
  getWorkHoursParenthetical,
  sumWorkMinutes,
} from '../utils/workDuration';
import { ArrivalTypeConfig, CommuteTime, HolidayWorkType, WorkArrivalType } from '../types';
import { getCommuteRowColors } from '../utils/arrivalSettings';

type PreviewItem = {
  dateKey: string;
  line: string;
};

type DayTimeDraft = {
  clockInHour: string;
  clockInMinute: string;
  clockOutHour: string;
  clockOutMinute: string;
};

function draftFromCommuteTime(times?: CommuteTime): DayTimeDraft {
  const clockIn = parseTime(times?.clockIn ?? '');
  const clockOut = parseTime(times?.clockOut ?? '');
  return {
    clockInHour: clockIn.hour,
    clockInMinute: clockIn.minute,
    clockOutHour: clockOut.hour,
    clockOutMinute: clockOut.minute,
  };
}

function draftToCommuteTime(parts: DayTimeDraft): CommuteTime {
  const hasClockIn = Boolean(parts.clockInHour || parts.clockInMinute);
  const hasClockOut = Boolean(parts.clockOutHour || parts.clockOutMinute);
  return {
    clockIn: hasClockIn
      ? formatTime(parts.clockInHour || '0', parts.clockInMinute || '0')
      : '',
    clockOut: hasClockOut
      ? formatTime(parts.clockOutHour || '0', parts.clockOutMinute || '0')
      : '',
  };
}

function typeLabelFor(
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string,
  dayType: CommuteDayType
): string {
  if (dayType === 'office') return tr('office');
  if (dayType === 'remote') return tr('remote');
  if (dayType === 'vacation') return tr('arrivalVacation');
  return tr('holidayLabel');
}

function DayTimeRow({
  dateKey,
  dayType,
  rowColors,
  canChangeType,
  draft,
  memo,
  onUpdatePart,
  onMemoChange,
  onChangeWorkType,
  tr,
  weekdays,
}: {
  dateKey: string;
  dayType: CommuteDayType;
  rowColors: { backgroundColor: string; borderColor: string };
  canChangeType: boolean;
  draft: DayTimeDraft;
  memo: string;
  onUpdatePart: (dateKey: string, field: keyof DayTimeDraft, value: string) => void;
  onMemoChange: (dateKey: string, value: string) => void;
  onChangeWorkType: (dateKey: string, workType: HolidayWorkType) => void;
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string;
  weekdays: string[];
}) {
  const typeLabel = typeLabelFor(tr, dayType);
  const dateLabel = formatDateWithTypeLabel(dateKey, weekdays, typeLabel);

  const openTypePicker = () => {
    Alert.alert(tr('holidayWorkTypeTitle'), tr('holidayWorkTypeDesc'), [
      {
        text: tr('office'),
        onPress: () => onChangeWorkType(dateKey, 'office'),
      },
      {
        text: tr('remote'),
        onPress: () => onChangeWorkType(dateKey, 'remote'),
      },
      { text: tr('alertCancel'), style: 'cancel' },
    ]);
  };

  return (
    <View
      style={[
        styles.dayCard,
        { backgroundColor: rowColors.backgroundColor, borderColor: rowColors.borderColor },
      ]}
    >
      {canChangeType ? (
        <TouchableOpacity onPress={openTypePicker} activeOpacity={0.7}>
          <View style={styles.dateLabelRow}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#555" />
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={styles.dateLabel}>{dateLabel}</Text>
      )}
      <TimeRangeInput
        compact
        clockInHour={draft.clockInHour}
        clockInMinute={draft.clockInMinute}
        clockOutHour={draft.clockOutHour}
        clockOutMinute={draft.clockOutMinute}
        onClockInHourChange={(v) => onUpdatePart(dateKey, 'clockInHour', v)}
        onClockInMinuteChange={(v) => onUpdatePart(dateKey, 'clockInMinute', v)}
        onClockOutHourChange={(v) => onUpdatePart(dateKey, 'clockOutHour', v)}
        onClockOutMinuteChange={(v) => onUpdatePart(dateKey, 'clockOutMinute', v)}
      />
      <View style={styles.memoBox}>
        <Text style={styles.memoLabel}>{tr('commuteMemoLabel')}</Text>
        <TextInput
          style={styles.memoInput}
          value={memo}
          onChangeText={(v) => onMemoChange(dateKey, v)}
          placeholder={tr('commuteMemoPlaceholder')}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
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

  const [draftParts, setDraftParts] = useState<Record<string, DayTimeDraft>>({});
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [previewTotalHours, setPreviewTotalHours] = useState<string | null>(null);

  const { data, setCommuteTimes, setDayMemos, setHolidayWorkType } = useWorkDataContext();
  const {
    language,
    lunchBreakMinutes,
    eveningBreakMinutes,
    normalArrival,
    earlyArrival,
    lateArrival,
    remoteArrival,
    vacationArrival,
    tr,
  } = useLanguage();

  const arrivalConfigs = useMemo<Record<WorkArrivalType, ArrivalTypeConfig>>(
    () => ({
      normal: normalArrival,
      early: earlyArrival,
      late: lateArrival,
      remote: remoteArrival,
      vacation: vacationArrival,
    }),
    [normalArrival, earlyArrival, lateArrival, remoteArrival, vacationArrival]
  );
  const totalBreakMinutes = lunchBreakMinutes + eveningBreakMinutes;
  const bulkApplyDays = getBulkApplyDateKeys(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const weekdays = getWeekdays(language);

  const getDraftForDate = (dateKey: string): DayTimeDraft => {
    return draftParts[dateKey] ?? draftFromCommuteTime(data.commuteTimes[dateKey]);
  };

  const getCommuteTimeForDate = (dateKey: string): CommuteTime => {
    if (draftParts[dateKey]) {
      return draftToCommuteTime(draftParts[dateKey]);
    }
    return data.commuteTimes[dateKey] ?? { clockIn: '', clockOut: '' };
  };

  const updateDraftPart = (dateKey: string, field: keyof DayTimeDraft, value: string) => {
    const current = getDraftForDate(dateKey);
    setDraftParts((prev) => ({ ...prev, [dateKey]: { ...current, [field]: value } }));
  };

  const getMemoForDate = (dateKey: string): string => {
    if (dateKey in memoDrafts) return memoDrafts[dateKey];
    return data.dayMemos[dateKey] ?? '';
  };

  const updateMemo = (dateKey: string, value: string) => {
    setMemoDrafts((prev) => ({ ...prev, [dateKey]: value }));
  };

  const handleChangeWorkType = async (dateKey: string, workType: HolidayWorkType) => {
    await setHolidayWorkType(dateKey, workType);
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

    const next = { ...draftParts };
    bulkApplyDays.forEach((dateKey) => {
      next[dateKey] = {
        clockInHour: clockInHour,
        clockInMinute: clockInMinute,
        clockOutHour: clockOutHour,
        clockOutMinute: clockOutMinute,
      };
    });
    setDraftParts(next);
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
    const zeroDraft: DayTimeDraft = {
      clockInHour: '00',
      clockInMinute: '00',
      clockOutHour: '00',
      clockOutMinute: '00',
    };
    const nextCommute = { ...data.commuteTimes };
    const nextMemos = { ...data.dayMemos };
    const nextDraft: Record<string, DayTimeDraft> = {};

    allDays.forEach((dateKey) => {
      nextCommute[dateKey] = zeroTime;
      delete nextMemos[dateKey];
      nextDraft[dateKey] = zeroDraft;
    });

    setClockInHour('00');
    setClockInMinute('00');
    setClockOutHour('00');
    setClockOutMinute('00');
    setDraftParts(nextDraft);
    setMemoDrafts({});
    setPreview([]);
    setPreviewTotalHours(null);
    await setCommuteTimes(nextCommute);
    await setDayMemos(nextMemos);
  };

  const handleSave = async () => {
    const merged = { ...data.commuteTimes };
    Object.entries(draftParts).forEach(([dateKey, parts]) => {
      merged[dateKey] = draftToCommuteTime(parts);
    });

    const mergedMemos = { ...data.dayMemos };
    Object.entries(memoDrafts).forEach(([dateKey, memo]) => {
      const trimmed = memo.trim();
      if (trimmed) {
        mergedMemos[dateKey] = trimmed;
      } else {
        delete mergedMemos[dateKey];
      }
    });

    const timeEntries: { clockIn: string; clockOut: string }[] = [];
    const savedList: PreviewItem[] = Array.from({ length: daysInMonth }, (_, i) => {
      const dateKey = formatDateKey(year, month, i + 1);
      const times = merged[dateKey] ?? getCommuteTimeForDate(dateKey);
      const memo = mergedMemos[dateKey] ?? '';
      if (!times?.clockIn && !times?.clockOut && !memo) return null;
      const clockIn = times.clockIn ?? '--:--';
      const clockOut = times.clockOut ?? '--:--';
      timeEntries.push({ clockIn, clockOut });
      const dateLabel = formatSlashDateWithWeekday(dateKey, weekdays);
      const workHours = getWorkHoursParenthetical(clockIn, clockOut, totalBreakMinutes);
      const memoSuffix = memo ? ` ${tr('commuteMemoPreview', { memo })}` : '';
      return {
        dateKey,
        line: `${dateLabel} ${clockIn}-${clockOut}${workHours}${memoSuffix}`,
      };
    }).filter(Boolean) as PreviewItem[];

    const totalMinutes = sumWorkMinutes(timeEntries, totalBreakMinutes);
    await setCommuteTimes(merged);
    await setDayMemos(mergedMemos);
    setPreview(savedList);
    setPreviewTotalHours(formatTotalWorkHoursDecimal(totalMinutes));
    setDraftParts({});
    setMemoDrafts({});
    Alert.alert(tr('alertSaved'), tr('alertCommuteSaved'));
  };

  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    formatDateKey(year, month, i + 1)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
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

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

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
              compact
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
              compact
            />
          </View>
        </View>
        <View style={styles.applyRow}>
          <Button title={tr('bulkApplyAction')} onPress={applyBulk} fullWidth />
        </View>
        <Text style={styles.bulkNote}>{tr('bulkExcludeNote', { count: bulkApplyDays.length })}</Text>
      </View>

      <View style={styles.dayList}>
        {monthDays.map((dateKey) => {
          const dayType = getCommuteDayType(
            dateKey,
            data.workDays,
            data.holidayWorkTypes,
            data.workDayTypes
          );
          const rowColors = getCommuteRowColors(
            dateKey,
            data.workDays,
            data.workDayTypes,
            arrivalConfigs
          );
          return (
            <DayTimeRow
              key={dateKey}
              dateKey={dateKey}
              dayType={dayType}
              rowColors={rowColors}
              canChangeType={
                canChangeHolidayWorkType(dateKey, data.workDays) &&
                data.workDayTypes[dateKey] !== 'vacation'
              }
              draft={getDraftForDate(dateKey)}
              memo={getMemoForDate(dateKey)}
              onUpdatePart={updateDraftPart}
              onMemoChange={updateMemo}
              onChangeWorkType={handleChangeWorkType}
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
          {previewTotalHours !== null && (
            <Text style={styles.previewTotal}>
              {tr('totalWorkHoursLine', { hours: previewTotalHours })}
            </Text>
          )}
          {preview.map((item) => (
            <Text key={item.dateKey} style={styles.previewItem}>
              {item.line}
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
  applyRow: { marginTop: 12 },
  bulkNote: { fontSize: 11, color: '#888', marginTop: 8 },
  dayList: { gap: 10 },
  dayCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  memoBox: { gap: 4 },
  memoLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  memoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 40,
  },
  saveRow: { marginTop: 20 },
  preview: { marginTop: 24, padding: 16, backgroundColor: '#f3e5f5', borderRadius: 12 },
  previewTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#6a1b9a' },
  previewTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a1b9a',
    textAlign: 'center',
    marginBottom: 10,
  },
  previewItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
  },
});
