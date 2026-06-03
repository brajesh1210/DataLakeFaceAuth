import React from 'react';
import { StyleSheet, ViewStyle, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
}

export const GradientBackground = React.memo(({
  children,
  colors = ['#E8F1FB', '#F5F8FC', '#FFFFFF'],
  style,
}: GradientBackgroundProps) => {
  return (
    <LinearGradient colors={colors} style={[styles.container, style]}>
      <SafeAreaView style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
