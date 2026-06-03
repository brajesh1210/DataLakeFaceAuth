import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {useTheme} from '@theme/ThemeContext';

export interface FloatingInputProps
  extends Omit<TextInputProps, 'style' | 'placeholder'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  style?: ViewStyle;
}

export const FloatingInput = React.memo(
  ({
    label,
    value,
    onChangeText,
    error,
    style,
    editable = true,
    ...textInputProps
  }: FloatingInputProps) => {
    const {colors, typography, radius} = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    // 0 = unfocused/empty, 1 = focused/filled
    const floatingProgress = useSharedValue(value ? 1 : 0);

    useEffect(() => {
      if (isFocused || value) {
        floatingProgress.value = withTiming(1, {duration: 200});
      } else {
        floatingProgress.value = withTiming(0, {duration: 200});
      }
    }, [isFocused, value, floatingProgress]);

    const animatedLabelStyle = useAnimatedStyle(() => {
      return {
        fontSize: interpolate(floatingProgress.value, [0, 1], [14, 12]),
        transform: [
          {
            translateY: interpolate(floatingProgress.value, [0, 1], [0, -22]),
          },
        ],
        color: error
          ? colors.accent.red
          : isFocused
          ? colors.primary.navy
          : colors.text.secondary,
      };
    });

    return (
      <View style={[styles.wrapper, style]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.background.input,
              borderRadius: radius.md,
              borderWidth: error ? 1.5 : isFocused ? 1.5 : 0,
              borderColor: error ? colors.accent.red : colors.primary.navy,
              opacity: editable ? 1 : 0.6,
            },
          ]}>
          <Animated.Text
            style={[
              styles.labelContainer,
              typography.body,
              animatedLabelStyle,
            ]}>
            {label}
          </Animated.Text>
          <TextInput
            style={[
              styles.input,
              typography.body,
              {color: colors.text.primary},
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={editable}
            {...textInputProps}
          />
        </View>
        {error && (
          <Text
            style={[
              typography.caption,
              {color: colors.accent.red, marginTop: 4, marginLeft: 4},
            ]}>
            {error}
          </Text>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    left: 16,
    top: 18,
  },
  input: {
    height: '100%',
    paddingTop: 20, // push text down below floating label
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
});
