import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, TextInput, ScrollView, Alert, Modal, TouchableOpacity} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import {NavyAppHeader} from '@components/ui/NavyAppHeader';
import {Card} from '@components/ui/Card';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {StatusBadge} from '@components/ui/StatusBadge';
import {Dropdown} from '@components/ui/Dropdown';
import {CalendarGrid} from '@components/ui/CalendarGrid';
import {databaseService} from '@services/DatabaseService';
import {useAppStore} from '@store/useAppStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LEAVE_TYPES = [
  {label: 'Casual', value: 'Casual'},
  {label: 'Sick', value: 'Sick'},
  {label: 'Annual', value: 'Annual'},
  {label: 'Maternity', value: 'Maternity'},
];

export function ApplyLeaveScreen() {
  const {colors, typography} = useTheme();
  const navigation = useNavigation();
  const currentUser = useAppStore(state => state.currentUser);

  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGridDate, setSelectedGridDate] = useState('');
  
  const [leaveType, setLeaveType] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [currentUser?.id]);

  const fetchHistory = async () => {
    if (currentUser?.id) {
      const leaves = await databaseService.getLeaveApplications(currentUser.id);
      setHistory(leaves);
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedGridDate(dateStr);
  };

  const confirmDate = () => {
    if (selectedGridDate) {
      const parts = selectedGridDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      setDate(d);
    }
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!date) {
      Alert.alert('Validation Error', 'Please select a date.');
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      Alert.alert('Invalid Date', 'Cannot apply leave for past dates');
      return;
    }

    if (!leaveType) {
      Alert.alert('Validation Error', 'Please select a leave type.');
      return;
    }
    if (!currentUser) return;

    try {
      await databaseService.createLeaveApplication({
        id: 'leave_' + Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
        leaveType,
        date: date.getTime(),
        reason: reason.trim(),
        status: 'Pending',
        appliedAt: Date.now(),
      });

      Alert.alert('Success', 'Leave application submitted for verification.');
      setDate(null);
      setLeaveType(null);
      setReason('');
      fetchHistory();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit leave.');
    }
  };

  const renderHistoryItem = (item: any) => {
    const applyDate = new Date(item.date).toLocaleDateString('en-US', {day: 'numeric', month: 'long', year: 'numeric'});
    let variant: 'success' | 'warning' | 'danger' = 'warning';
    if (item.status === 'Approved') variant = 'success';
    else if (item.status === 'Rejected') variant = 'danger';

    return (
      <Card key={item.id} style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={[typography.h3, {color: colors.text.primary}]}>{item.leaveType} Leave</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>{applyDate}</Text>
          </View>
          <StatusBadge variant={variant} label={item.status} />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      <NavyAppHeader title="Apply for Leave" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          <Text style={[typography.h2, styles.cardTitle, {color: colors.text.primary}]}>
            New Leave Application
          </Text>

          <Text style={[typography.label, styles.label, {color: colors.text.secondary}]}>Select Date</Text>
          <TouchableOpacity
            style={[styles.inputBox, {borderColor: colors.border.default, backgroundColor: colors.background.page}]}
            onPress={() => setShowDatePicker(true)}>
            <Text style={[typography.body, {color: date ? colors.text.primary : colors.text.tertiary}]}>
              {date ? date.toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Tap to pick date from calendar'}
            </Text>
            <Icon name="calendar" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <Text style={[typography.label, styles.label, {color: colors.text.secondary, marginTop: 16}]}>Select Leave Type</Text>
          <Dropdown
            label="Leave Type"
            options={LEAVE_TYPES}
            value={leaveType}
            onChange={setLeaveType}
            placeholder="Tap to select Leave Type"
          />

          <Text style={[typography.label, styles.label, {color: colors.text.secondary, marginTop: 16}]}>Reason (Optional)</Text>
          <TextInput
            style={[styles.inputBox, styles.textArea, {borderColor: colors.border.default, backgroundColor: colors.background.page, color: colors.text.primary}]}
            placeholder="Type reason here..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />

          <PrimaryButton
            title="Submit for Verification"
            onPress={handleSubmit}
            style={{marginTop: 24, backgroundColor: colors.primary.navy}}
          />
        </Card>

        <Text style={[typography.h2, styles.sectionTitle, {color: colors.primary.navy}]}>
          My Application History
        </Text>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank" size={48} color={colors.text.tertiary} />
            <Text style={[typography.body, {color: colors.text.secondary, marginTop: 8}]}>No applications yet</Text>
          </View>
        ) : (
          history.map(renderHistoryItem)
        )}
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.background.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, {color: colors.text.primary}]}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <CalendarGrid
              month={new Date().getMonth()}
              year={new Date().getFullYear()}
              attendanceData={{}}
              selectedDate={selectedGridDate}
              onDateSelect={handleDateSelect}
              minDate={new Date()}
            />
            <PrimaryButton
              title="Confirm Date"
              onPress={confirmDate}
              style={{marginTop: 16}}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
  },
  cardTitle: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  historyCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
