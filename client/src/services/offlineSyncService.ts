import { openDB, DBSchema, IDBPDatabase } from 'idb';
import api from './api';

interface OfflineQueueDB extends DBSchema {
  requests: {
    key: number;
    value: {
      id?: number;
      url: string;
      method: string;
      headers: Record<string, string>;
      data?: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

class OfflineSyncService {
  private dbPromise: Promise<IDBPDatabase<OfflineQueueDB>>;

  constructor() {
    this.dbPromise = openDB<OfflineQueueDB>('gearguard-offline-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('requests', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }

  async addRequestToQueue(config: any) {
    const db = await this.dbPromise;
    await db.add('requests', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data ? JSON.parse(config.data) : undefined,
      timestamp: Date.now(),
    });
  }

  async getQueueCount() {
    const db = await this.dbPromise;
    return await db.count('requests');
  }

  async syncQueue() {
    if (!navigator.onLine) return;

    const db = await this.dbPromise;
    const tx = db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');
    const requests = await store.getAll();

    if (requests.length === 0) return;

    // Sort by timestamp
    requests.sort((a, b) => a.timestamp - b.timestamp);

    for (const req of requests) {
      try {
        await api.request({
          url: req.url,
          method: req.method,
          data: req.data,
          headers: req.headers,
        });
        
        // Remove from queue upon success
        if (req.id) {
          await db.delete('requests', req.id);
        }
      } catch (error: any) {
        // If it's a network error, stop syncing and try later
        if (!error.response) {
          console.error('Network error during sync, pausing.');
          break;
        } else {
          // If it's a 4xx/5xx from the server, we might want to discard it to avoid blocking the queue forever.
          console.error(`Request to ${req.url} failed with status ${error.response.status}. Removing from queue.`);
          if (req.id) {
            await db.delete('requests', req.id);
          }
        }
      }
    }
  }

  // Subscribe to changes (simple polling or event)
  async watchQueue(callback: (count: number) => void) {
    // Basic polling or just call this whenever adding/syncing
    const count = await this.getQueueCount();
    callback(count);
  }
}

export const offlineSyncService = new OfflineSyncService();
