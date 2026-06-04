import React, {useState} from 'react';
import {StyleSheet, View, Text, TextInput, Alert} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {RootStackScreenProps} from '@navigation/navigationTypes';
import {Card} from '@components/ui/Card';
import {HoldButton} from '@components/ui/HoldButton';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppStore} from '@store/useAppStore';
import {databaseService} from '@services/DatabaseService';

type Props = RootStackScreenProps<'Login'>;

export function LoginScreen({navigation}: Props) {
  const {colors, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const loginStore = useAppStore(state => state.login);

  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = empId.trim().length > 0 && password.trim().length > 0;

  const handleAuthenticate = async () => {
    // ADMIN: hardcoded credentials
    if (empId === 'ADMIN' && password === 'admin123') {
      const adminUser = {
        id: 'admin_user',
        name: 'Administrator',
        employeeId: 'ADMIN',
        role: 'admin' as const,
        department: 'Administration',
        projectSite: 'HQ',
        mobile: '',
        faceRegistered: true,
        registeredAt: Date.now(),
        initials: 'AD',
        avatarColor: '#1B3A6B',
      };
      
      // Save to store
      loginStore(adminUser);
      
      // Navigate to admin portal
      navigation.replace('AdminPortal');
      return;
    }
    
    // EMPLOYEE: any non-empty credentials
    if (empId.trim() && password.trim()) {
      // Check if employee exists in DB, create if not
      let user = await databaseService.getUserByEmployeeId(empId.trim());
      
      if (!user) {
        // Auto-create employee on first login
        user = {
          id: 'emp_' + Date.now(),
          name: empId.trim(), // Use empId as name initially
          employeeId: empId.trim(),
          role: 'employee',
          department: 'Field Operations',
          projectSite: 'Site A',
          mobile: '',
          faceRegistered: false,
          registeredAt: Date.now(),
          initials: empId.trim().substring(0, 2).toUpperCase(),
          avatarColor: '#2E9F3F',
        };
        
        // Save to DB (without face embedding - they'll register face later)
        await databaseService.createUser(user);
      }
      
      loginStore(user);
      navigation.replace('EmployeePortal');
      return;
    }
    
    // Invalid: show error (should not reach here if isFormValid is true, but fallback)
    Alert.alert('Login Failed', 'Please enter valid credentials');
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page, paddingTop: insets.top + 60}]}>
      <View style={styles.header}>
        <Text style={[typography.h1, {color: colors.primary.navy, textAlign: 'center', marginBottom: 8}]}>
          Secure Gateway
        </Text>
        <Text style={[typography.body, {color: colors.text.secondary, textAlign: 'center'}]}>
          Enter your NHAI credentials to continue
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={[typography.label, {color: colors.primary.navy, marginBottom: 8, fontWeight: '700'}]}>
            Employee ID
          </Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.background.card, borderColor: colors.border.default}]}
            placeholder="e.g., EMP102"
            placeholderTextColor={colors.text.tertiary}
            value={empId}
            onChangeText={setEmpId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[typography.label, {color: colors.primary.navy, marginBottom: 8, fontWeight: '700'}]}>
            Password
          </Text>
          <TextInput
            style={[styles.input, {backgroundColor: colors.background.card, borderColor: colors.border.default}]}
            placeholder="Enter password"
            placeholderTextColor={colors.text.tertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.buttonContainer}>
          <HoldButton
            title="HOLD TO AUTHENTICATE"
            onComplete={handleAuthenticate}
            disabled={!isFormValid}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  card: {
    padding: 24,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  buttonContainer: {
    marginTop: 8,
  },
});
