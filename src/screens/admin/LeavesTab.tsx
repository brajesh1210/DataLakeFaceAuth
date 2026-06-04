import React, {useState, useEffect, useCallback} from 'react';
import {StyleSheet, View, Text, FlatList, Pressable, RefreshControl, ScrollView, Alert} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {Card} from '@components/ui/Card';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {SecondaryButton} from '@components/ui/SecondaryButton';
import {StatusBadge} from '@components/ui/StatusBadge';
import {databaseService} from '@services/DatabaseService';
import {useAppStore} from '@store/useAppStore';
import {SkeletonCard} from '@components/ui/SkeletonCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type LeaveFilter = 'Pending' | 'Approved' | 'Rejected' | 'All';
const FILTERS: LeaveFilter[] = ['Pending', 'Approved', 'Rejected', 'All'];

export function LeavesTab() {
  const {colors, typography, radius} = useTheme();
  const currentUser = useAppStore(state => state.currentUser);
  
  const [activeFilter, setActiveFilter] = useState<LeaveFilter>('Pending');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const allLeaves = await databaseService.getLeaveApplications();
      setLeaves(allLeaves);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaves();
    setRefreshing(false);
  }, []);

  const handleAction = (id: string, status: string) => {
    Alert.alert(
      `Confirm ${status}`,
      `Are you sure you want to mark this leave as ${status}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await databaseService.updateLeaveStatus(id, status, currentUser?.id || 'admin');
              await fetchLeaves();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const filteredLeaves = leaves.filter(l => activeFilter === 'All' ? true : l.status === activeFilter);

  const renderFilterChips = () => (
    <View style={styles.filterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary.navy : colors.background.card,
                  borderColor: isActive ? colors.primary.navy : colors.border.default,
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
                {f}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderItem = ({item}: {item: any}) => {
    const applyDate = new Date(item.appliedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
    const leaveDate = new Date(item.date).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[typography.h3, {color: colors.text.primary}]}>{item.userName}</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>ID: {item.userId}</Text>
          </View>
          <View style={[styles.typeBadge, {backgroundColor: colors.background.page}]}>
            <Text style={[typography.caption, {color: colors.primary.navy, fontWeight: '600'}]}>
              {item.leaveType} Leave
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Icon name="calendar" size={16} color={colors.text.tertiary} />
            <Text style={[typography.body, {color: colors.text.primary, marginLeft: 6}]}>{leaveDate}</Text>
          </View>
        </View>

        {item.reason ? (
          <Text style={[typography.body, {color: colors.text.secondary, marginVertical: 8, fontStyle: 'italic'}]}>
            "{item.reason}"
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={[typography.caption, {color: colors.text.tertiary}]}>Applied: {applyDate}</Text>
          
          {item.status === 'Pending' ? (
            <View style={styles.actionButtons}>
              <PrimaryButton
                title="Approve"
                onPress={() => handleAction(item.id, 'Approved')}
                style={{minWidth: 80, paddingVertical: 6, backgroundColor: '#2E9F3F'}}
              />
              <View style={{width: 8}} />
              <PrimaryButton
                title="Reject"
                onPress={() => handleAction(item.id, 'Rejected')}
                style={{minWidth: 80, paddingVertical: 6, backgroundColor: '#D32F2F'}}
              />
            </View>
          ) : (
            <StatusBadge
              variant={item.status === 'Approved' ? 'success' : 'danger'}
              label={item.status}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      {renderFilterChips()}
      
      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredLeaves}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar-remove" size={64} color={colors.border.default} />
              <Text style={[typography.h3, {color: colors.text.secondary, marginTop: 16}]}>
                No leave applications
              </Text>
            </View>
          }
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
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsRow: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
});
