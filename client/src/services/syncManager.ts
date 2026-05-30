import { dbService } from './db';
import api from './api';

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
        const response = await api.post('/sync/batch', { actions });
        
        if (response.data.success) {
          // If successful, clear all synced actions
          for (const action of actions) {
            await dbService.clearSyncAction(action.id);
          }
          console.log('[SyncManager] Batch synchronization complete');
        } else {
           console.error('[SyncManager] Batch sync failed:', response.data);
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
