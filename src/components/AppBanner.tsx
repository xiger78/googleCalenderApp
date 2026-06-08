import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 56;

export function AppBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <Image
        source={require('../../assets/banner.png')}
        style={styles.banner}
        resizeMode="cover"
        accessibilityLabel="App banner"
      />
    </View>
  );
}

export const APP_BANNER_HEIGHT = BANNER_HEIGHT;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#E3F2FD',
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
});
