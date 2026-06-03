/**
 * Model Manager - Singleton
 * Only manages face_detection.tflite now (recognition is feature-based)
 */

import {loadTensorflowModel, TensorflowModel} from 'react-native-fast-tflite';

class ModelManagerImpl {
  private faceDetectionModel: TensorflowModel | null = null;
  private faceRecognitionModel: TensorflowModel | null = null;
  private isInitialized = false;
  private isInitializing = false;

  async initialize(): Promise<void> {
    const startTime = performance.now();
    console.log('[ModelManager] Initializing models (skipped TFLite for ML Kit)...');
    try {
      this.isInitialized = true;
    } catch (error) {
      console.error('[ModelManager] Initialization failed:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async warmUp(): Promise<void> {
    if (!this.faceDetectionModel) {
      return;
    }

    console.log('[ModelManager] Warming up models...');
    const startTime = Date.now();

    try {
      const dummyInput = new Float32Array(128 * 128 * 3).fill(0);
      for (let i = 0; i < 3; i++) {
        await this.faceDetectionModel.run([dummyInput]);
      }

      const warmupTime = Date.now() - startTime;
      console.log(`[ModelManager] Warmup completed in ${warmupTime}ms`);
    } catch (error) {
      console.warn('[ModelManager] Warmup failed:', error);
    }
  }

  getFaceDetection(): TensorflowModel {
    if (!this.faceDetectionModel) {
      throw new Error('[ModelManager] Face detection model not loaded');
    }
    return this.faceDetectionModel;
  }

  isReady(): boolean {
    return this.isInitialized && this.faceDetectionModel !== null;
  }

  async releaseAll(): Promise<void> {
    this.faceDetectionModel = null;
    this.isInitialized = false;
    console.log('[ModelManager] Models released');
  }
}

export const ModelManager = new ModelManagerImpl();
