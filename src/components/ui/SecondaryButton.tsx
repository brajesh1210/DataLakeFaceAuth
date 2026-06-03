import React from 'react';
import { StyleSheet, ViewStyle, Pressable, ActivityIndicator, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SecondaryButton = React.memo(({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  size = 'medium',
  style,
}: SecondaryButtonProps) => {
  const { colors, radius, typography } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.5 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  React.useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 200 });
  }, [disabled, opacity]);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(0.96, { duration: 150 });
      opacity.value = withTiming(0.7, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  };

  let height = 48;
  if (size === 'small') height = 36;
  if (size === 'large') height = 56;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          borderColor: colors.primary.navy,
          borderWidth: 1.5,
          borderRadius: radius.pill,
          height,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'small' ? 16 : 24,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary.navy} />
      ) : (
        <>
          {icon && (
            <Icon
              name={icon}
              size={size === 'small' ? 18 : 22}
              color={colors.primary.navy}
              style={styles.icon}
            />
          )}
          <Text style={[typography.button, { color: colors.primary.navy }]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: 8,
  },
});
