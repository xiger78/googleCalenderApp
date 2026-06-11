import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { CalendarGrid } from '../components/CalendarGrid';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkDaysInMonth } from '../utils/storage';
import { WorkArrivalType } from '../types';
import { getArrivalColorHex } from '../utils/arrivalSettings';

const ARRIVAL_MODES: WorkArrivalType[] = ['normal', 'early', 'late', 'remote'];

export function WorkDateScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedMode, setSelectedMode] = useState<WorkArrivalType>('normal');
  const { data, setWorkDayArrival, clearWorkDay } = useWorkDataContext();
  const { tr, normalArrival, earlyArrival, lateArrival, remoteArrival } = useLanguage();

  const monthWorkDays = getWorkDaysInMonth(data.workDays, year, month);

  const arrivalSettings = useMemo(
    () => ({
      normal: normalArrival,
      early: earlyArrival,
      late: lateArrival,
      remote: remoteArrival,
    }),
    [normalArrival, earlyArrival, lateArrival, remoteArrival]
  );

  const dateColors = useMemo(() => {
    const colors: Record<string, string> = {};
    monthWorkDays.forEach((dateKey) => {
      const type = data.workDayTypes[dateKey] ?? 'normal';
      const config = arrivalSettings[type];
      colors[dateKey] = getArrivalColorHex(config.color);
    });
    return colors;
  }, [monthWorkDays, data.workDayTypes, arrivalSettings]);

  const modeLabel = (type: WorkArrivalType) => {
    if (type === 'early') return tr('arrivalEarly');
    if (type === 'late') return tr('arrivalLate');
    if (type === 'remote') return tr('arrivalRemote');
    return tr('arrivalNormal');
  };

  const handleDatePress = async (dateKey: string, action: 'set' | 'clear') => {
    if (action === 'clear') {
      await clearWorkDay(dateKey);
      return;
    }
    const config = arrivalSettings[selectedMode];
    await setWorkDayArrival(dateKey, selectedMode, config);
  };

  const legendItems = ARRIVAL_MODES.map((type) => ({
    color: getArrivalColorHex(arrivalSettings[type].color),
    label: modeLabel(type),
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.centerTitle}>{tr('workDateTitle')}</Text>

        <YearMonthPicker
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />

        <CalendarGrid
          year={year}
          month={month}
          selectedDates={monthWorkDays}
          dateColors={dateColors}
          onDatePress={handleDatePress}
          legendItems={legendItems}
        />

        <View style={styles.modeRow}>
          {ARRIVAL_MODES.map((type) => {
            const active = selectedMode === type;
            const bg = getArrivalColorHex(arrivalSettings[type].color);
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modeBtn,
                  { backgroundColor: bg },
                  active && styles.modeBtnActive,
                ]}
                onPress={() => setSelectedMode(type)}
                activeOpacity={0.85}
              >
                <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                  {modeLabel(type)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.modeHint}>{tr('arrivalModeHint')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  modeBtn: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeBtnActive: {
    borderColor: '#333',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  modeBtnTextActive: {
    fontWeight: '800',
  },
  modeHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
