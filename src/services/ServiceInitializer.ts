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

  private initPromise: Promise<InitResult> | null = null;

  async initializeAll(): Promise<InitResult> {
    if (this.isInitialized) {
      return {
        encryption: true,
        database: true,
        models: true,
        recognition: true,
        errors: [],
      };
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    const result = await this.initPromise;
    this.initPromise = null;
    return result;
  }

  private async _doInitialize(): Promise<InitResult> {
    const result: InitResult = {
      encryption: false,
      database: false,
      models: false,
      recognition: false,
      errors: [],
    };

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

      // Seed data for Checkpoint N testing
      const userCount = await databaseService.getUserCount();
      if (userCount === 0) {
        console.log('[ServiceInitializer] Seeding test data...');
        // Seed 3 test employees
        await databaseService.createUser({
          id: 'emp_1',
          name: 'Rajesh Kumar',
          employeeId: 'EMP101',
          role: 'employee',
          department: 'Field Operations',
          registeredAt: Date.now(),
        } as any);
        await databaseService.createUser({
          id: 'emp_2',
          name: 'Sneha Patel',
          employeeId: 'EMP102',
          role: 'employee',
          department: 'Survey',
          registeredAt: Date.now(),
        } as any);
        await databaseService.createUser({
          id: 'emp_3',
          name: 'Amit Singh',
          employeeId: 'EMP103',
          role: 'employee',
          department: 'Inspection',
          registeredAt: Date.now(),
        } as any);
        
        // Seed some test leave applications
        await databaseService.createLeaveApplication({
          id: 'leave_1',
          userId: 'emp_1',
          userName: 'Rajesh Kumar',
          leaveType: 'Casual',
          date: Date.now() + 86400000, // Tomorrow
          reason: 'Family function',
          status: 'Pending',
          appliedAt: Date.now() - 86400000, // 1 day ago
        });
        await databaseService.createLeaveApplication({
          id: 'leave_2',
          userId: 'emp_2',
          userName: 'Sneha Patel',
          leaveType: 'Sick',
          date: Date.now(), // Today
          reason: 'Fever',
          status: 'Pending',
          appliedAt: Date.now(), // Today
        });
        console.log('[ServiceInitializer] Seeding complete');
      }

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
