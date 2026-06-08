import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkDataProvider } from './src/context/WorkDataContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { BannerTabBar } from './src/components/AppBanner';
import { WorkDateScreen } from './src/screens/WorkDateScreen';
import { CommuteTimeScreen } from './src/screens/CommuteTimeScreen';
import { GoogleCalendarScreen } from './src/screens/GoogleCalendarScreen';
import { AttendanceHistoryScreen } from './src/screens/AttendanceHistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createMaterialTopTabNavigator();

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
      <Tab.Screen name="WorkDate" component={WorkDateScreen} options={{ title: tr('tabWorkDate') }} />
      <Tab.Screen name="CommuteTime" component={CommuteTimeScreen} options={{ title: tr('tabCommuteTime') }} />
      <Tab.Screen name="GoogleCalendar" component={GoogleCalendarScreen} options={{ title: tr('tabGoogleCalendar') }} />
      <Tab.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: tr('tabAttendanceHistory') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: tr('tabSettings') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <WorkDataProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <AppTabs />
          </NavigationContainer>
        </WorkDataProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
