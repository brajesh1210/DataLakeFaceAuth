import React from 'react';
import {StyleSheet, View, Text, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@theme/ThemeContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

interface NavyAppHeaderProps {
  title: string;
  hasNotifications?: boolean;
  onPressNotification?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export function NavyAppHeader({
  title,
  hasNotifications = false,
  onPressNotification,
  showBack = false,
  onBack,
}: NavyAppHeaderProps) {
  const {colors, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary.navy,
          paddingTop: insets.top + 16,
        },
      ]}>
      <View style={styles.leftContent}>
        {showBack && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.white} />
          </Pressable>
        )}
        <Text style={[typography.h3, {color: colors.text.white}]}>{title}</Text>
      </View>

      <View style={styles.rightContent}>
        <Pressable onPress={() => navigation.navigate('About' as never)} style={styles.iconContainer}>
          <Icon name="information-outline" size={26} color={colors.text.white} />
        </Pressable>
        <Pressable onPress={onPressNotification} style={styles.iconContainer}>
          <Icon name="bell" size={26} color={colors.accent.yellow} />
          {hasNotifications && (
            <View
              style={[
                styles.redDot,
                {backgroundColor: colors.accent.notification},
              ]}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    padding: 6,
    marginLeft: 8,
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#1B3A6B', // Match navy background
  },
});
