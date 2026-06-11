import { dbService } from './db';
import api from './api';
import toast from 'react-hot-toast';

class SyncManager {
  private isSyncing = false;

  async sync() {
    if (this.isSyncing) return;
    
    if (!navigator.onLine) {
      console.log('[SyncManager] Cannot sync, currently offline');
      return;
    }

    this.isSyncing = true;
    console.log('[SyncManager] Starting background synchronization...');

    try {
      const actions = await dbService.getSyncActions();
      
      if (actions.length === 0) {
        console.log('[SyncManager] No offline actions to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncManager] Found ${actions.length} actions to sync`);

      // Attempt to batch sync if there's a backend endpoint for it
      try {
        const response = await api.post('/api/sync/batch', { actions });
        
        if (response.data.success) {
          let conflictCount = 0;
          let successCount = 0;

          // Process results
          for (const result of response.data.results) {
            if (result.status === 'success') {
              successCount++;
              if (result.id !== undefined) await dbService.clearSyncAction(result.id);
            } else if (result.status === 'conflict_logged') {
              conflictCount++;
              if (result.id !== undefined) await dbService.clearSyncAction(result.id);
            }
          }
          
          if (successCount > 0) {
            toast.success(`Successfully synced ${successCount} offline actions.`);
          }
          if (conflictCount > 0) {
            toast.error(`${conflictCount} offline changes conflicted with server updates and require admin review.`, { duration: 6000 });
          }
          
          console.log('[SyncManager] Batch synchronization complete');
        } else {
           console.error('[SyncManager] Batch sync failed:', response.data);
           toast.error('Failed to sync offline changes.');
        }
      } catch (error) {
        console.error('[SyncManager] Failed to sync batch:', error);
      }

    } catch (error) {
      console.error('[SyncManager] Error during synchronization:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Set up event listeners
  init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncManager] Network restored. Triggering sync...');
        this.sync();
      });
    }
  }
}

export const syncManager = new SyncManager();
