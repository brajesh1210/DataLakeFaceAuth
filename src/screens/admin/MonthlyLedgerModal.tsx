import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Modal, TouchableOpacity, SafeAreaView, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@theme/ThemeContext';
import {CalendarGrid} from '@components/ui/CalendarGrid';
import {Card} from '@components/ui/Card';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {databaseService} from '@services/DatabaseService';
import type {User} from '../../types/types';

interface Props {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

export function MonthlyLedgerModal({visible, user, onClose}: Props) {
  const {colors, typography} = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [attendanceData, setAttendanceData] = useState<{[date: string]: 'present' | 'absent' | 'leave'}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      fetchMonthData();
    }
  }, [visible, user, currentDate]);

  const fetchMonthData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const data = await databaseService.getAttendanceByMonth(user.id, year, month);
      
      // Also fetch leaves
      const leaves = await databaseService.getLeaveApplications(user.id);
      const approvedLeaves = leaves.filter(l => l.status === 'Approved');

      // Merge leaves into attendance data as orange dots
      const mergedData: {[date: string]: 'present' | 'absent' | 'leave'} = {};
      data.forEach(d => {
        mergedData[d.date] = d.status as any;
      });

      approvedLeaves.forEach(leave => {
        const d = new Date(leave.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          // Add if not already present
          if (!mergedData[dateStr]) {
            mergedData[dateStr] = 'leave';
          }
        }
      });

      setAttendanceData(mergedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  if (!user) return null;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Check status for selected day
  const selectedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayStatus = attendanceData[selectedDateStr];
  
  let statusText = 'ABSENT';
  let statusColor = colors.accent.red;
  let timeText = '';

  if (dayStatus) {
    if (dayStatus === 'present') {
      statusText = 'PRESENT';
      statusColor = colors.accent.green;
      // We don't have checkInTime stored in the dict format anymore unless we change it.
      // For now, let's just skip the checkIn time display since it's an object map now.
    } else if (dayStatus === 'leave') {
      statusText = 'ON LEAVE';
      statusColor = colors.accent.orange;
    }
  }

  // Weekends are naturally absent but we might not want to highlight them as absent if not required, 
  // but let's keep it simple.

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalContainer}>
        <View style={[styles.content, {backgroundColor: colors.background.page}]}>
          
          <View style={styles.header}>
            <Text style={[typography.h2, {color: colors.primary.navy}]}>
              {user.name}'s Ledger
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Icon name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Card style={styles.card}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Icon name="chevron-left" size={28} color={colors.primary.navy} />
              </TouchableOpacity>
              <Text style={[typography.h3, {color: colors.text.primary}]}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Icon name="chevron-right" size={28} color={colors.primary.navy} />
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary.navy} style={{padding: 40}} />
            ) : (
              <CalendarGrid
                year={currentDate.getFullYear()}
                month={currentDate.getMonth()}
                attendanceData={attendanceData}
                selectedDate={selectedDateStr}
                onDateSelect={(dateStr) => {
                  const parts = dateStr.split('-');
                  setSelectedDay(parseInt(parts[2], 10));
                }}
              />
            )}
            
            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.accent.green}]} />
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.accent.red}]} />
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.accent.orange}]} />
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Leave</Text>
              </View>
            </View>

          </Card>

          <View style={[styles.infoCard, {backgroundColor: colors.background.card}]}>
            <Text style={[typography.h4, {color: colors.text.primary, marginBottom: 8}]}>
              Log Details for {selectedDay} {monthNames[currentDate.getMonth()]}
            </Text>
            <Text style={[typography.body, {color: statusColor, fontWeight: '700'}]}>
              Status: {statusText}
            </Text>
            {timeText ? (
              <Text style={[typography.body, {color: colors.text.secondary, marginTop: 4}]}>
                {timeText}
              </Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <PrimaryButton title="Close Analytics" onPress={onClose} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeIcon: {
    padding: 4,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
});
