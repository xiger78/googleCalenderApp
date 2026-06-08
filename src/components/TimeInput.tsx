import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  hour: string;
  minute: string;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  label: string;
}

export function TimeInput({ hour, minute, onHourChange, onMinuteChange, label }: Props) {
  const { tr } = useLanguage();

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={hour}
          onChangeText={(t) => onHourChange(t.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
          placeholder="00"
          maxLength={2}
        />
        <Text style={styles.sep}>{tr('hour')}</Text>
        <TextInput
          style={styles.input}
          value={minute}
          onChangeText={(t) => onMinuteChange(t.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
          placeholder="00"
          maxLength={2}
        />
        <Text style={styles.sep}>{tr('minute')}</Text>
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
});
