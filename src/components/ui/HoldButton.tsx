import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Pressable, Vibration} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import {useTheme} from '@theme/ThemeContext';

interface HoldButtonProps {
  onComplete: () => void;
  title: string;
  holdTimeMs?: number;
  disabled?: boolean;
}

export function HoldButton({
  onComplete,
  title,
  holdTimeMs = 1500,
  disabled = false,
}: HoldButtonProps) {
  const {colors, typography} = useTheme();
  const [isHolding, setIsHolding] = useState(false);
  
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isHolding) {
      cancelAnimation(progress);
      progress.value = withTiming(0, {duration: 200});
      scale.value = withSpring(1);
    }
  }, [isHolding, progress, scale]);

  const handlePressIn = () => {
    if (disabled) return;
    setIsHolding(true);
    scale.value = withSpring(0.95);
    progress.value = withTiming(
      1,
      {
        duration: holdTimeMs,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(handleComplete)();
        }
      }
    );
  };

  const handlePressOut = () => {
    if (disabled) return;
    setIsHolding(false);
  };

  const handleComplete = () => {
    Vibration.vibrate(100);
    setIsHolding(false);
    onComplete();
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      opacity: progress.value > 0 ? 1 : 0,
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
    };
  });

  return (
    <Animated.View style={[styles.container, buttonStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          {backgroundColor: disabled ? colors.background.input : colors.primary.navy},
          disabled && styles.buttonDisabled,
        ]}>
        
        {/* Progress Background */}
        <Animated.View
          style={[
            styles.progressBackground,
            {backgroundColor: colors.primary.action},
            progressStyle,
          ]}
        />

        <Text
          style={[
            typography.button,
            {color: disabled ? colors.text.disabled : colors.text.white},
          ]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Contain the progress background
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
  },
});
