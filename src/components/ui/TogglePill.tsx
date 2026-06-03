import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@theme/ThemeContext';

export interface TogglePillProps {
  options: string[];
  selected: string;
  onChange: (option: string) => void;
}

export const TogglePill = React.memo(({ options, selected, onChange }: TogglePillProps) => {
  const { colors, typography, radius } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const selectedIndex = options.indexOf(selected);
  const safeSelectedIndex = selectedIndex !== -1 ? selectedIndex : 0;
  
  const pillWidth = containerWidth > 0 ? containerWidth / options.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (pillWidth > 0) {
      translateX.value = withSpring(safeSelectedIndex * pillWidth, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [safeSelectedIndex, pillWidth, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: pillWidth,
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.card, borderRadius: radius.pill },
      ]}
      onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {pillWidth > 0 && (
        <Animated.View
          style={[
            styles.activeIndicator,
            { backgroundColor: colors.primary.navy, borderRadius: radius.pill },
            animatedIndicatorStyle,
          ]}
        />
      )}
      
      {options.map((option, index) => {
        const isActive = index === safeSelectedIndex;
        return (
          <Pressable
            key={option}
            style={styles.optionButton}
            onPress={() => onChange(option)}
          >
            <Text
              style={[
                typography.label,
                { color: isActive ? colors.text.white : colors.text.primary },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    position: 'relative',
    padding: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
  },
  optionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // ensure text is above the indicator
  },
});
