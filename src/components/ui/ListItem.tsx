import React from 'react';
import {StyleSheet, View, Text, Pressable} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface ListItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  rightLabel?: string;
  badge?: number;
}

export const ListItem = React.memo(
  ({icon, label, onPress, rightLabel, badge}: ListItemProps) => {
    const {colors, typography, radius} = useTheme();

    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [
          styles.container,
          {backgroundColor: pressed ? colors.background.input : 'transparent'},
        ]}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.background.iconContainer,
              borderRadius: radius.sm,
            },
          ]}>
          {icon}
        </View>

        <Text
          style={[
            styles.label,
            typography.bodyLarge,
            {color: colors.primary.navy},
          ]}>
          {label}
        </Text>

        <View style={styles.rightArea}>
          {rightLabel && (
            <Text
              style={[
                typography.body,
                {color: colors.text.secondary, marginRight: 8},
              ]}>
              {rightLabel}
            </Text>
          )}
          {badge !== undefined && badge > 0 && (
            <View
              style={[
                styles.badge,
                {backgroundColor: colors.accent.red, borderRadius: radius.pill},
              ]}>
              <Text
                style={[
                  typography.caption,
                  {color: colors.text.white, fontWeight: '700'},
                ]}>
                {badge}
              </Text>
            </View>
          )}
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </View>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  label: {
    flex: 1,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
