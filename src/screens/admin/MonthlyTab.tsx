import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, FlatList, TouchableOpacity} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {databaseService} from '@services/DatabaseService';
import {MonthlyLedgerModal} from './MonthlyLedgerModal';
import type {User} from '../../types/types';

export function MonthlyTab() {
  const {colors, typography} = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers = await databaseService.getAllUsers();
      // filter out admin if needed, or keep them
      setUsers(allUsers.filter(u => u.role !== 'admin'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const todayStr = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

  const renderItem = ({item}: {item: User}) => (
    <TouchableOpacity
      style={[styles.userRow, {backgroundColor: colors.background.card, borderBottomColor: colors.border.default}]}
      onPress={() => handleSelectUser(item)}>
      
      <View style={styles.leftContent}>
        <View style={[styles.avatar, {backgroundColor: item.avatarColor || colors.primary.navy}]}>
          <Text style={[typography.h3, {color: '#fff'}]}>{item.initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[typography.h4, {color: colors.text.primary}]}>{item.name}</Text>
          <Text style={[typography.caption, {color: colors.text.secondary}]}>
            {item.employeeId} • {item.role || item.department}
          </Text>
        </View>
      </View>

      <View style={[styles.datePill, {backgroundColor: colors.background.page}]}>
        <Text style={[typography.caption, {color: colors.text.secondary}]}>{todayStr}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.body, {color: colors.text.secondary}]}>No employees found.</Text>
          </View>
        }
      />

      <MonthlyLedgerModal
        visible={modalVisible}
        user={selectedUser}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
});
