import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ArrivalColor } from '../types';
import { ARRIVAL_COLOR_HEX, ARRIVAL_COLOR_OPTIONS } from '../utils/arrivalSettings';

interface Props {
  value: ArrivalColor;
  onChange: (color: ArrivalColor) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {ARRIVAL_COLOR_OPTIONS.map((color) => {
        const selected = value === color;
        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.swatch,
              { backgroundColor: ARRIVAL_COLOR_HEX[color] },
              selected && styles.swatchSelected,
            ]}
            onPress={() => onChange(color)}
            activeOpacity={0.8}
          >
            {selected ? (
              <MaterialCommunityIcons name="check" size={18} color="#333" />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 8 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#333',
  },
});
