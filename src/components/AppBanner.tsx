import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';

const BANNER_HEIGHT = 56;
const NAV_HEIGHT = 36;

export function BannerTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.bannerArea}>
        <Image
          source={require('../../assets/banner.png')}
          style={styles.banner}
          resizeMode="cover"
          accessibilityLabel="App banner"
        />
        <View style={styles.navOverlay}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScroll}
          >
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label = options.title ?? route.name;
              const isFocused = state.index === index;

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
                  style={[styles.navBtn, isFocused && styles.navBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

export const APP_BANNER_HEIGHT = BANNER_HEIGHT + NAV_HEIGHT;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#E3F2FD',
  },
  bannerArea: {
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  navOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(25, 118, 210, 0.25)',
  },
  navScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    minHeight: NAV_HEIGHT,
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 14,
  },
  navBtnActive: {
    backgroundColor: '#1976D2',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  navLabelActive: {
    color: '#fff',
  },
});
