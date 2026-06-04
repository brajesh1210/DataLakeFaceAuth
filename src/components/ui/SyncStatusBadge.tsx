import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

interface Props {
  compact?: boolean;
  onPress?: () => void;
}

export const SyncStatusBadge: React.FC<Props> = ({ compact = false, onPress }) => {
  const { isOnline, isAWSReachable } = useNetworkStatus();
  const pulseValue = useSharedValue(1);
  
  React.useEffect(() => {
    if (isOnline && !isAWSReachable) {
      pulseValue.value = withRepeat(
        withTiming(0.6, { duration: 800 }),
        -1,
        true
      );
    } else {
      pulseValue.value = withTiming(1);
    }
  }, [isOnline, isAWSReachable, pulseValue]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
  }));
  
  const getStatus = () => {
    if (!isOnline) {
      return {
        color: '#94A3B8',
        bgColor: 'rgba(241, 245, 249, 0.95)',
        icon: 'wifi-off',
        text: 'Offline',
        textShort: 'Offline',
      };
    }
    if (isOnline && isAWSReachable) {
      return {
        color: '#2E9F3F',
        bgColor: '#2E9F3F',
        icon: 'cloud-check',
        text: 'AWS Connected',
        textShort: 'Synced',
      };
    }
    return {
      color: '#E67E22',
      bgColor: '#E67E22',
      icon: 'cloud-sync',
      text: 'Connecting to AWS...',
      textShort: 'Sync...',
    };
  };
  
  const status = getStatus();
  
  if (compact) {
    const CompactContent = (
      <Animated.View style={[styles.compactDot, animatedStyle]}>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <Icon name={status.icon} size={16} color="#FFFFFF" />
      </Animated.View>
    );
    if (onPress) {
      return <Pressable onPress={onPress}>{CompactContent}</Pressable>;
    }
    return CompactContent;
  }

  const Content = (
    <Animated.View style={[
      styles.badge, 
      { backgroundColor: status.color === '#94A3B8' ? status.bgColor : status.color },
      animatedStyle,
    ]}>
      <Icon name={status.icon} size={14} color={status.color === '#94A3B8' ? '#94A3B8' : '#FFFFFF'} />
      <Text style={[
        styles.text, 
        { color: status.color === '#94A3B8' ? '#94A3B8' : '#FFFFFF' },
      ]}>
        {status.text}
      </Text>
    </Animated.View>
  );
  
  if (onPress) {
    return <Pressable onPress={onPress}>{Content}</Pressable>;
  }
  return Content;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    gap: 6,
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compactDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
