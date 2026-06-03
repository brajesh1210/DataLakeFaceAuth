/**
 * Face Recognition Service
 *
 * Feature-based face recognition using:
 * - Geometric features from BlazeFace landmarks (16 dims)
 * - Color histogram features (32 dims)
 * - LBP texture features (16 dims)
 * Total: 64-dimensional embedding
 */

export interface Point {
  x: number;
  y: number;
}

export interface FaceLandmarks {
  rightEye: Point;
  leftEye: Point;
  nose: Point;
  mouth: Point;
  rightEarTragion: Point;
  leftEarTragion: Point;
}

export interface MatchResult {
  userId: string;
  confidence: number;
}

const EMBEDDING_SIZE = 64;
export const MATCH_THRESHOLD = 0.85;
export const STRICT_THRESHOLD = 0.92;

class FaceRecognitionServiceImpl {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    console.log('[FaceRecognition] Initializing feature-based service');
    this.isInitialized = true;
  }

  /**
   * Generate 64-dim embedding from face crop + landmarks
   */
  async generateEmbedding(
    faceCrop: Uint8Array,
    landmarks: FaceLandmarks,
    width: number,
    height: number,
  ): Promise<Float32Array> {
    const embedding = new Float32Array(EMBEDDING_SIZE);

    const geometric = this.extractGeometricFeatures(landmarks);
    embedding.set(geometric, 0);

    const histogram = this.extractColorHistogram(faceCrop, width, height);
    embedding.set(histogram, 16);

    const texture = this.extractTextureFeatures(faceCrop, width, height);
    embedding.set(texture, 48);

    return this.l2Normalize(embedding);
  }

  /**
   * Geometric features from 6 landmarks (16 dimensions)
   */
  private extractGeometricFeatures(landmarks: FaceLandmarks): Float32Array {
    const features = new Float32Array(16);
    const {rightEye, leftEye, nose, mouth, rightEarTragion, leftEarTragion} =
      landmarks;

    const faceWidth = Math.max(
      this.distance(leftEarTragion, rightEarTragion),
      1,
    );

    features[0] = this.distance(leftEye, rightEye) / faceWidth;
    features[1] = this.distance(nose, mouth) / faceWidth;
    features[2] = this.distance(leftEye, nose) / faceWidth;
    features[3] = this.distance(rightEye, nose) / faceWidth;
    features[4] = this.distance(leftEye, mouth) / faceWidth;
    features[5] = this.distance(rightEye, mouth) / faceWidth;

    features[6] = this.normalizeAngle(this.angle(leftEye, rightEye, nose));
    features[7] = this.normalizeAngle(this.angle(leftEye, mouth, rightEye));
    features[8] = this.normalizeAngle(
      this.angle(leftEarTragion, nose, rightEarTragion),
    );

    features[9] = features[3] !== 0 ? features[2] / features[3] : 1;
    features[10] = features[5] !== 0 ? features[4] / features[5] : 1;

    const centerX = (leftEarTragion.x + rightEarTragion.x) / 2;
    features[11] = (nose.x - centerX) / faceWidth;
    features[12] = (mouth.x - centerX) / faceWidth;

    const faceArea = faceWidth * faceWidth;
    features[13] = this.triangleArea(leftEye, rightEye, nose) / faceArea;
    features[14] = this.triangleArea(leftEye, rightEye, mouth) / faceArea;
    features[15] = this.triangleArea(nose, mouth, leftEye) / faceArea;

    return features;
  }

  /**
   * Color histogram features (32 dimensions)
   * 8 bins each for R, G, B, brightness
   */
  private extractColorHistogram(
    pixels: Uint8Array,
    width: number,
    height: number,
  ): Float32Array {
    const histogram = new Float32Array(32);
    const totalPixels = width * height;
    let pixelCount = 0;

    for (let i = 0; i < pixels.length - 3; i += 4) {
      const r = Math.min(7, Math.floor(pixels[i] / 32));
      const g = Math.min(7, Math.floor(pixels[i + 1] / 32));
      const b = Math.min(7, Math.floor(pixels[i + 2] / 32));

      histogram[r] += 1;
      histogram[8 + g] += 1;
      histogram[16 + b] += 1;

      const brightness = Math.min(
        7,
        Math.floor(
          (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) /
            32,
        ),
      );
      histogram[24 + brightness] += 1;

      pixelCount += 1;
    }

    const divisor = Math.max(pixelCount, 1);
    for (let i = 0; i < 32; i++) {
      histogram[i] /= divisor;
    }

    return histogram;
  }

  /**
   * LBP texture features per quadrant (16 dimensions)
   */
  private extractTextureFeatures(
    pixels: Uint8Array,
    width: number,
    height: number,
  ): Float32Array {
    const features = new Float32Array(16);

    const grayLen = Math.floor(pixels.length / 4);
    const gray = new Uint8Array(grayLen);
    for (let i = 0, j = 0; i < pixels.length - 3 && j < grayLen; i += 4, j++) {
      gray[j] = Math.floor((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
    }

    const halfW = Math.floor(width / 2);
    const halfH = Math.floor(height / 2);

    const regions = [
      {x: 0, y: 0, w: halfW, h: halfH},
      {x: halfW, y: 0, w: halfW, h: halfH},
      {x: 0, y: halfH, w: halfW, h: halfH},
      {x: halfW, y: halfH, w: halfW, h: halfH},
    ];

    regions.forEach((region, idx) => {
      const stats = this.computeLBPStats(gray, region, width);
      features[idx * 4] = stats.mean;
      features[idx * 4 + 1] = stats.variance;
      features[idx * 4 + 2] = stats.entropy;
      features[idx * 4 + 3] = stats.uniformity;
    });

    return features;
  }

  private computeLBPStats(
    gray: Uint8Array,
    region: {x: number; y: number; w: number; h: number},
    fullWidth: number,
  ) {
    const lbpHist = new Float32Array(256);
    let pixelCount = 0;

    for (let y = region.y + 1; y < region.y + region.h - 1; y++) {
      for (let x = region.x + 1; x < region.x + region.w - 1; x++) {
        const centerIdx = y * fullWidth + x;
        if (centerIdx >= gray.length) {
          continue;
        }

        const center = gray[centerIdx];
        let code = 0;

        const neighbors = [
          gray[(y - 1) * fullWidth + (x - 1)] ?? 0,
          gray[(y - 1) * fullWidth + x] ?? 0,
          gray[(y - 1) * fullWidth + (x + 1)] ?? 0,
          gray[y * fullWidth + (x + 1)] ?? 0,
          gray[(y + 1) * fullWidth + (x + 1)] ?? 0,
          gray[(y + 1) * fullWidth + x] ?? 0,
          gray[(y + 1) * fullWidth + (x - 1)] ?? 0,
          gray[y * fullWidth + (x - 1)] ?? 0,
        ];

        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) {
            code |= 1 << i;
          }
        }

        lbpHist[code] += 1;
        pixelCount += 1;
      }
    }

    if (pixelCount === 0) {
      return {mean: 0, variance: 0, entropy: 0, uniformity: 0};
    }

    for (let i = 0; i < 256; i++) {
      lbpHist[i] /= pixelCount;
    }

    let mean = 0;
    let entropy = 0;
    let uniformity = 0;

    for (let i = 0; i < 256; i++) {
      const p = lbpHist[i];
      mean += i * p;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
      uniformity += p * p;
    }

    let variance = 0;
    for (let i = 0; i < 256; i++) {
      variance += Math.pow(i - mean, 2) * lbpHist[i];
    }

    return {
      mean: mean / 255,
      variance: Math.sqrt(variance) / 255,
      entropy: entropy / 8,
      uniformity,
    };
  }

  /**
   * Cosine similarity between two embeddings (0 to 1)
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    const similarity = dot / denominator;
    return Math.max(0, Math.min(1, (similarity + 1) / 2));
  }

  /**
   * L2 normalize an embedding vector
   */
  l2Normalize(embedding: Float32Array): Float32Array {
    let sumSq = 0;
    for (let i = 0; i < embedding.length; i++) {
      sumSq += embedding[i] * embedding[i];
    }

    const norm = Math.sqrt(sumSq);
    if (norm === 0) {
      return embedding;
    }

    const normalized = new Float32Array(embedding.length);
    for (let i = 0; i < embedding.length; i++) {
      normalized[i] = embedding[i] / norm;
    }
    return normalized;
  }

  /**
   * Average multiple embeddings (for 5-frame enrollment)
   */
  averageEmbeddings(embeddings: Float32Array[]): Float32Array {
    if (embeddings.length === 0) {
      return new Float32Array(EMBEDDING_SIZE);
    }

    const avg = new Float32Array(embeddings[0].length);
    for (const emb of embeddings) {
      for (let i = 0; i < emb.length; i++) {
        avg[i] += emb[i];
      }
    }

    for (let i = 0; i < avg.length; i++) {
      avg[i] /= embeddings.length;
    }

    return this.l2Normalize(avg);
  }

  /**
   * Find best matching user from candidates
   */
  async findBestMatch(
    embedding: Float32Array,
    candidates: {userId: string; embedding: Float32Array}[],
  ): Promise<MatchResult | null> {
    if (candidates.length === 0) {
      return null;
    }

    let bestMatch: MatchResult | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const similarity = this.cosineSimilarity(embedding, candidate.embedding);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = {userId: candidate.userId, confidence: similarity};
      }
    }

    if (__DEV__) {
      console.log(
        `[FaceRecognition] Best match score: ${bestScore.toFixed(3)}`,
      );
    }

    return bestScore >= MATCH_THRESHOLD ? bestMatch : null;
  }

  // Helper functions
  private distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  private angle(p1: Point, p2: Point, p3: Point): number {
    const v1x = p1.x - p2.x;
    const v1y = p1.y - p2.y;
    const v2x = p3.x - p2.x;
    const v2y = p3.y - p2.y;
    const dot = v1x * v2x + v1y * v2y;
    const det = v1x * v2y - v1y * v2x;
    return Math.atan2(det, dot);
  }

  private normalizeAngle(angleRad: number): number {
    return (angleRad + Math.PI) / (2 * Math.PI);
  }

  private triangleArea(p1: Point, p2: Point, p3: Point): number {
    return (
      Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) /
      2
    );
  }
}

export const FaceRecognitionService = new FaceRecognitionServiceImpl();
