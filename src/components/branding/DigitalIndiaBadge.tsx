import React from 'react';
import {StyleSheet, View, Text, ViewStyle} from 'react-native';
import {useTheme} from '@theme/ThemeContext';

export interface DigitalIndiaBadgeProps {
  style?: ViewStyle;
}

export const DigitalIndiaBadge = React.memo(
  ({style}: DigitalIndiaBadgeProps) => {
    const {colors, typography, radius} = useTheme();

    return (
      <View style={[styles.container, style]}>
        {/* Digital India logo placeholder */}
        <View
          style={[
            styles.placeholder,
            {
              width: 24,
              height: 24,
              backgroundColor: colors.accent.red,
              borderRadius: radius.sm,
              marginRight: 8,
            },
          ]}
        />

        <View style={styles.textContainer}>
          <Text
            style={[
              typography.caption,
              {
                color: colors.text.secondary,
                fontSize: 10,
                fontStyle: 'italic',
                marginBottom: -2,
              },
            ]}>
            powered by
          </Text>
          <Text
            style={[
              typography.bodySmall,
              {color: colors.primary.navy, fontWeight: 'bold', fontSize: 12},
            ]}>
            Digital India
          </Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  placeholder: {
    opacity: 0.8,
  },
  textContainer: {
    justifyContent: 'center',
  },
});
