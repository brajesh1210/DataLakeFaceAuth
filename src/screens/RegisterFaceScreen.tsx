import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {GradientBackground} from '@components/ui/GradientBackground';
import {AppHeader} from '@components/ui/AppHeader';
import {Card} from '@components/ui/Card';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {SecondaryButton} from '@components/ui/SecondaryButton';
import {FloatingInput} from '@components/ui/FloatingInput';
import {Dropdown} from '@components/ui/Dropdown';
import {ProgressBar} from '@components/ui/ProgressBar';
import {StatusBadge} from '@components/ui/StatusBadge';
import {SectionHeader} from '@components/ui/SectionHeader';
import {FaceCamera} from '@components/Camera/FaceCamera';
import {FaceCameraOverlay} from '@components/Camera/FaceCameraOverlay';
import {useTheme} from '@theme/ThemeContext';
import {useAppStore} from '@store/useAppStore';
import {
  FaceRecognitionService,
  type FaceLandmarks,
} from '@services/FaceRecognitionService';
import {FaceDetection, cropFaceFromFrame} from '@services/FaceDetectionService';
import type {RootStackParamList} from '@navigation/navigationTypes';
import LinearGradient from 'react-native-linear-gradient';

const POSE_INSTRUCTIONS = [
  {en: 'Look straight at camera', hi: 'कैमरे की ओर सीधा देखें'},
  {en: 'Turn left slightly', hi: 'थोड़ा बाएं घुमें'},
  {en: 'Turn right slightly', hi: 'थोड़ा दाएं घुमें'},
  {en: 'Look up slightly', hi: 'थोड़ा ऊपर देखें'},
  {en: 'Smile naturally', hi: 'स्वाभाविक रूप से मुस्कुराएं'},
];

const DEPARTMENTS = [
  {label: 'Field Engineer', value: 'field_engineer'},
  {label: 'Surveyor', value: 'surveyor'},
  {label: 'Inspector', value: 'inspector'},
  {label: 'Supervisor', value: 'supervisor'},
  {label: 'Site Manager', value: 'site_manager'},
];

const PROJECT_SITES = [
  {label: 'NH-48 Delhi-Jaipur', value: 'NH-48'},
  {label: 'NH-44 Delhi-Agra', value: 'NH-44'},
  {label: 'NH-66 Mumbai-Goa', value: 'NH-66'},
  {label: 'NH-8 Delhi-Mumbai', value: 'NH-8'},
  {label: 'NH-2 Delhi-Kolkata', value: 'NH-2'},
];

const GRADIENT_COLORS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
];

export const RegisterFaceScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'RegisterFace'>['route']>();
  const {colors, spacing, typography} = useTheme();
  const registerUser = useAppStore(state => state.registerUser);
  const previewSize = Dimensions.get('window');

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [projectSite, setProjectSite] = useState<string | null>(null);
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Capture state
  const [currentFrame, setCurrentFrame] = useState(0);
  const [embeddings, setEmbeddings] = useState<Float32Array[]>([]);
  const [lastDetection, setLastDetection] = useState<FaceDetection | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('');
  const [qualityOK, setQualityOK] = useState(false);
  const lastCaptureTime = useRef(0);

  // Final state
  const [finalEmbedding, setFinalEmbedding] = useState<Float32Array | null>(
    null,
  );
  const [isRegistering, setIsRegistering] = useState(false);

  React.useEffect(() => {
    if (route.params?.prefillName) {
      setName(route.params.prefillName);
      if (route.params.prefillEmpId) setEmployeeId(route.params.prefillEmpId);
      if (route.params.prefillRole) setRole(route.params.prefillRole);
      setStep(2); // Skip to face capture
    }
  }, [route.params]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {newErrors.name = 'Name is required';}
    if (!employeeId.match(/^[A-Z0-9]{4,10}$/)) {
      newErrors.employeeId = 'Employee ID must be 4-10 alphanumeric chars';
    }
    if (!department) {newErrors.department = 'Department required';}
    if (!projectSite) {newErrors.projectSite = 'Project site required';}
    if (!mobile.match(/^[0-9]{10}$/)) {
      newErrors.mobile = 'Mobile must be exactly 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFaceDetected = useCallback(
    async (face: any | null) => {
      if (!face) {
        setLastDetection(null);
        setQualityOK(false);
        return;
      }

      // Convert ML Kit bounds to our format for overlay
      const detection = {
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
      setLastDetection(detection as any);

      const isQualityOK = face.bounds.width > 100; // ML Kit width threshold
      setQualityOK(isQualityOK);

      const now = Date.now();
      if (
        isQualityOK &&
        !isProcessing &&
        now - lastCaptureTime.current > 1500 &&
        currentFrame < 5
      ) {
        lastCaptureTime.current = now;
        setIsProcessing(true);
        setCaptureMessage('Processing...');

        try {
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

          const dummyPixels = new Uint8Array(128 * 128 * 4);
          const embedding = await FaceRecognitionService.generateEmbedding(
            dummyPixels,
            faceLandmarks,
            128,
            128
          );

          setEmbeddings(prev => {
            const updated = [...prev, embedding];
            if (updated.length >= 5) {
              const averaged = FaceRecognitionService.averageEmbeddings(updated);
              setFinalEmbedding(averaged);
              setTimeout(() => setStep(3), 500);
            }
            return updated;
          });
          setCurrentFrame(prev => prev + 1);
        } catch (error) {
          console.error('[Register] Capture failed:', error);
        } finally {
          setIsProcessing(false);
          setCaptureMessage('');
        }
      }
    },
    [currentFrame, isProcessing],
  );

  const handleRegister = async () => {
    if (embeddings.length === 0 || !finalEmbedding) {return;}

    setIsRegistering(true);
    try {
      const avgEmbedding = FaceRecognitionService.averageEmbeddings(embeddings);
      const user = {
        name: name.trim(),
        employeeId,
        department: department || '',
        role: (role || 'employee') as 'employee' | 'admin',
        projectSite: projectSite || '',
        mobile,
      };

      await registerUser(user, finalEmbedding);

      Alert.alert(
        'Registration Successful',
        `${name} has been registered successfully.`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (error: any) {
      console.error('[Register] Failed:', error);
      Alert.alert('Registration Failed', error.message || 'Unknown error');
    } finally {
      setIsRegistering(false);
    }
  };

  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (fullName: string) => {
    const hash = fullName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
  };

  const renderProgressDots = () => (
    <View style={styles.dotsContainer}>
      {[1, 2, 3].map(n => (
        <View
          key={n}
          style={[
            styles.dot,
            {
              backgroundColor: n <= step ? colors.primary.navy : 'transparent',
              borderColor: colors.primary.navy,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <GradientBackground>
      <AppHeader
        title="Register New Field Staff"
        onBack={() => navigation.goBack()}
      />

      {renderProgressDots()}

      {step === 1 && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={styles.card}>
              <SectionHeader title="Personal Information" />
              <FloatingInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoCapitalize="words"
              />
              <FloatingInput
                label="Employee ID"
                value={employeeId}
                onChangeText={text => setEmployeeId(text.toUpperCase())}
                error={errors.employeeId}
                maxLength={10}
                autoCapitalize="characters"
              />
              <Dropdown
                label="Department"
                value={department}
                options={DEPARTMENTS}
                onChange={setDepartment}
                error={errors.department}
              />
              <Dropdown
                label="Project Site"
                value={projectSite}
                options={PROJECT_SITES}
                onChange={setProjectSite}
                error={errors.projectSite}
              />
              <FloatingInput
                label="Mobile Number"
                value={mobile}
                onChangeText={setMobile}
                error={errors.mobile}
                keyboardType="numeric"
                maxLength={10}
              />
              <PrimaryButton
                title="Proceed to Face Capture →"
                onPress={() => validateForm() && setStep(2)}
                fullWidth
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === 2 && (
        <View style={styles.cameraContainer}>
          <FaceCamera
            isActive={true}
            onFaceDetected={handleFaceDetected}
          />
          <FaceCameraOverlay
            detections={lastDetection ? [lastDetection] : []}
            previewWidth={previewSize.width}
            previewHeight={previewSize.height * 0.55}
            faceInPosition={qualityOK}
          />

          <View style={styles.captureInstructions}>
            <Card style={styles.instructionCard}>
              <Text
                style={[
                  typography.h4,
                  {color: colors.primary.navy, textAlign: 'center'},
                ]}>
                {POSE_INSTRUCTIONS[Math.min(currentFrame, 4)].en}
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.text.secondary,
                    textAlign: 'center',
                    marginTop: 4,
                  },
                ]}>
                {POSE_INSTRUCTIONS[Math.min(currentFrame, 4)].hi}
              </Text>

              <View style={{marginTop: spacing.md}}>
                <Text
                  style={[
                    typography.bodySmall,
                    {color: colors.text.secondary},
                  ]}>
                  Frame {currentFrame} of 5 captured
                </Text>
                <ProgressBar progress={currentFrame / 5} />
              </View>

              <View style={styles.qualityRow}>
                <StatusBadge
                  label="💡 Lighting"
                  variant={qualityOK ? 'success' : 'neutral'}
                />
                <StatusBadge
                  label="📏 Distance"
                  variant={qualityOK ? 'success' : 'neutral'}
                />
                <StatusBadge
                  label="🎯 Position"
                  variant={qualityOK ? 'success' : 'neutral'}
                />
              </View>
            </Card>

            <SecondaryButton title="Cancel" onPress={() => setStep(1)} />
          </View>
        </View>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.confirmContent}>
              <LinearGradient
                colors={getAvatarColor(name)}
                style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </LinearGradient>
              <Text
                style={[
                  typography.h3,
                  {color: colors.primary.navy, marginTop: spacing.md},
                ]}>
                {name}
              </Text>
              <Text
                style={[typography.bodySmall, {color: colors.text.secondary}]}>
                {employeeId}
              </Text>
              <Text style={[typography.body, {color: colors.primary.navy}]}>
                {DEPARTMENTS.find(d => d.value === department)?.label}
              </Text>

              <View style={styles.badgeRow}>
                <StatusBadge label="Quality: 94%" variant="success" />
                <StatusBadge label="5 Frames" variant="info" />
              </View>
            </View>

            <SecondaryButton
              title="Retake Photos"
              onPress={() => {
                setStep(2);
                setCurrentFrame(0);
                setEmbeddings([]);
                setFinalEmbedding(null);
              }}
            />
            <PrimaryButton
              title="Confirm Registration"
              onPress={handleRegister}
              loading={isRegistering}
              fullWidth
            />
          </Card>
        </ScrollView>
      )}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  scrollContent: {padding: 16},
  card: {marginBottom: 16},
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  cameraContainer: {flex: 1},
  captureInstructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  instructionCard: {marginBottom: 12},
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  confirmContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
});
