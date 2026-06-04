import React, {useState} from 'react';
import {StyleSheet, View, Text, TextInput, ScrollView, Alert} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@navigation/navigationTypes';
import {Card} from '@components/ui/Card';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {databaseService} from '@services/DatabaseService';

export function RegisterTab() {
  const {colors, typography} = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [role, setRole] = useState('');

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required');
      return false;
    }
    if (!empId.trim()) {
      Alert.alert('Validation Error', 'Employee ID is required');
      return false;
    }
    if (!role.trim()) {
      Alert.alert('Validation Error', 'Role is required');
      return false;
    }
    return true;
  };

  const handleScanAndLink = () => {
    if (!validate()) return;
    navigation.navigate('RegisterFace', {
      prefillName: name.trim(),
      prefillEmpId: empId.trim(),
      prefillRole: role.trim(),
    });
  };

  const handleSaveProfile = async () => {
    if (!validate()) return;

    try {
      await databaseService.createUser({
        id: 'emp_' + Date.now(),
        name: name.trim(),
        employeeId: empId.trim(),
        role: role.trim() as 'employee' | 'admin',
        department: 'Operations', // Default or make it configurable
        projectSite: 'HQ',
        mobile: '',
        registeredAt: Date.now(),
        faceRegistered: false,
        initials: name.trim().substring(0, 2).toUpperCase(),
        avatarColor: '#2196F3',
      });

      Alert.alert('Success', 'Employee saved. They can register face later.');
      setName('');
      setEmpId('');
      setRole('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save employee');
    }
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background.page}]}>
      <Text style={[typography.h2, styles.title, {color: colors.primary.navy}]}>
        Onboard New Employee
      </Text>

      <Card style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={[typography.label, styles.label, {color: colors.text.secondary}]}>Full Name</Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.background.page, borderColor: colors.border.default, color: colors.text.primary}]}
            placeholder="e.g., Brajesh, Himesh, Shivam"
            placeholderTextColor={colors.text.tertiary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[typography.label, styles.label, {color: colors.text.secondary}]}>Employee ID</Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.background.page, borderColor: colors.border.default, color: colors.text.primary}]}
            placeholder="e.g., EMP205"
            placeholderTextColor={colors.text.tertiary}
            value={empId}
            onChangeText={setEmpId}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[typography.label, styles.label, {color: colors.text.secondary}]}>Role</Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.background.page, borderColor: colors.border.default, color: colors.text.primary}]}
            placeholder="e.g., Field Supervisor"
            placeholderTextColor={colors.text.tertiary}
            value={role}
            onChangeText={setRole}
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Scan & Link Face Biometrics"
            onPress={handleScanAndLink}
            style={{backgroundColor: '#2196F3', marginBottom: 12}}
          />
          <PrimaryButton
            title="Save Employee Profile"
            onPress={handleSaveProfile}
            style={{backgroundColor: colors.primary.navy}}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 12,
  },
});
