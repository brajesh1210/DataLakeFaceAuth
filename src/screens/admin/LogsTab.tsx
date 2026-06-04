import React, {useState, useMemo, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@theme/ThemeContext';
import {Card} from '@components/ui/Card';
import {StatusBadge} from '@components/ui/StatusBadge';
import {useAppStore} from '@store/useAppStore';
import {SkeletonListItem} from '@components/ui/SkeletonCard';
import type {AttendanceRecord} from '../../types/types';

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

export function LogsTab() {
  const {colors, typography, spacing, radius} = useTheme();
  const {attendanceRecords} = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = useMemo(
    () => filterRecords(attendanceRecords, activeFilter),
    [attendanceRecords, activeFilter],
  );

  const calculateHours = (checkIn: number, checkOut: number): string => {
    const diffMs = checkOut - checkIn;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDateShort = (ts: number): string => {
    const d = new Date(ts);
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderFilterChips = () => (
    <View style={styles.filterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? colors.primary.navy
                    : colors.background.card,
                  borderColor: isActive
                    ? colors.primary.navy
                    : colors.border.default,
                  borderRadius: radius.pill,
                },
              ]}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: isActive ? '#fff' : colors.text.secondary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderItem = ({item}: {item: AttendanceRecord}) => {
    const d = new Date(item.timestamp);
    const isToday = d.toDateString() === new Date().toDateString();

    return (
      <Card style={styles.recordCard}>
        <View style={styles.recordLeft}>
          <View style={[styles.datePill, {backgroundColor: colors.primary.navy}]}>
            <Text style={[typography.caption, {color: '#FFFFFF', fontWeight: '700'}]}>
              {d.getDate()}
            </Text>
            <Text style={[typography.caption, {color: 'rgba(255,255,255,0.7)', fontSize: 10}]}>
              {months[d.getMonth()]}
            </Text>
          </View>
          <View style={styles.recordInfo}>
            <Text style={[typography.body, {color: colors.text.primary, fontWeight: '600', marginBottom: 6}]}>
              {item.userName}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <View>
                <Text style={styles.timeLabel}>Check In</Text>
                <Text style={[styles.timeValue, {color: colors.accent.green}]}>{formatTime(item.checkInTime || item.timestamp)}</Text>
              </View>
              <Icon name="arrow-right" size={20} color={colors.text.tertiary} />
              <View>
                <Text style={styles.timeLabel}>Check Out</Text>
                {item.checkOutTime ? (
                  <Text style={[styles.timeValue, {color: colors.accent.red}]}>
                    {formatTime(item.checkOutTime)}
                  </Text>
                ) : (
                  <Text style={[styles.timeValue, {color: colors.accent.orange}]}>
                    Pending
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.timeLabel}>Hours</Text>
                <Text style={styles.timeValue}>
                  {item.checkOutTime 
                    ? calculateHours(item.checkInTime || item.timestamp, item.checkOutTime)
                    : '—'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.recordRight}>
          <StatusBadge
            variant={item.synced ? 'success' : 'warning'}
            label={item.synced ? 'Synced' : 'Pending'}
          />
        </View>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="clipboard-text-outline" size={64} color={colors.border.default} />
      <Text style={[typography.h3, {color: colors.text.secondary, marginTop: 16}]}>
        No records found
      </Text>
      <Text style={[typography.body, {color: colors.text.tertiary, textAlign: 'center', marginTop: 8}]}>
        Try changing the filter or pull to refresh.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      {renderFilterChips()}
      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonListItem key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.navy} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterWrapper: {
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    flexGrow: 1,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePill: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  recordRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
});
