import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {useTheme} from '@theme/ThemeContext';

export interface StatItem {
  value: string | number;
  label: string;
  color?: string;
}

export interface StatsCardProps {
  stats: StatItem[];
  columns?: 2 | 4;
}

export const StatsCard = React.memo(({stats, columns = 2}: StatsCardProps) => {
  const {typography, colors} = useTheme();

  // Calculate width percentage based on columns
  const itemWidth = columns === 2 ? '50%' : '25%';

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[styles.statContainer, {width: itemWidth as any}]}>
          <Text
            style={[typography.h1, {color: stat.color || colors.primary.navy}]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {stat.value}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              {color: colors.text.secondary, marginTop: 4},
            ]}
            numberOfLines={2}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});
