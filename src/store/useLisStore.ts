import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role, Tenant, Branch, Order, TestResult, Patient, AuditLogEntry, Permission } from '../types';
import { MOCK_USERS, MOCK_ORDERS, MOCK_RESULTS, MOCK_PATIENTS, MOCK_TENANTS } from '../data/mockData';
import { ResultEvaluator } from '../domain/ResultEvaluator';
import { InterpretationEngine } from '../domain/InterpretationEngine';
import { PermissionManager } from '../domain/PermissionManager';
import { SupabaseRepository } from '../services/SupabaseRepository';
import { supabase } from '../lib/supabaseClient';

interface LisState {
  currentUser: User;
  currentRole: Role;
  currentTenant: Tenant;
  currentBranch: Branch;
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
  login: (user: User, tenant: Tenant, branch: Branch) => void;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  setCurrentRole: (role: Role) => void;
  setCurrentTenant: (tenant: Tenant) => void;
  setCurrentBranch: (branch: Branch) => void;
  setSessionLock: (locked: boolean) => void;
  setActiveTab: (tab: string) => void;
  setActiveOrder: (orderId: string) => void;

  // --- Domain Actions ---
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
  setResults: (results: TestResult[] | ((prev: TestResult[]) => TestResult[])) => void;
  setPatients: (patients: Patient[] | ((prev: Patient[]) => Patient[])) => void;
  addOrder: (order: Order) => void;
  addResults: (newResults: TestResult[]) => void;
  updateResult: (resultId: string, newValue: string, resultData?: TestResult) => void;
  updateInterpretation: (resultId: string, interpretation: string) => void;
  updateResultStatus: (resultId: string, status: TestResult['status'], value?: string) => void;
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
        if (get().isDemoMode) {
          console.info('🚀 LIS-CORE: Iniciando en Modo Demo Enterprise.');
          set({
            results: MOCK_RESULTS,
            patients: MOCK_PATIENTS,
            orders: MOCK_ORDERS
          });
          return;
        }

        set({ isSyncing: true });
        try {
          // Intentar traer pacientes y resultados reales
          const { data: remoteResults, error: resError } = await supabase
            .from('test_results')
            .select('*');

          if (!resError && remoteResults && remoteResults.length > 0) {
            // Caso A: Hay datos reales en la nube -> Usarlos
            set({ results: remoteResults as TestResult[] });
            console.log('✅ LIS-CORE: Sincronización con Nube Exitosa.');
          } else {
            // Caso B: Base de datos vacía o error -> Usar Mocks como punto de partida
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

      login: (user: User, tenant: Tenant, branch: Branch) => {
        set({
          currentUser: user,
          currentRole: user.role,
          currentTenant: tenant,
          currentBranch: branch,
          isAuthenticated: true,
          activeTab: 'dashboard'
        });
      },

      logout: () => set({ isAuthenticated: false }),
      setCurrentUser: (user) => set({ currentUser: user, currentRole: user.role }),
      setCurrentRole: (role) => set({ currentRole: role }),
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setCurrentBranch: (branch) => set({ currentBranch: branch }),

      setSessionLock: (locked) => set({ isSessionLocked: locked }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      setActiveOrder: (orderId) => set({ activeOrderId: orderId }),

      setOrders: (updater) => set((state) => ({
        orders: typeof updater === 'function' ? updater(state.orders) : updater
      })),

      setResults: (updater) => set((state) => ({
        results: typeof updater === 'function' ? updater(state.results) : updater
      })),

      setPatients: (updater) => set((state) => ({
        patients: typeof updater === 'function' ? updater(state.patients) : updater
      })),

      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

      addResults: (newResults) => set((state) => ({ results: [...state.results, ...newResults] })),

      updateResult: (resultId, newValue, resultData) => set((state) => {
        if (!PermissionManager.hasPermission(state.currentRole, 'RESULT_ENTRY')) {
          console.error('[RBAC] Intento de edición denegado.');
          return state;
        }

        const targetRes = state.results.find(r => r.id === resultId);
        const order = state.orders.find(o => o.id === targetRes?.orderId);
        const patient = state.patients.find(p => p.id === order?.patientId) || MOCK_PATIENTS[0];

        const updatedResults = state.results.map(r => {
          if (r.id === resultId) {
            // Recalculate Clinical Logic via Senior Domain Services
            const mockResForEval = { ...r, value: newValue, numericValue: parseFloat(newValue) || undefined };
            const evaluation = ResultEvaluator.evaluate(mockResForEval as TestResult, patient);
            const autoInterp = InterpretationEngine.getInterpretation({ ...mockResForEval, flag: evaluation.flag } as TestResult, patient);

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
              status: 'INGRESADO' as const,
              version: (r.version || 1) + 1,
              history: [...(r.history || []), auditEntry]
            };
          }
          return r;
        });
        return { results: updatedResults };
      }),

      updateInterpretation: (resultId, interpretation) => set((state) => ({
        results: state.results.map(r => r.id === resultId ? { ...r, interpretation } : r)
      })),

      updateResultStatus: (resultId, status, value) => set((state) => ({
        results: state.results.map(r => r.id === resultId ? { ...r, status, value: value || r.value } : r)
      })),

      validateResult: (resultId, authorName) => set((state) => {
        if (!PermissionManager.hasPermission(state.currentRole, 'RESULT_VALIDATE_TECH')) {
          return state;
        }

        const res = state.results.find(r => r.id === resultId);

        // Business Rule: Clinical Warning if validating critical without interpretation
        if (res?.flag?.includes('CRITICO') && !res.interpretation) {
          console.warn(`[LIS-CORE] Validación de valor crítico sin interpretación para analito ${res.parameterName}`);
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
                status: 'VALIDADO_TEC',
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
                status: 'INGRESADO',
                technicalValidatedBy: undefined,
                technicalValidatedAt: undefined,
                version: (r.version || 1) + 1,
                history: [...(r.history || []), auditEntry]
              };
            }
            return r;
          })
        };
      })
    }),
    {
      name: 'lis-storage', // persist state in localStorage
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        activeTab: state.activeTab,
        activeOrderId: state.activeOrderId
      }),
    }
  )
);
