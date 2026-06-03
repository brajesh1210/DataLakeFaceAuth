import React from 'react';
import {StyleSheet, ViewStyle, StatusBar} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView, Edge} from 'react-native-safe-area-context';

export interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
  edges?: Edge[];
}

export const GradientBackground = React.memo(
  ({
    children,
    style,
    colors = ['#E8F1FB', '#F5F8FC', '#FFFFFF'],
    edges = ['top', 'bottom', 'left', 'right'],
  }: GradientBackgroundProps) => {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={colors}
          style={[styles.gradient, style]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}>
          <SafeAreaView style={styles.safeArea} edges={edges}>
            {children}
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  },
);

const styles = StyleSheet.create({
  gradient: {flex: 1},
  safeArea: {flex: 1},
});
