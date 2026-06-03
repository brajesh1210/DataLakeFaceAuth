import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  icon?: string;
  style?: ViewStyle;
}

export const StatusBadge = React.memo(({
  label,
  variant,
  icon,
  style,
}: StatusBadgeProps) => {
  const { typography, radius } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'warning':
        return { bg: '#FFF3E0', text: '#E65100' };
      case 'danger':
        return { bg: '#FFEBEE', text: '#C62828' };
      case 'info':
        return { bg: '#E3F2FD', text: '#0A3D7A' };
      case 'neutral':
      default:
        return { bg: '#F5F5F5', text: '#424242' };
    }
  };

  const themeColors = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.bg, borderRadius: radius.pill },
        style,
      ]}
    >
      {icon && (
        <Icon name={icon} size={14} color={themeColors.text} style={styles.icon} />
      )}
      <Text style={[typography.caption, { color: themeColors.text, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});
