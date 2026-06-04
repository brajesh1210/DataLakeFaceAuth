import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@navigation/navigationTypes';
import {Card} from '@components/ui/Card';
import {StatsRow} from '@components/ui/StatsRow';
import {databaseService} from '@services/DatabaseService';
import {useAppStore} from '@store/useAppStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNetworkStatus} from '@hooks/useNetworkStatus';
import {SyncService} from '@services/SyncService';
import {SkeletonStatsRow, SkeletonCard} from '@components/ui/SkeletonCard';

export function CoreTab() {
  const {colors, typography} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {currentUser, logout} = useAppStore();
  const networkStatus = useNetworkStatus();

  const [presentCount, setPresentCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  
  const [adminStatus, setAdminStatus] = useState<'check-in' | 'check-out' | 'completed'>('check-in');
  const [adminRecord, setAdminRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const present = await databaseService.getTodayAttendanceCount();
      const pending = await databaseService.getPendingLeavesCount();
      setPresentCount(present);
      setPendingLeaves(pending);

      const pendingSyncCount = await SyncService.getPendingCount();
      setPendingSync(pendingSyncCount);

      const history = await databaseService.getSyncHistory(1);
      if (history.length > 0) {
        setLastSyncTime(history[0].timestamp);
      }

      if (currentUser?.id) {
        const action = await databaseService.getNextAction(currentUser.id);
        const record = await databaseService.getTodayAttendance(currentUser.id);
        setAdminStatus(action);
        setAdminRecord(record);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => {
      setIsRefreshing(false);
      Alert.alert('Success', 'Data refreshed successfully');
    }, 500);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to end the current session?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const formatTimeAgo = (ts: number | null) => {
    if (!ts) return 'Never';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const formatTime = (timestamp: number | undefined): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background.page}]}>
      <View style={styles.statsContainer}>
        {isLoading ? (
          <SkeletonStatsRow />
        ) : (
          <StatsRow
            stats={[
              {value: presentCount.toString(), label: 'Present', valueColor: '#2E9F3F'},
              {value: pendingLeaves.toString(), label: 'Pending', valueColor: '#E67E22'},
            ]}
          />
        )}
      </View>

      <Text style={[typography.h2, styles.sectionTitle, {color: colors.primary.navy}]}>
        Operations
      </Text>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <Card style={styles.operationsCard}>
        {adminStatus === 'check-in' && (
          <TouchableOpacity
            style={[styles.operationItem, {borderBottomColor: colors.border.default}]}
            onPress={() => navigation.navigate('Authenticate', { mode: 'check-in' } as never)}>
            <View style={styles.operationText}>
              <Text style={[typography.h3, {color: colors.text.primary}]}>Admin Check In</Text>
              <Text style={[typography.caption, {color: colors.text.secondary}]}>Start your shift with face verification</Text>
            </View>
            <Icon name="login" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}

        {adminStatus === 'check-out' && (
          <TouchableOpacity
            style={[styles.operationItem, {borderBottomColor: colors.border.default}]}
            onPress={() => navigation.navigate('Authenticate', { mode: 'check-out', recordId: adminRecord?.id } as never)}>
            <View style={styles.operationText}>
              <Text style={[typography.h3, {color: colors.text.primary}]}>Admin Check Out</Text>
              <Text style={[typography.caption, {color: colors.text.secondary}]}>Checked in at {formatTime(adminRecord?.checkInTime)}</Text>
            </View>
            <Icon name="logout" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}

        {adminStatus === 'completed' && (
          <TouchableOpacity
            style={[styles.operationItem, {borderBottomColor: colors.border.default, opacity: 0.7}]}
            onPress={() => Alert.alert('Done', 'Your attendance for today is complete')}>
            <View style={styles.operationText}>
              <Text style={[typography.h3, {color: colors.text.primary}]}>Attendance Complete</Text>
              <Text style={[typography.caption, {color: colors.text.secondary}]}>In: {formatTime(adminRecord?.checkInTime)} | Out: {formatTime(adminRecord?.checkOutTime)}</Text>
            </View>
            <Icon name="check-circle" size={24} color="#2E9F3F" />
          </TouchableOpacity>
        )}

        {/* Force Refresh */}
        <TouchableOpacity
          style={[styles.operationItem, {borderBottomColor: colors.border.default}]}
          onPress={handleRefresh}>
          <View style={styles.operationText}>
            <Text style={[typography.h3, {color: colors.text.primary}]}>Force Refresh</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>Pull latest DB data</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.operationItem, {borderBottomWidth: 0}]}
          onPress={handleLogout}>
          <View style={styles.operationText}>
            <Text style={[typography.h3, {color: '#D32F2F'}]}>Logout Admin</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>End current session</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </Card>
      )}

      {/* Sync Info Card */}
      <Card style={{ ...styles.syncCard, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1 }}>
        <View style={styles.syncHeader}>
          <Icon name="cloud-sync" size={20} color={networkStatus.isOnline ? '#2E9F3F' : '#94A3B8'} />
          <Text style={[typography.h3, { color: '#1E293B', marginLeft: 8 }]}>AWS Sync Status</Text>
        </View>
        <Text style={[typography.body, { color: '#475569', marginTop: 8 }]}>
          Last AWS sync: {formatTimeAgo(lastSyncTime)}
        </Text>
        <Text style={[typography.body, { color: '#475569', marginTop: 4 }]}>
          Pending: {pendingSync} records
        </Text>
        <TouchableOpacity 
          style={styles.syncDetailsLink} 
          onPress={() => navigation.navigate('SyncDetails' as never)}
        >
          <Text style={[typography.body, { color: '#2563EB', fontWeight: 'bold' }]}>View Sync Details →</Text>
        </TouchableOpacity>
      </Card>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  operationsCard: {
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  operationText: {
    flex: 1,
  },
  syncCard: {
    borderRadius: 12,
    padding: 16,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncDetailsLink: {
    marginTop: 12,
  },
});
