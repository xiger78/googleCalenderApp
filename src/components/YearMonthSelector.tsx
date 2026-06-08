import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MONTHS, YEARS } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

type PickerMode = 'year' | 'month' | null;

export function YearMonthSelector({ year, month, onYearChange, onMonthChange }: Props) {
  const { tr } = useLanguage();
  const [mode, setMode] = useState<PickerMode>(null);
  const [draftYear, setDraftYear] = useState(year);
  const [draftMonth, setDraftMonth] = useState(month);

  const openYear = () => {
    setDraftYear(year);
    setMode('year');
  };

  const openMonth = () => {
    setDraftMonth(month);
    setMode('month');
  };

  const closePicker = () => setMode(null);

  const confirmPicker = () => {
    if (mode === 'year') onYearChange(draftYear);
    if (mode === 'month') onMonthChange(draftMonth);
    closePicker();
  };

  const pickerTitle = mode === 'year' ? tr('year') : mode === 'month' ? tr('month') : '';

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.selectorBtn} onPress={openYear} activeOpacity={0.7}>
        <Text style={styles.selectorLabel}>YYYY</Text>
        <Text style={styles.selectorValue}>{year}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.selectorBtn} onPress={openMonth} activeOpacity={0.7}>
        <Text style={styles.selectorLabel}>MM</Text>
        <Text style={styles.selectorValue}>{String(month).padStart(2, '0')}</Text>
      </TouchableOpacity>

      <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={closePicker}>
        <Pressable style={styles.overlay} onPress={closePicker}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={closePicker}>
                <Text style={styles.cancelText}>{tr('alertCancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={confirmPicker}>
                <Text style={styles.confirmText}>{tr('alertDone')}</Text>
              </TouchableOpacity>
            </View>
            {mode === 'year' && (
              <Picker
                selectedValue={draftYear}
                onValueChange={(v) => setDraftYear(Number(v))}
                style={styles.wheel}
                itemStyle={Platform.OS === 'ios' ? styles.wheelItem : undefined}
              >
                {YEARS.map((y) => (
                  <Picker.Item key={y} label={String(y)} value={y} />
                ))}
              </Picker>
            )}
            {mode === 'month' && (
              <Picker
                selectedValue={draftMonth}
                onValueChange={(v) => setDraftMonth(Number(v))}
                style={styles.wheel}
                itemStyle={Platform.OS === 'ios' ? styles.wheelItem : undefined}
              >
                {MONTHS.map((m) => (
                  <Picker.Item
                    key={m}
                    label={String(m).padStart(2, '0')}
                    value={m}
                  />
                ))}
              </Picker>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  selectorBtn: {
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cancelText: { fontSize: 15, color: '#757575' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#1976D2' },
  wheel: { width: '100%', height: Platform.OS === 'ios' ? 216 : 180 },
  wheelItem: { fontSize: 20, height: 216 },
});
