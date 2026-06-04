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
  const [attendanceData, setAttendanceData] = useState<{[date: string]: 'complete' | 'pending' | 'absent' | 'leave'}>({});
  const [loading, setLoading] = useState(false);
  const [dayRecord, setDayRecord] = useState<any>(null);

  useEffect(() => {
    if (visible && user) {
      fetchMonthData();
    }
  }, [visible, user, currentDate]);

  useEffect(() => {
    if (visible && user && selectedDay) {
      fetchDayRecord();
    }
  }, [visible, user, selectedDay, currentDate]);

  const fetchDayRecord = async () => {
    if (!user) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const d = new Date(year, month, selectedDay);
    const ts = d.getTime();
    
    const record = await databaseService.getAttendanceForDate(user.id, ts);
    setDayRecord(record);
  };

  const fetchMonthData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const mergedData = await databaseService.getAttendanceByUserAndMonth(user.id, year, month);
      
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
    if (dayStatus === 'complete') {
      statusText = 'COMPLETE';
      statusColor = colors.accent.green;
    } else if (dayStatus === 'pending') {
      statusText = 'PENDING';
      statusColor = colors.accent.orange;
    } else if (dayStatus === 'leave') {
      statusText = 'ON LEAVE';
      statusColor = '#3B82F6';
    } else if (dayStatus === 'absent') {
      statusText = 'ABSENT';
      statusColor = colors.accent.red;
    }
  }

  // Weekends are naturally absent but we might not want to highlight them as absent if not required, 
  // but let's keep it simple.

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
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Complete</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.accent.orange}]} />
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Pending</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: colors.accent.red}]} />
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#3B82F6'}]} />
                <Text style={[typography.caption, {color: colors.text.secondary}]}>Leave</Text>
              </View>
            </View>

          </Card>

          <View style={[styles.infoCard, {backgroundColor: colors.background.card}]}>
            <Text style={[typography.h4, {color: colors.text.primary, marginBottom: 12}]}>
              Log Details for {selectedDay} {monthNames[currentDate.getMonth()]}
            </Text>
            
            {dayRecord ? (
              <>
                <Text style={[typography.body, {color: dayRecord.checkOutTime ? colors.accent.green : colors.accent.orange, fontWeight: '700', marginBottom: 12}]}>
                  Status: {dayRecord.checkOutTime ? 'COMPLETE' : 'PENDING'}
                </Text>
                <View style={styles.timeGrid}>
                  <View>
                    <Text style={styles.timeLabel}>Check In</Text>
                    <Text style={styles.timeValue}>{formatTime(dayRecord.checkInTime || dayRecord.timestamp)}</Text>
                  </View>
                  <View>
                    <Text style={styles.timeLabel}>Check Out</Text>
                    <Text style={styles.timeValue}>
                      {dayRecord.checkOutTime ? formatTime(dayRecord.checkOutTime) : '—'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.timeLabel}>Total Hours</Text>
                    <Text style={styles.timeValue}>
                      {dayRecord.checkOutTime 
                        ? calculateHours(dayRecord.checkInTime || dayRecord.timestamp, dayRecord.checkOutTime)
                        : 'In progress'
                      }
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={[typography.body, {color: statusColor, fontWeight: '700'}]}>
                Status: {statusText}
              </Text>
            )}
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
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
});
