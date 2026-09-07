import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineSyncManager, offlineSyncManager } from './offlineSyncEngine';

const storageMock: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  // @ts-ignore
  globalThis.localStorage = {
    getItem: (key: string) => storageMock[key] ?? null,
    setItem: (key: string, val: string) => { storageMock[key] = String(val); },
    removeItem: (key: string) => { delete storageMock[key]; },
    clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
  };
}

// In-memory localStorage mock for node test environment
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = String(value); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
  key: (i: number) => Object.keys(storage)[i] ?? null,
  get length() { return Object.keys(storage).length; }
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = localStorageMock;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  };
}

describe('OfflineSyncManager (ISO 15189 Zero Data Loss)', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    offlineSyncManager.clearQueue();
    // Ensure offline simulation is reset to false
    if (offlineSyncManager.isSimulated()) {
      offlineSyncManager.toggleSimulatedOffline();
    }
  });

  it('should enqueue operations into local storage queue with metadata and timestamp', () => {
    const item = offlineSyncManager.enqueue({
      type: 'RESULT_UPDATE',
      sampleBarcode: 'B-99881',
      patientName: 'Pérez, Juan',
      testCode: 'GLUCOSA',
      payload: {
        resultId: 'res-101',
        value: '105',
        status: 'PENDIENTE',
        reason: 'Offline Entry'
      }
    });

    expect(item.id).toBeDefined();
    expect(item.status).toBe('PENDING');
    expect(item.timestamp).toBeDefined();
    expect(item.retryCount).toBe(0);

    const queue = offlineSyncManager.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].sampleBarcode).toBe('B-99881');
    expect(queue[0].payload.value).toBe('105');
  });

  it('should toggle simulated offline mode correctly and report status', () => {
    expect(offlineSyncManager.isSimulated()).toBe(false);
    
    // Toggle on
    const offlineState = offlineSyncManager.toggleSimulatedOffline();
    expect(offlineState).toBe(true);
    expect(offlineSyncManager.getConnectionStatus()).toBe(false);

    // Toggle off
    const onlineState = offlineSyncManager.toggleSimulatedOffline();
    expect(onlineState).toBe(false);
  });

  it('should generate ISO 15189 Disaster Recovery Package (DRP) with checksum', () => {
    offlineSyncManager.enqueue({
      type: 'RESULT_VALIDATION',
      sampleBarcode: 'B-12345',
      patientName: 'González, María',
      testCode: 'HEMOGRAMA',
      payload: {
        resultId: 'res-202',
        status: 'VALIDADO',
        authorName: 'Lic. Torres'
      }
    });

    const recoveryPkg = offlineSyncManager.generateEmergencyRecoveryPackage('Tec. Rodriguez (TM-882)');

    expect(recoveryPkg.fileName).toContain('LISCore_EMERGENCY_RECOVERY_PACKAGE');
    expect(recoveryPkg.checksum).toContain('SHA256:');
    expect(recoveryPkg.pkg.packageHeader.complianceStandard).toContain('ISO 15189');
    expect(recoveryPkg.pkg.metrics.totalRecords).toBe(1);
    expect(recoveryPkg.pkg.metrics.breakdownByType['RESULT_VALIDATION']).toBe(1);
    expect(recoveryPkg.pkg.unsyncedQueue.length).toBe(1);
  });

  it('should drain queue on syncPendingQueue without errors', async () => {
    offlineSyncManager.enqueue({
      type: 'TUBE_SCAN',
      sampleBarcode: 'TUBE-001',
      payload: { rack: 'R1', position: 4 }
    });

    expect(offlineSyncManager.getQueue().length).toBe(1);

    const result = await offlineSyncManager.syncPendingQueue();
    expect(result.syncedCount).toBe(1);
    expect(result.remainingCount).toBe(0);
    expect(offlineSyncManager.getQueue().length).toBe(0);
  });
});
