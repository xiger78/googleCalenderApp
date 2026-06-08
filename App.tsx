import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkDataProvider } from './src/context/WorkDataContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AppBanner } from './src/components/AppBanner';
import { WorkDateScreen } from './src/screens/WorkDateScreen';
import { CommuteTimeScreen } from './src/screens/CommuteTimeScreen';
import { GoogleCalendarScreen } from './src/screens/GoogleCalendarScreen';
import { AttendanceHistoryScreen } from './src/screens/AttendanceHistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function AppTabs() {
  const { language, tr } = useLanguage();

  return (
    <View style={styles.root}>
      <AppBanner />
      <Tab.Navigator
        key={language}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1976D2',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#e0e0e0',
            height: 58,
            paddingTop: 4,
          },
        }}
      >
        <Tab.Screen name="WorkDate" component={WorkDateScreen} options={{ title: tr('tabWorkDate') }} />
        <Tab.Screen name="CommuteTime" component={CommuteTimeScreen} options={{ title: tr('tabCommuteTime') }} />
        <Tab.Screen name="GoogleCalendar" component={GoogleCalendarScreen} options={{ title: tr('tabGoogleCalendar') }} />
        <Tab.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: tr('tabAttendanceHistory') }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: tr('tabSettings') }} />
      </Tab.Navigator>
    </View>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
