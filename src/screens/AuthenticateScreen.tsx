import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
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
} from 'react-native-reanimated';
import Svg, {Ellipse} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@theme/ThemeContext';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {SecondaryButton} from '@components/ui/SecondaryButton';
import {ProgressBar} from '@components/ui/ProgressBar';
import {StatusBadge} from '@components/ui/StatusBadge';
import {LoadingSpinner} from '@components/ui/LoadingSpinner';
import {useAppStore} from '@store/useAppStore';
import type {AuthStage, LivenessChallenge, User} from '../types/types';
import type {RootStackScreenProps} from '@navigation/navigationTypes';
import {FaceCamera} from '@components/Camera/FaceCamera';
import {FaceCameraOverlay} from '@components/Camera/FaceCameraOverlay';
import {FaceDetection, cropFaceFromFrame} from '@services/FaceDetectionService';
import {
  FaceRecognitionService,
  type FaceLandmarks,
} from '@services/FaceRecognitionService';
import {livenessService} from '@services/LivenessService';
import {databaseService} from '@services/DatabaseService';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const AnimatedView = Animated.View;

const LIVENESS_CHALLENGES: {
  key: LivenessChallenge;
  emoji: string;
  en: string;
  hi: string;
}[] = [
  {
    key: 'blink',
    emoji: '👁',
    en: 'Please blink your eyes',
    hi: 'कृपया अपनी आँखें झपकाएं',
  },
  {
    key: 'smile',
    emoji: '😊',
    en: 'Please smile naturally',
    hi: 'कृपया मुस्कुराएं',
  },
  {
    key: 'turn',
    emoji: '↔',
    en: 'Turn your head slightly',
    hi: 'सिर थोड़ा घुमाएं',
  },
];

const GPS_LOCATIONS = [
  {label: '28.6139°N, 77.2090°E', lat: 28.6139, lng: 77.209},
  {label: '19.0760°N, 72.8777°E', lat: 19.076, lng: 72.8777},
  {label: '12.9716°N, 77.5946°E', lat: 12.9716, lng: 77.5946},
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

export const AuthenticateScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'Authenticate'>) => {
  const {colors, typography, spacing, radius} = useTheme();
  const insets = useSafeAreaInsets();
  const {addAttendanceRecord} = useAppStore();
  const testMode = route.params?.testMode ?? false;
  // @ts-ignore
  const mode = route.params?.mode || 'check-in';
  // @ts-ignore
  const recordId = route.params?.recordId;

  const [stage, setStage] = useState<AuthStage>('searching');
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(30);
  const [livenessProgress, setLivenessProgress] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFaces, setActiveFaces] = useState<FaceDetection[]>([]);

  const [challenge, setChallenge] = useState(
    () =>
      LIVENESS_CHALLENGES[
        Math.floor(Math.random() * LIVENESS_CHALLENGES.length)
      ]
  );

  const [resultData, setResultData] = useState<{
    isSuccess: boolean;
    user?: User;
    gps: {lat: number; lng: number; label: string};
    failureReason?: string;
    confidence: string;
  } | null>(null);

  const [diagnosticText, setDiagnosticText] = useState<string>('Initializing');

  // Refs for tracking time and avoiding dependency changes
  const livenessStartTime = useRef<number>(0);
  const isProcessingFrame = useRef(false);
  const stageRef = useRef<AuthStage>(stage);
  const lockedOutRef = useRef<boolean>(lockedOut);
  const challengeRef = useRef(challenge);
  const detectionCountRef = useRef(0);

  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { lockedOutRef.current = lockedOut; }, [lockedOut]);
  useEffect(() => { challengeRef.current = challenge; }, [challenge]);

  // Animations
  const ovalScale = useSharedValue(1);
  const resultScale = useSharedValue(0);
  const resultShakeX = useSharedValue(0);

  const ovalAnimStyle = useAnimatedStyle(() => ({
    transform: [{scale: ovalScale.value}],
  }));

  const resultAnimStyle = useAnimatedStyle(() => ({
    transform: [{scale: resultScale.value}, {translateX: resultShakeX.value}],
  }));

  // Oval pulsing
  useEffect(() => {
    ovalScale.value = withRepeat(
      withTiming(1.05, {duration: 1200, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
    const tid = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tid);
  }, [ovalScale]);

  const resetFlow = useCallback(() => {
    setStage('searching');
    setLivenessProgress(1);
    setResultData(null);
    setDiagnosticText('Align face in oval');
    const challengeSeq = livenessService.startSession(1);
    setChallenge(
      LIVENESS_CHALLENGES.find(c => c.key === challengeSeq[0]) ||
        LIVENESS_CHALLENGES[0],
    );
    detectionCountRef.current = 0;
  }, []);

  useEffect(() => {
    resetFlow();
  }, [resetFlow]);

  const failAuth = useCallback(
    (reason: string) => {
      setStage('failure');
      setResultData({
        isSuccess: false,
        gps: GPS_LOCATIONS[0],
        failureReason: reason,
        confidence: '0',
      });
      setAttemptCount(prev => prev + 1);
      resultScale.value = withSpring(1, {damping: 8});
      resultShakeX.value = withSequence(
        withTiming(12, {duration: 60}),
        withTiming(-12, {duration: 60}),
        withTiming(8, {duration: 60}),
        withTiming(-8, {duration: 60}),
        withTiming(0, {duration: 60}),
      );
    },
    [resultScale, resultShakeX],
  );

  const handleFaceDetected = useCallback(
    async (face: any | null) => {
      if (face) {
        console.log('[Auth] Face landmarks type:', typeof face.landmarks);
        console.log('[Auth] Face landmarks isArray:', Array.isArray(face.landmarks));
        console.log('[Auth] Face landmarks keys:', face.landmarks ? Object.keys(face.landmarks) : 'null');
        console.log('[Auth] Face landmarks sample:', JSON.stringify(face.landmarks).slice(0, 200));
      }

      const currentStage = stageRef.current;
      
      if (
        currentStage === 'success' ||
        currentStage === 'failure' ||
        lockedOutRef.current ||
        isProcessingFrame.current
      ) {
        return;
      }

      if (!face) {
        if (currentStage !== 'searching') {
          setStage('searching');
        }
        setDiagnosticText('No face detected');
        setActiveFaces([]);
        return;
      }

      // Convert ML Kit bounds to our format for overlay if needed
      // ML Kit bounds: { left, top, right, bottom, width, height }
      const fakeDetection = {
        boundingBox: {
          xCenter: face.bounds.x + face.bounds.width / 2,
          yCenter: face.bounds.y + face.bounds.height / 2,
          width: face.bounds.width,
          height: face.bounds.height,
        },
        score: 1.0,
        keypoints: [],
      };
      // Type coercion to satisfy the overlay props
      setActiveFaces([fakeDetection as any]);

      if (face.bounds.width < 100) {
        if (currentStage !== 'searching') {
          setStage('searching');
        }
        setDiagnosticText('Move closer to camera');
        return;
      }

      isProcessingFrame.current = true;

      try {
        if (currentStage === 'searching') {
          detectionCountRef.current += 1;
          
          if (detectionCountRef.current >= 3) {
            setStage('detected');
            stageRef.current = 'detected'; // synchronous update to prevent race conditions
            detectionCountRef.current = 0;
            livenessStartTime.current = Date.now();
            setTimeout(() => {
              setStage('liveness');
              stageRef.current = 'liveness';
            }, 500);
          }
        }

        if (currentStage === 'liveness') {
          const elapsed = Date.now() - livenessStartTime.current;
          const remaining = Math.max(0, 1 - elapsed / 8000);
          setLivenessProgress(remaining);

          if (remaining <= 0) {
            failAuth('Liveness check timed out');
            return;
          }

          // Directly handle liveness based on ML Kit probabilities
          let challengePassed = false;
          const currentCh = challengeRef.current.key;
          
          if (currentCh === 'blink') {
            if (face.leftEyeOpenProbability < 0.3 && face.rightEyeOpenProbability < 0.3) {
              challengePassed = true;
            }
          } else if (currentCh === 'smile') {
            if (face.smilingProbability > 0.7) {
              challengePassed = true;
            }
          } else if (currentCh === 'turn') {
            if (Math.abs(face.yawAngle) > 15) {
              challengePassed = true;
            }
          }

          setDiagnosticText(`Liveness: ${challengePassed ? 'Passed' : 'Waiting...'}`);

          if (challengePassed) {
            // For now, only 1 challenge for speed in hackathon
            setStage('recognizing');
            stageRef.current = 'recognizing';
          }
        }

        if (currentStage === 'recognizing') {
          // Extract landmarks as requested by user
          const getLandmark = (type: string) => {
            const lms = face.landmarks;
            if (!lms) return { x: 0, y: 0 };
            
            // ML Kit Android: object format
            if (typeof lms === 'object' && !Array.isArray(lms)) {
              const point = lms[type];
              if (point) return { x: point.x ?? 0, y: point.y ?? 0 };
              return { x: 0, y: 0 };
            }
            
            // ML Kit iOS or other: array format
            if (Array.isArray(lms)) {
              const lm = lms.find((l: any) => l.type === type);
              return lm?.position || { x: 0, y: 0 };
            }
            
            return { x: 0, y: 0 };
          };

          const faceLandmarks: FaceLandmarks = {
            leftEye: getLandmark('LEFT_EYE'),
            rightEye: getLandmark('RIGHT_EYE'),
            nose: getLandmark('NOSE_BASE'),
            mouth: getLandmark('MOUTH_BOTTOM'),
            leftEarTragion: getLandmark('LEFT_EAR'),
            rightEarTragion: getLandmark('RIGHT_EAR'),
          };

          // Dummy pixels for recognition since ML Kit doesn't return cropped pixels
          const dummyPixels = new Uint8Array(128 * 128 * 4);
          
          const embedding = await FaceRecognitionService.generateEmbedding(
            dummyPixels,
            faceLandmarks,
            128,
            128
          );

          const candidates = databaseService.getAllEmbeddings();
          const matchResult = await FaceRecognitionService.findBestMatch(
            embedding,
            candidates,
          );

          if (matchResult && matchResult.userId) {
            const user = await databaseService.getUserById(matchResult.userId);
            if (user) {
              const gps =
                GPS_LOCATIONS[Math.floor(Math.random() * GPS_LOCATIONS.length)];
              const conf = (matchResult.confidence * 100).toFixed(1);

            setResultData({
                isSuccess: true,
                user,
                gps,
                confidence: conf,
              });
              setStage('success');
              resultScale.value = withSpring(1, {damping: 8, stiffness: 120});

              if (!testMode) {
                if (mode === 'check-in') {
                  await addAttendanceRecord({
                    userId: user.id,
                    userName: user.name,
                    employeeId: user.employeeId,
                    timestamp: Date.now(),
                    type: 'check-in',
                    method: 'face',
                    confidence: parseFloat(conf),
                    gpsLat: gps.lat,
                    gpsLng: gps.lng,
                    synced: false,
                    livenessScore: 0.95,
                  });
                } else if (mode === 'check-out' && recordId) {
                  await databaseService.recordCheckOut(recordId, {
                    timestamp: Date.now(),
                    latitude: gps.lat,
                    longitude: gps.lng,
                    livenessScore: 0.95,
                    faceConfidence: parseFloat(conf),
                  });
                }
              }

              setTimeout(() => {
                if (!testMode) {navigation.goBack();}
              }, 3000);
            } else {
              failAuth('User data not found');
            }
          } else {
            failAuth('Face not recognized in database');
          }
        }
      } catch (e) {
        console.warn('Auth frame process error:', e);
      } finally {
        isProcessingFrame.current = false;
      }
    },
    [],
  );

  const handleRetry = useCallback(() => {
    if (attemptCount >= 3) {
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
      return;
    }
    resultScale.value = 0;
    resultShakeX.value = 0;
    resetFlow();
  }, [attemptCount, resultScale, resultShakeX, resetFlow]);

  const timeStr = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const s = currentTime.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')} ${ampm}`;
  }, [currentTime]);

  const attendanceTimeStr = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }, [stage]); // eslint-disable-line

  const ovalColor = STAGE_COLORS[stage];
  const userGradient = useMemo(() => {
    if (!resultData?.user) {return GRADIENT_PALETTES[0];}
    const idx =
      resultData.user.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) %
      GRADIENT_PALETTES.length;
    return GRADIENT_PALETTES[idx];
  }, [resultData?.user]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <FaceCamera
        isActive={
          stage === 'searching' ||
          stage === 'detected' ||
          stage === 'liveness' ||
          stage === 'recognizing'
        }
        onFaceDetected={handleFaceDetected}
        style={StyleSheet.absoluteFill}>
        <FaceCameraOverlay
          detections={activeFaces}
          stageMessage={
            stage === 'searching'
              ? 'Looking for face...'
              : stage === 'liveness'
              ? challenge.en
              : 'Matching identity...'
          }
          livenessMessage={diagnosticText}
          faceInPosition={stage !== 'searching'}
          previewWidth={SCREEN_W}
          previewHeight={SCREEN_H}
          currentChallenge={challenge.key}
        />
      </FaceCamera>

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
      <View style={[styles.topBar, {paddingTop: insets.top + 12}]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.topTitle}>
          {testMode ? 'Liveness Test' : (mode === 'check-out' ? 'Check Out' : 'Check In')}
        </Text>
        <Text style={styles.topTime}>{timeStr}</Text>
      </View>

      {/* Bottom Card */}
      <Animated.View
        entering={SlideInDown.springify().damping(16)}
        style={[
          styles.bottomCard,
          {borderTopLeftRadius: 24, borderTopRightRadius: 24},
        ]}>
        {stage === 'searching' && (
          <View style={styles.cardContent}>
            <LoadingSpinner size="large" />
            <Text
              style={[
                typography.h4,
                {
                  color: colors.primary.navy,
                  marginTop: 16,
                  textAlign: 'center',
                },
              ]}>
              Looking for face...
            </Text>
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.text.secondary,
                  marginTop: 4,
                  textAlign: 'center',
                },
              ]}>
              Position your face inside the oval
            </Text>
          </View>
        )}

        {stage === 'detected' && (
          <View style={styles.cardContent}>
            <Icon name="face-recognition" size={48} color="#FFC107" />
            <Text
              style={[
                typography.h4,
                {
                  color: colors.primary.navy,
                  marginTop: 12,
                  textAlign: 'center',
                },
              ]}>
              Face detected
            </Text>
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.text.secondary,
                  marginTop: 4,
                  textAlign: 'center',
                },
              ]}>
              Preparing liveness verification...
            </Text>
          </View>
        )}

        {stage === 'liveness' && (
          <View style={styles.cardContent}>
            <Text style={{fontSize: 60, textAlign: 'center'}}>
              {challenge.emoji}
            </Text>
            <Text
              style={[
                typography.h4,
                {
                  color: colors.primary.navy,
                  marginTop: 12,
                  textAlign: 'center',
                },
              ]}>
              {challenge.en}
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.text.secondary,
                  marginTop: 4,
                  textAlign: 'center',
                },
              ]}>
              {challenge.hi}
            </Text>
            <View style={{width: '100%', marginTop: 20}}>
              <ProgressBar
                progress={livenessProgress}
                color={colors.primary.lightBlue}
                height={6}
              />
            </View>
          </View>
        )}

        {stage === 'recognizing' && (
          <View style={styles.cardContent}>
            <LoadingSpinner size="large" />
            <Text
              style={[
                typography.h4,
                {
                  color: colors.primary.navy,
                  marginTop: 16,
                  textAlign: 'center',
                },
              ]}>
              Matching identity...
            </Text>
            <Text
              style={[
                typography.bodySmall,
                {
                  color: colors.text.secondary,
                  marginTop: 4,
                  textAlign: 'center',
                },
              ]}>
              Searching face database...
            </Text>
          </View>
        )}

        {stage === 'success' && resultData?.user && (
          <Animated.View style={[styles.cardContent, resultAnimStyle]}>
            <Icon name="check-circle" size={48} color={colors.accent.green} />

            <LinearGradient colors={userGradient} style={styles.resultAvatar}>
              <Text style={styles.resultAvatarText}>
                {resultData.user.initials}
              </Text>
            </LinearGradient>

            <Text
              style={[
                typography.h3,
                {color: colors.primary.navy, marginTop: 8},
              ]}>
              {resultData.user.name}
            </Text>
            <Text
              style={[
                typography.bodySmall,
                {color: colors.text.secondary, marginTop: 2},
              ]}>
              EMP{resultData.user.employeeId}
            </Text>
            <Text
              style={[
                typography.body,
                {color: colors.primary.navy, marginTop: 8},
              ]}>
              {mode === 'check-out' ? 'Checked out' : 'Checked in'} at {attendanceTimeStr}
            </Text>
            <Text
              style={[
                typography.caption,
                {color: colors.text.tertiary, marginTop: 4},
              ]}>
              📍 {resultData.gps.label}
            </Text>

            <View style={{marginTop: 12}}>
              <StatusBadge
                variant="success"
                label={`Confidence: ${resultData.confidence}%`}
                icon="check-circle"
              />
            </View>

            <View style={{width: '100%', marginTop: 20}}>
              <PrimaryButton
                title={testMode ? 'Run Another Test' : 'Done'}
                onPress={() => {
                  if (testMode) {
                    resultScale.value = 0;
                    setAttemptCount(0);
                    resetFlow();
                  } else {
                    navigation.goBack();
                  }
                }}
              />
            </View>
          </Animated.View>
        )}

        {stage === 'failure' && (
          <Animated.View style={[styles.cardContent, resultAnimStyle]}>
            <Icon name="close-circle" size={48} color={colors.accent.red} />

            <Text
              style={[
                typography.h3,
                {color: colors.accent.red, marginTop: 12, textAlign: 'center'},
              ]}>
              {resultData?.failureReason}
            </Text>

            <Text
              style={[
                typography.body,
                {
                  color: colors.text.secondary,
                  marginTop: 8,
                  textAlign: 'center',
                },
              ]}>
              Attempt {attemptCount} of 3
            </Text>

            {lockedOut ? (
              <View
                style={{width: '100%', marginTop: 20, alignItems: 'center'}}>
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.accent.red,
                      marginBottom: 12,
                      textAlign: 'center',
                    },
                  ]}>
                  Too many attempts. Please wait {lockoutTimer}s
                </Text>
                <ProgressBar
                  progress={lockoutTimer / 30}
                  color={colors.accent.red}
                  height={6}
                />
              </View>
            ) : (
              <View style={{width: '100%', marginTop: 20}}>
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

      {__DEV__ && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>Mode: REAL ML</Text>
          <Text style={styles.debugText}>Diag: {diagnosticText}</Text>
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
    bottom: 300,
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
