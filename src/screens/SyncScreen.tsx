import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/ThemeContext';
import { GradientBackground } from '@components/ui/GradientBackground';
import { Card } from '@components/ui/Card';
import { AppHeader } from '@components/ui/AppHeader';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { SecondaryButton } from '@components/ui/SecondaryButton';
import { Checkbox } from '@components/ui/Checkbox';
import { ProgressBar } from '@components/ui/ProgressBar';
import { useAppStore } from '@store/useAppStore';
import type { TabScreenProps } from '@navigation/navigationTypes';

export const SyncScreen = ({ navigation }: TabScreenProps<'Sync'>) => {
  const { colors, typography, spacing, radius } = useTheme();
  const {
    isOnline,
    pendingSyncCount,
    attendanceRecords,
    lastSyncTime,
    autoSync,
    setAutoSync,
    markRecordsAsSynced,
    purge,
  } = useAppStore();

  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, []);

  // Calculate synced records count
  const syncedCount = attendanceRecords.filter(r => r.synced).length;
  const estimatedSize = (pendingSyncCount * 0.2).toFixed(1);

  // Relative time for last sync
  const getRelativeTime = (ts: number | null): string => {
    if (!ts) return 'Never';
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const handleSync = useCallback(() => {
    if (!isOnline || pendingSyncCount === 0) return;

    setSyncing(true);
    setSyncProgress(0);

    let progress = 0;
    syncTimerRef.current = setInterval(() => {
      progress += 0.033; // ~3 seconds total (30 ticks × 100ms)
      if (progress >= 1) {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
        // Mark all pending records as synced
        const pendingIds = attendanceRecords
          .filter(r => !r.synced)
          .map(r => r.id);
        markRecordsAsSynced(pendingIds);
        setSyncProgress(1);
        setTimeout(() => {
          setSyncing(false);
          setSyncProgress(0);
        }, 500);
      } else {
        setSyncProgress(progress);
      }
    }, 100);
  }, [isOnline, pendingSyncCount, attendanceRecords, markRecordsAsSynced]);

  const handlePurge = useCallback(() => {
    Alert.alert(
      'Purge Synced Records',
      'This will permanently delete all synced attendance records from this device. Pending records will be preserved.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: () => purge(),
        },
      ],
    );
  }, [purge]);

  return (
    <GradientBackground>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AppHeader title="Sync & Backup" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Network Status Card */}
        <Card padding={24} style={{ alignItems: 'center' }}>
          <Icon
            name={isOnline ? 'wifi' : 'wifi-off'}
            size={64}
            color={isOnline ? colors.accent.green : colors.accent.red}
          />
          <Text
            style={[
              typography.h3,
              {
                color: isOnline ? colors.accent.green : colors.accent.red,
                marginTop: spacing.md,
              },
            ]}
          >
            {isOnline ? 'Connected to WiFi' : 'No Network'}
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 4 }]}>
            {isOnline ? 'Ready to sync data' : 'Sync will resume when connected'}
          </Text>
        </Card>

        {/* Pending Records Card */}
        <Card padding={20} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={[typography.h1, { color: colors.primary.navy, fontSize: 48, fontWeight: '700' }]}>
            {pendingSyncCount}
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary, marginTop: 4 }]}>
            Records pending sync
          </Text>
          <Text style={[typography.caption, { color: colors.text.tertiary, marginTop: 4 }]}>
            Estimated upload size: ~{estimatedSize} MB
          </Text>
        </Card>

        {/* Sync Action Card */}
        <Card padding={20} style={{ marginTop: spacing.lg }}>
          {syncing ? (
            <View style={{ marginBottom: spacing.lg }}>
              <ProgressBar
                progress={syncProgress}
                label="Syncing..."
                showPercentage
                color={colors.accent.green}
              />
            </View>
          ) : null}

          <PrimaryButton
            title="Sync Now"
            icon="sync"
            onPress={handleSync}
            disabled={!isOnline || pendingSyncCount === 0 || syncing}
            loading={syncing}
          />

          <View style={{ height: spacing.lg }} />

          <Checkbox
            checked={autoSync}
            onToggle={setAutoSync}
            label="Auto-sync when online"
          />
        </Card>

        {/* Last Sync Info Card */}
        <Card padding={16} style={{ marginTop: spacing.lg }}>
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={20} color={colors.text.secondary} />
            <View style={styles.infoText}>
              <Text style={[typography.body, { color: colors.primary.navy, fontWeight: '600' }]}>
                Last sync: {getRelativeTime(lastSyncTime)}
              </Text>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {syncedCount} records uploaded
              </Text>
            </View>
          </View>
        </Card>

        {/* Danger Zone Card */}
        <Card
          padding={16}
          style={{
            marginTop: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: colors.accent.red,
          }}
        >
          <Text style={[typography.h4, { color: colors.accent.red, marginBottom: spacing.sm }]}>
            Danger Zone
          </Text>
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginBottom: spacing.lg }]}>
            Remove synced records from this device to free up storage. Pending records will not be affected.
          </Text>
          <SecondaryButton
            title="Purge Synced Records"
            icon="delete-outline"
            onPress={handlePurge}
            disabled={syncedCount === 0}
          />
        </Card>

        <View style={{ height: 20 }} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
});
