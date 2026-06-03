import React, {useState, useMemo} from 'react';
import {StyleSheet, View, Text, ScrollView, StatusBar} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@theme/ThemeContext';
import {GradientBackground} from '@components/ui/GradientBackground';
import {Card} from '@components/ui/Card';
import {TogglePill} from '@components/ui/TogglePill';
import {SectionHeader} from '@components/ui/SectionHeader';
import {StatsCard} from '@components/ui/StatsCard';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {StatusBadge} from '@components/ui/StatusBadge';
import {useAppStore} from '@store/useAppStore';
import type {TabScreenProps} from '@navigation/navigationTypes';

export const AttendanceDashboard = ({
  navigation,
}: TabScreenProps<'Attendance'>) => {
  const {colors, typography, spacing, radius} = useTheme();
  const {attendanceRecords, currentUser} = useAppStore();
  const [viewMode, setViewMode] = useState('Me');

  // Today's date formatted
  const today = new Date();
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const todayLabel = `${today.getDate()} ${months[today.getMonth()]}`;

  // Calculate stats from records (last 7 days)
  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;
    const recentRecords = attendanceRecords.filter(
      r => r.timestamp >= sevenDaysAgo,
    );

    const checkIns = recentRecords.filter(r => r.type === 'check-in');
    const uniqueDays = new Set(
      checkIns.map(r => new Date(r.timestamp).toDateString()),
    ).size;

    const avgHours = checkIns.length > 0 ? '8h 30m' : '0h';
    const attendancePct =
      uniqueDays > 0 ? `${Math.round((uniqueDays / 7) * 100)}%` : '0%';

    return {
      presentDays: uniqueDays.toString(),
      absentDays: Math.max(0, 7 - uniqueDays).toString(),
      avgHours,
      attendancePct,
    };
  }, [attendanceRecords]);

  // Today's check-in info
  const todayCheckIn = useMemo(() => {
    const todayStr = new Date().toDateString();
    return attendanceRecords.find(
      r =>
        r.type === 'check-in' &&
        new Date(r.timestamp).toDateString() === todayStr,
    );
  }, [attendanceRecords]);

  // Recent attendance records for the list (last 7 entries)
  const recentList = useMemo(() => {
    return attendanceRecords.filter(r => r.type === 'check-in').slice(0, 7);
  }, [attendanceRecords]);

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDateShort = (ts: number): string => {
    const d = new Date(ts);
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  // Find matching check-out for a check-in
  const findCheckOut = (checkIn: (typeof attendanceRecords)[0]) => {
    const checkInDate = new Date(checkIn.timestamp).toDateString();
    return attendanceRecords.find(
      r =>
        r.type === 'check-out' &&
        r.userId === checkIn.userId &&
        new Date(r.timestamp).toDateString() === checkInDate,
    );
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Motivational */}
        <View style={styles.motivational}>
          <Text style={[typography.h2, {color: colors.primary.navy}]}>
            Smarter Check-Ins.
          </Text>
          <Text
            style={[
              typography.h1,
              {color: colors.primary.navy, fontWeight: '700'},
            ]}>
            Stronger Oversight.
          </Text>
        </View>

        {/* Card 1: Today's Attendance */}
        <Card padding={16}>
          <TogglePill
            options={['Me', 'My Team']}
            selected={viewMode}
            onChange={setViewMode}
          />

          <SectionHeader
            title="My Today's Attendance"
            rightAction={{
              label: todayLabel,
              onPress: () => {},
              icon: 'calendar',
            }}
            style={{marginTop: spacing.lg}}
          />

          <View style={[styles.datePillRow, {marginBottom: spacing.md}]}>
            <View
              style={[
                styles.datePill,
                {backgroundColor: '#D6E3F1', borderRadius: radius.md},
              ]}>
              <Icon
                name="calendar-today"
                size={14}
                color={colors.primary.navy}
                style={{marginRight: 4}}
              />
              <Text
                style={[
                  typography.bodySmall,
                  {color: colors.primary.navy, fontWeight: '600'},
                ]}>
                {todayLabel}
              </Text>
            </View>
          </View>

          {todayCheckIn ? (
            <View style={{marginBottom: spacing.md}}>
              <Text style={[typography.body, {color: colors.text.secondary}]}>
                {currentUser?.projectSite ?? 'NH-48 Delhi-Jaipur'} • Checked in
                at {formatTime(todayCheckIn.timestamp)}
              </Text>
              <StatusBadge
                variant="success"
                label="Present"
                icon="check-circle"
                style={{marginTop: 8}}
              />
            </View>
          ) : (
            <Text
              style={[
                typography.body,
                {color: colors.text.secondary, marginBottom: spacing.md},
              ]}>
              You haven't marked attendance today.
            </Text>
          )}

          <PrimaryButton
            title="Mark your attendance"
            icon="face-recognition"
            onPress={() => navigation.navigate('Authenticate')}
          />
        </Card>

        {/* Card 2: Overview Stats */}
        <Card padding={16} style={{marginTop: spacing.lg}}>
          <SectionHeader
            title="My Overview"
            rightAction={{
              label: 'Last 7 Days',
              onPress: () => {},
              icon: 'chevron-down',
            }}
          />
          <StatsCard
            columns={2}
            stats={[
              {value: stats.presentDays, label: 'Total Present Days'},
              {
                value: stats.absentDays,
                label: 'Total Absents',
                color:
                  stats.absentDays === '0'
                    ? colors.accent.green
                    : colors.accent.red,
              },
              {value: stats.avgHours, label: 'Avg. working hours'},
              {
                value: stats.attendancePct,
                label: 'Attendance %age',
                color: colors.accent.green,
              },
            ]}
          />
        </Card>

        {/* Card 3: Attendance Report */}
        <Card padding={0} style={{marginTop: spacing.lg}}>
          <SectionHeader
            title="My Attendance Report"
            style={{paddingHorizontal: 16}}
          />

          {recentList.map(record => {
            const checkOut = findCheckOut(record);
            return (
              <View
                key={record.id}
                style={[
                  styles.reportRow,
                  {borderBottomColor: colors.border.default},
                ]}>
                <View
                  style={[
                    styles.datePillSmall,
                    {backgroundColor: '#D6E3F1', borderRadius: radius.sm},
                  ]}>
                  <Text
                    style={[
                      typography.caption,
                      {color: colors.primary.navy, fontWeight: '700'},
                    ]}>
                    {formatDateShort(record.timestamp)}
                  </Text>
                </View>
                <View style={styles.reportInfo}>
                  <Text
                    style={[
                      typography.bodySmall,
                      {color: colors.primary.navy, fontWeight: '600'},
                    ]}>
                    In: {formatTime(record.timestamp)}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {color: colors.text.secondary},
                    ]}>
                    {checkOut
                      ? `Out: ${formatTime(checkOut.timestamp)}`
                      : 'No checkout'}
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={colors.text.tertiary}
                />
              </View>
            );
          })}

          <View style={{height: spacing.md}} />
        </Card>

        <View style={{height: 20}} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  motivational: {
    marginBottom: 20,
    marginTop: 8,
  },
  datePillRow: {
    flexDirection: 'row',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  datePillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 56,
    alignItems: 'center',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  reportInfo: {
    flex: 1,
  },
});
