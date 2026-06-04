import { databaseService } from './DatabaseService';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errorMessage?: string;
  duration: number;
}

class SyncServiceImpl {
  private isSyncing = false;
  
  async syncNow(onProgress?: (progress: number) => void): Promise<SyncResult> {
    if (this.isSyncing) {
      return { 
        success: false, 
        syncedCount: 0, 
        failedCount: 0,
        errorMessage: 'Sync already in progress',
        duration: 0,
      };
    }
    
    this.isSyncing = true;
    const startTime = Date.now();
    
    try {
      // Get unsynced records
      const unsyncedRecords = await databaseService.getUnsyncedRecords();
      
      if (unsyncedRecords.length === 0) {
        this.isSyncing = false;
        return { 
          success: true, 
          syncedCount: 0, 
          failedCount: 0,
          duration: Date.now() - startTime,
        };
      }
      
      console.log(`[Sync] Syncing ${unsyncedRecords.length} records to AWS...`);
      
      // Batch upload (10 at a time for demo)
      const batchSize = 10;
      let syncedCount = 0;
      let failedCount = 0;
      const syncedIds: string[] = [];
      
      for (let i = 0; i < unsyncedRecords.length; i += batchSize) {
        const batch = unsyncedRecords.slice(i, i + batchSize);
        
        try {
          // Mock AWS API call (replace with real endpoint when available)
          const success = await this.uploadBatch(batch);
          
          if (success) {
            syncedCount += batch.length;
            syncedIds.push(...batch.map(r => r.id));
          } else {
            failedCount += batch.length;
          }
        } catch (err) {
          failedCount += batch.length;
        }
        
        // Update progress
        if (onProgress) {
          const progress = (i + batch.length) / unsyncedRecords.length;
          onProgress(Math.min(progress, 1));
        }
      }
      
      // Mark synced records in DB
      if (syncedIds.length > 0) {
        await databaseService.markRecordsSynced(syncedIds);
      }
      
      // Log sync event
      await databaseService.logSync({
        timestamp: Date.now(),
        recordsCount: syncedCount,
        failedCount,
        status: failedCount === 0 ? 'success' : 'partial',
      });
      
      const duration = Date.now() - startTime;
      console.log(`[Sync] Complete: ${syncedCount} synced, ${failedCount} failed in ${duration}ms`);
      
      return {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        duration,
      };
    } catch (error: any) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errorMessage: error?.message || 'Unknown error',
        duration: Date.now() - startTime,
      };
    } finally {
      this.isSyncing = false;
    }
  }
  
  private async uploadBatch(records: any[]): Promise<boolean> {
    // Mock upload - simulate network delay and 90% success rate
    await new Promise(resolve => setTimeout(resolve, 800));
    return Math.random() > 0.1;
  }
  
  async getPendingCount(): Promise<number> {
    const records = await databaseService.getUnsyncedRecords();
    return records.length;
  }
  
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const SyncService = new SyncServiceImpl();
