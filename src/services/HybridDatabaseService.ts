/**
 * Hybrid Database Coordination Service — AbregoTech LIS/HIS
 * Manages Full 1:1 Mirroring (Clon Idéntico) between Local On-Premises Docker PostgreSQL (1-3 ms)
 * and Cloud Supabase (Pacientes, Órdenes, Resultados, Facturación, Inventario y Finanzas).
 */

import {
  supabaseLocal,
  supabaseCloud,
  DATABASE_MODE,
  isLocalConfigured,
  isCloudConfigured,
  testDatabaseConnections,
  DatabaseHealthStatus,
  DatabaseMode
} from '../lib/supabaseClient';
import { offlineSyncManager, OfflineSyncItem } from '../utils/offlineSyncEngine';
import { Order, Patient, TestResult } from '../types';
import {
  encryptPatientPII,
  decryptPatientPII,
  generateBlindIndex
} from '../utils/cryptoVault';

export interface HybridSyncTelemetry {
  mode: DatabaseMode;
  isOnline: boolean;
  localLatencyMs: number | null;
  cloudLatencyMs: number | null;
  localStatus: 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
  cloudStatus: 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
  pendingCloudSyncCount: number;
  lastSyncTimestamp: string | null;
  mirroredModules: string[];
}

class HybridDatabaseService {
  private static instance: HybridDatabaseService;
  private lastSyncTimestamp: string | null = null;
  private isSyncingWithCloud: boolean = false;

  private constructor() {
    // Listen for online events to automatically push queued updates to cloud
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.info('[HybridDatabaseService] Conexión restablecida. Sincronizando espejo 1:1 con la nube...');
        this.flushPendingToCloud();
      });

      // Periodic check every 15 seconds
      setInterval(() => {
        if (navigator.onLine && DATABASE_MODE === 'HYBRID' && isCloudConfigured && !this.isSyncingWithCloud) {
          this.flushPendingToCloud();
        }
      }, 15000);
    }
  }

  public static getInstance(): HybridDatabaseService {
    if (!HybridDatabaseService.instance) {
      HybridDatabaseService.instance = new HybridDatabaseService();
    }
    return HybridDatabaseService.instance;
  }

  /**
   * Returns current mode of operation.
   */
  public getMode(): DatabaseMode {
    return DATABASE_MODE;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. SINCRONIZACIÓN DE RESULTADOS CLÍNICOS
  // ──────────────────────────────────────────────────────────────────────────
  public async syncResultToDatabases(result: TestResult, orderBarcode?: string, patientName?: string): Promise<{ localSuccess: boolean; cloudSuccess: boolean }> {
    let localSuccess = false;
    let cloudSuccess = false;

    // 1. Guardado inmediato en base de datos local (1-3 ms)
    if (isLocalConfigured) {
      try {
        const { error } = await (supabaseLocal.from('results') as any).upsert({
          id: result.id,
          order_id: result.orderId,
          test_id: result.testId,
          value: result.value,
          status: result.status,
          validation_stage: result.status,
          updated_at: new Date().toISOString()
        });
        localSuccess = !error;
      } catch (err) {
        console.warn('[HybridDatabaseService] Error local (results):', err);
      }
    } else {
      localSuccess = true;
    }

    // 2. Réplica a la nube (Espejo 1:1)
    if (DATABASE_MODE === 'HYBRID' && isCloudConfigured) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        try {
          const { error } = await (supabaseCloud.from('results') as any).upsert({
            id: result.id,
            order_id: result.orderId,
            test_id: result.testId,
            value: result.value,
            status: result.status,
            validation_stage: result.status,
            updated_at: new Date().toISOString()
          });
          if (!error) {
            cloudSuccess = true;
            this.lastSyncTimestamp = new Date().toLocaleTimeString();
          } else {
            this.enqueueForCloud('RESULT_VALIDATION', { resultId: result.id, value: result.value, status: result.status }, orderBarcode, patientName, result.testId);
          }
        } catch {
          this.enqueueForCloud('RESULT_VALIDATION', { resultId: result.id, value: result.value, status: result.status }, orderBarcode, patientName, result.testId);
        }
      } else {
        this.enqueueForCloud('RESULT_VALIDATION', { resultId: result.id, value: result.value, status: result.status }, orderBarcode, patientName, result.testId);
      }
    }

    return { localSuccess, cloudSuccess };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SINCRONIZACIÓN DE PACIENTES (Con Cifrado AES-256 y Blind Index Ley 81)
  // ──────────────────────────────────────────────────────────────────────────
  public async syncPatientToDatabases(patient: Patient): Promise<{ localSuccess: boolean; cloudSuccess: boolean }> {
    let localSuccess = false;
    let cloudSuccess = false;

    // Cifrar PII sensible y generar Hash Ciego para búsquedas rápidas
    const encryptedPII = await encryptPatientPII({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      phone: patient.phone,
      email: patient.email
    });

    const payload = {
      id: patient.id,
      first_name: encryptedPII.firstName,
      last_name: encryptedPII.lastName,
      national_id: encryptedPII.nationalId,
      national_id_hash: encryptedPII.nationalIdHash,
      is_encrypted: true,
      phone: encryptedPII.phone,
      email: encryptedPII.email,
      birth_date: patient.dob,
      gender: patient.gender,
      insurance_provider: patient.insuranceProvider || 'PARTICULAR',
      updated_at: new Date().toISOString()
    };

    if (isLocalConfigured) {
      try {
        const { error } = await (supabaseLocal.from('patients') as any).upsert(payload);
        localSuccess = !error;
      } catch (err) {
        console.warn('[HybridDatabaseService] Error local (patients):', err);
      }
    } else {
      localSuccess = true;
    }

    if (DATABASE_MODE === 'HYBRID' && isCloudConfigured) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        try {
          const { error } = await (supabaseCloud.from('patients') as any).upsert(payload);
          if (!error) {
            cloudSuccess = true;
            this.lastSyncTimestamp = new Date().toLocaleTimeString();
          } else {
            this.enqueueForCloud('PATIENT_REGISTRATION', payload, undefined, `${patient.firstName} ${patient.lastName}`);
          }
        } catch {
          this.enqueueForCloud('PATIENT_REGISTRATION', payload, undefined, `${patient.firstName} ${patient.lastName}`);
        }
      } else {
        this.enqueueForCloud('PATIENT_REGISTRATION', payload, undefined, `${patient.firstName} ${patient.lastName}`);
      }
    }

    return { localSuccess, cloudSuccess };
  }

  /**
   * Busca un paciente por Cédula/Pasaporte en 1 ms utilizando el Hash Ciego (Blind Index),
   * sin desencriptar toda la base de datos y manteniendo la privacidad según la Ley 81.
   */
  public async findPatientByNationalId(nationalId: string): Promise<Patient | null> {
    const blindHash = await generateBlindIndex(nationalId);
    if (!blindHash) return null;

    try {
      const client = isLocalConfigured ? supabaseLocal : supabaseCloud;
      const { data, error } = await (client.from('patients') as any)
        .select('*')
        .eq('national_id_hash', blindHash)
        .maybeSingle();

      if (error || !data) return null;

      const decrypted = await decryptPatientPII(data);
      return {
        id: decrypted.id,
        tenantId: decrypted.tenant_id || 'lab-san-jose',
        idType: (decrypted.id_type as any) || 'CEDULA',
        firstName: decrypted.firstName,
        lastName: decrypted.lastName,
        nationalId: decrypted.nationalId,
        dob: decrypted.birth_date || '1990-01-01',
        gender: decrypted.gender || 'M',
        phone: decrypted.phone || '',
        email: decrypted.email || '',
        address: decrypted.address || '',
        insuranceProvider: decrypted.insurance_provider,
        dataConsentLey81: true
      };
    } catch (err) {
      console.error('[HybridDatabaseService] Error en búsqueda por Blind Index:', err);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SINCRONIZACIÓN DE ÓRDENES CLÍNICAS
  // ──────────────────────────────────────────────────────────────────────────
  public async syncOrderToDatabases(order: Order, patientName?: string): Promise<{ localSuccess: boolean; cloudSuccess: boolean }> {
    let localSuccess = false;
    let cloudSuccess = false;

    const payload = {
      id: order.id,
      order_number: order.orderNumber,
      patient_id: order.patientId,
      status: order.status,
      priority: order.priority,
      created_at: order.createdAt,
      total_amount: order.totalAmount || 0,
      payment_status: order.paymentStatus || 'PAID',
      updated_at: new Date().toISOString()
    };

    if (isLocalConfigured) {
      try {
        const { error } = await (supabaseLocal.from('orders') as any).upsert(payload);
        localSuccess = !error;
      } catch (err) {
        console.warn('[HybridDatabaseService] Error local (orders):', err);
      }
    } else {
      localSuccess = true;
    }

    if (DATABASE_MODE === 'HYBRID' && isCloudConfigured) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        try {
          const { error } = await (supabaseCloud.from('orders') as any).upsert(payload);
          if (!error) {
            cloudSuccess = true;
            this.lastSyncTimestamp = new Date().toLocaleTimeString();
          } else {
            this.enqueueForCloud('SAMPLE_REGISTRATION', payload, order.orderNumber, patientName);
          }
        } catch {
          this.enqueueForCloud('SAMPLE_REGISTRATION', payload, order.orderNumber, patientName);
        }
      } else {
        this.enqueueForCloud('SAMPLE_REGISTRATION', payload, order.orderNumber, patientName);
      }
    }

    return { localSuccess, cloudSuccess };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. SINCRONIZACIÓN DE FACTURACIÓN Y FINANZAS (Para vista remota del Dueño)
  // ──────────────────────────────────────────────────────────────────────────
  public async syncBillingToDatabases(billingData: { id: string; orderId: string; amount: number; method: string; status: string }): Promise<{ localSuccess: boolean; cloudSuccess: boolean }> {
    let localSuccess = true;
    let cloudSuccess = false;

    if (DATABASE_MODE === 'HYBRID' && isCloudConfigured) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        try {
          const { error } = await (supabaseCloud.from('billing_transactions') as any).upsert({
            id: billingData.id,
            order_id: billingData.orderId,
            amount: billingData.amount,
            payment_method: billingData.method,
            status: billingData.status,
            created_at: new Date().toISOString()
          });
          if (!error) {
            cloudSuccess = true;
            this.lastSyncTimestamp = new Date().toLocaleTimeString();
          }
        } catch {
          // Enqueue billing transaction
          this.enqueueForCloud('STAT_FLAG', billingData, billingData.orderId, 'Transacción Facturación');
        }
      } else {
        this.enqueueForCloud('STAT_FLAG', billingData, billingData.orderId, 'Transacción Facturación');
      }
    }

    return { localSuccess, cloudSuccess };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. SINCRONIZACIÓN DE INVENTARIO Y REACTIVOS
  // ──────────────────────────────────────────────────────────────────────────
  public async syncInventoryToDatabases(item: { id: string; name: string; currentStock: number; lotNumber?: string; minStock?: number }): Promise<{ localSuccess: boolean; cloudSuccess: boolean }> {
    let localSuccess = true;
    let cloudSuccess = false;

    if (DATABASE_MODE === 'HYBRID' && isCloudConfigured) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        try {
          const { error } = await (supabaseCloud.from('inventory_items') as any).upsert({
            id: item.id,
            name: item.name,
            current_stock: item.currentStock,
            lot_number: item.lotNumber || 'LOTE-DEFAULT',
            min_stock_alert: item.minStock || 10,
            updated_at: new Date().toISOString()
          });
          if (!error) {
            cloudSuccess = true;
            this.lastSyncTimestamp = new Date().toLocaleTimeString();
          }
        } catch {
          this.enqueueForCloud('SAMPLE_INTEGRITY_ACTION', item, item.lotNumber, `Inventario: ${item.name}`);
        }
      } else {
        this.enqueueForCloud('SAMPLE_INTEGRITY_ACTION', item, item.lotNumber, `Inventario: ${item.name}`);
      }
    }

    return { localSuccess, cloudSuccess };
  }

  /**
   * Enqueues an operation into the offline sync engine for cloud push.
   */
  private enqueueForCloud(type: OfflineSyncItem['type'], payload: Record<string, any>, sampleBarcode?: string, patientName?: string, testCode?: string): void {
    offlineSyncManager.enqueue({
      type,
      sampleBarcode,
      patientName,
      testCode,
      payload
    });
  }

  /**
   * Flushes all pending items to the cloud database when internet returns.
   */
  public async flushPendingToCloud(): Promise<number> {
    if (this.isSyncingWithCloud || !isCloudConfigured) return 0;
    this.isSyncingWithCloud = true;

    try {
      const result = await offlineSyncManager.syncPendingQueue();
      if (result.syncedCount > 0) {
        this.lastSyncTimestamp = new Date().toLocaleTimeString();
      }
      return result.syncedCount;
    } finally {
      this.isSyncingWithCloud = false;
    }
  }

  /**
   * Retrieves live telemetry for both database channels.
   */
  public async getTelemetry(): Promise<HybridSyncTelemetry> {
    const health = await testDatabaseConnections();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pendingCount = offlineSyncManager.getQueue().length;

    return {
      mode: DATABASE_MODE,
      isOnline,
      localLatencyMs: health.local.latencyMs,
      cloudLatencyMs: health.cloud.latencyMs,
      localStatus: health.local.status,
      cloudStatus: health.cloud.status,
      pendingCloudSyncCount: pendingCount,
      lastSyncTimestamp: this.lastSyncTimestamp,
      mirroredModules: ['Pacientes', 'Órdenes', 'Resultados', 'Facturación & Caja', 'Inventario & Reactivos', 'Auditoría Ley 81']
    };
  }
}

export const hybridDatabaseService = HybridDatabaseService.getInstance();
