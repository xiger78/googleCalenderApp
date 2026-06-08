import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from './Picker';
import { MONTHS, YEARS } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function YearMonthPicker({ year, month, onYearChange, onMonthChange }: Props) {
  const { tr } = useLanguage();

  return (
    <View style={styles.row}>
      <View style={styles.pickerWrap}>
        <Text style={styles.label}>{tr('year')}</Text>
        <Picker
          selectedValue={year}
          onValueChange={(v) => onYearChange(Number(v))}
          items={YEARS.map((y) => ({ label: `${y}${tr('year')}`, value: y }))}
        />
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.label}>{tr('month')}</Text>
        <Picker
          selectedValue={month}
          onValueChange={(v) => onMonthChange(Number(v))}
          items={MONTHS.map((m) => ({ label: `${m}${tr('month')}`, value: m }))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
});
