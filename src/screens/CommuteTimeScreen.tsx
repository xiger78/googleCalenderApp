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
  formatDateKey,
  formatDateWithTypeLabel,
  formatSlashDateWithWeekday,
} from '../utils/dateUtils';
import { getBulkApplyDateKeys, isNonWorkingDay } from '../utils/japaneseHolidays';
import { getWeekdays, TranslationKey } from '../i18n/translations';
import {
  formatTotalWorkHoursDecimal,
  getWorkHoursParenthetical,
  isValidCommutePair,
  sumWorkMinutes,
} from '../utils/workDuration';
import { ArrivalTypeConfig, CommuteTime, WorkArrivalType } from '../types';
import {
  ARRIVAL_BORDER_HEX,
  draftFromCommuteTime,
  getArrivalColorHex,
  getArrivalTypeForDate,
  getCommuteRowColors,
  getEffectiveCommuteTimes,
  isBulkApplyEligibleDate,
  shouldClearHolidayCommuteTime,
} from '../utils/arrivalSettings';

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

const COMMUTE_LEGEND_TYPES: WorkArrivalType[] = ['early', 'normal', 'late', 'remote'];

function arrivalTypeLabel(
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string,
  type: WorkArrivalType
): string {
  if (type === 'early') return tr('arrivalEarly');
  if (type === 'late') return tr('arrivalLate');
  if (type === 'remote') return tr('arrivalRemote');
  if (type === 'vacation') return tr('arrivalVacation');
  return tr('arrivalNormal');
}

function dateTypeLabel(
  dateKey: string,
  workDays: string[],
  workDayTypes: Record<string, WorkArrivalType>,
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  if (isNonWorkingDay(dateKey) && !workDays.includes(dateKey)) {
    return tr('holidayLabel');
  }
  return arrivalTypeLabel(tr, getArrivalTypeForDate(dateKey, workDays, workDayTypes));
}

function DayTimeRow({
  dateKey,
  typeLabel,
  rowColors,
  draft,
  memo,
  onUpdatePart,
  onMemoChange,
  onSave,
  tr,
  weekdays,
}: {
  dateKey: string;
  typeLabel: string;
  rowColors: { backgroundColor: string; borderColor: string };
  draft: DayTimeDraft;
  memo: string;
  onUpdatePart: (dateKey: string, field: keyof DayTimeDraft, value: string) => void;
  onMemoChange: (dateKey: string, value: string) => void;
  onSave: (dateKey: string) => void;
  tr: (key: TranslationKey, params?: Record<string, string | number>) => string;
  weekdays: string[];
}) {
  const dateLabel = formatDateWithTypeLabel(dateKey, weekdays, typeLabel);

  return (
    <View
      style={[
        styles.dayCard,
        { backgroundColor: rowColors.backgroundColor, borderColor: rowColors.borderColor },
      ]}
    >
      <Text style={styles.dateLabel}>{dateLabel}</Text>
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
      <Button title={tr('saveDay')} onPress={() => onSave(dateKey)} variant="success" fullWidth />
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

  const { data, setCommuteTimes, setDayMemos } = useWorkDataContext();
  const {
    language,
    lunchBreakMinutes,
    eveningBreakMinutes,
    morningBreakMinutes,
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
  const breakSettings = useMemo(
    () => ({ morningBreakMinutes, lunchBreakMinutes, eveningBreakMinutes }),
    [morningBreakMinutes, lunchBreakMinutes, eveningBreakMinutes]
  );
  const bulkTargetDays = useMemo(
    () =>
      getBulkApplyDateKeys(year, month).filter((dateKey) =>
        isBulkApplyEligibleDate(dateKey, data.workDays, data.workDayTypes)
      ),
    [year, month, data.workDays, data.workDayTypes]
  );
  const commuteLegendItems = useMemo(
    () =>
      COMMUTE_LEGEND_TYPES.map((type) => ({
        color: getArrivalColorHex(arrivalConfigs[type].color),
        borderColor: ARRIVAL_BORDER_HEX[arrivalConfigs[type].color],
        label: arrivalTypeLabel(tr, type),
      })),
    [arrivalConfigs, tr, language]
  );
  const daysInMonth = getDaysInMonth(year, month);
  const weekdays = getWeekdays(language);
  const monthDays = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => formatDateKey(year, month, i + 1)),
    [daysInMonth, year, month]
  );

  const getDraftForDate = (dateKey: string): DayTimeDraft => {
    if (draftParts[dateKey]) return draftParts[dateKey];
    const effective = getEffectiveCommuteTimes(
      dateKey,
      data.commuteTimes[dateKey],
      data.workDays,
      data.workDayTypes,
      arrivalConfigs,
      breakSettings
    );
    if (effective) return draftFromCommuteTime(effective);
    return draftFromCommuteTime(data.commuteTimes[dateKey]);
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

  const applyBulk = async () => {
    if (!isValidTime(clockInHour, clockInMinute)) {
      Alert.alert(tr('alertInputError'), tr('alertInvalidClockIn'));
      return;
    }
    if (!isValidTime(clockOutHour, clockOutMinute)) {
      Alert.alert(tr('alertInputError'), tr('alertInvalidClockOut'));
      return;
    }
    if (bulkTargetDays.length === 0) {
      Alert.alert(tr('alertNotice'), tr('alertBulkNoDays'));
      return;
    }

    const next = { ...draftParts };
    const nextCommute = { ...data.commuteTimes };
    const bulkDraft: DayTimeDraft = {
      clockInHour,
      clockInMinute,
      clockOutHour,
      clockOutMinute,
    };
    let appliedCount = 0;

    bulkTargetDays.forEach((dateKey) => {
      next[dateKey] = bulkDraft;
      nextCommute[dateKey] = draftToCommuteTime(bulkDraft);
      appliedCount++;
    });

    monthDays.forEach((dateKey) => {
      if (!shouldClearHolidayCommuteTime(dateKey, data.workDays)) return;
      delete nextCommute[dateKey];
      delete next[dateKey];
    });

    if (appliedCount === 0) {
      Alert.alert(tr('alertNotice'), tr('alertBulkNoDays'));
      return;
    }

    setDraftParts(next);
    await setCommuteTimes(nextCommute);
    Alert.alert(
      tr('alertDone'),
      tr('alertBulkClockIn', { month, count: appliedCount })
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
      if (shouldClearHolidayCommuteTime(dateKey, data.workDays)) {
        delete nextCommute[dateKey];
        delete nextMemos[dateKey];
        delete nextDraft[dateKey];
        return;
      }
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

  const handleSaveDay = async (dateKey: string) => {
    const draft = getDraftForDate(dateKey);
    const merged = { ...data.commuteTimes, [dateKey]: draftToCommuteTime(draft) };

    const mergedMemos = { ...data.dayMemos };
    const memo = getMemoForDate(dateKey).trim();
    if (memo) {
      mergedMemos[dateKey] = memo;
    } else {
      delete mergedMemos[dateKey];
    }

    await setCommuteTimes(merged);
    await setDayMemos(mergedMemos);

    setDraftParts((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
    setMemoDrafts((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });

    Alert.alert(
      tr('alertSaved'),
      tr('alertDaySaved', { date: formatSlashDateWithWeekday(dateKey, weekdays) })
    );
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

    const timeEntries: { clockIn: string; clockOut: string; arrivalType?: WorkArrivalType }[] = [];
    const savedList: PreviewItem[] = Array.from({ length: daysInMonth }, (_, i) => {
      const dateKey = formatDateKey(year, month, i + 1);
      const arrivalType = getArrivalTypeForDate(dateKey, data.workDays, data.workDayTypes);
      const memo = mergedMemos[dateKey] ?? '';
      const effective = getEffectiveCommuteTimes(
        dateKey,
        merged[dateKey],
        data.workDays,
        data.workDayTypes,
        arrivalConfigs,
        breakSettings
      );
      const raw = merged[dateKey];
      if (!effective && !memo && !raw?.clockIn && !raw?.clockOut) return null;

      const clockIn = effective?.clockIn ?? raw?.clockIn ?? '--:--';
      const clockOut = effective?.clockOut ?? raw?.clockOut ?? '--:--';
      if (effective && isValidCommutePair(effective.clockIn, effective.clockOut)) {
        timeEntries.push({
          clockIn: effective.clockIn,
          clockOut: effective.clockOut,
          arrivalType,
        });
      }
      const dateLabel = formatSlashDateWithWeekday(dateKey, weekdays);
      const workHours = effective
        ? getWorkHoursParenthetical(
            effective.clockIn,
            effective.clockOut,
            breakSettings,
            arrivalType
          )
        : '';
      const memoSuffix = memo ? ` ${tr('commuteMemoPreview', { memo })}` : '';
      return {
        dateKey,
        line: `${dateLabel} ${clockIn}-${clockOut}${workHours}${memoSuffix}`,
      };
    }).filter(Boolean) as PreviewItem[];

    const totalMinutes = sumWorkMinutes(timeEntries, breakSettings);
    await setCommuteTimes(merged);
    await setDayMemos(mergedMemos);
    setPreview(savedList);
    setPreviewTotalHours(formatTotalWorkHoursDecimal(totalMinutes));
    setDraftParts({});
    setMemoDrafts({});
    Alert.alert(tr('alertSaved'), tr('alertCommuteSaved'));
  };

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
          <View style={styles.applyBtnCol}>
            <Button title={tr('bulkApplyAction')} onPress={applyBulk} fullWidth />
          </View>
          <View style={styles.applyBtnCol}>
            <Button title={tr('save')} onPress={handleSave} variant="success" fullWidth />
          </View>
        </View>
        <Text style={styles.bulkNote}>{tr('bulkExcludeNote', { count: bulkTargetDays.length })}</Text>
      </View>

      <View style={styles.legendBox}>
        <Text style={styles.legendTitle}>{tr('commuteColorLegendTitle')}</Text>
        <View style={styles.legendRow}>
          {commuteLegendItems.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: item.color, borderColor: item.borderColor },
                ]}
              />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.dayList}>
        {monthDays.map((dateKey) => {
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
              typeLabel={dateTypeLabel(dateKey, data.workDays, data.workDayTypes, tr)}
              rowColors={rowColors}
              draft={getDraftForDate(dateKey)}
              memo={getMemoForDate(dateKey)}
              onUpdatePart={updateDraftPart}
              onMemoChange={updateMemo}
              onSave={handleSaveDay}
              tr={tr}
              weekdays={weekdays}
            />
          );
        })}
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
  applyRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  applyBtnCol: { flex: 1 },
  bulkNote: { fontSize: 11, color: '#888', marginTop: 8 },
  legendBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  legendTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 10 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: '45%' },
  legendSwatch: { width: 18, height: 18, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12, fontWeight: '600', color: '#444' },
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
