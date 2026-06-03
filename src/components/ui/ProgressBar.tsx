import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ViewStyle, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@theme/ThemeContext';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const ProgressBar = React.memo(({
  progress,
  height = 8,
  color,
  label,
  showPercentage = false,
  style,
}: ProgressBarProps) => {
  const { colors, typography, radius } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  
  const animatedWidth = useSharedValue(0);

  // Clamp progress between 0 and 1
  const safeProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (containerWidth > 0) {
      animatedWidth.value = withTiming(containerWidth * safeProgress, { duration: 500 });
    }
  }, [safeProgress, containerWidth, animatedWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  return (
    <View style={[styles.wrapper, style]}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && (
            <Text style={[typography.label, { color: colors.text.secondary }]}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={[typography.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
              {Math.round(safeProgress * 100)}%
            </Text>
          )}
        </View>
      )}
      
      <View
        style={[
          styles.track,
          { height, backgroundColor: colors.background.input, borderRadius: radius.pill },
        ]}
        onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.fill,
            { height, backgroundColor: color || colors.primary.navy, borderRadius: radius.pill },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
