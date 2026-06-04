import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@navigation/navigationTypes';
import {Card} from '@components/ui/Card';
import {StatsRow} from '@components/ui/StatsRow';
import {databaseService} from '@services/DatabaseService';
import {useAppStore} from '@store/useAppStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export function CoreTab() {
  const {colors, typography} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useAppStore(state => state.logout);

  const [presentCount, setPresentCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const present = await databaseService.getTodayAttendanceCount();
      const pending = await databaseService.getPendingLeavesCount();
      setPresentCount(present);
      setPendingLeaves(pending);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => {
      setIsRefreshing(false);
      Alert.alert('Success', 'Data refreshed successfully');
    }, 500);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to end the current session?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background.page}]}>
      <View style={styles.statsContainer}>
        <StatsRow
          stats={[
            {value: presentCount.toString(), label: 'Present', valueColor: '#2E9F3F'},
            {value: pendingLeaves.toString(), label: 'Pending', valueColor: '#E67E22'},
          ]}
        />
      </View>

      <Text style={[typography.h2, styles.sectionTitle, {color: colors.primary.navy}]}>
        Operations
      </Text>

      <Card style={styles.operationsCard}>
        {/* Mark Attendance */}
        <TouchableOpacity
          style={[styles.operationItem, {borderBottomColor: colors.border.default}]}
          onPress={() => navigation.navigate('Authenticate')}>
          <View style={styles.operationText}>
            <Text style={[typography.h3, {color: colors.text.primary}]}>Mark Attendance</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>Execute biometric face scanning</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Force Refresh */}
        <TouchableOpacity
          style={[styles.operationItem, {borderBottomColor: colors.border.default}]}
          onPress={handleRefresh}>
          <View style={styles.operationText}>
            <Text style={[typography.h3, {color: colors.text.primary}]}>Force Refresh</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>Pull latest DB data</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.operationItem, {borderBottomWidth: 0}]}
          onPress={handleLogout}>
          <View style={styles.operationText}>
            <Text style={[typography.h3, {color: '#D32F2F'}]}>Logout Admin</Text>
            <Text style={[typography.caption, {color: colors.text.secondary}]}>End current session</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  operationsCard: {
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  operationText: {
    flex: 1,
  },
});
