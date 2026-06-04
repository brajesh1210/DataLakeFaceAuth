import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {Card} from './Card';

interface StatItem {
  value: string | number;
  label: string;
  valueColor?: string;
}

interface StatsRowProps {
  stats: StatItem[];
}

export function StatsRow({stats}: StatsRowProps) {
  const {colors, typography} = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        {stats.map((stat, index) => (
          <React.Fragment key={index}>
            <View style={styles.statItem}>
              <Text
                style={[
                  typography.h2,
                  {color: stat.valueColor || colors.text.primary},
                  styles.value,
                ]}>
                {stat.value}
              </Text>
              <Text style={[typography.caption, {color: colors.text.secondary}]}>
                {stat.label}
              </Text>
            </View>
            {index < stats.length - 1 && (
              <View
                style={[
                  styles.divider,
                  {backgroundColor: colors.border.default},
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    marginBottom: 4,
  },
  divider: {
    width: 1,
    height: '80%',
    marginHorizontal: 8,
  },
});
