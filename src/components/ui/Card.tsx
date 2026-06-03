import React from 'react';
import {StyleSheet, ViewStyle, Pressable} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '@theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  onPress?: () => void;
  elevated?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card = React.memo(
  ({children, style, padding = 16, onPress, elevated = true}: CardProps) => {
    const {colors, radius, shadows} = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{scale: scale.value}],
    }));

    const handlePressIn = () => {
      if (onPress) {
        scale.value = withTiming(0.98, {duration: 150});
      }
    };

    const handlePressOut = () => {
      if (onPress) {
        scale.value = withTiming(1, {duration: 150});
      }
    };

    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderRadius: radius.lg, // 16px
            padding,
          },
          elevated && shadows.card,
          animatedStyle,
          style,
        ]}>
        {children}
      </AnimatedPressable>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
