/**
 * 🗄️ PLATAFORMA-LIS — IndexedDB Native Storage Driver
 * =====================================================================
 * Provee almacenamiento transaccional no-bloqueante y asíncrono
 * para la cola de contingencia (Zero Data Loss - ISO 15189) y la
 * persistencia del estado clínico de Zustand.
 *
 * Capacidad: Múltiples Gigabytes (vs. ~5MB de localStorage)
 * Fallback: localStorage / memoria si IndexedDB no está disponible (ej. Vitest/Node)
 * =====================================================================
 */

const DB_NAME = 'LIS_CLINICAL_OFFLINE_DB';
const DB_VERSION = 1;

export const STORES = {
  SYNC_QUEUE: 'sync_queue',
  APP_CACHE: 'app_cache',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

class IndexedDbStorageDriver {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean = false;

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && Boolean(window.indexedDB);
  }

  /**
   * Abre o inicializa la conexión con la base de datos IndexedDB
   */
  private getDb(): Promise<IDBDatabase> {
    if (!this.isAvailable) {
      return Promise.reject(new Error('IndexedDB no está disponible en este entorno.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Store para cola de operaciones offline
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
            queueStore.createIndex('status', 'status', { unique: false });
            queueStore.createIndex('type', 'type', { unique: false });
            queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 2. Store Key-Value para persistencia de estado de la aplicación
          if (!db.objectStoreNames.contains(STORES.APP_CACHE)) {
            db.createObjectStore(STORES.APP_CACHE);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error || new Error('Error al abrir IndexedDB'));
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Verifica si IndexedDB está disponible y activo
   */
  public hasIndexedDb(): boolean {
    return this.isAvailable;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OPERACIONES KEY-VALUE (Zustand async createJSONStorage compatible)
  // ─────────────────────────────────────────────────────────────────────────────

  public async getItem(key: string): Promise<string | null> {
    if (!this.isAvailable) {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.APP_CACHE, 'readonly');
        const store = tx.objectStore(STORES.APP_CACHE);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve(req.result ?? null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    if (!this.isAvailable) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.APP_CACHE, 'readwrite');
        const store = tx.objectStore(STORES.APP_CACHE);
        const req = store.put(value, key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    }
  }

  public async removeItem(key: string): Promise<void> {
    if (!this.isAvailable) {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.APP_CACHE, 'readwrite');
        const store = tx.objectStore(STORES.APP_CACHE);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OPERACIONES PARA COLA OFFLINE (SYNC QUEUE)
  // ─────────────────────────────────────────────────────────────────────────────

  public async getQueueItems<T>(): Promise<T[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly');
        const store = tx.objectStore(STORES.SYNC_QUEUE);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[LISIndexedDB] Fallback al leer cola:', e);
      return [];
    }
  }

  public async saveQueueItem<T extends { id: string }>(item: T): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORES.SYNC_QUEUE);
        const req = store.put(item);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[LISIndexedDB] Error guardando ítem individual:', e);
    }
  }

  public async removeQueueItem(id: string): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORES.SYNC_QUEUE);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[LISIndexedDB] Error eliminando ítem:', e);
    }
  }

  public async replaceEntireQueue<T extends { id: string }>(items: T[]): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORES.SYNC_QUEUE);
        store.clear();
        for (const item of items) {
          store.put(item);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[LISIndexedDB] Error reemplazando cola:', e);
    }
  }

  public async clearQueue(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORES.SYNC_QUEUE);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[LISIndexedDB] Error limpiando cola:', e);
    }
  }

  /**
   * Consulta el almacenamiento estimado disponible en el navegador
   */
  public async getStorageEstimate(): Promise<{ usageBytes: number; quotaBytes: number; usagePercent: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 1;
        const usagePercent = Math.min(100, (usageBytes / quotaBytes) * 100);
        return { usageBytes, quotaBytes, usagePercent };
      } catch {
        // Fallback
      }
    }
    return { usageBytes: 0, quotaBytes: 0, usagePercent: 0 };
  }
}

export const lisIndexedDb = new IndexedDbStorageDriver();
