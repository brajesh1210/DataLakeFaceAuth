import {encryptionService} from './EncryptionService';
import {databaseService} from './DatabaseService';
import {ModelManager} from './ModelManager';
import {FaceRecognitionService} from './FaceRecognitionService';

export interface InitResult {
  encryption: boolean;
  database: boolean;
  models: boolean;
  recognition: boolean;
  errors: string[];
}

class ServiceInitializerImpl {
  private isInitialized = false;

  async initializeAll(): Promise<InitResult> {
    const result: InitResult = {
      encryption: false,
      database: false,
      models: false,
      recognition: false,
      errors: [],
    };

    if (this.isInitialized) {
      result.encryption = true;
      result.database = true;
      result.models = true;
      result.recognition = true;
      return result;
    }

    console.log('[ServiceInitializer] Starting initialization...');
    const startTime = Date.now();

    try {
      await encryptionService.initialize();
      result.encryption = true;
      console.log('[ServiceInitializer] ✓ Encryption ready');
    } catch (error: any) {
      result.errors.push(`Encryption: ${error.message}`);
      console.error('[ServiceInitializer] ✗ Encryption failed:', error);
    }

    try {
      await databaseService.initialize();
      result.database = true;
      console.log('[ServiceInitializer] ✓ Database ready');
    } catch (error: any) {
      result.errors.push(`Database: ${error.message}`);
      console.error('[ServiceInitializer] ✗ Database failed:', error);
    }

    try {
      await ModelManager.initialize();
      result.models = true;
      console.log('[ServiceInitializer] ✓ Models ready');
    } catch (error: any) {
      result.errors.push(`Models: ${error.message}`);
      console.error('[ServiceInitializer] ✗ Models failed:', error);
    }

    try {
      await FaceRecognitionService.initialize();
      result.recognition = true;
      console.log('[ServiceInitializer] ✓ Recognition ready');
    } catch (error: any) {
      result.errors.push(`Recognition: ${error.message}`);
      console.error('[ServiceInitializer] ✗ Recognition failed:', error);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[ServiceInitializer] Completed in ${totalTime}ms`);

    this.isInitialized = result.encryption && result.database;
    return result;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Backward compatibility alias
export const initializeServices = () => ServiceInitializer.initializeAll();
export const ServiceInitializer = new ServiceInitializerImpl();
