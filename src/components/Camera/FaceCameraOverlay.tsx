import React, {useMemo} from 'react';
import {StyleSheet, View, Text, Dimensions} from 'react-native';
import Svg, {Rect, Circle, Line} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import {FaceDetection} from '../../services/FaceDetectionService';
import {useTheme} from '../../theme/ThemeContext';
import {LivenessChallenge} from '../../types/types';

interface FaceCameraOverlayProps {
  /** Detected faces to overlay bounding boxes for */
  detections: FaceDetection[];
  /** Dimensions of the camera preview */
  previewWidth: number;
  previewHeight: number;
  /** Whether a face is in the target zone */
  faceInPosition: boolean;
  /** Current liveness challenge being performed */
  currentChallenge?: LivenessChallenge;
  /** Liveness message to display */
  livenessMessage?: string;
  /** Overall stage message */
  stageMessage?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * SVG-based overlay that shows:
 * - Face guide oval
 * - Bounding boxes around detected faces
 * - Keypoint dots
 * - Liveness challenge instructions
 */
export function FaceCameraOverlay({
  detections,
  previewWidth,
  previewHeight,
  faceInPosition,
  currentChallenge,
  livenessMessage,
  stageMessage,
}: FaceCameraOverlayProps) {
  const {colors} = useTheme();

  const guideColor = faceInPosition ? '#00E676' : 'rgba(255, 255, 255, 0.6)';

  // Center guide oval dimensions
  const ovalCx = previewWidth / 2;
  const ovalCy = previewHeight * 0.4;
  const ovalRx = previewWidth * 0.28;
  const ovalRy = previewHeight * 0.22;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width={previewWidth}
        height={previewHeight}
        style={StyleSheet.absoluteFill}>
        {/* Guide oval */}
        <Rect
          x={ovalCx - ovalRx}
          y={ovalCy - ovalRy}
          width={ovalRx * 2}
          height={ovalRy * 2}
          rx={ovalRx}
          ry={ovalRy}
          stroke={guideColor}
          strokeWidth={3}
          strokeDasharray={faceInPosition ? undefined : '8,8'}
          fill="none"
        />

        {/* Bounding boxes for each detection */}
        {detections.map((face, idx) => {
          const bb = face.boundingBox;
          // Convert normalized coords to pixel coords
          // Note: front camera is mirrored, so we flip x
          const x = (1 - bb.xCenter - bb.width / 2) * previewWidth;
          const y = (bb.yCenter - bb.height / 2) * previewHeight;
          const w = bb.width * previewWidth;
          const h = bb.height * previewHeight;

          const boxColor = faceInPosition ? '#00E676' : '#448AFF';

          return (
            <React.Fragment key={idx}>
              {/* Bounding box */}
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                stroke={boxColor}
                strokeWidth={2}
                fill="none"
                rx={8}
                ry={8}
              />

              {/* Keypoints */}
              {face.keypoints.map((kp, kpIdx) => (
                <Circle
                  key={kpIdx}
                  cx={(1 - kp.x) * previewWidth}
                  cy={kp.y * previewHeight}
                  r={3}
                  fill={boxColor}
                />
              ))}

              {/* Confidence label */}
              <Rect
                x={x}
                y={y - 18}
                width={60}
                height={16}
                fill={boxColor}
                rx={4}
                ry={4}
              />
            </React.Fragment>
          );
        })}

        {/* Corner markers for the guide */}
        {renderCornerMarkers(ovalCx, ovalCy, ovalRx, ovalRy, guideColor)}
      </Svg>

      {/* Liveness instruction */}
      {livenessMessage && (
        <View style={styles.instructionContainer}>
          <View
            style={[
              styles.instructionBox,
              {backgroundColor: 'rgba(0,0,0,0.7)'},
            ]}>
            {currentChallenge && (
              <Text style={styles.challengeIcon}>
                {getChallengeIcon(currentChallenge)}
              </Text>
            )}
            <Text style={styles.instructionText}>{livenessMessage}</Text>
          </View>
        </View>
      )}

      {/* Stage message at bottom */}
      {stageMessage && (
        <View style={styles.stageContainer}>
          <Text style={[styles.stageText, {color: colors.text.primary}]}>
            {stageMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

function renderCornerMarkers(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
) {
  const markerLen = 20;
  const corners = [
    {x: cx - rx, y: cy - ry}, // top-left
    {x: cx + rx, y: cy - ry}, // top-right
    {x: cx - rx, y: cy + ry}, // bottom-left
    {x: cx + rx, y: cy + ry}, // bottom-right
  ];

  return corners.map((corner, idx) => {
    const dx = idx % 2 === 0 ? 1 : -1;
    const dy = idx < 2 ? 1 : -1;

    return (
      <React.Fragment key={`corner-${idx}`}>
        <Line
          x1={corner.x}
          y1={corner.y}
          x2={corner.x + dx * markerLen}
          y2={corner.y}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Line
          x1={corner.x}
          y1={corner.y}
          x2={corner.x}
          y2={corner.y + dy * markerLen}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </React.Fragment>
    );
  });
}

function getChallengeIcon(challenge: LivenessChallenge): string {
  switch (challenge) {
    case 'blink':
      return '👁️';
    case 'smile':
      return '😊';
    case 'turn':
      return '↔️';
  }
}

const styles = StyleSheet.create({
  instructionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
  },
  challengeIcon: {
    fontSize: 24,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stageContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  stageText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
