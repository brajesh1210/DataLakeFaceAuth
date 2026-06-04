import React from 'react';
import {StyleSheet, View, Text, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@theme/ThemeContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {SyncStatusBadge} from './SyncStatusBadge';

interface NavyAppHeaderProps {
  title: string;
  hasNotifications?: boolean;
  onPressNotification?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  showBell?: boolean;
  showSyncBadge?: boolean;
  showInfo?: boolean;
}

export function NavyAppHeader({
  title,
  hasNotifications = true, // default true for demo
  onPressNotification,
  showBack = false,
  onBack,
  showBell = true,
  showSyncBadge = true,
  showInfo = true,
}: NavyAppHeaderProps) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.primary.navy,
          paddingTop: insets.top + 12,
        },
      ]}>
      <View style={styles.leftSection}>
        {(showBack || onBack) && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={26} color={colors.text.white} />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {showSyncBadge && <SyncStatusBadge compact onPress={() => navigation.navigate('SyncDetails' as never)} />}
        
        {showBell && (
          <Pressable onPress={() => navigation.navigate('Notifications' as never)} style={styles.iconButton}>
            <Icon name="bell" size={24} color={colors.accent.yellow} />
            {hasNotifications && (
              <View style={[styles.notificationDot, {backgroundColor: colors.accent.notification}]} />
            )}
          </Pressable>
        )}

        {showInfo && (
          <Pressable onPress={() => navigation.navigate('About' as never)} style={styles.iconButton}>
            <Icon name="information-outline" size={22} color={colors.text.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#1B3A6B',
  },
});
