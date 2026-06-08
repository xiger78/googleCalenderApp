import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from './Picker';
import { MONTHS, YEARS } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function MonthNavigator({ year, month, onYearChange, onMonthChange }: Props) {
  const { tr } = useLanguage();

  const goPrev = () => {
    if (month === 1) {
      onYearChange(year - 1);
      onMonthChange(12);
      return;
    }
    onMonthChange(month - 1);
  };

  const goNext = () => {
    if (month === 12) {
      onYearChange(year + 1);
      onMonthChange(1);
      return;
    }
    onMonthChange(month + 1);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.arrowBtn} onPress={goPrev} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#555" />
      </TouchableOpacity>

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Picker
            selectedValue={year}
            onValueChange={(v) => onYearChange(Number(v))}
            items={YEARS.map((y) => ({ label: `${y}${tr('year')}`, value: y }))}
          />
        </View>
        <View style={styles.chip}>
          <Picker
            selectedValue={month}
            onValueChange={(v) => onMonthChange(Number(v))}
            items={MONTHS.map((m) => ({ label: `${m}${tr('month')}`, value: m }))}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.arrowBtn} onPress={goNext} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#555" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
});
