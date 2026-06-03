import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Ellipse } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@theme/ThemeContext';
import { GradientBackground } from '@components/ui/GradientBackground';
import { Card } from '@components/ui/Card';
import { AppHeader } from '@components/ui/AppHeader';
import { SectionHeader } from '@components/ui/SectionHeader';
import { FloatingInput } from '@components/ui/FloatingInput';
import { Dropdown } from '@components/ui/Dropdown';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { SecondaryButton } from '@components/ui/SecondaryButton';
import { ProgressBar } from '@components/ui/ProgressBar';
import { StatusBadge } from '@components/ui/StatusBadge';
import { useAppStore } from '@store/useAppStore';
import type { RootStackScreenProps } from '@navigation/navigationTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ──────────────────────────────────────────────────

const DEPARTMENTS = [
  { label: 'Field Engineer', value: 'Field Engineer' },
  { label: 'Surveyor', value: 'Surveyor' },
  { label: 'Inspector', value: 'Inspector' },
  { label: 'Supervisor', value: 'Supervisor' },
  { label: 'Site Manager', value: 'Site Manager' },
];

const PROJECT_SITES = [
  { label: 'NH-48 Delhi-Jaipur', value: 'NH-48 Delhi-Jaipur' },
  { label: 'NH-44 Delhi-Agra', value: 'NH-44 Delhi-Agra' },
  { label: 'NH-66 Mumbai-Goa', value: 'NH-66 Mumbai-Goa' },
  { label: 'NH-8 Delhi-Mumbai', value: 'NH-8 Delhi-Mumbai' },
  { label: 'NH-2 Delhi-Kolkata', value: 'NH-2 Delhi-Kolkata' },
  { label: 'NH-16 Chennai-Kolkata', value: 'NH-16 Chennai-Kolkata' },
];

const POSE_INSTRUCTIONS: { en: string; hi: string }[] = [
  { en: 'Look straight at camera', hi: 'कैमरे की ओर सीधा देखें' },
  { en: 'Turn left slightly', hi: 'थोड़ा बाएं घुमें' },
  { en: 'Turn right slightly', hi: 'थोड़ा दाएं घुमें' },
  { en: 'Look up slightly', hi: 'थोड़ा ऊपर देखें' },
  { en: 'Smile naturally', hi: 'स्वाभाविक रूप से मुस्कुराएं' },
];

const GRADIENT_PALETTES = [
  ['#0A3D7A', '#1976D2'],
  ['#1976D2', '#42A5F5'],
  ['#F57C00', '#FFB74D'],
  ['#388E3C', '#66BB6A'],
];

// ─── Progress Dots ──────────────────────────────────────────────

const ProgressDots = ({ current }: { current: number }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i <= current ? colors.primary.navy : 'transparent',
              borderColor: i <= current ? colors.primary.navy : colors.text.tertiary,
            },
          ]}
        />
      ))}
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────────

export const RegisterFaceScreen = ({ navigation }: RootStackScreenProps<'RegisterFace'>) => {
  const { colors, typography, spacing, radius } = useTheme();
  const { registerUser } = useAppStore();

  const [step, setStep] = useState(0);

  // Step 1 form state
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const [projectSite, setProjectSite] = useState<string | null>(null);
  const [mobile, setMobile] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 2 capture state
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for face guide
  const pulseOpacity = useSharedValue(0.5);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulseOpacity]);

  // Step 2 auto-advance logic
  useEffect(() => {
    if (step === 1) {
      setCurrentFrame(0);
      frameIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= 4) {
            if (frameIntervalRef.current) {
              clearInterval(frameIntervalRef.current);
              frameIntervalRef.current = null;
            }
            // Advance to step 3
            setTimeout(() => setStep(2), 500);
            return 5;
          }
          return prev + 1;
        });
      }, 1500);
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [step]);

  // ── Validation ──────────────────────────────────────────────

  const validateStep1 = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    const empId = employeeId.trim();
    if (!empId) {
      errors.employeeId = 'Employee ID is required';
    } else if (!/^[A-Za-z0-9]{4,10}$/.test(empId)) {
      errors.employeeId = 'Must be 4-10 alphanumeric characters';
    }

    if (!department) {
      errors.department = 'Please select a department';
    }

    if (!projectSite) {
      errors.projectSite = 'Please select a project site';
    }

    const mob = mobile.trim();
    if (!mob) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mob)) {
      errors.mobile = 'Must be exactly 10 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fullName, employeeId, department, projectSite, mobile]);

  const handleProceedToCapture = useCallback(() => {
    if (validateStep1()) {
      setStep(1);
    }
  }, [validateStep1]);

  const handleConfirmRegistration = useCallback(() => {
    registerUser({
      name: fullName.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      department: department as string,
      projectSite: projectSite as string,
      mobile: mobile.trim(),
    });

    Alert.alert(
      'Registration Successful! ✅',
      `${fullName.trim()} has been registered for face authentication.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  }, [fullName, employeeId, department, projectSite, mobile, registerUser, navigation]);

  // ── Get initials and gradient ───────────────────────────────

  const initials = fullName
    .trim()
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const gradientIdx =
    fullName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENT_PALETTES.length;
  const avatarGradient = GRADIENT_PALETTES[gradientIdx];

  // ── Header titles per step ──────────────────────────────────

  const headerTitles = ['Register New Field Staff', 'Capture Face', 'Confirm Registration'];

  // ═══════════════════════════════════════════════════════════

  return (
    <GradientBackground>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AppHeader
        title={headerTitles[step]}
        onBack={() => {
          if (step > 0) {
            if (step === 1 && frameIntervalRef.current) {
              clearInterval(frameIntervalRef.current);
              frameIntervalRef.current = null;
            }
            setStep(step - 1);
          } else {
            navigation.goBack();
          }
        }}
      />

      <ProgressDots current={step} />

      {/* ─── STEP 1: Personal Info ─────────────────────────── */}
      {step === 0 && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card padding={20}>
              <SectionHeader title="Personal Information" />

              <View style={{ height: spacing.md }} />

              <FloatingInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                error={formErrors.fullName}
              />

              <View style={{ height: spacing.lg }} />

              <FloatingInput
                label="Employee ID"
                value={employeeId}
                onChangeText={(t) => setEmployeeId(t.slice(0, 10))}
                autoCapitalize="characters"
                error={formErrors.employeeId}
              />

              <View style={{ height: spacing.lg }} />

              <Dropdown
                label="Department"
                value={department}
                options={DEPARTMENTS}
                onChange={setDepartment}
                error={formErrors.department}
              />

              <View style={{ height: spacing.lg }} />

              <Dropdown
                label="Project Site"
                value={projectSite}
                options={PROJECT_SITES}
                onChange={setProjectSite}
                error={formErrors.projectSite}
              />

              <View style={{ height: spacing.lg }} />

              <FloatingInput
                label="Mobile Number"
                value={mobile}
                onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, '').slice(0, 10))}
                keyboardType="numeric"
                error={formErrors.mobile}
              />

              <View style={{ height: spacing.xl }} />

              <PrimaryButton
                title="Proceed to Face Capture →"
                icon="arrow-right"
                onPress={handleProceedToCapture}
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ─── STEP 2: Mock Face Capture ─────────────────────── */}
      {step === 1 && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mock Camera */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <View style={styles.cameraView}>
              <Text style={styles.faceEmoji}>😊</Text>
              <Animated.View style={[styles.svgOverlay, pulseStyle]}>
                <Svg width={240} height={320}>
                  <Ellipse
                    cx={120}
                    cy={160}
                    rx={100}
                    ry={140}
                    stroke={colors.primary.navy}
                    strokeWidth={3}
                    strokeDasharray="10,5"
                    fill="none"
                  />
                </Svg>
              </Animated.View>
            </View>
          </Card>

          {/* Instruction Card */}
          <Card padding={16} style={{ marginTop: spacing.md }}>
            <Text style={[typography.h4, { color: colors.primary.navy, textAlign: 'center' }]}>
              {currentFrame < 5
                ? POSE_INSTRUCTIONS[currentFrame].en
                : POSE_INSTRUCTIONS[4].en}
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, textAlign: 'center', marginTop: 4 },
              ]}
            >
              {currentFrame < 5
                ? POSE_INSTRUCTIONS[currentFrame].hi
                : POSE_INSTRUCTIONS[4].hi}
            </Text>
          </Card>

          {/* Progress */}
          <View style={{ marginTop: spacing.md }}>
            <ProgressBar
              progress={Math.min(currentFrame + 1, 5) / 5}
              label="Capture Progress"
              showPercentage
              color={colors.accent.green}
            />
            <Text
              style={[
                typography.bodySmall,
                { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
              ]}
            >
              Frame {Math.min(currentFrame + 1, 5)} of 5 captured
            </Text>
          </View>

          {/* Quality Indicators */}
          <View style={styles.qualityRow}>
            <StatusBadge variant="success" label="💡 Lighting" icon="check-circle" />
            <StatusBadge variant="success" label="📏 Distance" icon="check-circle" />
            <StatusBadge variant="success" label="🎯 Position" icon="check-circle" />
          </View>

          <SecondaryButton
            title="Cancel"
            onPress={() => {
              if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
              }
              setStep(0);
            }}
            style={{ marginTop: spacing.lg }}
          />

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* ─── STEP 3: Confirmation ──────────────────────────── */}
      {step === 2 && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card padding={24} style={{ alignItems: 'center' }}>
            {/* Avatar */}
            <LinearGradient
              colors={avatarGradient}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarText}>{initials || '??'}</Text>
            </LinearGradient>

            <Text style={[typography.h3, { color: colors.primary.navy, marginTop: spacing.lg }]}>
              {fullName.trim()}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4 }]}>
              {employeeId.trim().toUpperCase()}
            </Text>
            <Text style={[typography.body, { color: colors.primary.navy, marginTop: 4 }]}>
              {department}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4 }]}>
              {projectSite}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

            <View style={styles.badgesRow}>
              <StatusBadge variant="success" label="Enrollment Quality: 94%" icon="check-circle" />
            </View>
            <View style={{ height: 6 }} />
            <StatusBadge variant="info" label="5 Frames Captured" icon="camera" />
          </Card>

          <View style={styles.buttonRow}>
            <SecondaryButton
              title="Retake Photos"
              icon="camera-retake"
              onPress={() => setStep(1)}
              fullWidth={false}
              style={{ flex: 1, marginRight: 8 }}
            />
            <PrimaryButton
              title="Confirm"
              icon="check"
              onPress={handleConfirmRegistration}
              fullWidth={false}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  cameraView: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceEmoji: {
    fontSize: 60,
  },
  svgOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  divider: {
    width: '80%',
    height: 1,
    marginVertical: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
});
