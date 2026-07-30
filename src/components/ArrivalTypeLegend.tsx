import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type LegendItem = {
  key: string;
  color: string;
  borderColor: string;
  label: string;
};

type Props = {
  title?: string;
  rows: LegendItem[][];
};

export function ArrivalTypeLegend({ title, rows }: Props) {
  return (
    <View style={styles.box}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item) => (
            <View key={item.key} style={styles.item}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: item.color, borderColor: item.borderColor },
                ]}
              />
              <Text style={styles.label}>{item.label}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '28%',
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
});
