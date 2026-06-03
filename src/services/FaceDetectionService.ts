import {ModelManager} from './ModelManager';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

/**
 * BlazeFace short-range detection result.
 * The model outputs bounding boxes and 6 keypoints per face.
 */
export interface FaceDetection {
  /** Bounding box [xCenter, yCenter, width, height] normalized 0-1 */
  boundingBox: {
    xCenter: number;
    yCenter: number;
    width: number;
    height: number;
  };
  /** Confidence score 0-1 */
  score: number;
  /** 6 keypoints: right eye, left eye, nose, mouth, right ear, left ear */
  keypoints: Array<{x: number; y: number}>;
}

// BlazeFace constants
const DETECTION_THRESHOLD = 0.5;
const NMS_IOU_THRESHOLD = 0.3;

// Anchors for BlazeFace short-range (128x128)
// Pre-generated anchor centers for the SSD grid
const ANCHORS = generateAnchors();

function generateAnchors(): Array<{cx: number; cy: number}> {
  const anchors: Array<{cx: number; cy: number}> = [];
  // BlazeFace short-range uses 2 layers with strides [8, 16]
  // Layer 0: stride 8, grid 16x16, 2 anchors per cell = 512
  // Layer 1: stride 16, grid 8x8, 6 anchors per cell = 384
  const strides = [8, 16];
  const anchorsPerStride = [2, 6];

  for (let i = 0; i < strides.length; i++) {
    const stride = strides[i];
    const gridSize = Math.floor(128 / stride);
    const numAnchors = anchorsPerStride[i];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cx = (x + 0.5) / gridSize;
        const cy = (y + 0.5) / gridSize;
        for (let a = 0; a < numAnchors; a++) {
          anchors.push({cx, cy});
        }
      }
    }
  }
  return anchors;
}

/**
 * Preprocess a frame's pixel data to the 128x128x3 float32 input expected by BlazeFace.
 * Input pixel data should be RGBA Uint8Array (from camera frame).
 * Returns normalized [-1, 1] Float32Array of shape [1, 128, 128, 3].
 */
export function preprocessDetectionInput(
  rgbaPixels: Uint8Array,
  srcWidth: number,
  srcHeight: number,
): Float32Array {
  const targetSize = 128;
  const inputBuffer = new Float32Array(1 * targetSize * targetSize * 3);

  // Simple nearest-neighbor resize from source to 128x128
  const xScale = srcWidth / targetSize;
  const yScale = srcHeight / targetSize;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.min(Math.floor(x * xScale), srcWidth - 1);
      const srcY = Math.min(Math.floor(y * yScale), srcHeight - 1);
      const srcIdx = (srcY * srcWidth + srcX) * 4; // RGBA
      const dstIdx = (y * targetSize + x) * 3;

      // Normalize to [-1, 1]
      inputBuffer[dstIdx] = rgbaPixels[srcIdx] / 127.5 - 1.0; // R
      inputBuffer[dstIdx + 1] = rgbaPixels[srcIdx + 1] / 127.5 - 1.0; // G
      inputBuffer[dstIdx + 2] = rgbaPixels[srcIdx + 2] / 127.5 - 1.0; // B
    }
  }

  return inputBuffer;
}

/**
 * Run face detection on preprocessed input.
 * Returns array of detected faces (post-NMS).
 */
export function detectFaces(inputBuffer: Float32Array): FaceDetection[] {
  const model = ModelManager.getFaceDetection();
  const outputs = model.runSync([inputBuffer]);

  // BlazeFace outputs:
  // outputs[0]: regressors [1, 896, 16] - bounding box + 6 keypoints
  // outputs[1]: classificators [1, 896, 1] - confidence scores
  const regressors = outputs[0] as Float32Array;
  const classificators = outputs[1] as Float32Array;

  const numAnchors = ANCHORS.length;
  const rawDetections: FaceDetection[] = [];

  for (let i = 0; i < numAnchors; i++) {
    // Sigmoid of the classificator score
    const rawScore = classificators[i];
    const score = 1.0 / (1.0 + Math.exp(-rawScore));

    if (score < DETECTION_THRESHOLD) {
      continue;
    }

    const anchor = ANCHORS[i];
    const regOffset = i * 16;

    // Decode bounding box (relative to anchor)
    const xCenter = regressors[regOffset] / 128.0 + anchor.cx;
    const yCenter = regressors[regOffset + 1] / 128.0 + anchor.cy;
    const w = regressors[regOffset + 2] / 128.0;
    const h = regressors[regOffset + 3] / 128.0;

    // Decode 6 keypoints
    const keypoints: Array<{x: number; y: number}> = [];
    for (let k = 0; k < 6; k++) {
      const kpOffset = regOffset + 4 + k * 2;
      keypoints.push({
        x: regressors[kpOffset] / 128.0 + anchor.cx,
        y: regressors[kpOffset + 1] / 128.0 + anchor.cy,
      });
    }

    rawDetections.push({
      boundingBox: {xCenter, yCenter, width: w, height: h},
      score,
      keypoints,
    });
  }

  // Apply NMS
  return nonMaxSuppression(rawDetections, NMS_IOU_THRESHOLD);
}

/**
 * Compute IoU (Intersection over Union) between two bounding boxes.
 */
function computeIoU(
  a: FaceDetection['boundingBox'],
  b: FaceDetection['boundingBox'],
): number {
  const ax1 = a.xCenter - a.width / 2;
  const ay1 = a.yCenter - a.height / 2;
  const ax2 = a.xCenter + a.width / 2;
  const ay2 = a.yCenter + a.height / 2;

  const bx1 = b.xCenter - b.width / 2;
  const by1 = b.yCenter - b.height / 2;
  const bx2 = b.xCenter + b.width / 2;
  const by2 = b.yCenter + b.height / 2;

  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interArea =
    Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const unionArea = areaA + areaB - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

/**
 * Non-maximum suppression to remove overlapping detections.
 */
function nonMaxSuppression(
  detections: FaceDetection[],
  iouThreshold: number,
): FaceDetection[] {
  // Sort by score descending
  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const selected: FaceDetection[] = [];

  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) {
      continue;
    }
    selected.push(sorted[i]);

    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed.has(j)) {
        continue;
      }
      const iou = computeIoU(sorted[i].boundingBox, sorted[j].boundingBox);
      if (iou > iouThreshold) {
        suppressed.add(j);
      }
    }
  }

  return selected;
}

/**
 * Crop face region from RGBA pixel data based on detection bounding box.
 * Returns RGBA pixel data of the cropped region.
 */
export function cropFaceFromFrame(
  rgbaPixels: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  detection: FaceDetection,
  padding = 0.2,
): {pixels: Uint8Array; width: number; height: number} {
  const bb = detection.boundingBox;

  // Convert normalized coordinates to pixel coordinates
  let x1 = Math.floor((bb.xCenter - bb.width / 2) * srcWidth);
  let y1 = Math.floor((bb.yCenter - bb.height / 2) * srcHeight);
  let x2 = Math.ceil((bb.xCenter + bb.width / 2) * srcWidth);
  let y2 = Math.ceil((bb.yCenter + bb.height / 2) * srcHeight);

  // Add padding
  const padW = Math.floor((x2 - x1) * padding);
  const padH = Math.floor((y2 - y1) * padding);
  x1 = Math.max(0, x1 - padW);
  y1 = Math.max(0, y1 - padH);
  x2 = Math.min(srcWidth, x2 + padW);
  y2 = Math.min(srcHeight, y2 + padH);

  const cropW = x2 - x1;
  const cropH = y2 - y1;
  const cropped = new Uint8Array(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((y1 + y) * srcWidth + (x1 + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      cropped[dstIdx] = rgbaPixels[srcIdx];
      cropped[dstIdx + 1] = rgbaPixels[srcIdx + 1];
      cropped[dstIdx + 2] = rgbaPixels[srcIdx + 2];
      cropped[dstIdx + 3] = rgbaPixels[srcIdx + 3];
    }
  }

  return {pixels: cropped, width: cropW, height: cropH};
}

/**
 * Reads a JPEG file from disk, decodes it, and runs face detection.
 * Returns the detected faces along with the raw RGBA pixels.
 */
export async function detectFromFile(filePath: string): Promise<{
  faces: FaceDetection[];
  pixels: Uint8Array;
  width: number;
  height: number;
} | null> {
  try {
    const base64 = await RNFS.readFile(filePath, 'base64');
    const buffer = Buffer.from(base64, 'base64');
    
    // Decode JPEG to RGBA pixel array
    const jpegData = jpeg.decode(buffer, { useTArray: true }); // Returns Uint8Array
    const pixels = jpegData.data;
    const width = jpegData.width;
    const height = jpegData.height;
    
    // Preprocess and detect
    const inputBuffer = preprocessDetectionInput(pixels, width, height);
    const faces = detectFaces(inputBuffer);
    
    return {
      faces,
      pixels,
      width,
      height,
    };
  } catch (err) {
    console.warn('[FaceDetection] File detection failed:', err);
    return null;
  }
}
