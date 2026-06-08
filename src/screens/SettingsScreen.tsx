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
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

function SettingsCard({
  category,
  icon,
  iconColor,
  iconBg,
  title,
  description,
  right,
  children,
  expanded,
  onToggle,
}: {
  category: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  right?: string;
  children?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.cardWrap}>
      <Text style={styles.category}>{category}</Text>
      <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
        <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
        {right ? <Text style={styles.cardRight}>{right}</Text> : null}
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-right'}
          size={22}
          color="#bbb"
        />
      </TouchableOpacity>
      {expanded && children ? <View style={styles.cardBody}>{children}</View> : null}
    </View>
  );
}

export function SettingsScreen() {
  const now = new Date();
  const {
    language,
    lunchBreakMinutes,
    eveningBreakMinutes,
    setLanguage,
    setBreakTimes,
    tr,
  } = useLanguage();
  const { data } = useWorkDataContext();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    language: true,
    attendance: false,
    export: false,
    email: false,
  });

  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [exporting, setExporting] = useState(false);
  const [lastCsvUri, setLastCsvUri] = useState<string | null>(null);

  const toHourStr = (minutes: number) => String(Math.floor(minutes / 60)).padStart(2, '0');
  const toMinuteStr = (minutes: number) => String(minutes % 60).padStart(2, '0');

  const [draftLunchHour, setDraftLunchHour] = useState(() => toHourStr(lunchBreakMinutes));
  const [draftLunchMinute, setDraftLunchMinute] = useState(() => toMinuteStr(lunchBreakMinutes));
  const [draftEveningHour, setDraftEveningHour] = useState(() => toHourStr(eveningBreakMinutes));
  const [draftEveningMinute, setDraftEveningMinute] = useState(() =>
    toMinuteStr(eveningBreakMinutes)
  );
  const [savingBreakTimes, setSavingBreakTimes] = useState(false);

  const totalBreakMinutes = lunchBreakMinutes + eveningBreakMinutes;

  const syncBreakDraft = () => {
    setDraftLunchHour(toHourStr(lunchBreakMinutes));
    setDraftLunchMinute(toMinuteStr(lunchBreakMinutes));
    setDraftEveningHour(toHourStr(eveningBreakMinutes));
    setDraftEveningMinute(toMinuteStr(eveningBreakMinutes));
  };

  const parseDraftMinutes = (hour: string, minute: string) => {
    const h = parseInt(hour || '0', 10);
    const m = parseInt(minute || '0', 10);
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
  };

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const langLabel = tr(
    LANGUAGE_OPTIONS.find((o) => o.value === language)?.labelKey ?? 'langJa'
  );

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const willExpand = !prev[key];
      if (key === 'attendance' && willExpand) {
        syncBreakDraft();
      }
      return { ...prev, [key]: willExpand };
    });
  };

  const handleLanguageChange = (lang: string | number) => {
    setLanguage(lang as Language);
  };

  const handleSaveBreakTimes = async () => {
    setSavingBreakTimes(true);
    try {
      const lunch = parseDraftMinutes(draftLunchHour, draftLunchMinute);
      const evening = parseDraftMinutes(draftEveningHour, draftEveningMinute);
      await setBreakTimes(lunch, evening);
      setDraftLunchHour(toHourStr(lunch));
      setDraftLunchMinute(toMinuteStr(lunch));
      setDraftEveningHour(toHourStr(evening));
      setDraftEveningMinute(toMinuteStr(evening));
      Alert.alert(tr('alertSaved'), tr('alertBreakTimeSaved'));
    } finally {
      setSavingBreakTimes(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const uri = await exportAttendanceCsv(
        data,
        reportYear,
        reportMonth,
        language,
        totalBreakMinutes
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

      if (
        result.status === MailComposer.MailComposerStatus.SENT ||
        result.status === MailComposer.MailComposerStatus.SAVED
      ) {
        Alert.alert(tr('alertDone'), tr('alertMailSent'));
      }
    } catch (e) {
      Alert.alert(tr('alertError'), e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>{tr('settingsTitle')}</Text>

      <SettingsCard
        category={tr('settingsLanguage')}
        icon="earth"
        iconColor="#1976D2"
        iconBg="#E3F2FD"
        title={tr('settingsLanguageItem')}
        description={tr('settingsLanguageItemDesc')}
        right={langLabel}
        expanded={expanded.language}
        onToggle={() => toggle('language')}
      >
        <Picker
          selectedValue={language}
          onValueChange={handleLanguageChange}
          items={LANGUAGE_OPTIONS.map((opt) => ({
            label: tr(opt.labelKey),
            value: opt.value,
          }))}
        />
      </SettingsCard>

      <SettingsCard
        category={tr('settingsBreakTime')}
        icon="calendar-check"
        iconColor="#4CAF50"
        iconBg="#E8F5E9"
        title={tr('settingsReportItem')}
        description={tr('settingsReportItemDesc')}
        expanded={expanded.attendance}
        onToggle={() => toggle('attendance')}
      >
        <Text style={styles.label}>{tr('settingsLunch')}</Text>
        <TimeInput
          label=""
          hour={draftLunchHour}
          minute={draftLunchMinute}
          onHourChange={setDraftLunchHour}
          onMinuteChange={setDraftLunchMinute}
        />
        <Text style={styles.label}>{tr('settingsEvening')}</Text>
        <TimeInput
          label=""
          hour={draftEveningHour}
          minute={draftEveningMinute}
          onHourChange={setDraftEveningHour}
          onMinuteChange={setDraftEveningMinute}
        />
        <View style={styles.saveBreakRow}>
          <Button
            title={tr('save')}
            onPress={handleSaveBreakTimes}
            loading={savingBreakTimes}
            fullWidth
          />
        </View>
      </SettingsCard>

      <SettingsCard
        category={tr('settingsCsvExport')}
        icon="printer"
        iconColor="#7B1FA2"
        iconBg="#F3E5F5"
        title={tr('settingsExportItem')}
        description={tr('settingsExportItemDesc')}
        expanded={expanded.export}
        onToggle={() => toggle('export')}
      >
        <YearMonthPicker
          year={reportYear}
          month={reportMonth}
          onYearChange={setReportYear}
          onMonthChange={setReportMonth}
        />
        <Button title={tr('export')} onPress={handleExport} loading={exporting} fullWidth />
      </SettingsCard>

      <SettingsCard
        category={tr('settingsEmail')}
        icon="email-outline"
        iconColor="#1976D2"
        iconBg="#E3F2FD"
        title={tr('settingsEmailItem')}
        description={tr('settingsEmailItemDesc')}
        expanded={expanded.email}
        onToggle={() => toggle('email')}
      >
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
          <Button title={tr('emailSend')} onPress={handleSendMail} loading={sending} fullWidth />
        </View>
      </SettingsCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#222' },
  cardWrap: { marginBottom: 16 },
  category: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 6, marginLeft: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  cardDesc: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 17 },
  cardRight: { fontSize: 13, fontWeight: '600', color: '#1976D2', marginRight: 4 },
  cardBody: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 8, color: '#333' },
  saveBreakRow: { marginTop: 16 },
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
  sendRow: { marginTop: 16 },
});
