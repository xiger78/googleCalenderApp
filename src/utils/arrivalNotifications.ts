import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WorkArrivalType, WorkData } from '../types';
import { Language } from '../i18n/types';
import { formatSlashDateWithWeekday, parseDateKey } from './dateUtils';
import { getWeekdays, t, TranslationKey } from '../i18n/translations';

export const ARRIVAL_REMINDER_PREFIX = 'arrival-reminder-';
export const ARRIVAL_REMINDER_CHANNEL = 'arrival-reminders';

const REMINDER_ARRIVAL_TYPES: WorkArrivalType[] = ['normal', 'early', 'late'];

function arrivalTypeLabel(language: Language, type: WorkArrivalType): string {
  const key: TranslationKey =
    type === 'early'
      ? 'arrivalEarly'
      : type === 'late'
        ? 'arrivalLate'
        : 'arrivalNormal';
  return t(language, key);
}

export function getArrivalReminderTriggerDate(dateKey: string): Date {
  const { year, month, day } = parseDateKey(dateKey);
  const trigger = new Date(year, month - 1, day);
  trigger.setDate(trigger.getDate() - 1);
  trigger.setHours(21, 0, 0, 0);
  return trigger;
}

export function shouldScheduleArrivalReminder(
  dateKey: string,
  arrivalType: WorkArrivalType
): boolean {
  if (!REMINDER_ARRIVAL_TYPES.includes(arrivalType)) return false;
  return getArrivalReminderTriggerDate(dateKey).getTime() > Date.now();
}

export async function ensureNotificationSetup(language: Language): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ARRIVAL_REMINDER_CHANNEL, {
      name: t(language, 'arrivalReminderChannel'),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1565C0',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelArrivalReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(ARRIVAL_REMINDER_PREFIX))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

export async function syncArrivalReminders(
  data: WorkData,
  language: Language
): Promise<void> {
  const granted = await ensureNotificationSetup(language);
  if (!granted) return;

  await cancelArrivalReminders();

  const weekdays = getWeekdays(language);
  const schedules = data.workDays
    .map((dateKey) => {
      const arrivalType = data.workDayTypes[dateKey] ?? 'normal';
      if (!shouldScheduleArrivalReminder(dateKey, arrivalType)) return null;

      const dateLabel = formatSlashDateWithWeekday(dateKey, weekdays);
      const typeLabel = arrivalTypeLabel(language, arrivalType);

      return Notifications.scheduleNotificationAsync({
        identifier: `${ARRIVAL_REMINDER_PREFIX}${dateKey}`,
        content: {
          title: t(language, 'arrivalReminderTitle'),
          body: t(language, 'arrivalReminderBody', { date: dateLabel, type: typeLabel }),
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: ARRIVAL_REMINDER_CHANNEL } : {}),
        },
        trigger: getArrivalReminderTriggerDate(dateKey),
      });
    })
    .filter(Boolean);

  await Promise.all(schedules);
}
