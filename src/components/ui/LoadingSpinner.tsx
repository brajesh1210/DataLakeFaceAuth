import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullscreen?: boolean;
  overlay?: boolean;
  style?: ViewStyle;
}

export const LoadingSpinner = React.memo(({
  message,
  size = 'small',
  fullscreen = false,
  overlay = false,
  style,
}: LoadingSpinnerProps) => {
  const { colors, typography } = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const content = (
    <View style={[styles.contentContainer, !fullscreen && { flexDirection: 'row' }, style]}>
      <ActivityIndicator size={size} color={colors.primary.navy} />
      {message && (
        <Text
          style={[
            typography.body,
            { color: colors.primary.navy },
            fullscreen ? styles.messageFullscreen : styles.messageInline
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (fullscreen) {
    return (
      <Animated.View
        style={[
          styles.fullscreenContainer,
          overlay && { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
          animatedStyle,
        ]}
      >
        {content}
      </Animated.View>
    );
  }

  return <Animated.View style={animatedStyle}>{content}</Animated.View>;
});

const styles = StyleSheet.create({
  fullscreenContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInline: {
    marginLeft: 12,
  },
  messageFullscreen: {
    marginTop: 16,
    textAlign: 'center',
  },
});
