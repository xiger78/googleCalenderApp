import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  clockInHour: string;
  clockInMinute: string;
  clockOutHour: string;
  clockOutMinute: string;
  onClockInHourChange: (v: string) => void;
  onClockInMinuteChange: (v: string) => void;
  onClockOutHourChange: (v: string) => void;
  onClockOutMinuteChange: (v: string) => void;
  compact?: boolean;
}

function TimeField({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  compact,
}: {
  hour: string;
  minute: string;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  compact?: boolean;
}) {
  const { tr } = useLanguage();
  const inputStyle = compact ? styles.inputCompact : styles.input;
  const sepStyle = compact ? styles.sepCompact : styles.sep;

  return (
    <View style={styles.fieldRow}>
      <TextInput
        style={inputStyle}
        value={hour}
        onChangeText={(t) => onHourChange(t.replace(/[^0-9]/g, '').slice(0, 2))}
        keyboardType="number-pad"
        placeholder="00"
        maxLength={2}
      />
      <Text style={sepStyle}>{tr('hour')}</Text>
      <TextInput
        style={inputStyle}
        value={minute}
        onChangeText={(t) => onMinuteChange(t.replace(/[^0-9]/g, '').slice(0, 2))}
        keyboardType="number-pad"
        placeholder="00"
        maxLength={2}
      />
      <Text style={sepStyle}>{tr('minute')}</Text>
    </View>
  );
}

export function TimeRangeInput({
  clockInHour,
  clockInMinute,
  clockOutHour,
  clockOutMinute,
  onClockInHourChange,
  onClockInMinuteChange,
  onClockOutHourChange,
  onClockOutMinuteChange,
  compact = false,
}: Props) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <TimeField
        hour={clockInHour}
        minute={clockInMinute}
        onHourChange={onClockInHourChange}
        onMinuteChange={onClockInMinuteChange}
        compact={compact}
      />
      <Text style={styles.tilde}>~</Text>
      <TimeField
        hour={clockOutHour}
        minute={clockOutMinute}
        onHourChange={onClockOutHourChange}
        onMinuteChange={onClockOutMinuteChange}
        compact={compact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  rowCompact: { flex: 1, justifyContent: 'flex-end' },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 44,
    textAlign: 'center',
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputCompact: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    width: 36,
    textAlign: 'center',
    fontSize: 13,
    backgroundColor: '#fafafa',
  },
  sep: { marginHorizontal: 4, fontSize: 14, color: '#555' },
  sepCompact: { marginHorizontal: 2, fontSize: 12, color: '#666' },
  tilde: { marginHorizontal: 4, fontSize: 14, color: '#888', fontWeight: '600' },
});
