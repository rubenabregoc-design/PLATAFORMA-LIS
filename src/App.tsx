import React, { useState, useEffect, useRef } from 'react';
import { Role, Tenant, Branch, Order, TestResult, Patient, MiddlewareMessageLog, Specimen, User, AnalyzerTestMapping } from './types';
import {
  MOCK_TENANTS,
  MOCK_USERS,
  MOCK_PATIENTS,
  MOCK_TEST_CATALOG,
  MOCK_ORDERS,
  MOCK_RESULTS,
  MOCK_ANALYZERS,
  MOCK_MIDDLEWARE_LOGS,
  MOCK_WESTGARD_QC,
  MOCK_ANALYZER_MAPPINGS
} from './data/mockData';

import { useLisStore } from './store/useLisStore';
import { SupabaseService } from './services/SupabaseService';
import { Header, ROLE_LABELS, ALLOWED_TABS_PER_ROLE, NAVIGATION_TABS } from './components/Header';
import { GlobalErrorBoundary, ModuleErrorBoundary } from './components/ErrorBoundary';
import { Lock, ShieldAlert, KeyRound, ShieldCheck, RefreshCw, Microscope, Building2, Droplets, Calendar, Users, Truck } from 'lucide-react';
import { getTimeBasedGreeting } from './utils/greeting';
import { getTabLabel, getBranchName, getRoleLabel } from './utils/i18n';
import { LoginScreen } from './components/LoginScreen';
import { BranchSelectionModal } from './components/BranchSelectionModal';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { MiddlewareSimulator } from './components/MiddlewareSimulator';
import { WestgardQC } from './components/WestgardQC';
import { PdfReportPreview } from './components/PdfReportPreview';
import { PatientResultsPortal } from './components/PatientResultsPortal';
import { AstmDriverStudio } from './components/AstmDriverStudio';
import { BillingPOS } from './components/BillingPOS';
import { AnalyzerHomologation } from './components/AnalyzerHomologation';
import { DeltaPanicAlerts } from './components/Phase3Suite/DeltaPanicAlerts';
import { MinsaEpidemiology } from './components/Phase3Suite/MinsaEpidemiology';
import { ReagentInventoryModule } from './components/Phase3Suite/ReagentInventoryModule';
import { ExecutiveAnalyticsAI } from './components/Phase4Suite/ExecutiveAnalyticsAI';
import { Ley81AuditVault } from './components/Phase4Suite/Ley81AuditVault';
import { MultiBranchRouting } from './components/Phase4Suite/MultiBranchRouting';
import { FhirInteroperabilityStudio } from './components/Phase5Suite/FhirInteroperabilityStudio';
import { HighAvailabilityDisasterRecovery } from './components/Phase5Suite/HighAvailabilityDisasterRecovery';
import { Iso15189AccreditationPortal } from './components/Phase5Suite/Iso15189AccreditationPortal';
import { ShiftManagementModule } from './components/ShiftManagementModule';
import AppointmentCalendarManager from './components/Phase6Suite/TechnologistSuite/AppointmentCalendarManager';

import { EqaPeecModule } from './components/Phase6Suite/EqaPeecModule';
import { EquipmentMaintenanceCmms } from './components/Phase6Suite/EquipmentMaintenanceCmms';
import { HomePhlebotomyRouting } from './components/Phase6Suite/HomePhlebotomyRouting';
import { AnatomicalPathologyModule } from './components/Phase6Suite/AnatomicalPathologyModule';
import { WhatsAppNotificationEngine } from './components/Phase6Suite/WhatsAppNotificationEngine';
import { BloodBankModule } from './components/Phase6Suite/BloodBankModule';
import { LabelPrinterStudio } from './components/Phase6Suite/LabelPrinterStudio';
import { LabProductivityDashboard } from './components/Phase6Suite/LabProductivityDashboard';
import { TechnologistWorkbench } from './components/Phase6Suite/TechnologistWorkbench';
import { BatchReportingStudio } from './components/Phase6Suite/BatchReportingStudio';

import { EmergencyTriageModule } from './components/HospitalSuite/EmergencyTriageModule';
import { HospitalCommandCenter } from './components/HospitalSuite/HospitalCommandCenter';
import { BedCensusManagement } from './components/HospitalSuite/BedCensusManagement';
import { CpoeCdsModule } from './components/HospitalSuite/CpoeCdsModule';
import { DischargeManagementModule } from './components/HospitalSuite/DischargeManagementModule';
import { IcuCriticalCareModule } from './components/HospitalSuite/IcuCriticalCareModule';
import { SerologyNatScreening } from './components/Phase6Suite/TechnologistSuite/SerologyNatScreening';
import { SmartBedsideTransfusion } from './components/Phase6Suite/TechnologistSuite/SmartBedsideTransfusion';
import StaffPunchClock from './components/Phase6Suite/TechnologistSuite/StaffPunchClock';
import { ElectronicHealthRecordEHR } from './components/HospitalSuite/ElectronicHealthRecordEHR';
import { KardexNursingModule } from './components/HospitalSuite/KardexNursingModule';
import { OperatingRoomManagement } from './components/HospitalSuite/OperatingRoomManagement';
import { MaternityNeonatalModule } from './components/HospitalSuite/MaternityNeonatalModule';
import { RisPacsRadiologyStudio } from './components/HospitalSuite/RisPacsRadiologyStudio';
import { HospitalPharmacyDispensing } from './components/HospitalSuite/HospitalPharmacyDispensing';

import BloodBankCenter from './components/Phase6Suite/TechnologistSuite/BloodBankCenter';
import DonorScreeningForm from './components/Phase6Suite/TechnologistSuite/DonorScreeningForm';
import DonorDeferralDashboard from './components/Phase6Suite/TechnologistSuite/DonorDeferralDashboard';
import ApheresisDonationModule from './components/Phase6Suite/TechnologistSuite/ApheresisDonationModule';
import ExtramuralBloodDriveManager from './components/Phase6Suite/TechnologistSuite/ExtramuralBloodDriveManager';
import UnitProcessingWorkspace from './components/Phase6Suite/TechnologistSuite/UnitProcessingWorkspace';
import ColdChainMonitor from './components/Phase6Suite/TechnologistSuite/ColdChainMonitor';
import BloodLogisticsManager from './components/Phase6Suite/TechnologistSuite/BloodLogisticsManager';
import CrossmatchWorkflow from './components/Phase6Suite/TechnologistSuite/CrossmatchWorkflow';
import HemovigilanceAnalytics from './components/Phase6Suite/TechnologistSuite/HemovigilanceAnalytics';
import BiohazardWasteManager from './components/Phase6Suite/TechnologistSuite/BiohazardWasteManager';
import { AnalyticalValidationWorkstation } from './components/Phase6Suite/TechnologistSuite/AnalyticalValidationWorkstation';
import HISIntegrationConsole from './components/Phase6Suite/TechnologistSuite/HISIntegrationConsole';

import ChemicalWasteManager from './components/Phase6Suite/TechnologistSuite/ChemicalWasteManager';
import DisposalManifestPDF from './components/Phase6Suite/TechnologistSuite/DisposalManifestPDF';
import { ReagentsHilPreanalytics } from './components/Phase6Suite/TechnologistSuite/ReagentsHilPreanalytics';
import { CriticalValueRegistry } from './components/Phase3Suite/CriticalValueRegistry';

import { ResultsAlertsCenter } from './components/RoleDashboards/ResultsAlertsCenter';
import { ResultsClinicalCalculator } from './components/RoleDashboards/ResultsClinicalCalculator';
import { ResultsTelemetryDashboard } from './components/RoleDashboards/ResultsTelemetryDashboard';

import { SecureInternalMessagingWidget } from './components/SecureInternalMessagingWidget';
import { MasterTestCatalogManager } from './components/MasterTestCatalogManager';

import { OwnerDashboard } from './components/RoleDashboards/OwnerDashboard';
import { LabChiefDashboard } from './components/RoleDashboards/LabChiefDashboard';
import { TechMedDashboard } from './components/RoleDashboards/TechMedDashboard';
import { TechValidationTray } from './components/RoleDashboards/TechValidationTray';
import { ResultEntryWorkspace } from './components/RoleDashboards/ResultEntryWorkspace';
import { LabTechDashboard } from './components/RoleDashboards/LabTechDashboard';
import { ReceptionDashboard } from './components/RoleDashboards/ReceptionDashboard';
import { DoctorPortal } from './components/RoleDashboards/DoctorPortal';
import { SecureDoctorPortalGateway } from './components/RoleDashboards/SecureDoctorPortalGateway';
import { SecurePatientPortalGateway } from './components/PatientPortal/SecurePatientPortalGateway';
import { PatientPortal } from './components/RoleDashboards/PatientPortal';
import { SuperAdminDashboard } from './components/RoleDashboards/SuperAdminDashboard';
import { ServerCenterApp } from './components/Infrastructure/ServerCenterApp';
import { SkeletonLoader } from './components/SkeletonLoader';
import { RecentActivityWidget } from './components/RecentActivityWidget';

export default function App() {
  const {
    hasHydrated,
    isAuthenticated,
    currentUser,
    currentRole,
    activeTab,
    setActiveTab,
    language,
    isSessionLocked,
    setSessionLock,
    orders,
    results,
    patients,
    activeOrderId,
    login,
    logout,
    setActiveOrder,
    setCurrentUser,
    setCurrentRole,
    setCurrentTenant,
    setCurrentBranch,
    setIsAuthenticated,
    setOrders,
    setResults,
    setPatients,
    addOrder,
    addPatient,
    updateSpecimenStatus,
    validateResult,
    fetchInitialData
  } = useLisStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Helper para sanitizar tenants y sedes cargados de almacenamiento local
  const loadSanitizedTenants = (): Tenant[] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_tenants');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error cargando tenants:', e);
      }
    }
    return MOCK_TENANTS;
  };

  // Tenant, Branch and User State (Instant zero-flicker restoration)
  const [tenants, setTenants] = useState<Tenant[]>(() => loadSanitizedTenants());
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lis_current_tenant_id') || 'lab-san-jose';
    }
    return 'lab-san-jose';
  });
  const [currentBranchId, setCurrentBranchId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lis_current_branch_id') || 'branch-via-espana';
    }
    return 'branch-via-espana';
  });
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lis_current_branch_id') || 'branch-via-espana';
    }
    return 'branch-via-espana';
  });
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Escuchar si se crean o modifican sedes y clientes en el Súper Admin
  useEffect(() => {
    const handleTenantsUpdated = () => {
      try {
        setTenants(loadSanitizedTenants());
      } catch (e) {}
    };
    window.addEventListener('lis_tenants_updated', handleTenantsUpdated);
    return () => window.removeEventListener('lis_tenants_updated', handleTenantsUpdated);
  }, []);

  // Navigation & View State (Restaurados síncronamente)
  const [showAllModules, setShowAllModules] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const portalParam = searchParams.get('portal');
      const port = window.location.port;
      if (portalParam === 'patient' || port === '3001' || portalParam === 'doctor' || port === '3002') {
        return false;
      }
    }
    return true;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dashboardSubMode, setDashboardSubMode] = useState<'LIS' | 'HIS' | 'BLOODBANK'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lis_dashboard_submode');
      if (saved === 'LIS' || saved === 'HIS' || saved === 'BLOODBANK') return saved;
    }
    return 'LIS';
  });

  const handleDashboardSubModeChange = (mode: 'LIS' | 'HIS' | 'BLOODBANK') => {
    setDashboardSubMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_dashboard_submode', mode);
    }
  };

  const [shiftsViewMode, setShiftsViewMode] = useState<'appointments' | 'shifts' | 'phlebotomy'>('appointments');

  const [autoLockReason, setAutoLockReason] = useState<'inactivity' | 'manual' | null>(null);
  const [unlockPinInput, setUnlockPinInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setGlobalToast({ message: detail.message, type: detail.type || 'info' });
      setTimeout(() => {
        setGlobalToast(null);
      }, detail.duration || 3500);
    };
    window.addEventListener('lis-global-toast', handleToast);
    return () => window.removeEventListener('lis-global-toast', handleToast);
  }, []);

  // Detección de puertos dedicados (3001: Pacientes, 3002: Médicos, 3003: SuperAdmin) o parámetros URL (?portal=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const portalParam = searchParams.get('portal');
      const port = window.location.port;

      if (portalParam === 'patient' || port === '3001') {
        if (currentRole !== 'patient') setCurrentRole('patient');
        if (activeTab !== 'patient_results') setActiveTab('patient_results');
        setShowAllModules(false);
      } else if (portalParam === 'doctor' || port === '3002') {
        if (currentRole !== 'ext_doctor') setCurrentRole('ext_doctor');
        if (activeTab !== 'dashboard') setActiveTab('dashboard');
        setShowAllModules(false);
      } else if (portalParam === 'superadmin' || port === '3003') {
        if (currentRole !== 'abregotech_admin') setCurrentRole('abregotech_admin');
        if (activeTab !== 'dashboard') setActiveTab('dashboard');
        setShowAllModules(true);
      }
    }
  }, []);

  const lastActivityRef = useRef<number>(Date.now());
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos = 300,000 ms

  // Reset activity timestamp on user interaction or login
  useEffect(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const inactivityChecker = setInterval(() => {
      if (!isSessionLocked && isAuthenticated) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          setSessionLock(true);
          setAutoLockReason('inactivity');
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(inactivityChecker);
    };
  }, [isAuthenticated, isSessionLocked]);

  const handleLockSession = () => {
    setSessionLock(true);
    setAutoLockReason('manual');
    setUnlockPinInput('');
    setUnlockError(null);
  };

  const handleUnlockSession = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = currentUser?.pinCode || '1234';
    if (unlockPinInput.trim() === expectedPin) {
      setSessionLock(false);
      setAutoLockReason(null);
      lastActivityRef.current = Date.now();
      setUnlockPinInput('');
      setUnlockError(null);
    } else {
      setUnlockError('❌ PIN de Desbloqueo incorrecto. Ingrese su PIN de firma autorizado.');
    }
  };

  const triggerLoading = () => {
    // Zero-flicker instant transition
    setIsLoading(false);
  };

  // Domain data state
  const [middlewareLogs, setMiddlewareLogs] = useState<MiddlewareMessageLog[]>(MOCK_MIDDLEWARE_LOGS);
  const [analyzerMappings, setAnalyzerMappings] = useState<AnalyzerTestMapping[]>(MOCK_ANALYZER_MAPPINGS);

  const handleAddAnalyzerMapping = (newMapping: AnalyzerTestMapping) => {
    setAnalyzerMappings((prev) => [newMapping, ...prev]);
  };

  const handleUpdateAnalyzerMapping = (updatedMapping: AnalyzerTestMapping) => {
    setAnalyzerMappings((prev) =>
      prev.map((m) => (m.id === updatedMapping.id ? updatedMapping : m))
    );
  };

  const handleDeleteAnalyzerMapping = (mappingId: string) => {
    setAnalyzerMappings((prev) => prev.filter((m) => m.id !== mappingId));
  };

  // PDF Preview Modal State
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);

  const currentTenant = tenants.find((t) => t.id === currentTenantId) || tenants[0];
  const currentBranch = currentTenant.branches.find((b) => b.id === (selectedBranchId || currentBranchId)) || currentTenant.branches[0];

  // Actions
  const handleLogin = (user: User, tenant: Tenant, branch: Branch) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_auth_active', 'true');
      localStorage.setItem('lis_session_user', JSON.stringify(user));
      localStorage.setItem('lis_session_role', user.role);
      localStorage.setItem('lis_current_tenant_id', tenant.id);
      localStorage.setItem('lis_current_branch_id', branch.id);
    }
    setCurrentUser(user);
    setCurrentRole(user.role);
    setCurrentTenant(tenant);
    setCurrentBranch(branch);
    setCurrentTenantId(tenant.id);
    setCurrentBranchId(branch.id);
    setSelectedBranchId(branch.id);
    setIsAuthenticated(true);
    // Modal eliminated upon login because user ALREADY selected branch on Login Screen

    // Preserve active tab if valid for role, otherwise default to first allowed tab
    const allowed = ALLOWED_TABS_PER_ROLE[user.role] || ['dashboard'];
    const savedTab = typeof window !== 'undefined' ? localStorage.getItem('lis_current_tab') : null;
    const initialTab = (savedTab && (allowed.includes(savedTab) || showAllModules)) ? savedTab : (allowed[0] || 'dashboard');
    setActiveTab(initialTab);
  };

  const handleConfirmBranchSelection = (branchId: string) => {
    setSelectedBranchId(branchId);
    setCurrentBranchId(branchId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_current_branch_id', branchId);
    }
    const br = currentTenant.branches.find((b) => b.id === branchId);
    if (br) setCurrentBranch(br);
    setIsBranchModalOpen(false);
    triggerLoading();
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lis_auth_active');
      localStorage.removeItem('lis_session_user');
      localStorage.removeItem('lis_session_role');
      localStorage.removeItem('lis_session_locked');
      localStorage.removeItem('lis_current_tab');
    }
    logout();
  };

  const handleTenantChange = (tenantId: string) => {
    triggerLoading();
    setCurrentTenantId(tenantId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_current_tenant_id', tenantId);
    }
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      if (tenant.branches.length > 0) {
        setCurrentBranchId(tenant.branches[0].id);
        setSelectedBranchId(tenant.branches[0].id);
        setCurrentBranch(tenant.branches[0]);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lis_current_branch_id', tenant.branches[0].id);
        }
      }
    }
  };

  const handleBranchChange = (branchId: string) => {
    triggerLoading();
    setCurrentBranchId(branchId);
    setSelectedBranchId(branchId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_current_branch_id', branchId);
    }
    const br = currentTenant.branches.find((b) => b.id === branchId);
    if (br) setCurrentBranch(br);
  };

  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      triggerLoading();
      setActiveTab(newTab);
    }
  };

  const handleRoleChangeDirect = (newRole: Role) => {
    triggerLoading();
    setCurrentRole(newRole);
    const matchingUser = MOCK_USERS.find((u) => u.role === newRole) || MOCK_USERS[0];
    setCurrentUser(matchingUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_session_role', newRole);
      localStorage.setItem('lis_session_user', JSON.stringify(matchingUser));
    }
    setActiveTab('dashboard');
  };

  const handleNewResultSimulated = (newLog: MiddlewareMessageLog, newResult: TestResult) => {
    setMiddlewareLogs([newLog, ...middlewareLogs]);
    setResults((prev) => {
      const existsIdx = prev.findIndex((r) => r.id === newResult.id || (r.orderId === newResult.orderId && r.parameterId === newResult.parameterId));
      if (existsIdx >= 0) {
        const updated = [...prev];
        updated[existsIdx] = newResult;
        return updated;
      }
      return [newResult, ...prev];
    });
  };

  const handleUpdateResultValue = (resultId: string, newValue: string, resultData?: TestResult) => {
    setResults((prev) => {
      const idx = prev.findIndex((r) => r.id === resultId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          value: newValue,
          numericValue: parseFloat(newValue) || undefined,
          status: 'INGRESADO',
          source: updated[idx].source || 'INGRESO_MANUAL'
        };
        return updated;
      }

      // If parameter is not yet in results array, append the result object with the new value
      if (resultData) {
        return [
          {
            ...resultData,
            id: resultId,
            value: newValue,
            numericValue: parseFloat(newValue) || undefined,
            status: 'INGRESADO',
            source: 'INGRESO_MANUAL'
          },
          ...prev
        ];
      }

      return prev;
    });
  };

  const handleUpdateInterpretation = (resultId: string, interpretation: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, interpretation } : r))
    );
  };

  const handleValidateTechnical = (resultId: string) => {
    validateResult(resultId, currentUser?.name || 'Tecnólogo Médico');
  };

  const handleValidateTechnicalBulk = (resultIds: string[]) => {
    resultIds.forEach((id) => validateResult(id, currentUser?.name || 'Tecnólogo Médico'));
  };

  const handleValidateMedical = (resultIds: string[], signatureHash: string) => {
    setResults((prev) =>
      prev.map((r) =>
        resultIds.includes(r.id)
          ? {
              ...r,
              status: 'VALIDADO',
              medicalValidatedBy: `${currentUser.name} (${currentUser.licenseNumber || 'TM-3109-PA'})`,
              medicalValidatedAt: new Date().toISOString()
            }
          : r
      )
    );

    // Update order status
    const targetOrderId = results.find((r) => resultIds.includes(r.id))?.orderId;
    if (targetOrderId) {
      setOrders((prev) =>
        prev.map((o) => (o.id === targetOrderId ? { ...o, status: 'VALIDADA_MED' } : o))
      );
    }
  };

  const handleUpdateSpecimenStatus = (specimenId: string, status: Specimen['status']) => {
    const targetOrder = orders.find((o) => o.specimens.some((s) => s.id === specimenId));
    if (targetOrder) {
      updateSpecimenStatus(targetOrder.id, specimenId, status);
    } else {
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          specimens: o.specimens.map((s) => (s.id === specimenId ? { ...s, status } : s))
        }))
      );
    }
  };

  const handleCreateOrder = (newOrder: Order, newPatient?: Patient) => {
    if (newPatient) {
      addPatient(newPatient);
    }

    // Instantiate parameter results for all tests included in the new order
    const generatedResults: TestResult[] = [];
    (newOrder.testIds || []).forEach((testId) => {
      const catalogTest = MOCK_TEST_CATALOG.find((t) => t.id === testId);
      if (catalogTest && catalogTest.parameters) {
        catalogTest.parameters.forEach((param) => {
          generatedResults.push({
            id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            orderId: newOrder.id,
            testId: testId,
            parameterId: param.id,
            parameterCode: param.astmParamCode || param.id,
            parameterName: param.name,
            unit: param.unit,
            value: '', // Ready for entry
            numericValue: undefined,
            flag: 'PENDIENTE',
            status: 'PENDIENTE',
            refRangeText: param.referenceRanges?.[0] ? `${param.referenceRanges[0].minValue} - ${param.referenceRanges[0].maxValue}` : 'Normal',
            source: 'RECEPCION_POS',
            analyzerName: 'Ingreso Manual / ACE'
          });
        });
      }
    });

    addOrder(newOrder);

    if (generatedResults.length > 0) {
      setResults((prev) => [...prev, ...generatedResults]);
    }
  };

  const handleUpdateTenants = (updatedTenants: Tenant[]) => {
    setTenants(updatedTenants);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lis_tenants', JSON.stringify(updatedTenants));
        window.dispatchEvent(new CustomEvent('lis_tenants_updated'));
      } catch (e) {
        console.error('Error guardando tenants:', e);
      }
    }
  };

  const handleProvisionTenant = (name: string, ruc: string, dv: string, plan: Tenant['plan']) => {
    const newTenantId = `lab-${Date.now()}`;
    const newTenant: Tenant = {
      id: newTenantId,
      name,
      ruc,
      dv,
      plan,
      branches: [
        {
          id: `br-${Date.now()}`,
          tenantId: newTenantId,
          name: 'Sede Central',
          code: 'SC-01',
          address: 'Ciudad de Panamá',
          phone: '+507 200-0000'
        }
      ]
    };
    handleUpdateTenants([...tenants, newTenant]);
  };

  const handleOrderPaid = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'PAGADO' } : o))
    );
    try {
      await SupabaseService.orders.updateStatus(orderId, { payment_status: 'PAGADO' });
    } catch (e) {
      console.warn('Could not sync payment status to remote database, saved locally:', e);
    }
  };

  const pdfOrder = orders.find((o) => o.id === previewOrderId) || orders[0];
  const pdfPatient = patients.find((p) => p.id === pdfOrder?.patientId) || patients[0];
  const pdfResults = results.filter((r) => r.orderId === pdfOrder?.id);

  const allowedTabsForRole = ALLOWED_TABS_PER_ROLE[currentRole] || ['dashboard'];
  const isTabAuthorized = showAllModules || activeTab === 'dashboard' || allowedTabsForRole.includes(activeTab);

  // Auto-redirect unauthorized tab to user's primary default tab (Must be placed before any conditional returns to obey React Rules of Hooks)
  useEffect(() => {
    if (!hasHydrated) return; // Prevent spurious redirect during store rehydration
    if (isAuthenticated && !isTabAuthorized) {
      const defaultTab = allowedTabsForRole[0] || 'dashboard';
      setActiveTab(defaultTab);
    }
  }, [hasHydrated, isAuthenticated, isTabAuthorized, currentRole]);

  const isServerCenterView = typeof window !== 'undefined' && (
    window.location.port === '3004' ||
    new URLSearchParams(window.location.search).get('view') === 'server_center'
  );

  // Si está en la vista del Centro de Control de Servidores (puerto 3004 o ?view=server_center)
  if (isServerCenterView) {
    return (
      <ModuleErrorBoundary moduleName="Centro de Control de Servidores e Infraestructura">
        <ServerCenterApp />
      </ModuleErrorBoundary>
    );
  }

  const isDoctorPortal = typeof window !== 'undefined' && (
    window.location.port === '3002' ||
    new URLSearchParams(window.location.search).get('portal') === 'doctor' ||
    (isAuthenticated && currentRole === 'ext_doctor')
  );

  const isPatientPortal = typeof window !== 'undefined' && (
    window.location.port === '3001' ||
    new URLSearchParams(window.location.search).get('portal') === 'patient' ||
    (isAuthenticated && currentRole === 'patient')
  );

  // Si está en el Portal Médico (puerto 3002 o ?portal=doctor o rol ext_doctor), presentar pasarela médica aislada directamente
  if (isDoctorPortal) {
    return (
      <ModuleErrorBoundary moduleName="Portal de Médicos Referentes">
        <div className="min-h-screen bg-[#020617] text-slate-100 p-4 sm:p-6 lg:p-8">
          <SecureDoctorPortalGateway
            orders={orders}
            results={results}
            patients={patients}
            tenant={currentTenant}
            branch={currentBranch}
            onOpenPdf={setPreviewOrderId}
            onCreateOrder={handleCreateOrder}
          />
        </div>
      </ModuleErrorBoundary>
    );
  }

  // Si está en el Portal de Pacientes (puerto 3001 o ?portal=patient o rol patient), presentar portal de pacientes con su propio login y vista aislada
  if (isPatientPortal) {
    const matchedPatient = patients.find(p =>
      (currentUser?.id && p.id === currentUser.id) ||
      (currentUser?.email && p.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
      (currentUser?.name && p.firstName && currentUser.name.toLowerCase().includes(p.firstName.toLowerCase())) ||
      (currentUser?.name && p.lastName && currentUser.name.toLowerCase().includes(p.lastName.toLowerCase()))
    ) || patients.find(p => p.id === 'pat-009') || patients[0];

    return (
      <ModuleErrorBoundary moduleName="Portal de Pacientes">
        <div className="min-h-screen bg-[#020617] text-slate-100 p-4 sm:p-6 lg:p-8">
          <SecurePatientPortalGateway
            patients={patients}
            orders={orders}
            results={results}
            tenant={currentTenant}
            branch={currentBranch}
            onOpenPdf={setPreviewOrderId}
            initialPatient={currentUser?.role === 'patient' ? matchedPatient : null}
          />
        </div>
      </ModuleErrorBoundary>
    );
  }

  // Si no está autenticado en la estación estándar (Puerto 3000), presentar Login de Personal Clínico (LIS / HIS / Banco de Sangre)
  if (!isAuthenticated) {
    return (
      <ModuleErrorBoundary moduleName="Portal de Inicio de Sesión">
        <LoginScreen onLogin={handleLogin} />
      </ModuleErrorBoundary>
    );
  }

  // 🔒 PROTOCOLO DE SEGURIDAD ESTRICTA (ISO 15189 / Ley 81):
  // Si la sesión está bloqueada (por inactividad de 5 min o bloqueo manual), presentar ÚNICAMENTE la pantalla de desbloqueo.
  // El árbol DOM clínico queda COMPLETAMENTE DESMONTADO de memoria, impidiendo bypasses por inspección DevTools (F12).
  if (isSessionLocked) {
    return (
      <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4 selection:bg-amber-500/30" onContextMenu={(e) => e.preventDefault()}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-3xl border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {autoLockReason === 'inactivity' ? '🔒 Bloqueo Automático por Inactividad (5 Min)' : 'Seguridad ISO 15189 • Sesión Bloqueada'}
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Estación Protegida</h2>
            <p className="text-xs text-slate-400">
              {autoLockReason === 'inactivity' ? (
                <>
                  Se detectaron <strong className="text-amber-400">5 minutos de inactividad desatendida</strong>. Por protección de datos del paciente (ISO 15189 / Ley 81), la sesión se bloqueó automáticamente.
                </>
              ) : (
                <>
                  La estación de trabajo ha sido protegida. Ingrese el PIN de usuario de <strong className="text-teal-300">{currentUser.name}</strong> para reanudar la sesión.
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleUnlockSession} className="space-y-4" onContextMenu={(e) => e.preventDefault()} noValidate>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>PIN de Desbloqueo (4 Dígitos)</span>
                <span className="text-[10px] text-slate-500 font-mono">Clave de Idoneidad / Firma</span>
              </label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                autoComplete="new-password"
                value={'•'.repeat(unlockPinInput.length)}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const prevLen = unlockPinInput.length;
                  if (rawVal.length < prevLen) {
                    setUnlockPinInput(unlockPinInput.slice(0, rawVal.length));
                  } else {
                    const added = rawVal.replace(/•/g, '').replace(/\D/g, '');
                    if (added) {
                      setUnlockPinInput((prev) => (prev + added).slice(0, 4));
                    }
                  }
                  if (unlockError) setUnlockError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    e.preventDefault();
                    setUnlockPinInput((prev) => prev.slice(0, -1));
                    if (unlockError) setUnlockError(null);
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                  if (pasted) {
                    setUnlockPinInput(pasted);
                    if (unlockError) setUnlockError(null);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-amber-400 focus:outline-none focus:border-amber-400"
                placeholder="••••"
                required
                autoFocus
              />
            </div>

            {unlockError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold">
                {unlockError}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Desbloquear Estación
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Cerrar Sesión e Ir a Inicio
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col relative overflow-x-hidden selection:bg-teal-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-emerald-500/5 rounded-full blur-[110px]"></div>
      </div>

      {/* Top Navbar */}
      <Header
        onRoleChange={handleRoleChangeDirect}
        onTenantChange={handleTenantChange}
        onBranchChange={handleBranchChange}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onLockSession={handleLockSession}
        showAllModules={showAllModules}
        setShowAllModules={setShowAllModules}
      />

      {/* 🌟 Suite Platform Visual Separation Sub-Header Context Banner */}
      {(() => {
        const currentTabObj = NAVIGATION_TABS.find(t => t.id === activeTab) || NAVIGATION_TABS[0];
        const activePlatformCategory = currentTabObj.category || 'lis';
        const greeting = getTimeBasedGreeting(language);

        return (
          <div className={`border-b backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all relative z-20 ${
            activePlatformCategory === 'lis'
              ? 'bg-gradient-to-r from-cyan-950/70 via-slate-950 to-slate-950 border-cyan-500/30 text-cyan-200'
              : activePlatformCategory === 'his'
              ? 'bg-gradient-to-r from-indigo-950/70 via-slate-950 to-slate-950 border-indigo-500/30 text-indigo-200'
              : activePlatformCategory === 'bloodbank'
              ? 'bg-gradient-to-r from-rose-950/70 via-slate-950 to-slate-950 border-rose-500/30 text-rose-200'
              : 'bg-gradient-to-r from-amber-950/70 via-slate-950 to-slate-950 border-amber-500/30 text-amber-200'
          }`}>
            <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">

              {/* Left: Platform Badge & Module Name */}
              <div className="flex items-center space-x-2.5 shrink-0">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black font-mono uppercase tracking-wider border shadow-md flex items-center space-x-1.5 shrink-0 ${
                  activePlatformCategory === 'lis'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/10'
                    : activePlatformCategory === 'his'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50 shadow-indigo-500/10'
                    : activePlatformCategory === 'bloodbank'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/50 shadow-rose-500/10'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-500/10'
                }`}>
                  <span>
                    {activePlatformCategory === 'lis' && (language === 'EN' ? '🔬 LIS PLATFORM' : '🔬 PLATAFORMA LIS')}
                    {activePlatformCategory === 'his' && (language === 'EN' ? '🏥 HIS PLATFORM' : '🏥 PLATAFORMA HIS')}
                    {activePlatformCategory === 'bloodbank' && (language === 'EN' ? '🩸 BLOOD BANK' : '🩸 BANCO DE SANGRE')}
                    {activePlatformCategory === 'bi' && (language === 'EN' ? '💼 BI & MANAGEMENT' : '💼 GESTIÓN & BI')}
                  </span>
                </span>

                <span className="text-slate-600 font-bold">•</span>

                <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight truncate">
                  <span className="text-slate-400 font-medium">{language === 'EN' ? 'Module: ' : 'Módulo: '}</span>
                  <span className="text-white underline decoration-cyan-500/40 underline-offset-4">
                    {getTabLabel(currentTabObj.id, currentTabObj.label, language)}
                  </span>
                </span>
              </div>

              {/* Right: Quick Access Shortcuts Bar (⭐ ACCESOS RÁPIDOS 1-CLIC) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider hidden 2xl:inline">
                  {language === 'EN' ? '⭐ QUICK ACCESS:' : '⭐ ACCESOS RÁPIDOS:'}
                </span>

                <button
                  onClick={() => setActiveTab('billing')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-sm"
                  title={language === 'EN' ? "POS Admission & Invoicing" : "Admisión & Facturación POS"}
                >
                  <span>{language === 'EN' ? '🔬 POS Admission' : '🔬 Admisión POS'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('validation')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-sm"
                  title={language === 'EN' ? "Results & Medical Validation" : "Resultados & Validación Médica"}
                >
                  <span>{language === 'EN' ? '🧪 Validation' : '🧪 Validación'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('his_command')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-sm"
                  title={language === 'EN' ? "Hospital Command Center HIS" : "Command Center Hospitalario HIS"}
                >
                  <span>{language === 'EN' ? '🏥 HIS Command' : '🏥 Command HIS'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('his_triage')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-sm"
                  title={language === 'EN' ? "Manchester Emergency Triage" : "Triage Urgencias Manchester"}
                >
                  <span>{language === 'EN' ? '🫀 ER / Triage' : '🫀 Urgencias'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('his_beds')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-sm"
                  title={language === 'EN' ? "Bed Census & Map" : "Censo & Mapa de Camas"}
                >
                  <span>{language === 'EN' ? '🛏️ Beds' : '🛏️ Camas'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('his_ehr')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-sm"
                  title={language === 'EN' ? "Electronic Health Record EHR" : "Historia Clínica EHR"}
                >
                  <span>📋 EHR</span>
                </button>

                <button
                  onClick={() => setActiveTab('bloodbank')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-sm"
                  title={language === 'EN' ? "Blood Bank Center" : "Centro Banco de Sangre"}
                >
                  <span>{language === 'EN' ? '🩸 Blood Bank' : '🩸 Banco Sangre'}</span>
                </button>

                <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] shrink-0">
                  {getBranchName(currentBranch?.name, language)}
                </span>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Main Body */}
      <main className="flex-1 pb-16 relative z-10 overflow-x-hidden min-w-0">
        {isLoading ? (
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <SkeletonLoader />
          </div>
        ) : !isTabAuthorized ? (
          /* 403 RBAC Access Denied Security Screen */
          <div className="max-w-3xl mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 text-center mx-4 sm:mx-auto">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-3xl border border-rose-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] sm:text-xs bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {language === 'EN' ? '403 Access Denied • Law 81 / RBAC' : '403 Acceso Denegado • Ley 81 / RBAC'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {language === 'EN' ? 'Restricted Module' : 'Módulo Restringido'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                {language === 'EN' ? (
                  <>Your current role (<strong className="text-teal-400">{getRoleLabel(currentRole, 'EN').title}</strong>) does not have permissions for <span className="font-mono text-amber-300 uppercase font-bold">{activeTab}</span>.</>
                ) : (
                  <>Tu perfil actual (<strong className="text-teal-400">{getRoleLabel(currentRole, 'ES').title}</strong>) no tiene permisos para <span className="font-mono text-amber-300 uppercase font-bold">{activeTab}</span>.</>
                )}
              </p>
            </div>

            <div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                {language === 'EN' ? 'Back to my Dashboard' : 'Volver a mi Dashboard'}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[1920px] w-full mx-auto p-2 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 🌟 Suite Dashboard Mode Switcher Bar (Adaptive Responsive Layout) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/90 p-2 sm:p-2.5 rounded-2xl border border-slate-800 shadow-xl">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    <button
                      onClick={() => handleDashboardSubModeChange('LIS')}
                      className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        dashboardSubMode === 'LIS'
                          ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Microscope className={`w-3.5 h-3.5 shrink-0 ${dashboardSubMode === 'LIS' ? 'text-slate-950' : 'text-cyan-400'}`} />
                      <span className="hidden sm:inline">{language === 'EN' ? 'LIS Dashboard (Laboratory)' : 'Dashboard LIS (Laboratorio)'}</span>
                      <span className="sm:hidden font-mono font-black">🔬 LIS</span>
                    </button>

                    <button
                      onClick={() => handleDashboardSubModeChange('HIS')}
                      className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        dashboardSubMode === 'HIS'
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 shrink-0 ${dashboardSubMode === 'HIS' ? 'text-white' : 'text-indigo-400'}`} />
                      <span className="hidden sm:inline">{language === 'EN' ? 'HIS Dashboard (Hospital)' : 'Dashboard HIS (Hospital)'}</span>
                      <span className="sm:hidden font-mono font-black">🏥 HIS</span>
                    </button>

                    <button
                      onClick={() => handleDashboardSubModeChange('BLOODBANK')}
                      className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        dashboardSubMode === 'BLOODBANK'
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Droplets className={`w-3.5 h-3.5 shrink-0 ${dashboardSubMode === 'BLOODBANK' ? 'text-white' : 'text-rose-400'}`} />
                      <span className="hidden sm:inline">{language === 'EN' ? 'Blood Bank Dashboard' : 'Dashboard Banco de Sangre'}</span>
                      <span className="sm:hidden font-mono font-black">{language === 'EN' ? '🩸 Blood Bank' : '🩸 Banco Sangre'}</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 hidden xl:inline px-2">
                    {dashboardSubMode === 'LIS' && (language === 'EN' ? 'Clinical Patient Metrics & Demographics' : 'Métricas Clínicas de Pacientes, Analitos y Demografía')}
                    {dashboardSubMode === 'HIS' && (language === 'EN' ? 'Hospital Command Center & Bed Census' : 'Centro de Mando Hospitalario, Camas & Triage Urgencias')}
                    {dashboardSubMode === 'BLOODBANK' && (language === 'EN' ? 'Transfusion Medicine & Donors' : 'Medicina Transfusional, Donantes & Hemovigilancia')}
                  </span>
                </div>

                {/* Render Selected Suite Dashboard */}
                {dashboardSubMode === 'HIS' ? (
                  <HospitalCommandCenter onNavigateTab={(tab) => setActiveTab(tab)} />
                ) : dashboardSubMode === 'BLOODBANK' ? (
                  <BloodBankModule />
                ) : (
                  <>
                    {currentRole === 'owner' && <OwnerDashboard tenant={currentTenant} branch={currentBranch} orders={orders} />}
                    {currentRole === 'lab_chief' && <LabChiefDashboard orders={orders} results={results} patients={patients} onValidateMedical={handleValidateMedical} onOpenPdf={setPreviewOrderId} />}
                    {currentRole === 'tech_med' && <TechMedDashboard results={results} orders={orders} analyzers={MOCK_ANALYZERS} patients={patients} onValidateTechnical={handleValidateTechnical} onValidateTechnicalBulk={handleValidateTechnicalBulk} />}
                    {currentRole === 'lab_tech' && <LabTechDashboard orders={orders} results={results} patients={patients} onUpdateSpecimenStatus={handleUpdateSpecimenStatus} onValidateTechnical={handleValidateTechnical} onValidateTechnicalBulk={handleValidateTechnicalBulk} onOpenPdf={setPreviewOrderId} />}
                    {currentRole === 'receptionist' && (
                      <ReceptionDashboard
                        patients={patients}
                        testCatalog={MOCK_TEST_CATALOG}
                        orders={orders}
                        results={results}
                        onCreateOrder={handleCreateOrder}
                        onOpenPdf={(ordId) => setPreviewOrderId(ordId)}
                      />
                    )}
                    {currentRole === 'abregotech_admin' && (
                      <SuperAdminDashboard
                        tenants={tenants}
                        analyzers={MOCK_ANALYZERS}
                        logs={middlewareLogs}
                        onProvisionTenant={handleProvisionTenant}
                        onUpdateTenants={handleUpdateTenants}
                      />
                    )}
                    {currentRole === 'ext_doctor' && (
                      <SecureDoctorPortalGateway
                        orders={orders}
                        results={results}
                        patients={patients}
                        tenant={currentTenant}
                        branch={currentBranch}
                        onOpenPdf={setPreviewOrderId}
                        onCreateOrder={handleCreateOrder}
                      />
                    )}
                    {currentRole === 'patient' && (
                      <SecurePatientPortalGateway
                        patients={patients}
                        orders={orders}
                        results={results}
                        tenant={currentTenant}
                        branch={currentBranch}
                        onOpenPdf={setPreviewOrderId}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'batch_reporting' && (
              <BatchReportingStudio
                orders={orders}
                patients={patients}
                results={results}
                tenant={currentTenant}
                branch={currentBranch}
                onOpenSinglePdf={setPreviewOrderId}
              />
            )}

            {activeTab === 'reception' && (
              <ReceptionDashboard
                patients={patients}
                testCatalog={MOCK_TEST_CATALOG}
                orders={orders}
                results={results}
                onCreateOrder={handleCreateOrder}
                onOpenPdf={(ordId) => setPreviewOrderId(ordId)}
              />
            )}

            {activeTab === 'patient_results' && (
              <PatientResultsPortal
                patients={patients}
                orders={orders}
                results={results}
                onOpenPdf={setPreviewOrderId}
                currentUser={currentUser}
                currentRole={currentRole}
                language={language}
              />
            )}

            {activeTab === 'validation' && (
              <ResultEntryWorkspace
                order={orders.find((o) => o.id === activeOrderId) || orders[0]}
                patient={patients.find((p) => p.id === (orders.find((o) => o.id === activeOrderId) || orders[0])?.patientId) || patients[0]}
                results={results}
                analyzers={MOCK_ANALYZERS}
                currentUser={currentUser}
                onUpdateResultValue={handleUpdateResultValue}
                onUpdateInterpretation={handleUpdateInterpretation}
                onUpdateResultStatus={(resultId, status) => setResults((prev) => prev.map((r) => r.id === resultId ? { ...r, status } : r))}
                onOpenPdf={setPreviewOrderId}
                allOrders={orders}
                allPatients={patients}
              />
            )}

            {/* HIS Hospital Suite Sub-Modules */}
            {activeTab === 'his_command' && <HospitalCommandCenter onNavigateTab={(tab) => setActiveTab(tab)} />}
            {activeTab === 'his_triage' && <EmergencyTriageModule />}
            {activeTab === 'his_beds' && <BedCensusManagement onNavigateToEhr={(admissionId) => setActiveTab('his_ehr')} />}
            {activeTab === 'his_ehr' && <ElectronicHealthRecordEHR />}
            {activeTab === 'his_cpoe' && <CpoeCdsModule />}
            {activeTab === 'his_kardex' && <KardexNursingModule />}
            {activeTab === 'his_icu' && <IcuCriticalCareModule />}
            {activeTab === 'his_operating' && <OperatingRoomManagement />}
            {activeTab === 'his_maternity' && <MaternityNeonatalModule />}
            {activeTab === 'his_ris_pacs' && <RisPacsRadiologyStudio />}
            {activeTab === 'his_pharmacy' && <HospitalPharmacyDispensing />}
            {activeTab === 'his_discharge' && <DischargeManagementModule />}
            {activeTab === 'his_console' && <HISIntegrationConsole />}
            {activeTab === 'punch_clock' && <StaffPunchClock />}

            {/* Blood Bank Sub-Modules */}
            {activeTab === 'bloodbank' && <BloodBankCenter />}
            {activeTab === 'blood_donors' && <DonorScreeningForm onClose={() => setActiveTab('bloodbank')} onComplete={() => setActiveTab('bloodbank')} />}
            {activeTab === 'blood_deferral' && <DonorDeferralDashboard />}
            {activeTab === 'blood_apheresis' && <ApheresisDonationModule />}
            {activeTab === 'blood_drives' && <ExtramuralBloodDriveManager />}
            {activeTab === 'blood_fractionation' && <UnitProcessingWorkspace onClose={() => setActiveTab('bloodbank')} onRefresh={() => {}} />}
            {activeTab === 'blood_cold_chain' && <ColdChainMonitor />}
            {activeTab === 'blood_logistics' && <BloodLogisticsManager />}
            {activeTab === 'blood_crossmatch' && <BloodBankModule />}
            {activeTab === 'blood_serology' && <SerologyNatScreening />}
            {activeTab === 'blood_bedside' && <SmartBedsideTransfusion />}
            {activeTab === 'blood_hemovigilance' && <HemovigilanceAnalytics />}
            {activeTab === 'blood_waste' && <BiohazardWasteManager />}
            {activeTab === 'blood_chemical_waste' && <ChemicalWasteManager />}
            {activeTab === 'blood_manifest' && <DisposalManifestPDF onClose={() => setActiveTab('blood_waste')} />}
            {activeTab === 'routing' && <MultiBranchRouting tenant={currentTenant} branches={currentTenant.branches || []} />}
            {activeTab === 'lis_referrals' && <MultiBranchRouting tenant={currentTenant} branches={currentTenant.branches || []} />}

            {/* LIS & Workstation Sub-Modules */}
            {activeTab === 'lis_workstation' && (
              <AnalyticalValidationWorkstation />
            )}
            {activeTab === 'lis_panic' && (
              <CriticalValueRegistry />
            )}
            {activeTab === 'lis_hil' && (
              <ReagentsHilPreanalytics />
            )}
            {activeTab === 'lis_alerts_center' && (
              <ResultsAlertsCenter
                order={orders[0]}
                patient={patients[0]}
                results={results}
                currentUser={currentUser}
                onUpdateInterpretation={handleUpdateInterpretation}
                onUpdateResultStatus={(id, status) => setResults(prev => prev.map(r => r.id === id ? { ...r, status } : r))}
              />
            )}
            {activeTab === 'lis_calculators' && (
              <ResultsClinicalCalculator
                order={orders[0]}
                patient={patients[0]}
                results={results}
                onUpdateResultValue={handleUpdateResultValue}
              />
            )}
            {activeTab === 'lis_telemetry' && (
              <ResultsTelemetryDashboard
                order={orders[0]}
                patient={patients[0]}
                results={results}
                analyzers={MOCK_ANALYZERS}
              />
            )}

            {/* Other modules */}
            {activeTab === 'test_catalog' && <MasterTestCatalogManager />}
            {activeTab === 'tm_workbench' && <TechnologistWorkbench />}
            {activeTab === 'shifts' && (
              <div className="space-y-6">
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShiftsViewMode('appointments')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      shiftsViewMode === 'appointments'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar size={16} className={shiftsViewMode === 'appointments' ? 'text-teal-400' : ''} />
                    Agenda de Citas & Domicilios
                  </button>
                  <button
                    onClick={() => setShiftsViewMode('shifts')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      shiftsViewMode === 'shifts'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={16} className={shiftsViewMode === 'shifts' ? 'text-teal-400' : ''} />
                    Turnos de Personal del Laboratorio
                  </button>
                  <button
                    onClick={() => setShiftsViewMode('phlebotomy')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      shiftsViewMode === 'phlebotomy'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Truck size={16} className={shiftsViewMode === 'phlebotomy' ? 'text-teal-400' : ''} />
                    Flebotomía a Domicilio GPS en Vivo
                  </button>
                </div>

                {shiftsViewMode === 'appointments' && <AppointmentCalendarManager />}
                {shiftsViewMode === 'shifts' && <ShiftManagementModule />}
                {shiftsViewMode === 'phlebotomy' && <HomePhlebotomyRouting />}
              </div>
            )}
            {activeTab === 'productivity' && (
              <LabProductivityDashboard
                orders={orders}
                onNavigateToShifts={() => setActiveTab('shifts')}
              />
            )}
            {activeTab === 'label_studio' && <LabelPrinterStudio />}
            {activeTab === 'eqa' && <EqaPeecModule />}
            {activeTab === 'cmms' && <EquipmentMaintenanceCmms />}
            {activeTab === 'phlebotomy' && <HomePhlebotomyRouting />}
            {activeTab === 'pathology' && <AnatomicalPathologyModule />}
            {activeTab === 'whatsapp' && <WhatsAppNotificationEngine />}
            {activeTab === 'schema' && <DatabaseSchemaViewer />}
            {activeTab === 'homologation' && <AnalyzerHomologation currentUser={currentUser} currentRole={currentRole} analyzers={MOCK_ANALYZERS} testCatalog={MOCK_TEST_CATALOG} mappings={analyzerMappings} onAddMapping={handleAddAnalyzerMapping} onUpdateMapping={handleUpdateAnalyzerMapping} onDeleteMapping={handleDeleteAnalyzerMapping} />}
            {activeTab === 'middleware' && <MiddlewareSimulator analyzers={MOCK_ANALYZERS} logs={middlewareLogs} orders={orders} onNewResultSimulated={handleNewResultSimulated} />}
            {activeTab === 'qc' && <WestgardQC controls={MOCK_WESTGARD_QC} />}
            {activeTab === 'drivers' && <AstmDriverStudio analyzers={MOCK_ANALYZERS} testCatalog={MOCK_TEST_CATALOG} logs={middlewareLogs} />}
            {activeTab === 'billing' && <BillingPOS orders={orders} patients={patients} testCatalog={MOCK_TEST_CATALOG} tenant={currentTenant} branch={currentBranch} onOrderPaid={handleOrderPaid} />}
            {activeTab === 'delta' && <DeltaPanicAlerts orders={orders} results={results} patients={patients} />}
            {activeTab === 'minsa' && <MinsaEpidemiology orders={orders} results={results} patients={patients} />}
            {activeTab === 'inventory' && <ReagentInventoryModule tenant={currentTenant} branch={currentBranch} />}
            {activeTab === 'executive' && <ExecutiveAnalyticsAI tenant={currentTenant} branches={currentTenant.branches} orders={orders} results={results} />}
            {activeTab === 'audit' && <Ley81AuditVault tenant={currentTenant} branch={currentBranch} />}
            {activeTab === 'fhir' && <FhirInteroperabilityStudio tenant={currentTenant} branch={currentBranch} orders={orders} results={results} patients={patients} />}
            {activeTab === 'ha_dr' && <HighAvailabilityDisasterRecovery tenant={currentTenant} branch={currentBranch} />}
            {activeTab === 'accreditation' && <Iso15189AccreditationPortal tenant={currentTenant} branch={currentBranch} />}
            {activeTab === 'superadmin' && (
              <SuperAdminDashboard
                tenants={tenants}
                analyzers={MOCK_ANALYZERS}
                logs={middlewareLogs}
                onProvisionTenant={handleProvisionTenant}
                onUpdateTenants={handleUpdateTenants}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-6 text-xs text-center relative z-10">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <div className="font-bold text-slate-200">AbregoTech Solutions S.A. — LIS-Core + Middleware Engine</div>
          <div>Diseñado para Laboratorios Clínicos e Integración ASTM/HL7 en Panamá y Centroamérica</div>
        </div>
      </footer>

      {/* PDF Modal Preview */}
      {previewOrderId && (
        <PdfReportPreview
          order={orders.find(o => o.id === previewOrderId) || orders[0]}
          patient={patients.find(p => p.id === (orders.find(o => o.id === previewOrderId)?.patientId)) || patients[0]}
          results={results.filter(r => r.orderId === previewOrderId)}
          tenant={currentTenant}
          branch={currentBranch}
          onClose={() => setPreviewOrderId(null)}
        />
      )}

      <BranchSelectionModal
        isOpen={isBranchModalOpen}
        currentUser={currentUser}
        currentTenant={currentTenant}
        selectedBranchId={selectedBranchId || currentBranchId}
        onSelectBranch={(branchId) => {
          setSelectedBranchId(branchId);
          setCurrentBranchId(branchId);
        }}
        onConfirm={handleConfirmBranchSelection}
        onClose={() => setIsBranchModalOpen(false)}
      />


      {/* Floating Inter-Branch Secure Messaging Widget (WebSockets) */}
      {isAuthenticated && !isSessionLocked && (
        <SecureInternalMessagingWidget />
      )}

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
          <div className={`px-5 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 text-xs font-bold backdrop-blur-xl ${
            globalToast.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border-rose-500/60 shadow-rose-950/60'
              : globalToast.type === 'warning'
              ? 'bg-amber-950/95 text-amber-200 border-amber-500/60 shadow-amber-950/60'
              : globalToast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-emerald-950/60'
              : 'bg-slate-900/95 text-teal-200 border-teal-500/60 shadow-teal-950/60'
          }`}>
            <span>{globalToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
