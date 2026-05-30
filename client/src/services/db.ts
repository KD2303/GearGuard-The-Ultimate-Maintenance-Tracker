import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SyncAction {
  id: string; // uuid
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: any;
  timestamp: number;
}

interface GearGuardDB extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncAction;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<GearGuardDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<GearGuardDB>('gearguard-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });
}

export const dbService = {
  async addSyncAction(action: Omit<SyncAction, 'id' | 'timestamp'>) {
    if (!dbPromise) return;
    const db = await dbPromise;
    const fullAction: SyncAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await db.add('syncQueue', fullAction);
    console.log('[Offline] Action queued for sync:', fullAction);
  },

  async getSyncActions(): Promise<SyncAction[]> {
    if (!dbPromise) return [];
    const db = await dbPromise;
    return db.getAllFromIndex('syncQueue', 'by-timestamp');
  },

  async clearSyncAction(id: string) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.delete('syncQueue', id);
  },
};
