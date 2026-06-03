import React, { useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@theme/ThemeContext';
import { GradientBackground } from '@components/ui/GradientBackground';
import { Card } from '@components/ui/Card';
import { NHAIHeader } from '@components/branding/NHAIHeader';
import { DigitalIndiaBadge } from '@components/branding/DigitalIndiaBadge';
import type { RootStackScreenProps } from '@navigation/navigationTypes';

export const SplashScreen = ({ navigation }: RootStackScreenProps<'Splash'>) => {
  const { colors, typography, spacing } = useTheme();
  const fadeIn = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: (1 - fadeIn.value) * 20 }],
  }));

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeIn, navigation]);

  return (
    <GradientBackground colors={['#D6E3F1', '#E8F1FB', '#FFFFFF']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <Animated.View style={[styles.cardWrapper, animatedStyle]}>
          <Card padding={32} style={styles.card}>
            <NHAIHeader />

            <View style={styles.titleSection}>
              <Text style={[typography.body, { color: colors.text.secondary, marginBottom: 4 }]}>
                Welcome to
              </Text>
              <Text style={[typography.h1, { color: colors.primary.navy, fontSize: 32, fontWeight: '700' }]}>
                DataLake 3.0
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

            <Text style={[typography.bodySmall, { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.lg }]}>
              Field Authentication & Attendance System
            </Text>

            <DigitalIndiaBadge />
          </Card>
        </Animated.View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  divider: {
    width: 60,
    height: 2,
    borderRadius: 1,
    marginBottom: 16,
  },
});
