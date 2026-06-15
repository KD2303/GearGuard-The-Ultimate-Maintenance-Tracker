import { dbService } from './db';
import api from './api';
import toast from 'react-hot-toast';

class SyncManager {
  private isSyncing = false;

  async sync() {
    if (this.isSyncing) return;
    
    if (!navigator.onLine) {
      return;
    }

    this.isSyncing = true;

    try {
      const actions = await dbService.getSyncActions();
      
      if (actions.length === 0) {
        this.isSyncing = false;
        return;
      }


      // Attempt to sync each request individually to its original URL
      let successCount = 0;
      let failCount = 0;

      for (const action of actions) {
        try {
          // Replay the request
          await api.request({
            url: action.url,
            method: action.method,
            data: action.payload,
          });
          
          successCount++;
          if (action.id !== undefined) {
            await dbService.clearSyncAction(action.id);
          }
        } catch (error: any) {
          console.error(`[SyncManager] Failed to replay action ${action.id} to ${action.url}:`, error);
          // If it's a 4xx/5xx error (not a network error), we might want to drop it to avoid infinite loops
          // However, for 409 Conflict, we keep it or let the user resolve it.
          // To keep it simple, if there is a response from the server, we consider it processed (even if it failed validation)
          // so it doesn't block the queue forever, except for specific codes if needed.
          if (error.response && error.response.status !== 409 && error.response.status !== 500) {
             if (action.id !== undefined) {
               await dbService.clearSyncAction(action.id);
             }
          }
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} offline actions.`);
      }
      if (failCount > 0) {
        toast.error(`Failed to sync ${failCount} offline actions. Please check your connection.`);
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
        this.sync();
      });
    }
  }
}

export const syncManager = new SyncManager();
