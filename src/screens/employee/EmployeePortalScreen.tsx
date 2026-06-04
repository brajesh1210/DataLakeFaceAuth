import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@navigation/navigationTypes';
import {NavyAppHeader} from '@components/ui/NavyAppHeader';
import {StatsRow} from '@components/ui/StatsRow';
import {Card} from '@components/ui/Card';
import {useAppStore} from '@store/useAppStore';
import {databaseService} from '@services/DatabaseService';
import {SyncService} from '@services/SyncService';
import {SyncStatusBadge} from '@components/ui/SyncStatusBadge';
import {SkeletonStatsRow, SkeletonCard} from '@components/ui/SkeletonCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export function EmployeePortalScreen() {
  const {colors, typography, spacing, radius} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {currentUser, logout} = useAppStore();

  const [stats, setStats] = useState({present: 0, absent: 0, rate: 0});
  const [todayStatus, setTodayStatus] = useState<'check-in' | 'check-out' | 'completed'>('check-in');
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      if (currentUser?.id) {
        const data = await databaseService.getUserAttendanceStats(currentUser.id);
        setStats(data);
        
        const action = await databaseService.getNextAction(currentUser.id);
        const record = await databaseService.getTodayAttendance(currentUser.id);
        setTodayStatus(action);
        setTodayRecord(record);
        
        const history = await databaseService.getSyncHistory(1);
        if (history.length > 0) {
          setLastSyncTime(history[0].timestamp);
        }
      }
      setIsLoading(false);
    };
    
    fetchStats();
    const unsubscribe = navigation.addListener('focus', fetchStats);
    return unsubscribe;
  }, [currentUser?.id, navigation]);

  const handleLogout = () => {
    Alert.alert('Secure Logout', 'Are you sure you want to securely log out?', [
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

  const formatTime = (timestamp: number | undefined): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const timeAgo = (ts: number | null) => {
    if (!ts) return 'Never';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const firstName = currentUser?.name?.split(' ')[0] || 'User';

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      <NavyAppHeader 
        title={`Portal: ${firstName}`} 
        showBack={false}
        showSyncBadge={false}
        showBell={true}
      />
      
      <View style={styles.syncBar}>
        <SyncStatusBadge onPress={() => navigation.navigate('SyncDetails' as never)} />
        <Text style={styles.syncBarText}>
          Last sync: {timeAgo(lastSyncTime)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <SkeletonStatsRow />
        ) : (
          <StatsRow
            stats={[
              {value: stats.present.toString(), label: 'Present', valueColor: colors.accent.green},
              {value: stats.absent.toString(), label: 'Absent', valueColor: colors.accent.red},
              {value: `${stats.rate}%`, label: 'Rate', valueColor: colors.primary.navy},
            ]}
          />
        )}

        <Text style={[typography.h2, styles.sectionTitle, {color: colors.primary.navy}]}>
          Operational Controls
        </Text>

        {isLoading ? (
          <SkeletonCard />
        ) : (
          <Card style={styles.controlsCard}>
          {todayStatus === 'check-in' && (
            <TouchableOpacity
              style={[styles.controlItem, {borderBottomColor: colors.border.default}]}
              onPress={() => navigation.navigate('Authenticate', { mode: 'check-in' } as never)}>
              <View style={styles.controlText}>
                <Text style={[typography.h3, {color: colors.text.primary}]}>Check In</Text>
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Start your shift with face verification</Text>
              </View>
              <Icon name="login" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          {todayStatus === 'check-out' && (
            <TouchableOpacity
              style={[styles.controlItem, {borderBottomColor: colors.border.default}]}
              onPress={() => navigation.navigate('Authenticate', { mode: 'check-out', recordId: todayRecord?.id } as never)}>
              <View style={styles.controlText}>
                <Text style={[typography.h3, {color: colors.text.primary}]}>Check Out</Text>
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Checked in at {formatTime(todayRecord?.checkInTime)} • Verify face to checkout</Text>
              </View>
              <Icon name="logout" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          {todayStatus === 'completed' && (
            <TouchableOpacity
              style={[styles.controlItem, {borderBottomColor: colors.border.default, opacity: 0.7}]}
              onPress={() => Alert.alert('Done', 'Your attendance for today is complete')}>
              <View style={styles.controlText}>
                <Text style={[typography.h3, {color: colors.text.primary}]}>Attendance Complete</Text>
                <Text style={[typography.caption, {color: colors.text.secondary}]}>In: {formatTime(todayRecord?.checkInTime)} | Out: {formatTime(todayRecord?.checkOutTime)}</Text>
              </View>
              <Icon name="check-circle" size={24} color="#2E9F3F" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlItem, {borderBottomColor: colors.border.default}]}
            onPress={() => navigation.navigate('MyProfile')}>
            <View style={styles.controlText}>
              <Text style={[typography.h3, {color: colors.text.primary}]}>My Profile</Text>
              <Text style={[typography.caption, {color: colors.text.secondary}]}>View complete employee details</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlItem, {borderBottomWidth: 0}]}
            onPress={() => navigation.navigate('ApplyLeave')}>
            <View style={styles.controlText}>
              <Text style={[typography.h3, {color: colors.text.primary}]}>Apply for Leave</Text>
              <Text style={[typography.caption, {color: colors.text.secondary}]}>Submit leave and check status</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </Card>
        )}

        <Text style={[typography.h2, styles.sectionTitle, {color: colors.primary.navy, marginTop: 8}]}>
          Quick Actions
        </Text>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: colors.background.card, borderColor: colors.primary.navy}]}
            onPress={() => Alert.alert('Help Support', 'Contact: 1800-XXX-XXXX')}>
            <Text style={[typography.caption, {color: colors.primary.navy, fontWeight: '600', textAlign: 'center'}]}>Help Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: colors.background.card, borderColor: colors.primary.navy}]}
            onPress={() => Alert.alert('Call Admin', 'Calling +91-XXXXX-XXXXX')}>
            <Text style={[typography.caption, {color: colors.primary.navy, fontWeight: '600', textAlign: 'center'}]}>Call Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: '#FEE2E2', borderColor: colors.accent.red}]}
            onPress={handleLogout}>
            <Text style={[typography.caption, {color: colors.accent.red, fontWeight: '600', textAlign: 'center'}]}>Secure Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  syncBarText: {
    fontSize: 12,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    marginLeft: 4,
  },
  controlsCard: {
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  controlText: {
    flex: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
