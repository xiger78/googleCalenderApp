import React from 'react';
import { Image, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';

const BANNER_HEIGHT = 88;
const NAV_CARD_HEIGHT = 72;

type TabIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAB_CONFIG: Record<string, { icon: TabIconName; activeColor: string }> = {
  WorkDate: { icon: 'calendar-month', activeColor: '#1976D2' },
  CommuteTime: { icon: 'clock-outline', activeColor: '#4CAF50' },
  AttendanceHistory: { icon: 'clipboard-text-outline', activeColor: '#1976D2' },
  Settings: { icon: 'cog-outline', activeColor: '#616161' },
};

export function BannerTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <Image
        source={require('../../assets/banner.png')}
        style={styles.banner}
        resizeMode="cover"
        accessibilityLabel="App banner"
      />
      <View style={styles.navCard}>
        <View style={styles.navRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name] ?? TAB_CONFIG.WorkDate;
            const color = isFocused ? config.activeColor : '#757575';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                style={styles.navItem}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconWrap,
                    isFocused && { backgroundColor: `${config.activeColor}18` },
                  ]}
                >
                  <MaterialCommunityIcons name={config.icon} size={20} color={color} />
                </View>
                <Text style={[styles.navLabel, isFocused && { color, fontWeight: '700' }]}>
                  {label}
                </Text>
                {isFocused ? (
                  <View style={[styles.activeBar, { backgroundColor: config.activeColor }]} />
                ) : (
                  <View style={styles.activeBarPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export const APP_BANNER_HEIGHT = BANNER_HEIGHT + NAV_CARD_HEIGHT - 12;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#E3F2FD',
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  navCard: {
    marginHorizontal: 12,
    marginTop: -10,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#757575',
    textAlign: 'center',
  },
  activeBar: {
    width: '70%',
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  activeBarPlaceholder: {
    height: 7,
  },
});
