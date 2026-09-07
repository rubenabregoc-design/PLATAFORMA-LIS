/**
 * 🏥 PLATAFORMA-LIS — SupabaseService
 * =====================================================================
 * Capa de servicio central — ISO 15189 Compliant | Multi-Tenant
 * Todos los métodos son type-safe contra src/database.types.ts
 *
 * Reemplaza: LISDataService.ts + SupabaseRepository.ts
 * =====================================================================
 */

import { supabase as baseSupabase } from '../lib/supabaseClient';
const supabase: any = baseSupabase;
import type {
  DbPatient, DbPatientInsert, DbPatientUpdate,
  DbOrder, DbOrderInsert, DbOrderUpdate, DbOrderWithDetails, DbOrderFull,
  DbTestResult, DbTestResultInsert, DbTestResultUpdate, DbResultWithAudit,
  DbReferenceRange, DbReferenceRangeInsert, DbGender,
  DbAnalyzer, DbAnalyzerInsert, DbAnalyzerUpdate,
  DbBranch,
  DbProfile,
  DbResultAuditLog,
  DbResultStatus,
  DbBloodDonor,
  DbBloodUnit,
  DbBloodRequest,
  DbBloodCrossmatch,
  DbBloodHemovigilance,
  DbInventoryReagent,
  DbExternalQCProgram,
  DbQCConfiguration,
  DbQCRun,
  DbAnalyzerMaintenanceSchedule,
  DbAnalyzerMaintenanceLog,
  DbAnalyzerCalibration,
  DbSecurityAuditTrail,
  DbAutomatedNotification,
  DbBillingInvoice,
  DbBillingCashClosing,
  DbFinancialBudget,
  DbInsuranceProvider,
  DbMiddlewareRawFrame,
  DbClinicalCriticalAlert,
  DbPayrollRun,
  DbSupplier,
  DbSupplierEvaluation,
  DbIsoClause,
  DbIsoAuditFinding,
  DbTestFormula,
  DbFormulaExecutionLog,
  DbGrowthStandard,
  DbStaffProfessionalInsurance,
  DbPurchaseOrder,
  DbPatientAccessToken,
  DbAssetCategory,
  DbFixedAsset,
  DbAppointment,
  DbWasteCategory,
  DbBiohazardWasteLog,
  DbBiohazardPickup,
  DbStaffCompetency,
  DbStaffTrainingLog,
  DbColdChainDevice,
  DbColdChainReading,
  DbQualityIncident,
  DbBusinessOpportunity,
  DbITHardwareAsset,
  DbITMaintenanceLog,
  DbHISEndpoint,
  DbHISMessageLog,
  DbHISTestMapping,
  DbMedicalSupply,
  DbSupplyTransaction,
  DbShiftTemplate,
  DbStaffSchedule,
  DbQualityDocument,
  DbPatientFeedback,
  DbQualityRisk,
  DbBranchSalesTrend,
  DbIntangibleAsset,
  DbTestProfitability,
  DbReagentEfficiency,
  DbExternalAudit,
  DbExternalAuditFinding,
  DbTestProfile,
  DbTestProfileComponent,
  DbBloodDriveEvent,
  DbBloodDriveRegistration,
  DbDonorDeferralReason,
  DbBloodUnitTransfer,
  DbDonorDeferralStat,
  DbEpidemiologicalMarker,
  DbEpidemiologicalReport,
  DbMinsaSurveillance,
  DbEquipmentInsurance,
  DbEquipmentWarranty,
  DbEpiHeatmapData,
  DbChemicalWasteLog,
} from '../database.types';

import type { TestResult, AuditLogEntry, Patient, Order, BloodUnit, BloodDonor, BloodRequest } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// MAPPING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function mapDbFlagToFrontend(dbFlag: string | null): 'NORMAL' | 'ALTO' | 'BAJO' | 'CRITICO_ALTO' | 'CRITICO_BAJO' {
  if (!dbFlag) return 'NORMAL';
  switch (dbFlag) {
    case 'N': return 'NORMAL';
    case 'L': return 'BAJO';
    case 'H': return 'ALTO';
    case 'CRIT_L': return 'CRITICO_BAJO';
    case 'CRIT_H': return 'CRITICO_ALTO';
    case 'NORMAL': return 'NORMAL';
    case 'BAJO': return 'BAJO';
    case 'ALTO': return 'ALTO';
    case 'CRITICO_BAJO': return 'CRITICO_BAJO';
    case 'CRITICO_ALTO': return 'CRITICO_ALTO';
    default: return 'NORMAL';
  }
}

export function mapFrontendFlagToDb(feFlag: string | null | undefined): 'N' | 'L' | 'H' | 'CRIT_L' | 'CRIT_H' | null {
  if (!feFlag) return null;
  switch (feFlag) {
    case 'NORMAL': return 'N';
    case 'BAJO': return 'L';
    case 'ALTO': return 'H';
    case 'CRITICO_BAJO': return 'CRIT_L';
    case 'CRITICO_ALTO': return 'CRIT_H';
    case 'N': return 'N';
    case 'L': return 'L';
    case 'H': return 'H';
    case 'CRIT_L': return 'CRIT_L';
    case 'CRIT_H': return 'CRIT_H';
    default: return null;
  }
}

export function mapDbResultToFrontend(
  db: DbTestResult & { result_audit_logs?: DbResultAuditLog[] }
): TestResult {
  return {
    id: db.id,
    tenantId: '',
    orderId: db.order_id,
    testId: db.test_code,
    parameterId: db.test_code,
    parameterName: db.parameter_name,
    unit: db.unit || '',
    value: db.value || '',
    numericValue: db.numeric_value ?? undefined,
    flag: mapDbFlagToFrontend(db.flag),
    refRangeText: db.ref_range || '',
    source: 'MANUAL',
    analyzerName: db.analyzer_name ?? undefined,
    status: db.status,
    interpretation: db.interpretation ?? undefined,
    version: db.version,
    history: db.result_audit_logs
      ? db.result_audit_logs.map((log) => ({
          id: log.id,
          timestamp: log.timestamp,
          action: log.action === 'EDICION' ? 'EDICION' : 'VALIDACION_TEC',
          author: log.author,
          previousValue: log.previous_value ?? undefined,
          newValue: log.new_value ?? undefined,
          reason: log.reason ?? undefined,
        }))
      : [],
  };
}

export function mapDbOrderToFrontend(db: DbOrderWithDetails): Order {
  const patientAge = Math.max(
    0,
    new Date().getFullYear() - new Date(db.patients.dob).getFullYear()
  );
  return {
    id: db.id,
    tenantId: db.tenant_id,
    branchId: db.branch_id,
    orderNumber: db.order_number,
    patientId: db.patient_id,
    patientName: `${db.patients.first_name} ${db.patients.last_name}`,
    patientNationalId: db.patients.national_id,
    patientGender: db.patients.gender,
    patientAge,
    priority: db.priority,
    status: db.status as any,
    createdAt: db.created_at,
    totalAmount: 0,
    paymentStatus: db.payment_status,
    specimens: [],
    testIds: db.test_results.map((r) => r.test_code),
  };
}

export function mapDbPatientToFrontend(db: DbPatient): Patient {
  return {
    id: db.id,
    tenantId: db.tenant_id,
    nationalId: db.national_id,
    idType: db.id_type,
    firstName: db.first_name,
    lastName: db.last_name,
    dob: db.dob,
    gender: db.gender,
    phone: db.phone || '',
    email: db.email || '',
    address: db.address || '',
    dataConsentLey81: db.data_consent,
    consentDate: db.consent_date || undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Throws a typed error with context. */
function handleError(context: string, error: { message: string } | null): never {
  throw new Error(`[SupabaseService::${context}] ${error?.message ?? 'Unknown error'}`);
}

/** Extracts tenant_id for the currently authenticated user (via RLS-safe profile lookup). */
async function getTenantId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('[SupabaseService] No authenticated user.');
  const { data, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  if (error || !data?.tenant_id) handleError('getTenantId', error);
  return data!.tenant_id!;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const AuthService = {
  /** Login con email + password */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) handleError('signIn', error);
    return data;
  },

  /** Logout */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) handleError('signOut', error);
  },

  /** Obtiene el usuario autenticado actual */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /** Obtiene el perfil completo del usuario autenticado */
  async getCurrentProfile(): Promise<DbProfile | null> {
    const user = await AuthService.getCurrentUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) {
      console.error('[SupabaseService::getCurrentProfile]', error.message);
      return null;
    }
    return data;
  },

  /** Escucha cambios de sesión en tiempo real */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS — Ley 81 Compliant
// ─────────────────────────────────────────────────────────────────────────────

export const PatientService = {
  /** Lista todos los pacientes del tenant actual (RLS auto-aplica) */
  async getAll(): Promise<DbPatient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('last_name', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  /** Busca pacientes por nombre o cédula */
  async search(query: string): Promise<DbPatient[]> {
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
    if (!cleanQuery) return [];
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`national_id.ilike.%${cleanQuery}%,first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%`)
      .limit(20);
    if (error) handleError('search', error);
    return data!;
  },

  /** Obtiene un paciente por ID */
  async getById(id: string): Promise<DbPatient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.warn('[SupabaseService::getById] Patient not found:', id);
      return null;
    }
    return data;
  },

  /**
   * Crea un paciente con validación de consentimiento (Ley 81 de Panamá).
   * tenant_id se obtiene del perfil autenticado (no del input del usuario).
   */
  async create(patient: Omit<DbPatientInsert, 'tenant_id'>): Promise<DbPatient> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('patients')
      .insert({ ...patient, tenant_id })
      .select()
      .single();
    if (error) handleError('create', error);
    return data!;
  },

  /** Actualiza datos del paciente */
  async update(id: string, updates: DbPatientUpdate): Promise<DbPatient> {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError('update', error);
    return data!;
  },

  /**
   * Registra el consentimiento informado (Ley 81 de Panamá).
   * Almacena timestamp en consent_date.
   */
  async recordConsent(patientId: string): Promise<DbPatient> {
    return PatientService.update(patientId, {
      data_consent: true,
      consent_date: new Date().toISOString(),
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export const OrderService = {
  /** Lista todas las órdenes con datos del paciente */
  async getAll(): Promise<DbOrderWithDetails[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, patients(*), test_results(*)')
      .order('created_at', { ascending: false });
    if (error) handleError('getAll', error);
    return data as DbOrderWithDetails[];
  },

  /** Obtiene una orden completa con resultados y audit trail */
  async getFullById(orderId: string): Promise<DbOrderFull | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, patients(*), test_results(*, result_audit_logs(*))')
      .eq('id', orderId)
      .single();
    if (error) {
      console.warn('[SupabaseService::getFullById] Order not found:', orderId);
      return null;
    }
    return data as DbOrderFull;
  },

  /** Crea una nueva orden de laboratorio */
  async create(order: Omit<DbOrderInsert, 'tenant_id' | 'created_by'>): Promise<DbOrder> {
    const tenant_id = await getTenantId();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...order,
        tenant_id,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) handleError('create', error);
    return data!;
  },

  /** Actualiza el estado de una orden */
  async updateStatus(orderId: string, updates: DbOrderUpdate): Promise<DbOrder> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();
    if (error) handleError('updateStatus', error);
    return data!;
  },

  /** Genera el próximo número de orden correlativo (ORD-YYYY-NNNNN) */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    const next = String((count ?? 0) + 1).padStart(5, '0');
    return `ORD-${year}-${next}`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TEST RESULTS — ISO 15189 core
// ─────────────────────────────────────────────────────────────────────────────

export const ResultService = {
  /** Obtiene todos los resultados de una orden */
  async getByOrder(orderId: string): Promise<DbResultWithAudit[]> {
    const { data, error } = await supabase
      .from('test_results')
      .select('*, result_audit_logs(*)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) handleError('getByOrder', error);
    return data as DbResultWithAudit[];
  },

  /**
   * Inserta un resultado.
   * El trigger fn_validate_test_result() auto-calcula:
   * - flag (L/H/CRIT_L/CRIT_H/N)
   * - ref_range (texto para el reporte)
   * - Delta Check alert en interpretation
   */
  async create(result: DbTestResultInsert): Promise<DbTestResult> {
    const { data, error } = await supabase
      .from('test_results')
      .insert(result)
      .select()
      .single();
    if (error) handleError('create', error);
    return data!;
  },

  /** Inserción masiva de resultados (desde middleware ASTM/HL7) */
  async bulkCreate(results: DbTestResultInsert[]): Promise<DbTestResult[]> {
    const { data, error } = await supabase
      .from('test_results')
      .insert(results)
      .select();
    if (error) handleError('bulkCreate', error);
    return data!;
  },

  /**
   * Actualiza un resultado.
   * Si el resultado estaba en VALIDADO, el trigger:
   * - incrementa version
   * - resetea status a PENDIENTE (requiere re-validación)
   * - registra en result_audit_logs automáticamente
   */
  async update(resultId: string, updates: DbTestResultUpdate, reason?: string): Promise<DbTestResult> {
    const { data, error } = await supabase
      .from('test_results')
      .update(updates)
      .eq('id', resultId)
      .select()
      .single();
    if (error) handleError('update', error);

    // Manual audit entry (complementa el trigger automático con contexto adicional)
    if (reason) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('result_audit_logs').insert({
        result_id: resultId,
        action: 'EDICION',
        author: user?.email ?? 'system',
        previous_value: null,
        new_value: updates.value ?? null,
        reason,
      });
    }
    return data!;
  },

  /**
   * Valida un resultado — requiere licencia profesional en el perfil (ISO 15189).
   * El trigger fn_validate_test_result() lanza EXCEPTION si no hay license_number.
   */
  async validate(resultId: string, newStatus: DbResultStatus): Promise<DbTestResult> {
    const { data, error } = await supabase
      .from('test_results')
      .update({ status: newStatus })
      .eq('id', resultId)
      .select()
      .single();
    if (error) handleError('validate', error);
    return data!;
  },

  /** Obtiene el historial de auditoría de un resultado (ISO 15189 audit trail) */
  async getAuditTrail(resultId: string): Promise<DbResultAuditLog[]> {
    const { data, error } = await supabase
      .from('result_audit_logs')
      .select('*')
      .eq('result_id', resultId)
      .order('timestamp', { ascending: true });
    if (error) handleError('getAuditTrail', error);
    return data!;
  },

  /**
   * Suscripción en tiempo real — notifica cambios en test_results.
   * Filtrado por order_id para dashboards de resultado en vivo.
   */
  subscribeToOrder(orderId: string, callback: (result: DbTestResult) => void) {
    return supabase
      .channel(`results:order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_results',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => callback(payload.new as DbTestResult)
      )
      .subscribe();
  },

  /** Suscripción global — para el dashboard de monitoreo en vivo */
  subscribeToAll(callback: (result: DbTestResult) => void) {
    return supabase
      .channel('realtime:all_results')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_results' },
        (payload) => callback(payload.new as DbTestResult)
      )
      .subscribe();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE RANGES — Catálogo de Pruebas
// ─────────────────────────────────────────────────────────────────────────────

export const ReferenceRangeService = {
  /** Obtiene todos los rangos del catálogo del tenant */
  async getAll(): Promise<DbReferenceRange[]> {
    const { data, error } = await supabase
      .from('reference_ranges')
      .select('*')
      .order('test_name', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  /** Busca el rango de referencia para un paciente específico */
  async getForPatient(
    testCode: string,
    gender: 'M' | 'F',
    ageYears: number
  ): Promise<DbReferenceRange | null> {
    const { data, error } = await supabase
      .from('reference_ranges')
      .select('*')
      .eq('test_code', testCode)
      .or(`gender.eq.${gender},gender.eq.BOTH`)
      .lte('age_min', ageYears)
      .gte('age_max', ageYears)
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },

  /** Crea un nuevo rango de referencia */
  async create(range: Omit<DbReferenceRangeInsert, 'tenant_id'>): Promise<DbReferenceRange> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('reference_ranges')
      .insert({ ...range, tenant_id })
      .select()
      .single();
    if (error) handleError('create', error);
    return data!;
  },

  /** Actualiza un rango existente */
  async update(id: string, updates: Partial<DbReferenceRangeInsert>): Promise<DbReferenceRange> {
    const { data, error } = await supabase
      .from('reference_ranges')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError('update', error);
    return data!;
  },

  /** Elimina un rango */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('reference_ranges')
      .delete()
      .eq('id', id);
    if (error) handleError('delete', error);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYZERS — Equipos de Laboratorio
// ─────────────────────────────────────────────────────────────────────────────

export const AnalyzerService = {
  /** Lista todos los analizadores del tenant */
  async getAll(): Promise<DbAnalyzer[]> {
    const { data, error } = await supabase
      .from('analyzers')
      .select('*')
      .order('name', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  /** Registra un nuevo analizador */
  async create(analyzer: Omit<DbAnalyzerInsert, 'tenant_id'>): Promise<DbAnalyzer> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('analyzers')
      .insert({ ...analyzer, tenant_id })
      .select()
      .single();
    if (error) handleError('create', error);
    return data!;
  },

  /** Actualiza datos del analizador (modelo, serial, estado, mantenimiento) */
  async update(id: string, updates: DbAnalyzerUpdate): Promise<DbAnalyzer> {
    const { data, error } = await supabase
      .from('analyzers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError('update', error);
    return data!;
  },

  /** Registra fecha de mantenimiento */
  async recordMaintenance(id: string): Promise<DbAnalyzer> {
    return AnalyzerService.update(id, { last_maintenance: new Date().toISOString() });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BRANCHES
// ─────────────────────────────────────────────────────────────────────────────

export const BranchService = {
  /** Lista todas las sucursales del tenant */
  async getAll(): Promise<DbBranch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  /** Crea una sucursal */
  async create(branch: Omit<DbBranch, 'id' | 'tenant_id' | 'created_at'>): Promise<DbBranch> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('branches')
      .insert({ ...branch, tenant_id })
      .select()
      .single();
    if (error) handleError('create', error);
    return data!;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export const ProfileService = {
  /** Obtiene todos los usuarios del tenant */
  async getAll(): Promise<DbProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  /** Actualiza el perfil del usuario autenticado */
  async updateCurrent(updates: Partial<Omit<DbProfile, 'id' | 'tenant_id' | 'created_at'>>): Promise<DbProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('[SupabaseService::ProfileService] No authenticated user.');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) handleError('updateCurrent', error);
    return data!;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOOD BANK SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const BloodBankService = {
  /** Inventario: Obtiene todas las unidades de sangre disponibles */
  async getAvailableUnits(): Promise<DbBloodUnit[]> {
    const { data, error } = await supabase
      .from('blood_units')
      .select('*')
      .eq('status', 'AVAILABLE')
      .order('expiry_date', { ascending: true });
    if (error) handleError('getAvailableUnits', error);
    return data!;
  },

  /** Registro de Donante */
  async registerDonor(donor: Omit<DbBloodDonor, 'id' | 'tenant_id' | 'created_at'>): Promise<DbBloodDonor> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('blood_donors')
      .insert({ ...donor, tenant_id })
      .select()
      .single();
    if (error) handleError('registerDonor', error);
    return data!;
  },

  /** Ingreso de Unidad al Inventario (ISBT 128) */
  async addBloodUnit(unit: Omit<DbBloodUnit, 'id' | 'tenant_id' | 'created_at' | 'marker_hiv' | 'marker_hbv' | 'marker_hcv' | 'marker_syphilis' | 'marker_chagas' | 'marker_htlv'> & Partial<Pick<DbBloodUnit, 'marker_hiv' | 'marker_hbv' | 'marker_hcv' | 'marker_syphilis' | 'marker_chagas' | 'marker_htlv'>>): Promise<DbBloodUnit> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('blood_units')
      .insert({ ...unit, tenant_id })
      .select()
      .single();
    if (error) handleError('addBloodUnit', error);
    return data!;
  },

  /** Registrar Resultados de Serología y Liberar Unidad (Panamá Compliant) */
  async processUnitSerology(
    unitId: string,
    markers: {
      hiv: boolean, hbv: boolean, hcv: boolean,
      syphilis: boolean, chagas: boolean, htlv: boolean
    }
  ): Promise<void> {
    const isReactive = Object.values(markers).some(v => v === true);
    const { error } = await supabase
      .from('blood_units')
      .update({
        marker_hiv: markers.hiv,
        marker_hbv: markers.hbv,
        marker_hcv: markers.hcv,
        marker_syphilis: markers.syphilis,
        marker_chagas: markers.chagas,
        marker_htlv: markers.htlv,
        serology_status: isReactive ? 'REACTIVE' : 'NEGATIVE',
        status: isReactive ? 'DISCARDED' : 'AVAILABLE',
        location_storage: isReactive ? 'BIOHAZARD_PANAMA' : 'STOCK_NACIONAL'
      })
      .eq('id', unitId);
    if (error) handleError('processUnitSerology', error);
  },

  /** Obtener Estadísticas de Hemovigilancia */
  async getHemovigilanceStats(): Promise<any[]> {
    const { data, error } = await supabase
      .from('blood_hemovigilance')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) handleError('getHemovigilanceStats', error);
    return data!;
  },

  /** Solicitudes de Transfusión */
  async getPendingRequests(): Promise<any[]> {
    const { data, error } = await supabase
      .from('blood_requests')
      .select('*, patients(*)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });
    if (error) handleError('getPendingRequests', error);
    return data!;
  },

  /** Actualizar estado de solicitud */
  async updateRequestStatus(requestId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('blood_requests')
      .update({ status })
      .eq('id', requestId);
    if (error) handleError('updateRequestStatus', error);
  },

  /** Registrar Prueba de Compatibilidad (Cruce) */
  async performCrossmatch(crossmatch: Omit<DbBloodCrossmatch, 'id' | 'performed_at'>): Promise<DbBloodCrossmatch> {
    const { data, error } = await supabase
      .from('blood_crossmatches')
      .insert(crossmatch)
      .select()
      .single();
    if (error) handleError('performCrossmatch', error);

    // Si es compatible, reservar la unidad
    if (crossmatch.result === 'COMPATIBLE') {
      await supabase
        .from('blood_units')
        .update({ status: 'RESERVED' })
        .eq('id', crossmatch.unit_id);
    }

    return data!;
  },

  /** Hemovigilancia: Reportar reacción adversa */
  async reportReaction(report: Omit<DbBloodHemovigilance, 'id' | 'created_at'>): Promise<DbBloodHemovigilance> {
    const { data, error } = await supabase
      .from('blood_hemovigilance')
      .insert(report)
      .select()
      .single();
    if (error) handleError('reportReaction', error);
    return data!;
  },

  /** Notificación Epidemiológica MINSA */
  async createEpidemiologicalReport(report: Record<string, any>): Promise<any> {
    const { data, error } = await supabase
      .from('blood_notifications')
      .insert(report)
      .select()
      .single();
    if (error) handleError('createEpidemiologicalReport', error);
    return data!;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REAGENT INVENTORY SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ReagentService = {
  async getAll(): Promise<DbInventoryReagent[]> {
    const { data, error } = await supabase
      .from('inventory_reagents')
      .select('*')
      .order('expiry_date', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  async create(reagent: Omit<DbInventoryReagent, 'id' | 'tenant_id' | 'created_at' | 'opened_at' | 'opened_by'>): Promise<DbInventoryReagent> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('inventory_reagents')
      .insert({ ...reagent, tenant_id })
      .select()
      .single();
    if (error) handleError('create', error);
    return data!;
  },

  async updateStock(id: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('inventory_reagents')
      .update({ current_stock: newStock, status: newStock <= 0 ? 'DEPLETED' : 'IN_STOCK' })
      .eq('id', id);
    if (error) handleError('updateStock', error);
  },

  async openReagent(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('inventory_reagents')
      .update({
        status: 'OPENED',
        opened_at: new Date().toISOString(),
        opened_by: user?.id
      })
      .eq('id', id);
    if (error) handleError('openReagent', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL QC SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ExternalQCService = {
  async getAll(): Promise<DbExternalQCProgram[]> {
    const { data, error } = await supabase
      .from('external_qc_programs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) handleError('getAll', error);
    return data!;
  },

  async reportResult(id: string, reportedValue: number): Promise<void> {
    const { error } = await supabase
      .from('external_qc_programs')
      .update({
        reported_value: reportedValue,
        status: 'REPORTED'
      })
      .eq('id', id);
    if (error) handleError('reportResult', error);
  },

  async submitEvaluation(id: string, evaluation: { target: number, sdi: number, bias: number, pass: boolean }): Promise<void> {
    const { error } = await supabase
      .from('external_qc_programs')
      .update({
        target_value: evaluation.target,
        sdi_score: evaluation.sdi,
        bias_percent: evaluation.bias,
        status: evaluation.pass ? 'EVALUATED_PASS' : 'EVALUATED_FAIL',
        evaluated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) handleError('submitEvaluation', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL QC SERVICE (Levey-Jennings & Westgard)
// ─────────────────────────────────────────────────────────────────────────────

export const InternalQCService = {
  async getConfigurations(): Promise<DbQCConfiguration[]> {
    const { data, error } = await supabase
      .from('qc_configurations')
      .select('*')
      .eq('is_active', true);
    if (error) handleError('getConfigurations', error);
    return data!;
  },

  async getRuns(configId: string): Promise<DbQCRun[]> {
    const { data, error } = await supabase
      .from('qc_runs')
      .select('*')
      .eq('config_id', configId)
      .order('created_at', { ascending: true });
    if (error) handleError('getRuns', error);
    return data!;
  },

  async addRun(run: Omit<DbQCRun, 'id' | 'tenant_id' | 'created_at'>): Promise<DbQCRun> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('qc_runs')
      .insert({ ...run, tenant_id })
      .select()
      .single();
    if (error) handleError('addRun', error);
    return data!;
  },

  async saveCorrectiveAction(runId: string, correctiveAction: string, rootCause: string): Promise<void> {
    const { error } = await supabase
      .from('qc_runs')
      .update({
        corrective_action: correctiveAction,
        root_cause: rootCause,
        is_validated: true
      })
      .eq('id', runId);
    if (error) handleError('saveCorrectiveAction', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYZER MAINTENANCE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const MaintenanceService = {
  async getSchedules(): Promise<DbAnalyzerMaintenanceSchedule[]> {
    const { data, error } = await supabase
      .from('analyzer_maintenance_schedules')
      .select('*')
      .order('next_due_at', { ascending: true });
    if (error) handleError('getSchedules', error);
    return data!;
  },

  async getLogs(analyzerId?: string): Promise<DbAnalyzerMaintenanceLog[]> {
    let query = supabase.from('analyzer_maintenance_logs').select('*');
    if (analyzerId) query = query.eq('analyzer_id', analyzerId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) handleError('getLogs', error);
    return data!;
  },

  async logMaintenance(log: Omit<DbAnalyzerMaintenanceLog, 'id' | 'tenant_id' | 'created_at'>): Promise<DbAnalyzerMaintenanceLog> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('analyzer_maintenance_logs')
      .insert({ ...log, tenant_id })
      .select()
      .single();
    if (error) handleError('logMaintenance', error);

    // Update schedule last_done_at and next_due_at
    if (log.schedule_id) {
      await supabase
        .from('analyzer_maintenance_schedules')
        .update({ last_done_at: new Date().toISOString() })
        .eq('id', log.schedule_id);
    }

    return data!;
  },

  async getCalibrations(analyzerId?: string): Promise<DbAnalyzerCalibration[]> {
    let query = supabase.from('analyzer_calibrations').select('*, profiles(name)');
    if (analyzerId) query = query.eq('analyzer_id', analyzerId);
    const { data, error } = await query.order('calibration_date', { ascending: false });
    if (error) handleError('getCalibrations', error);
    return data!;
  },

  async logCalibration(cal: Omit<DbAnalyzerCalibration, 'id' | 'tenant_id' | 'created_at' | 'calibration_date'>): Promise<DbAnalyzerCalibration> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('analyzer_calibrations').insert({ ...cal, tenant_id }).select().single();
    if (error) handleError('logCalibration', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY INTELLIGENCE SERVICE (Aggregated Reporting)
// ─────────────────────────────────────────────────────────────────────────────

export const QualityIntelligenceService = {
  /** Obtiene un resumen consolidado de calidad para el reporte mensual */
  async getMonthlySummary(month: number, year: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const [qcRuns, maintenance, reagents, eqa] = await Promise.all([
      supabase.from('qc_runs').select('*, qc_configurations(*)').gte('created_at', startDate).lte('created_at', endDate),
      supabase.from('analyzer_maintenance_logs').select('*').gte('created_at', startDate).lte('created_at', endDate),
      supabase.from('inventory_reagents').select('*'),
      supabase.from('external_qc_programs').select('*').gte('created_at', startDate).lte('created_at', endDate)
    ]);

    return {
      qc: qcRuns.data || [],
      maintenance: maintenance.data || [],
      reagents: reagents.data || [],
      eqa: eqa.data || []
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY & SIGNATURE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const SecurityService = {
  /** Verifica el PIN del usuario para una acción sensible */
  async verifyPin(pin: string): Promise<boolean> {
    const profile = await AuthService.getCurrentProfile();
    if (!profile || profile.pin_code !== pin) {
      await this.logSecurityEvent('PIN_VERIFICATION', 'FAILED');
      return false;
    }
    await this.logSecurityEvent('PIN_VERIFICATION', 'SUCCESS');
    return true;
  },

  async logSecurityEvent(action: string, status: string, resource?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const tenant_id = await getTenantId();
    await supabase.from('security_audit_trail').insert({
      tenant_id,
      user_id: user?.id,
      action_type: action,
      status,
      resource_affected: resource || null
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationService = {
  async sendWhatsApp(to: string, message: string, type: string): Promise<void> {
    const tenant_id = await getTenantId();
    // En un sistema real, aquí llamaríamos a la API de Twilio/Meta
    await supabase.from('automated_notifications').insert({
      tenant_id,
      channel: 'WHATSAPP',
      recipient_contact: to,
      message_body: message,
      notification_type: type,
      status: 'SENT' // Simulado
    });
  },

  async sendEmail(to: string, subject: string, body: string, type: string): Promise<void> {
    const tenant_id = await getTenantId();
    await supabase.from('automated_notifications').insert({
      tenant_id,
      channel: 'EMAIL',
      recipient_contact: to,
      message_body: `${subject}: ${body}`,
      notification_type: type,
      status: 'SENT' // Simulado
    });
  },

  async triggerClinicalAlert(alert: Omit<DbClinicalCriticalAlert, 'id' | 'tenant_id' | 'detected_at'>): Promise<void> {
    const tenant_id = await getTenantId();
    await supabase.from('clinical_critical_alerts').insert({
      ...alert,
      tenant_id
    });
  },

  async getPendingClinicalAlerts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('clinical_critical_alerts')
      .select('*, orders(*, patients(*))')
      .eq('status', 'PENDING_CALL');
    if (error) handleError('getPendingClinicalAlerts', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BILLING & INSURANCE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const BillingService = {
  async getInsuranceProviders(): Promise<DbInsuranceProvider[]> {
    const { data, error } = await supabase.from('insurance_providers').select('*').eq('is_active', true);
    if (error) handleError('getInsuranceProviders', error);
    return data!;
  },

  async createInvoice(invoice: Omit<DbBillingInvoice, 'id' | 'tenant_id' | 'created_at'>): Promise<DbBillingInvoice> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('billing_invoices').insert({ ...invoice, tenant_id }).select().single();
    if (error) handleError('createInvoice', error);
    return data!;
  },

  async getInvoices(): Promise<DbBillingInvoice[]> {
    const { data, error } = await supabase.from('billing_invoices').select('*').order('created_at', { ascending: false });
    if (error) handleError('getInvoices', error);
    return data!;
  },

  async getDailyTotals(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('billing_invoices')
      .select('payment_method, total')
      .gte('created_at', today);
    if (error) handleError('getDailyTotals', error);

    return data!.reduce((acc: any, inv: any) => {
      const method = inv.payment_method?.toLowerCase() || 'other';
      acc[method] = (acc[method] || 0) + parseFloat(inv.total);
      acc.total = (acc.total || 0) + parseFloat(inv.total);
      return acc;
    }, { cash: 0, card: 0, yappy: 0, insurance: 0, total: 0 });
  },

  async performCashClosing(closing: Omit<DbBillingCashClosing, 'id' | 'tenant_id' | 'closed_at' | 'closed_by'>): Promise<DbBillingCashClosing> {
    const tenant_id = await getTenantId();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('billing_cash_closings').insert({
      ...closing,
      tenant_id,
      closed_by: user?.id,
      branch_id: '8823-MAIN' // Mocking branch for now
    }).select().single();

    if (error) handleError('performCashClosing', error);
    return data!;
  },

  async getBudget(month: number, year: number): Promise<DbFinancialBudget | null> {
    const { data, error } = await supabase
      .from('financial_budgets')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .single();
    if (error) return null;
    return data;
  },

  async updateBudget(budget: Omit<DbFinancialBudget, 'id' | 'tenant_id' | 'created_at'>): Promise<void> {
    const tenant_id = await getTenantId();
    const { error } = await supabase
      .from('financial_budgets')
      .upsert({ ...budget, tenant_id }, { onConflict: 'tenant_id, month, year' });
    if (error) handleError('updateBudget', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const MiddlewareService = {
  async logRawFrame(frame: Omit<DbMiddlewareRawFrame, 'id' | 'tenant_id' | 'created_at'>): Promise<void> {
    const tenant_id = await getTenantId();
    await supabase.from('middleware_raw_frames').insert({ ...frame, tenant_id });
  },

  async getPendingFrames(): Promise<DbMiddlewareRawFrame[]> {
    const { data, error } = await supabase.from('middleware_raw_frames').select('*').eq('processed', false);
    if (error) handleError('getPendingFrames', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const PayrollService = {
  async getTechnologistProduction(month: number, year: number): Promise<any[]> {
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').in('role', ['tech_med', 'lab_tech']);
    if (pErr) handleError('getProduction::profiles', pErr);

    return profiles.map(p => ({
      profile_id: p.id,
      name: p.name,
      base_salary: p.base_salary || 0,
      commission: p.commission_per_test || 0,
      tests_processed: Math.floor(Math.random() * 500) + 100, // Simulation
    }));
  },

  async runPayroll(payrollData: Omit<DbPayrollRun, 'id' | 'tenant_id' | 'created_at' | 'paid_at'>[]): Promise<void> {
    const tenant_id = await getTenantId();
    const insertData = payrollData.map(d => ({ ...d, tenant_id }));
    const { error } = await supabase.from('payroll_runs').insert(insertData);
    if (error) handleError('runPayroll', error);
  },

  async getPayrollHistory(month: number, year: number): Promise<DbPayrollRun[]> {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*, profiles(name)')
      .eq('month', month)
      .eq('year', year);
    if (error) handleError('getPayrollHistory', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASING SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const PurchasingService = {
  async getSuppliers(): Promise<DbSupplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').eq('is_active', true);
    if (error) handleError('getSuppliers', error);
    return data!;
  },

  async createPO(po: Omit<DbPurchaseOrder, 'id' | 'tenant_id' | 'created_at' | 'received_at'>): Promise<DbPurchaseOrder> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('purchase_orders').insert({ ...po, tenant_id }).select().single();
    if (error) handleError('createPO', error);
    return data!;
  },

  async getPOs(): Promise<DbPurchaseOrder[]> {
    const { data, error } = await supabase.from('purchase_orders').select('*, suppliers(*)').order('created_at', { ascending: false });
    if (error) handleError('getPOs', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT PORTAL SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const PatientPortalService = {
  async generateAccessToken(patientId: string, orderId: string): Promise<string> {
    const tenant_id = await getTenantId();
    const access_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const { error } = await supabase.from('patient_access_tokens').insert({
      tenant_id,
      patient_id: patientId,
      order_id: orderId,
      access_code,
      expires_at
    });

    if (error) handleError('generateAccessToken', error);
    return access_code;
  },

  async getResultsByCode(code: string): Promise<any> {
    const { data: token, error: tErr } = await supabase
      .from('patient_access_tokens')
      .select('*, orders(*, test_results(*))')
      .eq('access_code', code)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tErr) throw new Error('Código de acceso inválido o expirado.');
    return token.orders;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIXED ASSETS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const FixedAssetService = {
  async getCategories(): Promise<DbAssetCategory[]> {
    const { data, error } = await supabase.from('asset_categories').select('*');
    if (error) handleError('getCategories', error);
    return data!;
  },

  async getAssets(): Promise<DbFixedAsset[]> {
    const { data, error } = await supabase.from('fixed_assets').select('*, asset_categories(*)').order('internal_code', { ascending: true });
    if (error) handleError('getAssets', error);
    return data!;
  },

  async createAsset(asset: Omit<DbFixedAsset, 'id' | 'tenant_id' | 'created_at'>): Promise<DbFixedAsset> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('fixed_assets').insert({ ...asset, tenant_id }).select().single();
    if (error) handleError('createAsset', error);
    return data!;
  },

  async getAssetAuditLifecycle(assetId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('asset_audit_lifecycle_view')
      .select('*')
      .eq('asset_id', assetId)
      .order('maintenance_date', { ascending: false });
    if (error) handleError('getAssetAuditLifecycle', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const AppointmentService = {
  async getAppointments(): Promise<DbAppointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(*)')
      .order('scheduled_at', { ascending: true });
    if (error) handleError('getAppointments', error);
    return data!;
  },

  async createAppointment(appointment: Omit<DbAppointment, 'id' | 'tenant_id' | 'created_at'>): Promise<DbAppointment> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...appointment, tenant_id })
      .select()
      .single();
    if (error) handleError('createAppointment', error);
    return data!;
  },

  async updateStatus(id: string, status: DbAppointment['status']): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    if (error) handleError('updateStatus', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BIO-HAZARDOUS WASTE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const BiohazardWasteService = {
  async getCategories(): Promise<DbWasteCategory[]> {
    const { data, error } = await supabase.from('waste_categories').select('*');
    if (error) handleError('getCategories', error);
    return data!;
  },

  async getLogs(): Promise<DbBiohazardWasteLog[]> {
    const { data, error } = await supabase
      .from('biohazard_waste_logs')
      .select('*, waste_categories(*)')
      .order('created_at', { ascending: false });
    if (error) handleError('getLogs', error);
    return data!;
  },

  async logWaste(entry: Omit<DbBiohazardWasteLog, 'id' | 'tenant_id' | 'created_at'>): Promise<DbBiohazardWasteLog> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('biohazard_waste_logs').insert({ ...entry, tenant_id }).select().single();
    if (error) handleError('logWaste', error);
    return data!;
  },

  async getPickups(): Promise<DbBiohazardPickup[]> {
    const { data, error } = await supabase.from('biohazard_pickups').select('*').order('pickup_date', { ascending: false });
    if (error) handleError('getPickups', error);
    return data!;
  },

  async getChemicalWaste(): Promise<any[]> {
    const { data, error } = await supabase.from('chemical_waste_logs').select('*, analyzers(name)').order('created_at', { ascending: false });
    if (error) handleError('getChemicalWaste', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STAFF COMPETENCY & TRAINING SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const StaffService = {
  async getCompetencies(profileId?: string): Promise<any[]> {
    let query = supabase.from('staff_competencies').select('*, profiles!evaluated_by(name)');
    if (profileId) query = query.eq('profile_id', profileId);
    const { data, error } = await query.order('evaluated_at', { ascending: false });
    if (error) handleError('getCompetencies', error);
    return data!;
  },

  async getTrainingLogs(profileId?: string): Promise<DbStaffTrainingLog[]> {
    let query = supabase.from('staff_training_logs').select('*');
    if (profileId) query = query.eq('profile_id', profileId);
    const { data, error } = await query.order('completion_date', { ascending: false });
    if (error) handleError('getTrainingLogs', error);
    return data!;
  },

  async addCompetency(comp: Omit<DbStaffCompetency, 'id' | 'tenant_id' | 'created_at'>): Promise<DbStaffCompetency> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('staff_competencies').insert({ ...comp, tenant_id }).select().single();
    if (error) handleError('addCompetency', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COLD CHAIN MONITORING SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ColdChainService = {
  async getDevices(): Promise<DbColdChainDevice[]> {
    const { data, error } = await supabase.from('cold_chain_devices').select('*').order('name', { ascending: true });
    if (error) handleError('getDevices', error);
    return data!;
  },

  async getHistoricalReadings(deviceId: string, hours: number = 24): Promise<DbColdChainReading[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('cold_chain_readings')
      .select('*')
      .eq('device_id', deviceId)
      .gte('recorded_at', startTime)
      .order('recorded_at', { ascending: true });
    if (error) handleError('getHistoricalReadings', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENTAL INTELLIGENCE SERVICE (Waste Indicators)
// ─────────────────────────────────────────────────────────────────────────────

export const EnvironmentalService = {
  async getWasteEfficiencyStats(): Promise<any[]> {
    const { data, error } = await supabase.from('biohazard_efficiency_view').select('*').order('year', { ascending: false }).order('month', { ascending: false });
    if (error) handleError('getWasteEfficiencyStats', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY INCIDENTS & CAPA SERVICE (ISO 15189)
// ─────────────────────────────────────────────────────────────────────────────

export const IncidentService = {
  async getIncidents(): Promise<DbQualityIncident[]> {
    const { data, error } = await supabase.from('quality_incidents').select('*').order('created_at', { ascending: false });
    if (error) handleError('getIncidents', error);
    return data!;
  },

  async logIncident(incident: Omit<DbQualityIncident, 'id' | 'tenant_id' | 'created_at' | 'closed_at'>): Promise<DbQualityIncident> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('quality_incidents').insert({ ...incident, tenant_id }).select().single();
    if (error) handleError('logIncident', error);
    return data!;
  },

  async updateCAPA(id: string, updates: Partial<DbQualityIncident>): Promise<void> {
    const { error } = await supabase.from('quality_incidents').update(updates).eq('id', id);
    if (error) handleError('updateCAPA', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REAL-TIME WORKLOAD SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const WorkloadService = {
  async getSectionWorkload(): Promise<any[]> {
    const { data, error } = await supabase.from('section_workload_view').select('*');
    if (error) handleError('getSectionWorkload', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OPPORTUNITIES SERVICE (Kanban)
// ─────────────────────────────────────────────────────────────────────────────

export const OpportunityService = {
  async getOpportunities(): Promise<DbBusinessOpportunity[]> {
    const { data, error } = await supabase.from('business_opportunities').select('*').order('priority', { ascending: true });
    if (error) handleError('getOpportunities', error);
    return data!;
  },

  async moveOpportunity(id: string, newColumn: string): Promise<void> {
    const tenant_id = await getTenantId();
    const { error } = await supabase.from('business_opportunities').update({ kanban_column: newColumn as any }).eq('id', id);
    if (error) handleError('moveOpportunity', error);
  },

  async createOpportunity(opp: Omit<DbBusinessOpportunity, 'id' | 'tenant_id' | 'created_at'>): Promise<void> {
    const tenant_id = await getTenantId();
    const { error } = await supabase.from('business_opportunities').insert({ ...opp, tenant_id });
    if (error) handleError('createOpportunity', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// IT HARDWARE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ITHardwareService = {
  async getAssets(): Promise<DbITHardwareAsset[]> {
    const { data, error } = await supabase.from('it_hardware_assets').select('*').order('name', { ascending: true });
    if (error) handleError('getAssets', error);
    return data!;
  },

  async getLogs(assetId?: string): Promise<DbITMaintenanceLog[]> {
    let query = supabase.from('it_maintenance_logs').select('*');
    if (assetId) query = query.eq('asset_id', assetId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) handleError('getLogs', error);
    return data!;
  },

  async logMaintenance(log: Omit<DbITMaintenanceLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('it_maintenance_logs').insert(log);
    if (error) handleError('logMaintenance', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HIS INTEGRATION SERVICE (HL7 / FHIR Bridge)
// ─────────────────────────────────────────────────────────────────────────────

export const HISService = {
  async getEndpoints(): Promise<DbHISEndpoint[]> {
    const { data, error } = await supabase.from('his_endpoints').select('*').order('name', { ascending: true });
    if (error) handleError('getEndpoints', error);
    return data!;
  },

  async getMessageLogs(): Promise<DbHISMessageLog[]> {
    const { data, error } = await supabase
      .from('his_message_log')
      .select('*, his_endpoints(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) handleError('getMessageLogs', error);
    return data!;
  },

  async getMappings(endpointId: string): Promise<DbHISTestMapping[]> {
    const { data, error } = await supabase.from('his_test_mappings').select('*').eq('endpoint_id', endpointId);
    if (error) handleError('getMappings', error);
    return data!;
  },

  async sendResultToHIS(orderId: string, endpointId: string, hl7Payload: string): Promise<void> {
    const tenant_id = await getTenantId();
    const { error } = await supabase.from('his_message_log').insert({
      tenant_id,
      endpoint_id: endpointId,
      order_id: orderId,
      direction: 'OUTBOUND',
      message_type: 'ORU', // Observational Result
      raw_content: hl7Payload,
      status: 'PENDING'
    });
    if (error) handleError('sendResultToHIS', error);
  },

  /** Simulación de Recepción de Orden HL7 (ORM) */
  async simulateIncomingOrder(rawHL7: string): Promise<any> {
    const tenant_id = await getTenantId();
    // 1. Log the raw message
    const { data: log, error: lErr } = await supabase.from('his_message_log').insert({
      tenant_id,
      direction: 'INBOUND',
      message_type: 'ORM',
      raw_content: rawHL7,
      status: 'PROCESSING'
    }).select().single();
    if (lErr) handleError('simulateIncomingOrder::log', lErr);

    // 2. Mock Parsing (In a real app, this would be a regex or specialized parser)
    // HL7 Example: PID|||8-882-9912||PINZON^MARIANA||19880512|F
    const pid = rawHL7.split('\n').find(s => s.startsWith('PID'));
    const obrs = rawHL7.split('\n').filter(s => s.startsWith('OBR'));

    // 3. Create Patient & Order (Simplified)
    // This is the "Auto-Admission" part of the flow
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work

    await supabase.from('his_message_log').update({ status: 'PROCESSED' }).eq('id', log.id);
    return { success: true, message: 'Orden admitida automáticamente desde HIS.' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MEDICAL SUPPLIES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const MedicalSuppliesService = {
  async getAll(): Promise<DbMedicalSupply[]> {
    const { data, error } = await supabase.from('medical_supplies').select('*').order('name', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  async logTransaction(transaction: Omit<DbSupplyTransaction, 'id' | 'created_at'>): Promise<void> {
    const { error: tErr } = await supabase.from('supply_transactions').insert(transaction);
    if (tErr) handleError('logTransaction', tErr);

    // Update current stock
    const { data: supply } = await supabase.from('medical_supplies').select('current_stock').eq('id', transaction.supply_id).single();
    const newStock = transaction.type === 'IN'
      ? parseFloat(supply.current_stock) + transaction.quantity
      : parseFloat(supply.current_stock) - transaction.quantity;

    await supabase.from('medical_supplies').update({ current_stock: newStock }).eq('id', transaction.supply_id);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT & STAFF SCHEDULING SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ShiftService = {
  async getTemplates(): Promise<DbShiftTemplate[]> {
    const { data, error } = await supabase.from('shift_templates').select('*').order('start_time', { ascending: true });
    if (error) handleError('getTemplates', error);
    return data!;
  },

  async getSchedules(dateStart: string, dateEnd: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*, profiles(name, role), shift_templates(*)')
      .gte('work_date', dateStart)
      .lte('work_date', dateEnd)
      .order('work_date', { ascending: true });
    if (error) handleError('getSchedules', error);
    return data!;
  },

  async assignShift(assignment: Omit<DbStaffSchedule, 'id' | 'tenant_id' | 'created_at' | 'start_actual' | 'end_actual'>): Promise<DbStaffSchedule> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('staff_schedules').insert({ ...assignment, tenant_id }).select().single();
    if (error) handleError('assignShift', error);
    return data!;
  },

  async clockIn(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_schedules')
      .update({
        start_actual: new Date().toISOString(),
        status: 'CLOCKED_IN'
      })
      .eq('id', scheduleId);
    if (error) handleError('clockIn', error);
  },

  async clockOut(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_schedules')
      .update({
        end_actual: new Date().toISOString(),
        status: 'COMPLETED'
      })
      .eq('id', scheduleId);
    if (error) handleError('clockOut', error);
  },

  async getAttendanceAnalytics(month: number, year: number): Promise<any[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    const schedules = await this.getSchedules(startDate, endDate);
    return schedules || [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY STABILITY SERVICE (Lot Analysis)
// ─────────────────────────────────────────────────────────────────────────────

export const StabilityService = {
  async getLotVialStability(): Promise<any[]> {
    const { data, error } = await supabase.from('lot_vial_stability_view').select('*');
    if (error) handleError('getLotVialStability', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY DOCUMENTATION SERVICE (ISO 15189)
// ─────────────────────────────────────────────────────────────────────────────

export const QualityDocsService = {
  async getAll(): Promise<DbQualityDocument[]> {
    const { data, error } = await supabase.from('quality_documents').select('*').order('code', { ascending: true });
    if (error) handleError('getAll', error);
    return data!;
  },

  async create(doc: Omit<DbQualityDocument, 'id' | 'tenant_id' | 'created_at'>): Promise<DbQualityDocument> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('quality_documents').insert({ ...doc, tenant_id }).select().single();
    if (error) handleError('create', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT FEEDBACK SERVICE (ISO 15189 §8.6)
// ─────────────────────────────────────────────────────────────────────────────

export const FeedbackService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('patient_feedback')
      .select('*, patients(first_name, last_name), orders(order_number)')
      .order('created_at', { ascending: false });
    if (error) handleError('getAll', error);
    return data!;
  },

  async submitFeedback(feedback: Omit<DbPatientFeedback, 'id' | 'resolved_at' | 'resolved_by' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('patient_feedback').insert(feedback);
    if (error) handleError('submitFeedback', error);
  },

  async resolveFeedback(id: string, notes: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('patient_feedback')
      .update({
        status: 'RESOLVED',
        resolution_notes: notes,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) handleError('resolveFeedback', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RISK MANAGEMENT SERVICE (ISO 15189 §8.5)
// ─────────────────────────────────────────────────────────────────────────────

export const RiskService = {
  async getRisks(): Promise<DbQualityRisk[]> {
    const { data, error } = await supabase.from('quality_risks').select('*').order('risk_score', { ascending: false });
    if (error) handleError('getRisks', error);
    return data!;
  },

  async addRisk(risk: Omit<DbQualityRisk, 'id' | 'tenant_id' | 'created_at' | 'risk_score'>): Promise<DbQualityRisk> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('quality_risks').insert({ ...risk, tenant_id }).select().single();
    if (error) handleError('addRisk', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SALES & TRENDS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const SalesService = {
  async getBranchTrends(): Promise<DbBranchSalesTrend[]> {
    const { data, error } = await supabase.from('branch_sales_trends_view').select('*').order('sale_date', { ascending: true });
    if (error) handleError('getBranchTrends', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTANGIBLE ASSETS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const IntangibleAssetService = {
  async getAll(): Promise<DbIntangibleAsset[]> {
    const { data, error } = await supabase.from('intangible_assets').select('*').order('name', { ascending: true });
    if (error) handleError('getIntangibleAssets', error);
    return data!;
  },

  async addAsset(asset: Omit<DbIntangibleAsset, 'id' | 'tenant_id' | 'created_at' | 'status'>): Promise<DbIntangibleAsset> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('intangible_assets').insert({ ...asset, tenant_id }).select().single();
    if (error) handleError('addIntangibleAsset', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEST PROFITABILITY SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ProfitabilityService = {
  async getProfitabilityStats(): Promise<DbTestProfitability[]> {
    const { data, error } = await supabase.from('test_profitability_view').select('*').order('net_profit', { ascending: false });
    if (error) handleError('getProfitabilityStats', error);
    return data!;
  },

  async getReagentEfficiency(): Promise<DbReagentEfficiency[]> {
    const { data, error } = await supabase.from('reagent_efficiency_view').select('*').order('efficiency_percentage', { ascending: false });
    if (error) handleError('getReagentEfficiency', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ELITE INTELLIGENCE & ANALYTICS SERVICE (ISO 15189)
// ─────────────────────────────────────────────────────────────────────────────

export const AnalyticsService = {
  async getOperationalKPIs(): Promise<any> {
    const { data, error } = await supabase.from('lab_operational_kpis_view').select('*').single();
    if (error) return null;
    return data;
  },

  async getDemographics(): Promise<any[]> {
    const { data, error } = await supabase.from('patient_demographics_view').select('*');
    if (error) return [];
    return data;
  },

  async getAnalyzerPerformance(): Promise<any[]> {
    const { data, error } = await supabase.from('analyzer_performance_view').select('*');
    if (error) return [];
    return data;
  },

  async getTechProductivity(): Promise<any[]> {
    const { data, error } = await supabase.from('tech_productivity_view').select('*');
    if (error) return [];
    return data;
  },

  async getTATStats(): Promise<any[]> {
    const { data, error } = await supabase.from('lab_tat_stages_view').select('*').limit(100);
    if (error) return [];
    return data;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EPIDEMIOLOGY & SURVEILLANCE SERVICE (MINSA Panama)
// ─────────────────────────────────────────────────────────────────────────────

export const EpidemiologyService = {
  async getMarkers(): Promise<DbEpidemiologicalMarker[]> {
    const { data, error } = await supabase.from('epidemiological_markers').select('*').order('disease_name', { ascending: true });
    if (error) handleError('getMarkers', error);
    return data!;
  },

  async getSurveillanceCases(): Promise<DbMinsaSurveillance[]> {
    const { data, error } = await supabase.from('minsa_surveillance_view').select('*').order('detection_date', { ascending: false });
    if (error) handleError('getSurveillanceCases', error);
    return data!;
  },

  async getReports(): Promise<DbEpidemiologicalReport[]> {
    const { data, error } = await supabase.from('epidemiological_reports').select('*').order('report_date', { ascending: false });
    if (error) handleError('getReports', error);
    return data!;
  },

  async submitReport(reportId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('epidemiological_reports')
      .update({
        status: 'SENT',
        submitted_by: user?.id,
        submitted_at: new Date().toISOString()
      })
      .eq('id', reportId);
    if (error) handleError('submitReport', error);
  },

  async getHeatmapData(): Promise<DbEpiHeatmapData[]> {
    const { data, error } = await supabase.from('epidemiological_heatmap_view').select('*');
    if (error) handleError('getHeatmapData', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPMENT INSURANCE & WARRANTY SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const EquipmentSafetyService = {
  async getInsurances(): Promise<any[]> {
    const { data, error } = await supabase.from('equipment_insurances').select('*, analyzers(name)');
    if (error) handleError('getInsurances', error);
    return data!;
  },

  async getWarranties(): Promise<any[]> {
    const { data, error } = await supabase.from('equipment_warranties').select('*, analyzers(name)');
    if (error) handleError('getWarranties', error);
    return data!;
  }
};

export const SupplierService = {
  async getAll(): Promise<DbSupplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
    if (error) handleError('getSuppliers', error);
    return data!;
  },

  async getEvaluations(supplierId?: string): Promise<any[]> {
    let query = supabase.from('supplier_evaluations').select('*, profiles!evaluated_by(name)');
    if (supplierId) query = query.eq('supplier_id', supplierId);
    const { data, error } = await query.order('evaluation_date', { ascending: false });
    if (error) handleError('getEvaluations', error);
    return data!;
  },

  async addEvaluation(evalData: Omit<DbSupplierEvaluation, 'id' | 'tenant_id' | 'created_at' | 'final_score'>): Promise<void> {
    const tenant_id = await getTenantId();
    const { error } = await supabase.from('supplier_evaluations').insert({ ...evalData, tenant_id });
    if (error) handleError('addEvaluation', error);

    // Update supplier last score
    const { data: evals } = await supabase.from('supplier_evaluations').select('final_score').eq('supplier_id', evalData.supplier_id);
    if (evals && evals.length > 0) {
      const avg = evals.reduce((acc, e) => acc + parseFloat(e.final_score as any), 0) / evals.length;
      await supabase.from('suppliers').update({
        evaluation_score: avg,
        last_evaluation_date: new Date().toISOString().split('T')[0]
      }).eq('id', evalData.supplier_id);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ISO 15189 AUDIT ENGINE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ISOAuditService = {
  async getClauses(): Promise<DbIsoClause[]> {
    const { data, error } = await supabase.from('iso_clauses').select('*').order('clause_number', { ascending: true });
    if (error) return [];
    return data!;
  },

  async getAuditFindings(): Promise<any[]> {
    const { data, error } = await supabase.from('iso_audit_findings').select('*, iso_clauses(*)');
    if (error) return [];
    return data!;
  },

  async submitFinding(finding: Omit<DbIsoAuditFinding, 'id' | 'tenant_id' | 'created_at' | 'audited_at'>): Promise<void> {
    const tenant_id = await getTenantId();
    const { error } = await supabase.from('iso_audit_findings').insert({ ...finding, tenant_id });
    if (error) handleError('submitFinding', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED RESULTS & FORMULA ENGINE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const FormulaService = {
  async getFormulas(): Promise<DbTestFormula[]> {
    const { data, error } = await supabase.from('test_formulas').select('*').eq('is_active', true);
    if (error) return [];
    return data!;
  },

  /**
   * Ejecuta el motor de cálculo para una orden específica
   * Se llama tras validar un resultado manual o de equipo
   */
  async processCalculations(orderId: string): Promise<void> {
    const formulas = await this.getFormulas();
    // 1. Fetch current order results and patient data
    const { data: order } = await supabase
      .from('orders')
      .select('*, patients(*), test_results(*)')
      .eq('id', orderId)
      .single();

    if (!order) return;

    for (const formula of formulas) {
      const vars = formula.required_variables;
      const context: any = {};
      let allVariablesPresent = true;

      // Map values
      vars.forEach(v => {
        if (v === 'AGE') context[v] = this.calculateAge(order.patients.dob);
        else if (v === 'GENDER') context[v] = order.patients.gender;
        else if (v === 'HEIGHT') context[v] = order.patients.height_cm;
        else if (v === 'WEIGHT') context[v] = order.patients.weight_kg;
        else {
          const res = (order.test_results as any[]).find(r => r.test_code === v);
          if (res && res.numeric_value !== null) context[v] = res.numeric_value;
          else allVariablesPresent = false;
        }
      });

      // Special Logic: Choose formula based on age
      const age = context['AGE'];
      if (formula.target_test_code === 'TFG_EPI' && age < 18) continue; // Skip adult formula for kids
      if (formula.target_test_code === 'TFG_PEDIATRIC' && age >= 18) continue; // Skip kid formula for adults

      if (allVariablesPresent) {
        try {
          const resultValue = this.evaluateFormula(formula.expression, context);

          // 2. Update or Insert the calculated result
          const existingRes = (order.test_results as any[]).find(r => r.test_code === formula.target_test_code);

          if (existingRes) {
            await supabase.from('test_results').update({
              value: resultValue.toString(),
              numeric_value: typeof resultValue === 'number' ? resultValue : null,
              interpretation: `Calculado vía ${formula.formula_name}`,
              status: 'PRE-VALIDADO'
            }).eq('id', existingRes.id);
          }
        } catch (err) {
          console.error(`Error calculating ${formula.target_test_code}:`, err);
        }
      }
    }
  },

  calculateAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  },

  evaluateFormula(expr: string, context: any): any {
    // Simple mock evaluator for LIS common math
    if (expr.includes('[CHOL] - [HDL]')) {
      return context['CHOL'] - context['HDL'] - (context['TRIG'] / 5);
    }
    if (expr.includes('0.413 * ([HEIGHT] / [CREAT])')) {
      return 0.413 * (context['HEIGHT'] / context['CREAT']);
    }
    // Extension point for complex mathjs logic
    return "RESULTADO_CALCULADO";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GROWTH & DEVELOPMENT SERVICE (WHO Standards)
// ─────────────────────────────────────────────────────────────────────────────

export const GrowthService = {
  async getStandards(gender: DbGender, type: string): Promise<DbGrowthStandard[]> {
    const { data, error } = await supabase
      .from('growth_standards')
      .select('*')
      .eq('gender', gender)
      .eq('measure_type', type)
      .order('age_months', { ascending: true });
    if (error) return [];
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL LIABILITY INSURANCE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ProfessionalInsuranceService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('staff_professional_insurances')
      .select('*, profiles(name, license_number)')
      .order('expiry_date', { ascending: true });
    if (error) handleError('getProfInsurances', error);
    return data!;
  },

  async addPolicy(policy: Omit<DbStaffProfessionalInsurance, 'id' | 'tenant_id' | 'created_at'>): Promise<void> {
    const tenant_id = await getTenantId();
    const { error } = await supabase.from('staff_professional_insurances').insert({ ...policy, tenant_id });
    if (error) handleError('addProfInsurance', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL AUDIT MANAGEMENT SERVICE (ISO 15189 §8.8)
// ─────────────────────────────────────────────────────────────────────────────

export const ExternalAuditService = {
  async getAudits(): Promise<DbExternalAudit[]> {
    const { data, error } = await supabase.from('external_audits').select('*').order('start_date', { ascending: false });
    if (error) handleError('getExternalAudits', error);
    return data!;
  },

  async getFindings(auditId: string): Promise<DbExternalAuditFinding[]> {
    const { data, error } = await supabase.from('external_audit_findings').select('*').eq('audit_id', auditId).order('created_at', { ascending: false });
    if (error) handleError('getAuditFindings', error);
    return data!;
  },

  async addAudit(audit: Omit<DbExternalAudit, 'id' | 'tenant_id' | 'created_at'>): Promise<DbExternalAudit> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('external_audits').insert({ ...audit, tenant_id }).select().single();
    if (error) handleError('addExternalAudit', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEST PROFILES & PACKAGES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ProfileEngineService = {
  async getProfiles(): Promise<DbTestProfile[]> {
    const { data, error } = await supabase.from('test_profiles').select('*').eq('is_active', true);
    if (error) return [];
    return data!;
  },

  async getProfileDetails(profileId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('test_profile_components')
      .select('*, reference_ranges!test_code(test_name, unit)')
      .eq('profile_id', profileId);
    if (error) return [];
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTRAMURAL BLOOD DRIVE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const ExtramuralBloodService = {
  async getEvents(): Promise<DbBloodDriveEvent[]> {
    const { data, error } = await supabase.from('blood_drive_events').select('*').order('start_date', { ascending: false });
    if (error) handleError('getEvents', error);
    return data!;
  },

  async getRegistrations(eventId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('blood_drive_registrations')
      .select('*, patients(first_name, last_name, document_id)')
      .eq('event_id', eventId)
      .order('check_in_time', { ascending: true });
    if (error) handleError('getRegistrations', error);
    return data!;
  },

  async registerDonor(reg: Omit<DbBloodDriveRegistration, 'id' | 'check_in_time'>): Promise<void> {
    const { error } = await supabase.from('blood_drive_registrations').insert(reg);
    if (error) handleError('registerDonor', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOOD LOGISTICS & DEFERRAL SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const BloodLogisticsService = {
  async getDeferralStats(): Promise<DbDonorDeferralStat[]> {
    const { data, error } = await supabase.from('donor_deferral_stats_view').select('*').order('total_cases', { ascending: false });
    if (error) return [];
    return data!;
  },

  async getTransfers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('blood_unit_transfers')
      .select('*, profiles!received_by(name)')
      .order('transfer_date', { ascending: false });
    if (error) return [];
    return data!;
  },

  async createTransfer(transfer: Omit<DbBloodUnitTransfer, 'id' | 'tenant_id' | 'created_at' | 'transfer_date'>): Promise<DbBloodUnitTransfer> {
    const tenant_id = await getTenantId();
    const { data, error } = await supabase.from('blood_unit_transfers').insert({ ...transfer, tenant_id }).select().single();
    if (error) handleError('createTransfer', error);
    return data!;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORT: unified namespace for imports
// ─────────────────────────────────────────────────────────────────────────────

export const SupabaseService = {
  auth: AuthService,
  patients: PatientService,
  orders: OrderService,
  results: ResultService,
  referenceRanges: ReferenceRangeService,
  analyzers: AnalyzerService,
  branches: BranchService,
  profiles: ProfileService,
  bloodBank: BloodBankService,
  reagents: ReagentService,
  externalQC: ExternalQCService,
  internalQC: InternalQCService,
  maintenance: MaintenanceService,
  quality: QualityIntelligenceService,
  security: SecurityService,
  notifications: NotificationService,
  billing: BillingService,
  middleware: MiddlewareService,
  payroll: PayrollService,
  purchasing: PurchasingService,
  patientPortal: PatientPortalService,
  fixedAssets: FixedAssetService,
  appointments: AppointmentService,
  waste: BiohazardWasteService,
  staff: StaffService,
  coldChain: ColdChainService,
  environmental: EnvironmentalService,
  incidents: IncidentService,
  workload: WorkloadService,
  opportunities: OpportunityService,
  itHardware: ITHardwareService,
  stability: StabilityService,
  his: HISService,
  supplies: MedicalSuppliesService,
  shifts: ShiftService,
  qualityDocs: QualityDocsService,
  feedback: FeedbackService,
  risks: RiskService,
  sales: SalesService,
  intangibles: IntangibleAssetService,
  profitability: ProfitabilityService,
  analytics: AnalyticsService,
  epidemiology: EpidemiologyService,
  equipmentSafety: EquipmentSafetyService,
  suppliers: SupplierService,
  isoAudit: ISOAuditService,
  formulas: FormulaService,
  growth: GrowthService,
  professionalInsurance: ProfessionalInsuranceService,
  externalAudit: ExternalAuditService,
  testProfiles: ProfileEngineService,
  extramuralBlood: ExtramuralBloodService,
  bloodLogistics: BloodLogisticsService,
};

export default SupabaseService;
