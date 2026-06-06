import Dexie, { Table } from 'dexie';

export interface SyncAction {
  id?: number; // auto-increment
  uuid: string; // unique ID for conflict resolution
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: any;
  timestamp: number;
}

export class GearGuardDatabase extends Dexie {
  syncQueue!: Table<SyncAction, number>;

  constructor() {
    super('GearGuardDB');
    this.version(1).stores({
      syncQueue: '++id, uuid, url, method, timestamp'
    });
  }
}

export const db = new GearGuardDatabase();

type SyncQueueListener = (count: number) => void;

class DBService {
  private listeners: SyncQueueListener[] = [];

  subscribe(listener: SyncQueueListener) {
    this.listeners.push(listener);
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async notifyListeners() {
    try {
      const count = await db.syncQueue.count();
      this.listeners.forEach(l => l(count));
    } catch (err) {
      console.error('[DBService] failed to notify listeners', err);
    }
  }

  async addSyncAction(action: Omit<SyncAction, 'id' | 'uuid' | 'timestamp'>) {
    const fullAction: SyncAction = {
      ...action,
      uuid: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await db.syncQueue.add(fullAction);
    console.log('[Offline] Action queued for sync:', fullAction);
    this.notifyListeners();
  }

  async getSyncActions(): Promise<SyncAction[]> {
    return await db.syncQueue.orderBy('timestamp').toArray();
  }

  async clearSyncAction(id: number) {
    await db.syncQueue.delete(id);
    this.notifyListeners();
  }
  
  async getQueueCount(): Promise<number> {
    return await db.syncQueue.count();
  }
}

export const dbService = new DBService();
