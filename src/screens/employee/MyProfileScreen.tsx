import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, ScrollView} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import {NavyAppHeader} from '@components/ui/NavyAppHeader';
import {Card} from '@components/ui/Card';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {useAppStore} from '@store/useAppStore';
import {databaseService} from '@services/DatabaseService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export function MyProfileScreen() {
  const {colors, typography} = useTheme();
  const navigation = useNavigation<any>();
  const currentUser = useAppStore(state => state.currentUser);

  const [stats, setStats] = useState({present: 0, absent: 0, rate: 0, lastAttendance: null as number | null});

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.id) {
        const data = await databaseService.getUserAttendanceStats(currentUser.id);
        setStats(data);
      }
    };
    fetchStats();
    const unsubscribe = navigation.addListener('focus', fetchStats);
    return unsubscribe;
  }, [currentUser?.id, navigation]);

  if (!currentUser) return null;

  const joinDate = currentUser.registeredAt ? new Date(currentUser.registeredAt).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : 'Unknown';
  const lastAttDate = stats.lastAttendance ? new Date(stats.lastAttendance).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : 'Never';

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      <NavyAppHeader title="My Profile" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, {backgroundColor: currentUser.avatarColor || colors.primary.navy}]}>
            <Text style={[typography.h1, {color: '#fff'}]}>{currentUser.initials}</Text>
          </View>
          
          <Text style={[typography.h2, {color: colors.text.primary, marginTop: 16}]}>{currentUser.name}</Text>
          <Text style={[typography.body, {color: colors.text.secondary}]}>{currentUser.employeeId}</Text>
          <Text style={[typography.h3, {color: colors.primary.navy, marginTop: 4}]}>{currentUser.role}</Text>

          <View style={[styles.divider, {backgroundColor: colors.border.default}]} />

          <View style={styles.detailRow}>
            <Text style={[typography.body, {color: colors.text.secondary, flex: 1}]}>Department:</Text>
            <Text style={[typography.h4, {color: colors.text.primary, flex: 2, textAlign: 'right'}]}>{currentUser.department}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.body, {color: colors.text.secondary, flex: 1}]}>Joined:</Text>
            <Text style={[typography.h4, {color: colors.text.primary, flex: 2, textAlign: 'right'}]}>{joinDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.body, {color: colors.text.secondary, flex: 1}]}>Face Registered:</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 2, justifyContent: 'flex-end'}}>
              {currentUser.faceRegistered ? (
                <Icon name="check-circle" size={18} color={colors.accent.green} style={{marginRight: 4}} />
              ) : (
                <Icon name="close-circle" size={18} color={colors.accent.red} style={{marginRight: 4}} />
              )}
              <Text style={[typography.h4, {color: currentUser.faceRegistered ? colors.accent.green : colors.accent.red}]}>
                {currentUser.faceRegistered ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={[typography.body, {color: colors.text.secondary, flex: 1}]}>Last Attendance:</Text>
            <Text style={[typography.h4, {color: colors.text.primary, flex: 2, textAlign: 'right'}]}>{lastAttDate}</Text>
          </View>

        </Card>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, {backgroundColor: colors.background.card}]}>
            <Text style={[typography.h2, {color: colors.accent.green}]}>{stats.present}</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>Total Present</Text>
          </View>
          <View style={[styles.statBox, {backgroundColor: colors.background.card}]}>
            <Text style={[typography.h2, {color: colors.accent.red}]}>{stats.absent}</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>Total Absent</Text>
          </View>
          <View style={[styles.statBox, {backgroundColor: colors.background.card}]}>
            <Text style={[typography.h2, {color: colors.primary.navy}]}>{stats.rate}%</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>Attendance Rate</Text>
          </View>
        </View>

        {!currentUser.faceRegistered && (
          <PrimaryButton
            title="Register Your Face"
            onPress={() => navigation.navigate('RegisterFace')}
            style={{marginTop: 24, backgroundColor: colors.primary.navy}}
            icon="face-recognition"
          />
        )}
      </ScrollView>
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
  profileCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
