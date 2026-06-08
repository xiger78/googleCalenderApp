import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  hour: string;
  minute: string;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  label: string;
  compact?: boolean;
}

export function TimeInput({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  label,
  compact = false,
}: Props) {
  const { tr } = useLanguage();

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          style={compact ? styles.inputCompact : styles.input}
          value={hour}
          onChangeText={(t) => onHourChange(t.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
          placeholder="00"
          maxLength={2}
        />
        <Text style={compact ? styles.sepCompact : styles.sep}>{tr('hour')}</Text>
        <TextInput
          style={compact ? styles.inputCompact : styles.input}
          value={minute}
          onChangeText={(t) => onMinuteChange(t.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
          placeholder="00"
          maxLength={2}
        />
        <Text style={compact ? styles.sepCompact : styles.sep}>{tr('minute')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 56,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sep: {
    marginHorizontal: 6,
    fontSize: 15,
    color: '#555',
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
  sepCompact: {
    marginHorizontal: 2,
    fontSize: 12,
    color: '#666',
  },
});
