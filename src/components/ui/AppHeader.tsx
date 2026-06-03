import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
}

export const AppHeader = React.memo(
  ({title, onBack, rightComponent, transparent = false}: AppHeaderProps) => {
    const {colors, typography} = useTheme();

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: transparent
              ? 'transparent'
              : colors.background.card,
            borderBottomWidth: transparent ? 0 : 1,
            borderBottomColor: colors.border.default,
          },
        ]}>
        <View style={styles.leftContainer}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
              <Icon name="chevron-left" size={32} color={colors.primary.navy} />
            </Pressable>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text
            style={[typography.h4, {color: colors.primary.navy}]}
            numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightContainer}>{rightComponent}</View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    height: 56, // + status bar height is handled by SafeAreaView in parent or screen
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    // Add paddingTop if not using SafeAreaView wrapping the header,
    // but usually SafeAreaView is external.
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    marginLeft: -8, // visually align left
  },
});
