import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavyAppHeader } from '@components/ui/NavyAppHeader';
import { Card } from '@components/ui/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStore } from '@store/useAppStore';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const userRole = useAppStore(state => state.userRole);
  
  // Mock notifications - in production from DB
  const notifications = [
    {
      id: '1',
      icon: 'cloud-check',
      title: 'AWS Sync Complete',
      message: '5 attendance records synced successfully',
      time: '2 mins ago',
      color: '#2E9F3F',
    },
    {
      id: '2',
      icon: 'account-check',
      title: 'New Employee Registered',
      message: 'Rajesh Kumar onboarded with biometric',
      time: '1 hour ago',
      color: '#1B3A6B',
    },
    {
      id: '3',
      icon: 'calendar-clock',
      title: 'Leave Application Pending',
      message: '2 leave requests awaiting your approval',
      time: '3 hours ago',
      color: '#E67E22',
    },
  ];
  
  return (
    <View style={styles.container}>
      <NavyAppHeader 
        title="Notifications" 
        onBack={() => navigation.goBack()}
        showBell={false}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        {notifications.map(notif => (
          <Card key={notif.id} style={styles.notifCard}>
            <View style={styles.notifRow}>
              <View style={[styles.iconContainer, { backgroundColor: notif.color + '20' }]}>
                <Icon name={notif.icon} size={24} color={notif.color} />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
              </View>
            </View>
          </Card>
        ))}
        
        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Icon name="bell-off-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF2FB' },
  content: { padding: 16 },
  notifCard: { marginBottom: 12 },
  notifRow: { flexDirection: 'row', gap: 12 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#1B3A6B', marginBottom: 4 },
  notifMessage: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  notifTime: { fontSize: 11, color: '#94A3B8' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 16 },
});
