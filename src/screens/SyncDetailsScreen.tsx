import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { NavyAppHeader } from '@components/ui/NavyAppHeader';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { SyncService } from '@services/SyncService';
import { databaseService } from '@services/DatabaseService';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { SecondaryButton } from '@components/ui/SecondaryButton';
import { SkeletonListItem } from '@components/ui/SkeletonCard';

export function SyncDetailsScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation();
  const networkStatus = useNetworkStatus();
  
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const pending = await SyncService.getPendingCount();
    setPendingCount(pending);
    
    // Load history
    const hist = await databaseService.getSyncHistory(10);
    setHistory(hist);
    
    // Load stats
    const st = await databaseService.getSyncStats();
    setStats(st);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // Poll for pending count every 5 seconds if not syncing
    const interval = setInterval(() => {
      if (!isSyncing) {
        loadData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  const handleSyncNow = async () => {
    if (!networkStatus.isAWSReachable) {
      Alert.alert('Offline', 'Cannot sync while offline. Please connect to the internet.');
      return;
    }
    
    setIsSyncing(true);
    setSyncProgress(0);
    
    const result = await SyncService.syncNow((progress) => {
      setSyncProgress(progress);
    });
    
    setIsSyncing(false);
    loadData();
    
    if (result.success) {
      Alert.alert('Sync Complete', `Successfully synced ${result.syncedCount} records.`);
    } else {
      Alert.alert('Sync Failed', result.errorMessage || `Failed to sync. ${result.syncedCount} succeeded, ${result.failedCount} failed.`);
    }
  };

  const handlePurge = () => {
    Alert.alert(
      'Purge Synced Records',
      'Are you sure you want to delete all server-confirmed records from this device? This will free up local storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purge', 
          style: 'destructive',
          onPress: async () => {
            // Wait for DB support, for now just show alert
            Alert.alert('Purge', 'Not implemented yet.');
          }
        }
      ]
    );
  };

  const getConnectionStatus = () => {
    if (!networkStatus.isOnline) {
      return {
        title: 'Offline',
        sub: 'No internet connection',
        icon: 'wifi-off',
        color: '#94A3B8',
        bg: '#F1F5F9'
      };
    }
    if (networkStatus.isAWSReachable) {
      return {
        title: 'AWS Connected',
        sub: `Connected via ${networkStatus.connectionType}`,
        icon: 'cloud-check',
        color: '#2E9F3F',
        bg: '#EAF8ED'
      };
    }
    return {
      title: 'Connecting...',
      sub: 'Attempting to reach AWS servers',
      icon: 'cloud-sync',
      color: '#E67E22',
      bg: '#FDF2E9'
    };
  };

  const conn = getConnectionStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.page }]} edges={['bottom']}>
      <NavyAppHeader 
        title="Sync & Backup" 
        showBack 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* CARD 1: Connection Status */}
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <View style={styles.connHeader}>
            <View style={[styles.iconBox, { backgroundColor: conn.bg }]}>
              <Icon name={conn.icon} size={32} color={conn.color} />
            </View>
            <View style={styles.connInfo}>
              <Text style={[typography.h3, { color: conn.color }]}>{conn.title}</Text>
              <Text style={[typography.body, { color: colors.text.secondary }]}>{conn.sub}</Text>
              <Text style={[typography.caption, { color: colors.text.tertiary, marginTop: 4 }]}>
                Last checked: {new Date(networkStatus.lastChecked).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>

        {/* CARD 2: Sync Statistics */}
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <Text style={[typography.h4, styles.cardTitle]}>Sync Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={[typography.h2, { color: '#E67E22' }]}>{pendingCount}</Text>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[typography.h2, { color: '#2E9F3F' }]}>{stats.today}</Text>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>Synced Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[typography.h2, { color: '#DC2626' }]}>{history.reduce((acc, curr) => acc + curr.failed_count, 0)}</Text>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>Failed</Text>
            </View>
          </View>
        </View>

        {/* CARD 3: Manual Sync */}
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <Text style={[typography.h4, styles.cardTitle]}>Manual Sync</Text>
          
          {isSyncing ? (
            <View style={styles.syncingContainer}>
              <ActivityIndicator size="large" color={colors.primary.navy} />
              <Text style={[typography.body, { marginTop: 12, color: colors.text.primary }]}>
                Syncing {(syncProgress * 100).toFixed(0)}%...
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${syncProgress * 100}%`, backgroundColor: colors.primary.navy }]} />
              </View>
            </View>
          ) : (
            <>
              <PrimaryButton 
                title={pendingCount > 0 ? "Sync Now" : "Everything is Synced"} 
                onPress={handleSyncNow} 
                disabled={!networkStatus.isAWSReachable || pendingCount === 0}
              />
              <View style={styles.autoSyncRow}>
                <Icon name="check-circle" size={16} color="#2E9F3F" />
                <Text style={[typography.body, { color: colors.text.secondary, marginLeft: 6 }]}>
                  Auto-sync when online is active
                </Text>
              </View>
            </>
          )}
        </View>

        {/* CARD 4: Sync History */}
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <Text style={[typography.h4, styles.cardTitle]}>Recent Sync History</Text>
          
          {isLoading ? (
            <View>
              {[1, 2, 3].map(i => (
                <SkeletonListItem key={i} />
              ))}
            </View>
          ) : history.length === 0 ? (
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginVertical: 16 }]}>
              No sync history available
            </Text>
          ) : (
            history.map((log) => (
              <View key={log.id} style={styles.historyRow}>
                <View>
                  <Text style={[typography.body, { color: colors.text.primary }]}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {log.records_count} records synced {log.failed_count > 0 ? `(${log.failed_count} failed)` : ''}
                  </Text>
                </View>
                <View style={[styles.historyBadge, { backgroundColor: log.status === 'success' ? '#EAF8ED' : '#FDF2E9' }]}>
                  <Text style={[typography.caption, { color: log.status === 'success' ? '#2E9F3F' : '#E67E22', fontWeight: 'bold' }]}>
                    {log.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* CARD 5: Danger Zone */}
        <View style={[styles.card, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}>
          <Text style={[typography.h4, { color: '#DC2626', marginBottom: 12 }]}>Storage Management</Text>
          <Text style={[typography.body, { color: colors.text.secondary, marginBottom: 16 }]}>
            Free up local space by purging records that have been successfully synced to AWS.
          </Text>
          <SecondaryButton 
            title="Purge Synced Records" 
            onPress={handlePurge}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    marginBottom: 16,
    color: '#1B3A6B',
  },
  connHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  connInfo: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  syncingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  autoSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
});
