import {FaceDetection} from './FaceDetectionService';
import {LivenessChallenge} from '../types/types';

/**
 * Liveness check result from a single frame analysis.
 */
export interface LivenessFrameResult {
  /** Whether the current challenge is passed */
  challengePassed: boolean;
  /** The current active challenge */
  currentChallenge: LivenessChallenge;
  /** Overall liveness score [0-1] for this frame */
  livenessScore: number;
  /** Whether texture analysis passed (passive anti-spoofing) */
  textureCheckPassed: boolean;
  /** Descriptive message for UI */
  message: string;
}

// ─── EAR/MAR Constants ──────────────────────────────────────────────
// Eye Aspect Ratio: ratio of the vertical eye distances to the horizontal eye distance
// When the eye is closed, EAR drops below the threshold (lower drop required = easier)
const EAR_BLINK_THRESHOLD = 0.15;

// Mouth Aspect Ratio: when mouth is open/smiling, MAR exceeds the threshold (lower increase required = easier)
const MAR_SMILE_THRESHOLD = 0.25;

// Head turn detection: ratio of left/right eye distances to nose (lower asymmetry required = easier)
const TURN_THRESHOLD = 0.10;

// LBP texture variance threshold (screens have lower texture variance)
const LBP_VARIANCE_THRESHOLD = 10.0;

// Number of consecutive frames the challenge must be detected
const CHALLENGE_FRAME_COUNT = 2;

/**
 * Active + Passive Liveness Detection Service.
 *
 * Active challenges:
 *  - Blink: Eye Aspect Ratio (EAR) tracking
 *  - Smile: Mouth Aspect Ratio (MAR) tracking
 *  - Turn: Head pose estimation from keypoint asymmetry
 *
 * Passive anti-spoofing:
 *  - LBP (Local Binary Pattern) texture analysis to distinguish
 *    real skin from flat screen/photo
 */
export class LivenessService {
  private currentChallenge: LivenessChallenge = 'blink';
  private challengeSequence: LivenessChallenge[] = [];
  private challengeIndex = 0;
  private consecutiveDetections = 0;
  private baselineEAR: number | null = null;
  private baselineMAR: number | null = null;
  private frameCount = 0;
  private challengesPassed = 0;
  private totalChallenges = 0;

  /**
   * Initialize a liveness session with a random challenge sequence.
   * @param numChallenges Number of challenges to present (default 2 for speed)
   */
  startSession(numChallenges = 2): LivenessChallenge[] {
    const allChallenges: LivenessChallenge[] = ['blink', 'smile', 'turn'];
    // Shuffle and pick
    const shuffled = allChallenges.sort(() => Math.random() - 0.5);
    this.challengeSequence = shuffled.slice(0, numChallenges);
    this.challengeIndex = 0;
    this.currentChallenge = this.challengeSequence[0];
    this.consecutiveDetections = 0;
    this.baselineEAR = null;
    this.baselineMAR = null;
    this.frameCount = 0;
    this.challengesPassed = 0;
    this.totalChallenges = numChallenges;

    console.log(
      '[Liveness] Session started. Challenges:',
      this.challengeSequence,
    );
    return this.challengeSequence;
  }

  /**
   * Process a single frame with face detection keypoints.
   * Returns liveness analysis for the frame.
   */
  processFrame(
    detection: FaceDetection,
    grayscalePixels?: Uint8Array,
    frameWidth?: number,
    frameHeight?: number,
  ): LivenessFrameResult {
    this.frameCount++;
    let challengePassed = false;

    // ─── Active Challenge Check ──────────────────────
    switch (this.currentChallenge) {
      case 'blink':
        challengePassed = this.checkBlink(detection);
        break;
      case 'smile':
        challengePassed = this.checkSmile(detection);
        break;
      case 'turn':
        challengePassed = this.checkHeadTurn(detection);
        break;
    }

    // Track consecutive detections for robustness
    if (challengePassed) {
      this.consecutiveDetections++;
    } else {
      this.consecutiveDetections = Math.max(0, this.consecutiveDetections - 1);
    }

    const challengeConfirmed =
      this.consecutiveDetections >= CHALLENGE_FRAME_COUNT;

    // ─── Passive Texture Check ───────────────────────
    let textureCheckPassed = true;
    if (grayscalePixels && frameWidth && frameHeight) {
      const lbpVariance = this.computeLBPVariance(
        grayscalePixels,
        frameWidth,
        frameHeight,
        detection,
      );
      textureCheckPassed = lbpVariance > LBP_VARIANCE_THRESHOLD;
      if (!textureCheckPassed) {
        console.warn(
          `[Liveness] LBP variance too low (${lbpVariance.toFixed(
            2,
          )}). Possible spoof.`,
        );
      }
    }

    // Advance to next challenge if confirmed
    if (challengeConfirmed) {
      this.challengesPassed++;
      this.consecutiveDetections = 0;

      if (this.challengeIndex < this.challengeSequence.length - 1) {
        this.challengeIndex++;
        this.currentChallenge = this.challengeSequence[this.challengeIndex];
        this.baselineEAR = null;
        this.baselineMAR = null;
      }
    }

    const livenessScore = this.computeOverallScore(textureCheckPassed);

    const message = challengeConfirmed
      ? `✓ ${this.getChallengeLabel(this.currentChallenge)} detected!`
      : `Please ${this.getChallengeInstruction(this.currentChallenge)}`;

    return {
      challengePassed: challengeConfirmed,
      currentChallenge: this.currentChallenge,
      livenessScore,
      textureCheckPassed,
      message,
    };
  }

  /**
   * Check if all challenges in the session are passed.
   */
  isSessionComplete(): boolean {
    return this.challengesPassed >= this.totalChallenges;
  }

  /**
   * Get the overall liveness score for the session.
   */
  getSessionScore(): number {
    if (this.totalChallenges === 0) {
      return 0;
    }
    return this.challengesPassed / this.totalChallenges;
  }

  // ─── Active Challenge Implementations ───────────────────

  /**
   * Blink detection using Eye Aspect Ratio (EAR).
   * EAR decreases when eyes close. We detect a blink when EAR
   * drops significantly below baseline.
   */
  private checkBlink(detection: FaceDetection): boolean {
    // BlazeFace keypoints: [rightEye, leftEye, nose, mouth, rightEar, leftEar]
    const keypoints = detection.keypoints;
    if (keypoints.length < 4) {
      return false;
    }

    const rightEye = keypoints[0];
    const leftEye = keypoints[1];
    const nose = keypoints[2];

    // Approximate EAR using distance ratios from BlazeFace keypoints
    // Since BlazeFace only gives center keypoints (not eye corners),
    // we use the vertical distance between eye and nose relative to
    // horizontal inter-eye distance as a proxy for EAR
    const interEyeDist = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2),
    );
    const rightEyeToNose = Math.sqrt(
      Math.pow(rightEye.x - nose.x, 2) + Math.pow(rightEye.y - nose.y, 2),
    );
    const leftEyeToNose = Math.sqrt(
      Math.pow(leftEye.x - nose.x, 2) + Math.pow(leftEye.y - nose.y, 2),
    );

    const ear = (rightEyeToNose + leftEyeToNose) / (2.0 * interEyeDist);

    // Establish baseline over first few frames
    if (this.baselineEAR === null && this.frameCount <= 5) {
      this.baselineEAR = ear;
      return false;
    }

    if (this.baselineEAR === null) {
      this.baselineEAR = ear;
    }

    // Detect significant drop in EAR (blink)
    const earDrop = this.baselineEAR - ear;
    return earDrop > EAR_BLINK_THRESHOLD * this.baselineEAR;
  }

  /**
   * Smile detection using Mouth Aspect Ratio (MAR).
   */
  private checkSmile(detection: FaceDetection): boolean {
    const keypoints = detection.keypoints;
    if (keypoints.length < 4) {
      return false;
    }

    const rightEye = keypoints[0];
    const leftEye = keypoints[1];
    const mouth = keypoints[3];

    const interEyeDist = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2),
    );

    // Mouth width relative to face (wider when smiling)
    // Since we only have mouth center, use the bounding box width as proxy
    const bb = detection.boundingBox;
    const mouthToNoseRatio = Math.abs(mouth.y - keypoints[2].y) / interEyeDist;

    // Establish baseline
    if (this.baselineMAR === null && this.frameCount <= 5) {
      this.baselineMAR = mouthToNoseRatio;
      return false;
    }

    if (this.baselineMAR === null) {
      this.baselineMAR = mouthToNoseRatio;
    }

    // Detect increase in MAR (smile)
    const marIncrease = mouthToNoseRatio - this.baselineMAR;
    return marIncrease > MAR_SMILE_THRESHOLD * this.baselineMAR;
  }

  /**
   * Head turn detection using keypoint asymmetry.
   */
  private checkHeadTurn(detection: FaceDetection): boolean {
    const keypoints = detection.keypoints;
    if (keypoints.length < 6) {
      return false;
    }

    const rightEye = keypoints[0];
    const leftEye = keypoints[1];
    const nose = keypoints[2];

    // Calculate asymmetry: distance from nose to each eye
    const rightDist = Math.abs(rightEye.x - nose.x);
    const leftDist = Math.abs(leftEye.x - nose.x);

    const totalDist = rightDist + leftDist;
    if (totalDist === 0) {
      return false;
    }

    const asymmetry = Math.abs(rightDist - leftDist) / totalDist;

    // Significant asymmetry = head turn
    return asymmetry > TURN_THRESHOLD;
  }

  // ─── Passive LBP Texture Analysis ──────────────────────

  /**
   * Compute Local Binary Pattern variance on the face region.
   * Real faces have higher texture variance than flat screens/photos.
   */
  private computeLBPVariance(
    grayscalePixels: Uint8Array,
    width: number,
    height: number,
    detection: FaceDetection,
  ): number {
    const bb = detection.boundingBox;

    // Extract face region coordinates
    const x1 = Math.max(1, Math.floor((bb.xCenter - bb.width / 2) * width));
    const y1 = Math.max(1, Math.floor((bb.yCenter - bb.height / 2) * height));
    const x2 = Math.min(
      width - 2,
      Math.floor((bb.xCenter + bb.width / 2) * width),
    );
    const y2 = Math.min(
      height - 2,
      Math.floor((bb.yCenter + bb.height / 2) * height),
    );

    if (x2 <= x1 || y2 <= y1) {
      return 0;
    }

    // Sample LBP values (don't process every pixel for performance)
    const step = 3; // Sample every 3rd pixel
    const lbpValues: number[] = [];

    for (let y = y1; y < y2; y += step) {
      for (let x = x1; x < x2; x += step) {
        const center = grayscalePixels[y * width + x];
        let lbp = 0;

        // 8-neighbor LBP
        const neighbors = [
          grayscalePixels[(y - 1) * width + (x - 1)],
          grayscalePixels[(y - 1) * width + x],
          grayscalePixels[(y - 1) * width + (x + 1)],
          grayscalePixels[y * width + (x + 1)],
          grayscalePixels[(y + 1) * width + (x + 1)],
          grayscalePixels[(y + 1) * width + x],
          grayscalePixels[(y + 1) * width + (x - 1)],
          grayscalePixels[y * width + (x - 1)],
        ];

        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) {
            lbp |= 1 << i;
          }
        }

        lbpValues.push(lbp);
      }
    }

    if (lbpValues.length === 0) {
      return 0;
    }

    // Compute variance of LBP histogram
    const mean = lbpValues.reduce((s, v) => s + v, 0) / lbpValues.length;
    const variance =
      lbpValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
      lbpValues.length;

    return Math.sqrt(variance);
  }

  // ─── Helpers ────────────────────────────────────────────

  private getChallengeLabel(challenge: LivenessChallenge): string {
    switch (challenge) {
      case 'blink':
        return 'Blink';
      case 'smile':
        return 'Smile';
      case 'turn':
        return 'Head turn';
    }
  }

  private getChallengeInstruction(challenge: LivenessChallenge): string {
    switch (challenge) {
      case 'blink':
        return 'blink your eyes';
      case 'smile':
        return 'smile';
      case 'turn':
        return 'slowly turn your head left or right';
    }
  }

  getCurrentChallenge(): LivenessChallenge {
    return this.currentChallenge;
  }

  getChallengeProgress(): {current: number; total: number} {
    return {current: this.challengesPassed, total: this.totalChallenges};
  }

  private computeOverallScore(textureOk: boolean): number {
    const activeScore =
      this.totalChallenges > 0
        ? this.challengesPassed / this.totalChallenges
        : 0;
    const passiveScore = textureOk ? 1.0 : 0.3;
    // Weighted: 70% active, 30% passive
    return activeScore * 0.7 + passiveScore * 0.3;
  }
}

export const livenessService = new LivenessService();
