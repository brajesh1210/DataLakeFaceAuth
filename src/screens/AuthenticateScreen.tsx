import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  SlideInDown,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Ellipse } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/ThemeContext';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { SecondaryButton } from '@components/ui/SecondaryButton';
import { ProgressBar } from '@components/ui/ProgressBar';
import { StatusBadge } from '@components/ui/StatusBadge';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useAppStore } from '@store/useAppStore';
import type { AuthStage, LivenessChallenge, User } from '../types/types';
import type { RootStackScreenProps } from '@navigation/navigationTypes';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AnimatedView = Animated.View;

// ─── Constants ──────────────────────────────────────────────────

const LIVENESS_CHALLENGES: {
  key: LivenessChallenge;
  emoji: string;
  en: string;
  hi: string;
}[] = [
  { key: 'blink', emoji: '👁', en: 'Please blink your eyes', hi: 'कृपया अपनी आँखें झपकाएं' },
  { key: 'smile', emoji: '😊', en: 'Please smile naturally', hi: 'कृपया मुस्कुराएं' },
  { key: 'turn', emoji: '↔', en: 'Turn your head slightly', hi: 'सिर थोड़ा घुमाएं' },
];

const GPS_LOCATIONS = [
  { label: '28.6139°N, 77.2090°E', lat: 28.6139, lng: 77.209 },
  { label: '19.0760°N, 72.8777°E', lat: 19.076, lng: 72.8777 },
  { label: '12.9716°N, 77.5946°E', lat: 12.9716, lng: 77.5946 },
];

const FAILURE_REASONS = [
  'Face not recognized',
  'Liveness check failed',
  'Low confidence score',
  'Spoof detected',
];

const STAGE_COLORS: Record<AuthStage, string> = {
  searching: '#9CA3AF',
  detected: '#FFC107',
  liveness: '#1976D2',
  recognizing: '#1976D2',
  success: '#4CAF50',
  failure: '#F44336',
};

const GRADIENT_PALETTES = [
  ['#0A3D7A', '#1976D2'],
  ['#1976D2', '#42A5F5'],
  ['#F57C00', '#FFB74D'],
  ['#388E3C', '#66BB6A'],
];

// ─── Main Component ─────────────────────────────────────────────

export const AuthenticateScreen = ({ navigation, route }: RootStackScreenProps<'Authenticate'>) => {
  const { colors, typography, spacing, radius } = useTheme();
  const { registeredUsers, addAttendanceRecord } = useAppStore();
  const testMode = route.params?.testMode ?? false;

  // ── State ───────────────────────────────────────────────────
  const [stage, setStage] = useState<AuthStage>('searching');
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(30);
  const [livenessProgress, setLivenessProgress] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Memoize random values per auth flow
  const challenge = useMemo(
    () => LIVENESS_CHALLENGES[Math.floor(Math.random() * LIVENESS_CHALLENGES.length)],
    [stage === 'liveness' ? stage : null], // eslint-disable-line
  );

  const resultData = useMemo(() => {
    const isSuccess = Math.random() < 0.8;
    const user = registeredUsers[Math.floor(Math.random() * registeredUsers.length)];
    const gps = GPS_LOCATIONS[Math.floor(Math.random() * GPS_LOCATIONS.length)];
    const failureReason = FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
    const confidence = (94 + Math.random() * 5).toFixed(1);
    return { isSuccess, user, gps, failureReason, confidence };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptCount]);

  // Refs for cleanup
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // ── Animations ──────────────────────────────────────────────
  const ovalScale = useSharedValue(1);
  const resultScale = useSharedValue(0);
  const resultShakeX = useSharedValue(0);

  const ovalAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ovalScale.value }],
  }));

  const resultAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }, { translateX: resultShakeX.value }],
  }));

  // Oval pulsing
  useEffect(() => {
    ovalScale.value = withRepeat(
      withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [ovalScale]);

  // Clock updater
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    intervalsRef.current.push(id);
    return () => clearInterval(id);
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      intervalsRef.current.forEach(i => clearInterval(i));
    };
  }, []);

  // ── Stage Flow Engine ───────────────────────────────────────
  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const runFlow = useCallback(() => {
    // Clear previous timers
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    setStage('searching');

    // Stage 1 → 2 (3s)
    addTimer(() => {
      setStage('detected');

      // Stage 2 → 3 (1s)
      addTimer(() => {
        setStage('liveness');
        setLivenessProgress(1);

        // Liveness countdown (5s)
        const livenessStart = Date.now();
        const lid = setInterval(() => {
          const elapsed = Date.now() - livenessStart;
          const remaining = Math.max(0, 1 - elapsed / 5000);
          setLivenessProgress(remaining);
          if (remaining <= 0) {
            clearInterval(lid);
          }
        }, 50);
        intervalsRef.current.push(lid);

        // Stage 3 → 4 (5s)
        addTimer(() => {
          setStage('recognizing');

          // Stage 4 → 5 (2s)
          addTimer(() => {
            // Result
            if (resultData.isSuccess) {
              setStage('success');
              resultScale.value = withSpring(1, { damping: 8, stiffness: 120 });

              // Add attendance record (not in test mode)
              if (!testMode && resultData.user) {
                addAttendanceRecord({
                  userId: resultData.user.id,
                  userName: resultData.user.name,
                  employeeId: resultData.user.employeeId,
                  timestamp: Date.now(),
                  type: 'check-in',
                  method: 'face',
                  confidence: parseFloat(resultData.confidence),
                  gpsLat: resultData.gps.lat,
                  gpsLng: resultData.gps.lng,
                  synced: false,
                  livenessScore: 0.91,
                });
              }

              // Auto-navigate after 8s
              addTimer(() => {
                navigation.goBack();
              }, 8000);
            } else {
              setStage('failure');
              resultScale.value = withSpring(1, { damping: 8 });
              resultShakeX.value = withSequence(
                withTiming(12, { duration: 60 }),
                withTiming(-12, { duration: 60 }),
                withTiming(8, { duration: 60 }),
                withTiming(-8, { duration: 60 }),
                withTiming(0, { duration: 60 }),
              );
              setAttemptCount(prev => prev + 1);
            }
          }, 2000);
        }, 5000);
      }, 1000);
    }, 3000);
  }, [addTimer, resultData, resultScale, resultShakeX, testMode, addAttendanceRecord, navigation]);

  // Start flow on mount
  useEffect(() => {
    runFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Retry Logic ─────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (attemptCount >= 3) {
      // Lockout
      setLockedOut(true);
      setLockoutTimer(30);
      const lid = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
            clearInterval(lid);
            setLockedOut(false);
            setAttemptCount(0);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      intervalsRef.current.push(lid);
      return;
    }

    resultScale.value = 0;
    resultShakeX.value = 0;
    runFlow();
  }, [attemptCount, runFlow, resultScale, resultShakeX]);

  // ── Format Time ─────────────────────────────────────────────
  const timeStr = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const s = currentTime.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${ampm}`;
  }, [currentTime]);

  const attendanceTimeStr = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }, [stage]); // eslint-disable-line

  // Oval stroke color
  const ovalColor = STAGE_COLORS[stage];

  // User gradient for avatar
  const userGradient = useMemo(() => {
    if (!resultData.user) return GRADIENT_PALETTES[0];
    const idx =
      resultData.user.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) %
      GRADIENT_PALETTES.length;
    return GRADIENT_PALETTES[idx];
  }, [resultData.user]);

  // ═══════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Mock Camera Background */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.cameraEmoji}>😊</Text>

      {/* Face Guide Oval */}
      <AnimatedView style={[styles.ovalContainer, ovalAnimStyle]}>
        <Svg width={280} height={360}>
          <Ellipse
            cx={140}
            cy={180}
            rx={120}
            ry={160}
            stroke={ovalColor}
            strokeWidth={4}
            fill="none"
          />
        </Svg>
      </AnimatedView>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.topTitle}>
          {testMode ? 'Liveness Test' : 'Mark Attendance'}
        </Text>
        <Text style={styles.topTime}>{timeStr}</Text>
      </View>

      {/* Bottom Card */}
      <Animated.View
        entering={SlideInDown.springify().damping(16)}
        style={[styles.bottomCard, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
      >
        {/* ── SEARCHING ──────────────────────────────── */}
        {stage === 'searching' && (
          <View style={styles.cardContent}>
            <LoadingSpinner size="large" />
            <Text style={[typography.h4, { color: colors.primary.navy, marginTop: 16, textAlign: 'center' }]}>
              Looking for face...
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4, textAlign: 'center' }]}>
              Position your face inside the oval
            </Text>
          </View>
        )}

        {/* ── DETECTED ───────────────────────────────── */}
        {stage === 'detected' && (
          <View style={styles.cardContent}>
            <Icon name="face-recognition" size={48} color="#FFC107" />
            <Text style={[typography.h4, { color: colors.primary.navy, marginTop: 12, textAlign: 'center' }]}>
              Face detected
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4, textAlign: 'center' }]}>
              Preparing liveness verification...
            </Text>
          </View>
        )}

        {/* ── LIVENESS ───────────────────────────────── */}
        {stage === 'liveness' && (
          <View style={styles.cardContent}>
            <Text style={{ fontSize: 60, textAlign: 'center' }}>{challenge.emoji}</Text>
            <Text style={[typography.h4, { color: colors.primary.navy, marginTop: 12, textAlign: 'center' }]}>
              {challenge.en}
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, marginTop: 4, textAlign: 'center' }]}>
              {challenge.hi}
            </Text>
            <View style={{ width: '100%', marginTop: 20 }}>
              <ProgressBar
                progress={livenessProgress}
                color={colors.primary.lightBlue}
                height={6}
              />
            </View>
          </View>
        )}

        {/* ── RECOGNIZING ────────────────────────────── */}
        {stage === 'recognizing' && (
          <View style={styles.cardContent}>
            <LoadingSpinner size="large" />
            <Text style={[typography.h4, { color: colors.primary.navy, marginTop: 16, textAlign: 'center' }]}>
              Matching identity...
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4, textAlign: 'center' }]}>
              Searching face database...
            </Text>
          </View>
        )}

        {/* ── SUCCESS ────────────────────────────────── */}
        {stage === 'success' && resultData.user && (
          <Animated.View style={[styles.cardContent, resultAnimStyle]}>
            <Icon name="check-circle" size={48} color={colors.accent.green} />

            <LinearGradient
              colors={userGradient}
              style={styles.resultAvatar}
            >
              <Text style={styles.resultAvatarText}>
                {resultData.user.initials}
              </Text>
            </LinearGradient>

            <Text style={[typography.h3, { color: colors.primary.navy, marginTop: 8 }]}>
              {resultData.user.name}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>
              EMP{resultData.user.employeeId}
            </Text>
            <Text style={[typography.body, { color: colors.primary.navy, marginTop: 8 }]}>
              Attendance marked at {attendanceTimeStr}
            </Text>
            <Text style={[typography.caption, { color: colors.text.tertiary, marginTop: 4 }]}>
              📍 {resultData.gps.label}
            </Text>

            <View style={{ marginTop: 12 }}>
              <StatusBadge
                variant="success"
                label={`Confidence: ${resultData.confidence}%`}
                icon="check-circle"
              />
            </View>

            <View style={{ width: '100%', marginTop: 20 }}>
              <PrimaryButton
                title={testMode ? 'Run Another Test' : 'Done'}
                onPress={() => {
                  if (testMode) {
                    resultScale.value = 0;
                    setAttemptCount(0);
                    runFlow();
                  } else {
                    navigation.goBack();
                  }
                }}
              />
            </View>
          </Animated.View>
        )}

        {/* ── FAILURE ────────────────────────────────── */}
        {stage === 'failure' && (
          <Animated.View style={[styles.cardContent, resultAnimStyle]}>
            <Icon name="close-circle" size={48} color={colors.accent.red} />

            <Text style={[typography.h3, { color: colors.accent.red, marginTop: 12, textAlign: 'center' }]}>
              {resultData.failureReason}
            </Text>

            <Text style={[typography.body, { color: colors.text.secondary, marginTop: 8, textAlign: 'center' }]}>
              Attempt {attemptCount} of 3
            </Text>

            {lockedOut ? (
              <View style={{ width: '100%', marginTop: 20, alignItems: 'center' }}>
                <Text style={[typography.body, { color: colors.accent.red, marginBottom: 12, textAlign: 'center' }]}>
                  Too many attempts. Please wait {lockoutTimer}s
                </Text>
                <ProgressBar
                  progress={lockoutTimer / 30}
                  color={colors.accent.red}
                  height={6}
                />
              </View>
            ) : (
              <View style={{ width: '100%', marginTop: 20 }}>
                <SecondaryButton
                  title="Try Again"
                  icon="refresh"
                  onPress={handleRetry}
                />
              </View>
            )}
          </Animated.View>
        )}
      </Animated.View>

      {/* Debug Overlay */}
      {__DEV__ && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>Mode: MOCK ML</Text>
          <Text style={styles.debugText}>Pipeline: 250ms</Text>
          <Text style={styles.debugText}>Liveness: 0.91</Text>
          <Text style={styles.debugText}>Stage: {stage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  cameraEmoji: {
    position: 'absolute',
    top: SCREEN_H * 0.3,
    alignSelf: 'center',
    fontSize: 100,
    opacity: 0.3,
  },
  ovalContainer: {
    position: 'absolute',
    top: SCREEN_H * 0.15,
    alignSelf: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  backBtn: {
    padding: 4,
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  topTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    minWidth: 100,
    textAlign: 'right',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    minHeight: 200,
    padding: 24,
    paddingBottom: 40,
  },
  cardContent: {
    alignItems: 'center',
  },
  resultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  resultAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  debugOverlay: {
    position: 'absolute',
    bottom: 250,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 6,
    zIndex: 30,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 14,
  },
});
