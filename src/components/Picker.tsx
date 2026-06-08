import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface PickerItem {
  label: string;
  value: string | number;
}

interface Props {
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  items: PickerItem[];
}

let NativePicker: React.ComponentType<{
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  style?: object;
  children?: React.ReactNode;
}> | null = null;

let PickerItem: React.ComponentType<{
  label: string;
  value: string | number;
}> | null = null;

if (Platform.OS !== 'web') {
  const RNPicker = require('@react-native-picker/picker');
  NativePicker = RNPicker.Picker;
  PickerItem = RNPicker.Picker.Item;
}

export function Picker({ selectedValue, onValueChange, items }: Props) {
  if (Platform.OS === 'web' || !NativePicker || !PickerItem) {
    return (
      <View style={styles.fallback}>
        {items.map((item) => (
          <View key={String(item.value)} />
        ))}
      </View>
    );
  }

  return (
    <NativePicker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      style={styles.picker}
    >
      {items.map((item) => (
        <PickerItem key={String(item.value)} label={item.label} value={item.value} />
      ))}
    </NativePicker>
  );
}

const styles = StyleSheet.create({
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  fallback: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: 44,
  },
});
