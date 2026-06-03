import React from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface SectionHeaderProps {
  title: string;
  rightAction?: {
    label: string;
    onPress: () => void;
    icon?: string; // Default: 'chevron-down'
  };
  style?: ViewStyle;
}

export const SectionHeader = React.memo(({
  title,
  rightAction,
  style,
}: SectionHeaderProps) => {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[typography.h3, { color: colors.primary.navy, flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>
      
      {rightAction && (
        <Pressable
          onPress={rightAction.onPress}
          style={({ pressed }) => [
            styles.actionContainer,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[typography.label, { color: colors.primary.navy }]}>
            {rightAction.label}
          </Text>
          <Icon
            name={rightAction.icon || 'chevron-down'}
            size={20}
            color={colors.primary.navy}
            style={styles.icon}
          />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  icon: {
    marginLeft: 4,
  },
});
