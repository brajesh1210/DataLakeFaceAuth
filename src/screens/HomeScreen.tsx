import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/ThemeContext';
import { GradientBackground } from '@components/ui/GradientBackground';
import { Card } from '@components/ui/Card';
import { AppHeader } from '@components/ui/AppHeader';
import { SearchBar } from '@components/ui/SearchBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { ListItem } from '@components/ui/ListItem';
import { IconBadge } from '@components/ui/IconBadge';
import { StatusBadge } from '@components/ui/StatusBadge';
import { useAppStore } from '@store/useAppStore';
import type { TabScreenProps } from '@navigation/navigationTypes';

export const HomeScreen = ({ navigation }: TabScreenProps<'Home'>) => {
  const { colors, typography, spacing, radius } = useTheme();
  const { attendanceRecords } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Get the 3 most recent attendance records
  const recentRecords = useMemo(() => {
    return attendanceRecords.slice(0, 3);
  }, [attendanceRecords]);

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (ts: number): string => {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <GradientBackground>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Motivational Section */}
        <View style={styles.motivationalSection}>
          <Text style={[typography.h2, { color: colors.primary.navy }]}>
            Solve Issues Quickly,
          </Text>
          <Text style={[typography.h1, { color: colors.primary.navy, fontWeight: '700' }]}>
            Stay Productive.
          </Text>
        </View>

        {/* Main Operations Card */}
        <Card padding={0}>
          <AppHeader
            title="Field Operations"
            transparent
          />
          <View style={{ paddingHorizontal: 16 }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search operations..."
            />
          </View>

          <SectionHeader
            title="Quick Actions"
            style={{ paddingHorizontal: 16, marginTop: spacing.sm }}
          />

          <ListItem
            icon={<Icon name="face-recognition" size={24} color={colors.primary.navy} />}
            label="Mark Attendance"
            onPress={() => navigation.navigate('Authenticate')}
          />
          <ListItem
            icon={<Icon name="account-plus" size={24} color={colors.primary.navy} />}
            label="Register New Face"
            onPress={() => navigation.navigate('RegisterFace')}
            badge={2}
          />
          <ListItem
            icon={<Icon name="format-list-bulleted" size={24} color={colors.primary.navy} />}
            label="Attendance Log"
            onPress={() => navigation.getParent()?.navigate('Log')}
          />
          <ListItem
            icon={<Icon name="sync" size={24} color={colors.primary.navy} />}
            label="Sync Data"
            onPress={() => navigation.getParent()?.navigate('Sync')}
          />
          <ListItem
            icon={<Icon name="shield-check" size={24} color={colors.primary.navy} />}
            label="Liveness Test"
            onPress={() => navigation.navigate('Authenticate', { testMode: true })}
          />
          <ListItem
            icon={<Icon name="cog" size={24} color={colors.primary.navy} />}
            label="Settings"
            onPress={() => { /* Phase 6 */ }}
          />

          <View style={{ height: spacing.md }} />
        </Card>

        {/* Action Cards Row */}
        <View style={styles.actionCardsRow}>
          <View style={styles.actionCardWrapper}>
            <Card padding={16} style={styles.actionCard}>
              <IconBadge icon="help-circle" color={colors.accent.green} label="Ask us" onPress={() => {}} />
            </Card>
          </View>
          <View style={styles.actionCardWrapper}>
            <Card padding={16} style={styles.actionCard}>
              <IconBadge icon="email" color={colors.accent.orange} label="Mail us" onPress={() => {}} />
            </Card>
          </View>
        </View>

        {/* Recent Activity */}
        <SectionHeader
          title="Recent Activity"
          rightAction={{ label: 'View All', onPress: () => navigation.getParent()?.navigate('Log') }}
          style={{ marginTop: spacing.sm }}
        />

        {recentRecords.map((record) => (
          <Card key={record.id} padding={12} style={{ marginBottom: spacing.sm }}>
            <View style={styles.recordRow}>
              <View style={[styles.datePill, { backgroundColor: '#D6E3F1', borderRadius: radius.md }]}>
                <Text style={[typography.caption, { color: colors.primary.navy, fontWeight: '700', fontSize: 11 }]}>
                  {formatDate(record.timestamp)}
                </Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={[typography.body, { color: colors.primary.navy, fontWeight: '600' }]} numberOfLines={1}>
                  {record.userName}
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  {record.employeeId} • {record.type === 'check-in' ? 'In' : 'Out'} {formatTime(record.timestamp)}
                </Text>
              </View>
              <StatusBadge
                variant={record.synced ? 'success' : 'warning'}
                label={record.synced ? 'Synced' : 'Pending'}
                icon={record.synced ? 'check-circle' : 'clock-outline'}
              />
            </View>
          </Card>
        ))}

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
  motivationalSection: {
    marginBottom: 20,
    marginTop: 8,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionCardWrapper: {
    flex: 1,
  },
  actionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
    marginRight: 8,
  },
});
