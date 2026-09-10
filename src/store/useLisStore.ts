import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Role, Tenant, Branch, Order, TestResult, Patient, AuditLogEntry, Permission, Specimen } from '../types';
import { MOCK_USERS, MOCK_ORDERS, MOCK_RESULTS, MOCK_PATIENTS, MOCK_TENANTS } from '../data/mockData';
import { ResultEvaluator } from '../domain/ResultEvaluator';
import { InterpretationEngine } from '../domain/InterpretationEngine';
import { PermissionManager } from '../domain/PermissionManager';
import { SupabaseService, mapDbOrderToFrontend, mapDbPatientToFrontend, mapDbResultToFrontend } from '../services/SupabaseService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { notifyToast } from '../utils/toastNotification';
import { offlineSyncManager } from '../utils/offlineSyncEngine';
import { lisIndexedDb } from '../utils/indexedDbStorage';

interface LisState {
  currentUser: User | null;
  currentRole: Role;
  currentTenant: Tenant | null;
  currentBranch: Branch | null;
  isAuthenticated: boolean;

  // --- Domain Data ---
  orders: Order[];
  results: TestResult[];
  patients: Patient[];

  // --- UI State ---
  activeOrderId: string | null;
  activeTab: string;
  isLoading: boolean;
  isSyncing: boolean;
  isDemoMode: boolean;
  isSessionLocked: boolean;

  // --- Actions ---
  canDo: (permission: Permission) => boolean;
  setDemoMode: (active: boolean) => void;
  fetchInitialData: () => Promise<void>;
  login: (email: string, password: string) => void;
  logout: () => void;
  setSessionLock: (locked: boolean) => void;
  setActiveTab: (tab: string) => void;
  setActiveOrder: (orderId: string) => void;

  // --- Domain Actions ---
  setCurrentUser: (user: User | null) => void;
  setCurrentRole: (role: Role) => void;
  setCurrentTenant: (tenant: Tenant) => void;
  setCurrentBranch: (branch: Branch) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
  setResults: (results: TestResult[] | ((prev: TestResult[]) => TestResult[])) => void;
  setPatients: (patients: Patient[] | ((prev: Patient[]) => Patient[])) => void;
  addPatient: (patient: Patient) => void;
  addOrder: (order: Order) => void;
  addResults: (newResults: TestResult[]) => void;
  updateResult: (resultId: string, newValue: string, resultData?: TestResult) => void;
  updateInterpretation: (resultId: string, interpretation: string) => void;
  updateResultStatus: (resultId: string, status: TestResult['status'], value?: string) => void;
  updateSpecimenStatus: (orderId: string, specimenId: string, status: Specimen['status']) => void;
  validateResult: (resultId: string, authorName: string) => void;
  unvalidateResult: (resultId: string, reason: string) => void;
}

export const useLisStore = create<LisState>()(
  persist(
    (set, get) => ({
      currentUser: MOCK_USERS[0], // Default for dev
      currentRole: 'owner',
      currentTenant: MOCK_TENANTS[0],
      currentBranch: MOCK_TENANTS[0].branches[0],
      isAuthenticated: false,

      orders: MOCK_ORDERS,
      results: MOCK_RESULTS,
      patients: MOCK_PATIENTS,

      activeOrderId: MOCK_ORDERS[0].id,
      activeTab: 'dashboard',
      isLoading: false,
      isSyncing: false,
      isDemoMode: false,
      isSessionLocked: false,

      canDo: (permission) => {
        const role = get().currentRole;
        return PermissionManager.hasPermission(role, permission);
      },

      setDemoMode: (active) => set({ isDemoMode: active }),

      fetchInitialData: async () => {
        // En caso de estar desconectado, preservar el estado local ya persistido sin sobreescribirlo
        if (!offlineSyncManager.getConnectionStatus()) {
          console.info('📡 LIS-CORE: Operando sin conexión de red (Offline). Conservando datos locales.');
          return;
        }

        if (get().isDemoMode || !isSupabaseConfigured) {
          console.info('🚀 LIS-CORE: Iniciando en Modo Local / Demo Seguro.');
          const currentResults = get().results;
          if (!currentResults || currentResults.length === 0) {
            set({
              results: MOCK_RESULTS,
              patients: MOCK_PATIENTS,
              orders: MOCK_ORDERS
            });
          }
          return;
        }

        set({ isSyncing: true });
        try {
          const dbOrders = await SupabaseService.orders.getAll();

          if (dbOrders && dbOrders.length > 0) {
            const mappedOrders = dbOrders.map(mapDbOrderToFrontend);

            const allResults: TestResult[] = [];
            dbOrders.forEach((o) => {
              if (o.test_results) {
                o.test_results.forEach((r) => {
                  allResults.push(mapDbResultToFrontend(r));
                });
              }
            });

            const patientMap = new Map<string, Patient>();
            dbOrders.forEach((o) => {
              if (o.patients) {
                patientMap.set(o.patients.id, mapDbPatientToFrontend(o.patients));
              }
            });
            const mappedPatients = Array.from(patientMap.values());

            set({
              orders: mappedOrders,
              results: allResults,
              patients: mappedPatients,
            });
            console.log('✅ LIS-CORE: Sincronización con Nube Exitosa.');
          } else {
            console.info('ℹ️ LIS-CORE: Base de datos vacía. Cargando configuración base (Mocks).');
            set({
              results: MOCK_RESULTS,
              patients: MOCK_PATIENTS,
              orders: MOCK_ORDERS
            });
          }
        } catch (e) {
          console.error('Error crítico de sincronización:', e);
        } finally {
          set({ isSyncing: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          if (!isSupabaseConfigured) {
            const matched = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
            if (matched) {
              set({ currentUser: matched, isAuthenticated: true });
              notifyToast(`Sesión iniciada como ${matched.name}`, 'success');
              return;
            }
          }

          const data = await SupabaseService.auth.signIn(email, password);

          if (data.user) {
            const profile = await SupabaseService.auth.getCurrentProfile();

            set({
              currentUser: profile
                ? {
                    id: profile.id,
                    name: profile.name,
                    email: data.user.email || '',
                    role: profile.role as any,
                    tenantId: profile.tenant_id || '',
                    branchId: profile.branch_id || undefined,
                    licenseNumber: profile.license_number || undefined,
                    pinCode: profile.pin_code || undefined,
                  }
                : { id: data.user.id, name: data.user.email || '', email: data.user.email || '', role: 'lab_tech', tenantId: '' },
              isAuthenticated: true,
            });
            notifyToast('Sesión autenticada en la nube', 'success');
          }
        } catch (error: any) {
          notifyToast('Error de Autenticación: ' + error.message, 'error');
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => set({ isAuthenticated: false, currentUser: null }),

      setSessionLock: (locked) => set({ isSessionLocked: locked }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      setActiveOrder: (orderId) => set({ activeOrderId: orderId }),

      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentRole: (role) => set({ currentRole: role }),
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
      setOrders: (orders) => set((state) => ({ orders: typeof orders === 'function' ? orders(state.orders) : orders })),
      setResults: (results) => set((state) => ({ results: typeof results === 'function' ? results(state.results) : results })),
      setPatients: (patients) => set((state) => ({ patients: typeof patients === 'function' ? patients(state.patients) : patients })),

      addPatient: (patient) => {
        set((state) => ({ patients: [patient, ...state.patients] }));

        const isOffline = !offlineSyncManager.getConnectionStatus();
        const payload = {
          national_id: patient.nationalId,
          id_type: patient.idType as any,
          first_name: patient.firstName,
          last_name: patient.lastName,
          dob: patient.dob,
          gender: patient.gender,
          phone: patient.phone || null,
          email: patient.email || null,
          address: patient.address || null,
          data_consent: Boolean(patient.dataConsentLey81),
          consent_date: patient.consentDate || new Date().toISOString(),
          insurance_status: (patient.insuranceProvider ? 'ASEGURADO' : 'PARTICULAR') as any,
          nationality: patient.nationality || 'Panameña',
        };

        if (isOffline || !isSupabaseConfigured) {
          if (isOffline) {
            offlineSyncManager.enqueue({
              type: 'PATIENT_REGISTRATION',
              sampleBarcode: patient.nationalId,
              patientName: `${patient.lastName}, ${patient.firstName}`,
              payload
            });
            notifyToast('Modo Offline: Paciente resguardado en buffer local.', 'info', 2000);
          }
        } else if (!get().isDemoMode) {
          SupabaseService.patients.create(payload as any).catch((err) => {
            console.warn('[LIS-CORE] Fallo al registrar paciente en nube, encolando offline:', err);
            offlineSyncManager.enqueue({
              type: 'PATIENT_REGISTRATION',
              sampleBarcode: patient.nationalId,
              patientName: `${patient.lastName}, ${patient.firstName}`,
              payload
            });
            notifyToast('Red inestable: Registro de paciente encolado.', 'warning');
          });
        }
      },

      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }));

        const isOffline = !offlineSyncManager.getConnectionStatus();
        const sampleBarcode = order.specimens?.[0]?.barcode || order.orderNumber;
        const branchId = order.branchId || get().currentBranch?.id || 'branch-default';

        if (isOffline || !isSupabaseConfigured) {
          if (isOffline) {
            offlineSyncManager.enqueue({
              type: 'SAMPLE_REGISTRATION',
              sampleBarcode,
              testCode: order.testIds?.join(', '),
              payload: {
                order_number: order.orderNumber,
                patient_id: order.patientId,
                branch_id: branchId,
                status: (order.status as any) || 'REGISTRADA',
                priority: (order.priority as any) || 'RUTINA',
                payment_status: (order.paymentStatus as any) || 'PENDIENTE',
              }
            });
            notifyToast('Modo Offline: Orden registrada localmente.', 'info', 2000);
          }
        } else if (!get().isDemoMode) {
          SupabaseService.orders.create({
            order_number: order.orderNumber,
            patient_id: order.patientId,
            branch_id: branchId,
            status: (order.status as any) || 'REGISTRADA',
            priority: (order.priority as any) || 'RUTINA',
            payment_status: (order.paymentStatus as any) || 'PENDIENTE',
          }).catch((err) => {
            console.warn('[LIS-CORE] Fallo al crear orden en nube, encolando offline:', err);
            offlineSyncManager.enqueue({
              type: 'SAMPLE_REGISTRATION',
              sampleBarcode,
              testCode: order.testIds?.join(', '),
              payload: {
                order_number: order.orderNumber,
                patient_id: order.patientId,
                branch_id: branchId,
                status: (order.status as any) || 'REGISTRADA',
                priority: (order.priority as any) || 'RUTINA',
                payment_status: (order.paymentStatus as any) || 'PENDIENTE',
              }
            });
            notifyToast('Red inestable: Orden encolada para sincronización.', 'warning');
          });
        }
      },

      addResults: (newResults) => set((state) => ({ results: [...state.results, ...newResults] })),

      updateResult: (resultId, newValue, resultData) => set((state) => {
        if (!PermissionManager.hasPermission(state.currentRole, 'RESULT_ENTRY')) {
          console.error('[RBAC] Intento de edición denegado.');
          return state;
        }

        const targetRes = state.results.find(r => r.id === resultId);
        const order = state.orders.find(o => o.id === targetRes?.orderId);
        const patient = state.patients.find(p => p.id === order?.patientId) || MOCK_PATIENTS[0];

        let autoInterpFinal = '';
        let evalFlagFinal: any = 'NORMAL';
        let evalNumFinal: number | undefined = undefined;

        const updatedResults = state.results.map(r => {
          if (r.id === resultId) {
            // Recalculate Clinical Logic via Senior Domain Services
            const mockResForEval = { ...r, value: newValue, numericValue: parseFloat(newValue) || undefined };
            const evaluation = ResultEvaluator.evaluate(mockResForEval as TestResult, patient);
            const autoInterp = InterpretationEngine.getInterpretation({ ...mockResForEval, flag: evaluation.flag } as TestResult, patient);
            autoInterpFinal = autoInterp;
            evalFlagFinal = evaluation.flag;
            evalNumFinal = evaluation.numericValue ?? undefined;

            const auditEntry: AuditLogEntry = {
              id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              timestamp: new Date().toISOString(),
              action: 'EDICION',
              author: state.currentUser?.name || 'Sistema',
              previousValue: r.value,
              newValue: newValue
            };

            return {
              ...r,
              value: newValue,
              numericValue: evaluation.numericValue ?? undefined,
              flag: evaluation.flag,
              interpretation: r.interpretation || autoInterp,
              status: 'PENDIENTE' as const,
              version: (r.version || 1) + 1,
              history: [...(r.history || []), auditEntry]
            };
          }
          return r;
        });

        // Persistir en Supabase o encolar en OfflineSyncManager
        const isOffline = !offlineSyncManager.getConnectionStatus();
        if (isOffline || !isSupabaseConfigured) {
          if (isOffline) {
            offlineSyncManager.enqueue({
              type: 'RESULT_UPDATE',
              sampleBarcode: order?.specimens?.[0]?.barcode || order?.orderNumber || targetRes?.orderId,
              patientName: patient ? `${patient.lastName}, ${patient.firstName}` : undefined,
              testCode: targetRes?.parameterName || targetRes?.testId,
              payload: {
                resultId,
                value: newValue,
                numeric_value: evalNumFinal ?? null,
                status: 'PENDIENTE',
                interpretation: autoInterpFinal,
                reason: 'Edición técnica en modo fuera de línea'
              }
            });
            notifyToast('Modo Offline: Resultado guardado en buffer local.', 'info', 2000);
          }
        } else if (!get().isDemoMode) {
          SupabaseService.results.update(resultId, {
            value: newValue,
            numeric_value: evalNumFinal ?? null,
            status: 'PENDIENTE',
            interpretation: autoInterpFinal,
          }, 'Actualización de valor desde estación de trabajo').catch((err) => {
            console.warn('[LIS-CORE] Fallo de red con Supabase, encolando en OfflineSyncManager:', err);
            offlineSyncManager.enqueue({
              type: 'RESULT_UPDATE',
              sampleBarcode: order?.specimens?.[0]?.barcode || order?.orderNumber || targetRes?.orderId,
              patientName: patient ? `${patient.lastName}, ${patient.firstName}` : undefined,
              testCode: targetRes?.parameterName || targetRes?.testId,
              payload: {
                resultId,
                value: newValue,
                numeric_value: evalNumFinal ?? null,
                status: 'PENDIENTE',
                interpretation: autoInterpFinal,
                reason: 'Reintento tras fallo de conectividad'
              }
            });
            notifyToast('Red inestable: Operación protegida en cola offline.', 'warning');
          });
        }

        return { results: updatedResults };
      }),

      updateInterpretation: (resultId, interpretation) => set((state) => ({
        results: state.results.map(r => r.id === resultId ? { ...r, interpretation } : r)
      })),

      updateResultStatus: (resultId, status, value) => set((state) => ({
        results: state.results.map(r => r.id === resultId ? { ...r, status, value: value || r.value } : r)
      })),

      updateSpecimenStatus: (orderId, specimenId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  specimens: o.specimens.map((s) => (s.id === specimenId ? { ...s, status } : s))
                }
              : o
          )
        }));

        const isOffline = !offlineSyncManager.getConnectionStatus();
        if (isOffline) {
          offlineSyncManager.enqueue({
            type: 'TUBE_SCAN',
            sampleBarcode: specimenId,
            payload: { orderId, specimenId, status, timestamp: new Date().toISOString() }
          });
        }
      },

      validateResult: (resultId, authorName) => set((state) => {
        if (!PermissionManager.hasPermission(state.currentRole, 'RESULT_VALIDATE_TECH')) {
          return state;
        }

        const res = state.results.find(r => r.id === resultId);

        // Business Rule: Clinical Warning if validating critical without interpretation
        if ((res?.flag === 'CRITICO_BAJO' || res?.flag === 'CRITICO_ALTO' || (res?.flag as any) === 'CRIT_L' || (res?.flag as any) === 'CRIT_H') && !res?.interpretation) {
          console.warn(`[LIS-CORE] Validación de valor crítico sin interpretación para analito ${res?.parameterName}`);
        }

        // Persistir en Supabase o encolar en OfflineSyncManager
        const isOffline = !offlineSyncManager.getConnectionStatus();
        if (isOffline || !isSupabaseConfigured) {
          if (isOffline) {
            offlineSyncManager.enqueue({
              type: 'RESULT_VALIDATION',
              sampleBarcode: res?.orderId,
              patientName: res?.parameterName,
              testCode: res?.parameterName || res?.testId,
              payload: {
                resultId,
                status: 'VALIDADO',
                authorName,
                validatedAt: new Date().toISOString()
              }
            });
            notifyToast('Modo Offline: Validación técnica resguardada localmente.', 'info', 2000);
          }
        } else if (!get().isDemoMode) {
          SupabaseService.results.validate(resultId, 'VALIDADO').catch((err) => {
            console.warn('[LIS-CORE] Fallo validación en Supabase, encolando offline:', err);
            offlineSyncManager.enqueue({
              type: 'RESULT_VALIDATION',
              sampleBarcode: res?.orderId,
              patientName: res?.parameterName,
              testCode: res?.parameterName || res?.testId,
              payload: {
                resultId,
                status: 'VALIDADO',
                authorName,
                validatedAt: new Date().toISOString()
              }
            });
            notifyToast('Red inestable: Validación encolada para sincronización.', 'warning');
          });
        }

        return {
          results: state.results.map(r => {
            if (r.id === resultId) {
              const auditEntry: AuditLogEntry = {
                id: `audit-${Date.now()}`,
                timestamp: new Date().toISOString(),
                action: 'VALIDACION_TEC',
                author: authorName
              };
              return {
                ...r,
                status: 'VALIDADO',
                technicalValidatedBy: authorName,
                technicalValidatedAt: new Date().toISOString(),
                version: (r.version || 1) + 1,
                history: [...(r.history || []), auditEntry]
              };
            }
            return r;
          })
        };
      }),

      unvalidateResult: (resultId, reason) => set((state) => {
        if (!PermissionManager.hasPermission(state.currentRole, 'RESULT_UNVALIDATE')) {
          return state;
        }

        // Persistir en Supabase o encolar en OfflineSyncManager
        const isOffline = !offlineSyncManager.getConnectionStatus();
        if (isOffline || !isSupabaseConfigured) {
          if (isOffline) {
            offlineSyncManager.enqueue({
              type: 'RESULT_UNVALIDATE',
              sampleBarcode: resultId,
              testCode: 'DESVALIDACION',
              payload: {
                resultId,
                status: 'PENDIENTE',
                reason
              }
            });
            notifyToast('Modo Offline: Desvalidación resguardada en buffer.', 'info', 2000);
          }
        } else if (!get().isDemoMode) {
          SupabaseService.results.update(resultId, {
            status: 'PENDIENTE',
          }, reason).catch((err) => {
            console.warn('[LIS-CORE] Fallo desvalidación en Supabase, encolando offline:', err);
            offlineSyncManager.enqueue({
              type: 'RESULT_UNVALIDATE',
              sampleBarcode: resultId,
              testCode: 'DESVALIDACION',
              payload: {
                resultId,
                status: 'PENDIENTE',
                reason
              }
            });
            notifyToast('Red inestable: Desvalidación encolada para sincronización.', 'warning');
          });
        }

        return {
          results: state.results.map(r => {
          if (r.id === resultId) {
            const auditEntry: AuditLogEntry = {
              id: `audit-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'DESVALIDACION',
              author: state.currentUser?.name || 'Sistema',
              reason
            };
            return {
              ...r,
              status: 'PENDIENTE' as TestResult['status'],
              technicalValidatedBy: undefined,
              technicalValidatedAt: undefined,
              version: (r.version || 1) + 1,
              history: [...(r.history || []), auditEntry]
            };
          }
          return r;
        })
        };
      }),
    }),
    {
      name: 'lis-storage-v4', // Version bump to flush stale IndexedDB cache & load latest fresh mock dataset
      storage: createJSONStorage(() => lisIndexedDb),
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        activeTab: state.activeTab,
        activeOrderId: state.activeOrderId,
        orders: state.orders,
        results: state.results,
        patients: state.patients,
      }),
    }
  )
);
