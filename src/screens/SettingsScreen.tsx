import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import * as DocumentPicker from 'expo-document-picker';
import { YearMonthPicker } from '../components/YearMonthPicker';
import { Button } from '../components/Button';
import { Picker } from '../components/Picker';
import { TimeInput } from '../components/TimeInput';
import { useLanguage } from '../context/LanguageContext';
import { useWorkDataContext } from '../context/WorkDataContext';
import { LANGUAGE_OPTIONS, Language } from '../i18n/types';
import { exportAttendanceCsv } from '../utils/attendanceReport';

export function SettingsScreen() {
  const now = new Date();
  const { language, lunchBreakMinutes, setLanguage, setLunchBreakMinutes, tr } = useLanguage();
  const { data } = useWorkDataContext();

  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [exporting, setExporting] = useState(false);
  const [lastCsvUri, setLastCsvUri] = useState<string | null>(null);

  const lunchHour = String(Math.floor(lunchBreakMinutes / 60)).padStart(2, '0');
  const lunchMinute = String(lunchBreakMinutes % 60).padStart(2, '0');

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleLanguageChange = (lang: string | number) => {
    setLanguage(lang as Language);
  };

  const handleLunchChange = (part: 'hour' | 'minute', value: string) => {
    const h = part === 'hour' ? parseInt(value || '0', 10) : parseInt(lunchHour, 10);
    const m = part === 'minute' ? parseInt(value || '0', 10) : parseInt(lunchMinute, 10);
    setLunchBreakMinutes(h * 60 + m);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const uri = await exportAttendanceCsv(
        data,
        reportYear,
        reportMonth,
        language,
        lunchBreakMinutes
      );
      setLastCsvUri(uri);
      Alert.alert(tr('alertDone'), tr('alertReportDone'));
    } catch (e) {
      Alert.alert(tr('alertError'), e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleSelectFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      setAttachmentUri(result.assets[0].uri);
      setAttachmentName(result.assets[0].name);
    }
  };

  const handleSendMail = async () => {
    if (!emailTo.trim()) {
      Alert.alert(tr('alertNotice'), tr('alertMailNeedRecipient'));
      return;
    }

    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      Alert.alert(tr('alertError'), tr('alertMailUnavailable'));
      return;
    }

    setSending(true);
    try {
      const attachments = [attachmentUri, lastCsvUri].filter(Boolean) as string[];
      const result = await MailComposer.composeAsync({
        recipients: [emailTo.trim()],
        subject: emailSubject,
        body: emailBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (result.status === MailComposer.MailComposerStatus.SENT) {
        Alert.alert(tr('alertDone'), tr('alertMailSent'));
      } else if (result.status === MailComposer.MailComposerStatus.SAVED) {
        Alert.alert(tr('alertDone'), tr('alertMailSent'));
      }
    } catch (e) {
      Alert.alert(tr('alertError'), e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{tr('settingsTitle')}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{tr('settingsLanguage')}</Text>
        <Text style={styles.sectionDesc}>{tr('settingsLanguageDesc')}</Text>
        <Picker
          selectedValue={language}
          onValueChange={handleLanguageChange}
          items={LANGUAGE_OPTIONS.map((opt) => ({
            label: tr(opt.labelKey),
            value: opt.value,
          }))}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{tr('settingsReport')}</Text>
        <Text style={styles.sectionDesc}>{tr('settingsReportDesc')}</Text>
        <YearMonthPicker
          year={reportYear}
          month={reportMonth}
          onYearChange={setReportYear}
          onMonthChange={setReportMonth}
        />
        <Text style={styles.label}>{tr('settingsLunch')}</Text>
        <TimeInput
          label=""
          hour={lunchHour}
          minute={lunchMinute}
          onHourChange={(v) => handleLunchChange('hour', v)}
          onMinuteChange={(v) => handleLunchChange('minute', v)}
        />
        <Button title={tr('export')} onPress={handleExport} loading={exporting} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{tr('settingsEmail')}</Text>
        <Text style={styles.sectionDesc}>{tr('settingsEmailDesc')}</Text>

        <Text style={styles.label}>{tr('emailTo')}</Text>
        <TextInput
          style={styles.input}
          value={emailTo}
          onChangeText={setEmailTo}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="example@email.com"
        />

        <Text style={styles.label}>{tr('emailSubject')}</Text>
        <TextInput style={styles.input} value={emailSubject} onChangeText={setEmailSubject} />

        <Text style={styles.label}>{tr('emailBody')}</Text>
        <TextInput
          style={[styles.input, styles.bodyInput]}
          value={emailBody}
          onChangeText={setEmailBody}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={styles.label}>{tr('emailAttach')}</Text>
        <View style={styles.attachRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleSelectFile}>
            <Text style={styles.attachBtnText}>{tr('emailSelectFile')}</Text>
          </TouchableOpacity>
          <Text style={styles.attachName} numberOfLines={1}>
            {attachmentName ?? tr('emailNoFile')}
          </Text>
        </View>
        {lastCsvUri && (
          <Text style={styles.csvHint}>
            ✓ attendance_{reportYear}{String(reportMonth).padStart(2, '0')}.csv
          </Text>
        )}

        <View style={styles.sendRow}>
          <Button title={tr('emailSend')} onPress={handleSendMail} loading={sending} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#222' },
  section: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#666', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  bodyInput: { minHeight: 100 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  attachBtn: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  attachBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  attachName: { flex: 1, fontSize: 13, color: '#555' },
  csvHint: { fontSize: 12, color: '#2e7d32', marginTop: 8 },
  sendRow: { marginTop: 16, alignItems: 'flex-start' },
});
