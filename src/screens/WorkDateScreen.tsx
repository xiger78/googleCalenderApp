import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { CalendarGrid } from '../components/CalendarGrid';
import { ScreenHeader } from '../components/ScreenHeader';
import { useWorkDataContext } from '../context/WorkDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkDaysInMonth } from '../utils/storage';

export function WorkDateScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data, toggleWorkDay } = useWorkDataContext();
  const { tr } = useLanguage();

  const monthWorkDays = getWorkDaysInMonth(data.workDays, year, month);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={tr('workDateTitle')} subtitle={tr('workDateDesc')} />

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <CalendarGrid
        year={year}
        month={month}
        selectedDates={monthWorkDays}
        onDatePress={toggleWorkDay}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
});
