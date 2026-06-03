import React from 'react';
import {StyleSheet, View, Text, Pressable, ViewStyle} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

export interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Checkbox = React.memo(
  ({checked, onToggle, label, disabled = false, style}: CheckboxProps) => {
    const {colors, typography, radius} = useTheme();

  // 0 = unchecked, 1 = checked
    const checkProgress = useSharedValue(checked ? 1 : 0);
    const scale = useSharedValue(1);

    React.useEffect(() => {
      checkProgress.value = withTiming(checked ? 1 : 0, {duration: 200});
    }, [checked, checkProgress]);

    const animatedBoxStyle = useAnimatedStyle(() => {
      return {
        transform: [{scale: scale.value}],
        backgroundColor: interpolateColor(
          checkProgress.value,
          [0, 1],
          ['transparent', colors.primary.navy],
        ),
        borderColor: interpolateColor(
          checkProgress.value,
          [0, 1],
          [colors.text.tertiary, colors.primary.navy],
        ),
      };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
      return {
        opacity: checkProgress.value,
        transform: [{scale: checkProgress.value}],
      };
    });

    const handlePressIn = () => {
      if (!disabled) {scale.value = withSpring(0.85);}
    };

    const handlePressOut = () => {
      if (!disabled) {scale.value = withSpring(1);}
    };

    return (
      <Pressable
        onPress={() => onToggle(!checked)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({pressed}) => [
          styles.container,
          {opacity: disabled ? 0.5 : 1},
          style,
        ]}>
        <Animated.View
          style={[
            styles.box,
            {borderRadius: radius.sm, borderWidth: 2},
            animatedBoxStyle,
          ]}>
          <Animated.View style={animatedIconStyle}>
            <Icon name="check" size={18} color={colors.text.white} />
          </Animated.View>
        </Animated.View>

        {label && (
          <Text
            style={[
              typography.body,
              styles.label,
              {color: colors.text.primary},
            ]}>
            {label}
          </Text>
        )}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  box: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 12,
    flexShrink: 1,
  },
});
