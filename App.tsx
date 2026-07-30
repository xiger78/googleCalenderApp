import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkDataProvider } from './src/context/WorkDataContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { BannerTabBar } from './src/components/AppBanner';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { WorkDateScreen } from './src/screens/WorkDateScreen';
import { CommuteTimeScreen } from './src/screens/CommuteTimeScreen';
import { AttendanceHistoryScreen } from './src/screens/AttendanceHistoryScreen';
import { HolidayScreen } from './src/screens/HolidayScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useArrivalReminderNotifications } from './src/hooks/useArrivalReminderNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createMaterialTopTabNavigator();

function AppContent() {
  const { loading } = useLanguage();
  useArrivalReminderNotifications();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1565C0' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <AppTabs />
    </NavigationContainer>
  );
}

function AppTabs() {
  const { language, tr } = useLanguage();

  return (
    <Tab.Navigator
      key={language}
      tabBar={(props) => <BannerTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        lazy: true,
      }}
    >
      <Tab.Screen name="Notifications" component={NotificationScreen} options={{ title: tr('tabNotifications') }} />
      <Tab.Screen name="WorkDate" component={WorkDateScreen} options={{ title: tr('tabWorkDate') }} />
      <Tab.Screen name="CommuteTime" component={CommuteTimeScreen} options={{ title: tr('tabCommuteTime') }} />
      <Tab.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: tr('tabAttendanceHistory') }} />
      <Tab.Screen name="YearHolidays" component={HolidayScreen} options={{ title: tr('tabYearHolidays') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: tr('tabSettings') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <WorkDataProvider>
          <AppContent />
        </WorkDataProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
