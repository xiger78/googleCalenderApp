import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { authenticateGoogle, GoogleAuthSession } from '../services/googleCalendar';

export function GoogleCalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectingAccount, setSelectingAccount] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<GoogleAuthSession | null>(null);
  const { tr } = useLanguage();

  const handleSelectAccount = async () => {
    setSelectingAccount(true);
    try {
      const session = await authenticateGoogle();
      if (!session) {
        Alert.alert(tr('alertCancel'), tr('alertGoogleCancel'));
        return;
      }
      setGoogleAccount(session);
    } catch (e) {
      Alert.alert(tr('alertError'), e instanceof Error ? e.message : tr('alertGoogleError'));
    } finally {
      setSelectingAccount(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={tr('googleTitle')} subtitle={tr('googleDescLong')} />

      <YearMonthPicker year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />

      <View style={styles.registerSection}>
        <MaterialCommunityIcons name="calendar-month" size={40} color="#1976D2" style={styles.calIcon} />

        {googleAccount ? (
          <View style={styles.accountBox}>
            <MaterialCommunityIcons name="account-circle" size={20} color="#1976D2" />
            <Text style={styles.accountEmail}>
              {tr('googleSelectedAccount', { email: googleAccount.email })}
            </Text>
            <TouchableOpacity onPress={handleSelectAccount} disabled={selectingAccount}>
              <Text style={styles.changeAccountText}>{tr('googleChangeAccount')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.selectAccountBtn, selectingAccount && styles.disabledBtn]}
            onPress={handleSelectAccount}
            disabled={selectingAccount}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
            <Text style={styles.selectAccountText}>{tr('googleSelectAccount')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.privacy}>{tr('googlePrivacy')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  registerSection: { alignItems: 'center', marginBottom: 24, gap: 12 },
  calIcon: { marginBottom: 4 },
  selectAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#90CAF9',
    backgroundColor: '#E3F2FD',
  },
  selectAccountText: { fontSize: 14, fontWeight: '600', color: '#1565C0' },
  accountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxWidth: '100%',
  },
  accountEmail: { flex: 1, fontSize: 13, fontWeight: '600', color: '#333', minWidth: 160 },
  changeAccountText: { fontSize: 12, fontWeight: '600', color: '#1976D2' },
  disabledBtn: { opacity: 0.6 },
  privacy: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
});
