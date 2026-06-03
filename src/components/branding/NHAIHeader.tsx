import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export interface NHAIHeaderProps {
  compact?: boolean;
  style?: ViewStyle;
}

export const NHAIHeader = React.memo(({
  compact = false,
  style,
}: NHAIHeaderProps) => {
  const { colors, typography, radius } = useTheme();

  const logoSize = compact ? 32 : 40;
  const textSize = compact ? 12 : 14;

  return (
    <View style={[styles.container, style]}>
      {/* Government emblem placeholder */}
      <View 
        style={[
          styles.placeholder, 
          { 
            width: logoSize, 
            height: logoSize, 
            backgroundColor: colors.accent.orange,
            borderRadius: radius.sm,
            marginRight: 8,
          }
        ]} 
      />
      
      {/* NHAI logo placeholder */}
      <View 
        style={[
          styles.placeholder, 
          { 
            width: logoSize, 
            height: logoSize, 
            backgroundColor: colors.primary.lightBlue,
            borderRadius: radius.sm,
            marginRight: 12,
          }
        ]} 
      />

      <View style={styles.textContainer}>
        <Text 
          style={[
            typography.body, 
            { 
              color: colors.primary.navy, 
              fontWeight: '700',
              fontSize: textSize,
            }
          ]}
          numberOfLines={2}
        >
          National Highways Authority of India
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  placeholder: {
    // These will be replaced by actual images later
    opacity: 0.8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
