import React from 'react';
import {StyleSheet, View, Text, Pressable, ViewStyle} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

export interface IconBadgeProps {
  icon: string;
  color: string;
  size?: 32 | 48 | 64;
  label?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const IconBadge = React.memo(
  ({icon, color, size = 48, label, onPress, style}: IconBadgeProps) => {
    const {typography, shadows} = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{scale: scale.value}],
    }));

    const handlePressIn = () => {
      if (onPress) {
        scale.value = withTiming(0.94, {duration: 150});
      }
    };

    const handlePressOut = () => {
      if (onPress) {
        scale.value = withTiming(1, {duration: 150});
      }
    };

    // Determine icon size based on container size
    const iconSize = size === 32 ? 18 : size === 48 ? 24 : 32;

    return (
      <View style={[styles.wrapper, style]}>
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!onPress}
          style={[
            styles.container,
            {
              backgroundColor: color,
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            shadows.card,
            animatedStyle,
          ]}>
          <Icon name={icon} size={iconSize} color="#FFFFFF" />
        </AnimatedPressable>
        {label && (
          <Text style={[typography.bodySmall, styles.label]}>{label}</Text>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
    textAlign: 'center',
  },
});
