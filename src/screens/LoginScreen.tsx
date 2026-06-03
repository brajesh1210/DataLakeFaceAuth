import React, {useState, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@theme/ThemeContext';
import {GradientBackground} from '@components/ui/GradientBackground';
import {Card} from '@components/ui/Card';
import {NHAIHeader} from '@components/branding/NHAIHeader';
import {FloatingInput} from '@components/ui/FloatingInput';
import {Dropdown} from '@components/ui/Dropdown';
import {Checkbox} from '@components/ui/Checkbox';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {useAppStore} from '@store/useAppStore';
import type {RootStackScreenProps} from '@navigation/navigationTypes';

// ─── Captcha Generator ──────────────────────────────────────────

function generateCaptcha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Quick Action Pill ──────────────────────────────────────────

const QuickActionPill = ({title, icon}: {title: string; icon: string}) => {
  const {colors, typography, radius} = useTheme();
  return (
    <Pressable
      style={[
        styles.quickActionPill,
        {backgroundColor: '#D6E3F1', borderRadius: radius.md},
      ]}>
      <Icon
        name={icon}
        size={18}
        color={colors.primary.navy}
        style={{marginRight: 8}}
      />
      <Text
        style={[
          typography.bodySmall,
          {color: colors.primary.navy, fontWeight: '600', flex: 1},
        ]}>
        {title}
      </Text>
      <Icon name="chevron-down" size={18} color={colors.primary.navy} />
    </Pressable>
  );
};

// ─── Login Screen ───────────────────────────────────────────────

const ROLES = [
  {label: 'Field Officer', value: 'Field Officer'},
  {label: 'Supervisor', value: 'Supervisor'},
  {label: 'Admin', value: 'Admin'},
];

export const LoginScreen = ({navigation}: RootStackScreenProps<'Login'>) => {
  const {colors, typography, spacing, radius} = useTheme();
  const {login, rememberedUsername, setRememberedUsername} = useAppStore();

  // Form state
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState(rememberedUsername);
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [rememberMe, setRememberMe] = useState(!!rememberedUsername);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Shake animation for error
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{translateX: shakeX.value}],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(10, {duration: 50}),
      withTiming(-10, {duration: 50}),
      withTiming(10, {duration: 50}),
      withTiming(-10, {duration: 50}),
      withTiming(0, {duration: 50}),
    );
  }, [shakeX]);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const handleSignIn = useCallback(() => {
    setError('');

    // Validation
    if (!role) {
      setError('Please select a role');
      triggerShake();
      return;
    }
    if (!username.trim()) {
      setError('Please enter your username');
      triggerShake();
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      triggerShake();
      return;
    }
    if (captchaInput.toUpperCase() !== captcha.toUpperCase()) {
      setError('Captcha does not match. Please try again.');
      triggerShake();
      refreshCaptcha();
      return;
    }

    setLoading(true);

    // Simulate auth delay
    setTimeout(() => {
      if (rememberMe) {
        setRememberedUsername(username.trim());
      } else {
        setRememberedUsername('');
      }
      login(username.trim(), role);
      setLoading(false);
      navigation.replace('MainTabs');
    }, 800);
  }, [
    role,
    username,
    password,
    captchaInput,
    captcha,
    rememberMe,
    login,
    navigation,
    triggerShake,
    refreshCaptcha,
    setRememberedUsername,
  ]);

  return (
    <GradientBackground colors={['#D6E3F1', '#E8F1FB', '#FFFFFF']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* NHAI Header */}
          <View style={styles.headerSection}>
            <NHAIHeader />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <QuickActionPill
              title="DATALAKE TRAINING VIDEO"
              icon="play-circle-outline"
            />
            <QuickActionPill
              title="FACE REGISTRATION FOR FIELD STAFF"
              icon="face-recognition"
            />
            <QuickActionPill
              title="MARK ATTENDANCE OFFLINE"
              icon="calendar-check-outline"
            />
            <QuickActionPill title="VIEW ATTENDANCE REPORTS" icon="chart-bar" />
          </View>

          {/* Welcome */}
          <Text
            style={[
              typography.h2,
              {
                color: colors.primary.navy,
                marginBottom: spacing.lg,
                marginTop: spacing.xl,
              },
            ]}>
            Welcome to Field Auth Portal
          </Text>

          {/* Login Card */}
          <Animated.View style={shakeStyle}>
            <Card padding={20}>
              <Dropdown
                label="Select Role"
                value={role}
                options={ROLES}
                onChange={setRole}
              />

              <View style={{height: spacing.lg}} />

              <FloatingInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={{height: spacing.lg}} />

              <FloatingInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={{height: spacing.lg}} />

              {/* Captcha */}
              <View style={styles.captchaRow}>
                <View
                  style={[
                    styles.captchaDisplay,
                    {
                      backgroundColor: colors.background.input,
                      borderRadius: radius.md,
                    },
                  ]}>
                  <Text
                    style={[
                      typography.h3,
                      {
                        color: colors.primary.navy,
                        letterSpacing: 6,
                        fontStyle: 'italic',
                        fontWeight: '700',
                      },
                    ]}>
                    {captcha}
                  </Text>
                </View>
                <Pressable
                  onPress={refreshCaptcha}
                  style={styles.captchaRefresh}
                  hitSlop={10}>
                  <Icon
                    name="refresh"
                    size={24}
                    color={colors.primary.lightBlue}
                  />
                </Pressable>
              </View>

              <View style={{height: spacing.sm}} />

              <FloatingInput
                label="Enter Captcha"
                value={captchaInput}
                onChangeText={setCaptchaInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <View style={{height: spacing.md}} />

              <Checkbox
                checked={rememberMe}
                onToggle={setRememberMe}
                label="Remember me"
              />

              {/* Error Message */}
              {error ? (
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: colors.accent.red,
                      marginTop: spacing.sm,
                      marginBottom: spacing.sm,
                    },
                  ]}>
                  {error}
                </Text>
              ) : null}

              <View style={{height: spacing.lg}} />

              <PrimaryButton
                title="SIGN IN"
                onPress={handleSignIn}
                loading={loading}
                style={{borderRadius: radius.md}}
              />
            </Card>
          </Animated.View>

          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  quickActionsSection: {
    gap: 8,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captchaDisplay: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captchaRefresh: {
    marginLeft: 12,
    padding: 8,
  },
});
