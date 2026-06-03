import React, {useState, useMemo, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@theme/ThemeContext';
import {GradientBackground} from '@components/ui/GradientBackground';
import {Card} from '@components/ui/Card';
import {AppHeader} from '@components/ui/AppHeader';
import {StatusBadge} from '@components/ui/StatusBadge';
import {useAppStore} from '@store/useAppStore';
import type {AttendanceRecord} from '../types/types';
import type {TabScreenProps} from '@navigation/navigationTypes';

// ─── Filter Chips ───────────────────────────────────────────────

type FilterKey = 'today' | 'yesterday' | 'week' | 'month' | 'all';

const FILTERS: {key: FilterKey; label: string}[] = [
  {key: 'today', label: 'Today'},
  {key: 'yesterday', label: 'Yesterday'},
  {key: 'week', label: 'This Week'},
  {key: 'month', label: 'This Month'},
  {key: 'all', label: 'All'},
];

function filterRecords(
  records: AttendanceRecord[],
  filter: FilterKey,
): AttendanceRecord[] {
  const now = new Date();
  const todayStr = now.toDateString();

  switch (filter) {
    case 'today':
      return records.filter(
        r => new Date(r.timestamp).toDateString() === todayStr,
      );
    case 'yesterday': {
      const yesterday = new Date(now.getTime() - 86400000);
      const yStr = yesterday.toDateString();
      return records.filter(r => new Date(r.timestamp).toDateString() === yStr);
    }
    case 'week':
      return records.filter(r => r.timestamp >= now.getTime() - 7 * 86400000);
    case 'month':
      return records.filter(r => r.timestamp >= now.getTime() - 30 * 86400000);
    case 'all':
    default:
      return records;
  }
}

// ─── Component ──────────────────────────────────────────────────

export const AttendanceLogScreen = ({navigation}: TabScreenProps<'Log'>) => {
  const {colors, typography, spacing, radius} = useTheme();
  const {attendanceRecords, addAttendanceRecord} = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(
    () => filterRecords(attendanceRecords, activeFilter),
    [attendanceRecords, activeFilter],
  );

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const formatDateShort = (ts: number): string => {
    const d = new Date(ts);
    return `${d.getDate()}/${months[d.getMonth()]}`;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Add a mock record
    const names = ['Rahul Kumar', 'Priya Sharma', 'Amit Singh', 'Neha Gupta'];
    const name = names[Math.floor(Math.random() * names.length)];
    addAttendanceRecord({
      userId: `u-refresh-${Date.now()}`,
      userName: name,
      employeeId: `EMP${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: Date.now(),
      type: 'check-in',
      method: 'face',
      confidence: 90 + Math.floor(Math.random() * 10),
      gpsLat: 28.6139 + (Math.random() - 0.5) * 0.01,
      gpsLng: 77.209 + (Math.random() - 0.5) * 0.01,
      synced: false,
      livenessScore: 0.85 + Math.random() * 0.14,
    });
    setTimeout(() => setRefreshing(false), 600);
  }, [addAttendanceRecord]);

  const renderItem = useCallback(
    ({item}: {item: AttendanceRecord}) => (
      <Card padding={12} style={{marginBottom: 8, marginHorizontal: 16}}>
        <View style={styles.recordRow}>
          <View
            style={[
              styles.datePill,
              {backgroundColor: '#D6E3F1', borderRadius: radius.md},
            ]}>
            <Text
              style={[
                typography.caption,
                {color: colors.primary.navy, fontWeight: '700', fontSize: 11},
              ]}>
              {formatDateShort(item.timestamp)}
            </Text>
          </View>
          <View style={styles.recordInfo}>
            <Text
              style={[
                typography.body,
                {color: colors.primary.navy, fontWeight: '600'},
              ]}
              numberOfLines={1}>
              {item.userName}
            </Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>
              {item.employeeId} • {item.type === 'check-in' ? 'In' : 'Out'}{' '}
              {formatTime(item.timestamp)}
            </Text>
          </View>
          <View style={styles.recordRight}>
            <StatusBadge
              variant={item.synced ? 'success' : 'warning'}
              label={item.synced ? 'Synced' : 'Pending'}
              icon={item.synced ? 'check-circle' : 'clock-outline'}
            />
            <Icon
              name="chevron-right"
              size={20}
              color={colors.text.tertiary}
              style={{marginLeft: 6}}
            />
          </View>
        </View>
      </Card>
    ),
    [colors, typography, radius],
  );

  const keyExtractor = useCallback((item: AttendanceRecord) => item.id, []);

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={{fontSize: 48, marginBottom: 12}}>📋</Text>
      <Text
        style={[typography.h3, {color: colors.primary.navy, marginBottom: 8}]}>
        No records found
      </Text>
      <Text
        style={[
          typography.body,
          {color: colors.text.secondary, textAlign: 'center'},
        ]}>
        No attendance records match the selected filter. Try a different time
        range.
      </Text>
    </View>
  );

  return (
    <GradientBackground>
      <AppHeader title="Attendance Log" />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{flexGrow: 0}}>
        {FILTERS.map(f => {
          const isActive = f.key === activeFilter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? colors.primary.navy
                    : colors.background.card,
                  borderColor: colors.primary.navy,
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Records List */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.navy]}
          />
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 40,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
    minWidth: 52,
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
    marginRight: 8,
  },
  recordRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
});
