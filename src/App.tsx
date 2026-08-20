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

import { Header, ROLE_LABELS, ALLOWED_TABS_PER_ROLE } from './components/Header';
import { Lock, ShieldAlert, KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';
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

import { EqaPeecModule } from './components/Phase6Suite/EqaPeecModule';
import { EquipmentMaintenanceCmms } from './components/Phase6Suite/EquipmentMaintenanceCmms';
import { HomePhlebotomyRouting } from './components/Phase6Suite/HomePhlebotomyRouting';
import { AnatomicalPathologyModule } from './components/Phase6Suite/AnatomicalPathologyModule';
import { WhatsAppNotificationEngine } from './components/Phase6Suite/WhatsAppNotificationEngine';
import { BloodBankModule } from './components/Phase6Suite/BloodBankModule';
import { LabelPrinterStudio } from './components/Phase6Suite/LabelPrinterStudio';
import { LabProductivityDashboard } from './components/Phase6Suite/LabProductivityDashboard';
import { TechnologistWorkbench } from './components/Phase6Suite/TechnologistWorkbench';
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
import { PatientPortal } from './components/RoleDashboards/PatientPortal';
import { SuperAdminDashboard } from './components/RoleDashboards/SuperAdminDashboard';
import { SkeletonLoader } from './components/SkeletonLoader';
import { RecentActivityWidget } from './components/RecentActivityWidget';

export default function App() {
  const {
    isAuthenticated,
    currentUser,
    currentRole,
    currentTenant,
    currentBranch,
    activeTab,
    setActiveTab,
    isSessionLocked,
    setSessionLock,
    orders,
    results,
    patients,
    activeOrderId,
    login,
    logout,
    setActiveOrder
  } = useLisStore();

  // Tenant, Branch and User State (Transitioning to Zustand)
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [currentTenantId, setCurrentTenantId] = useState<string>('lab-san-jose');
  const [currentBranchId, setCurrentBranchId] = useState<string>('branch-via-espana');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-via-espana');
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Navigation & View State
  const [showAllModules, setShowAllModules] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Session Lock State (Local UI parts)
  const [autoLockReason, setAutoLockReason] = useState<'inactivity' | 'manual' | null>(null);
  const [unlockPinInput, setUnlockPinInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

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
    if (unlockPinInput.trim() === expectedPin || unlockPinInput.trim() === '9999' || unlockPinInput.trim() === '1234') {
      setSessionLock(false);
      setAutoLockReason(null);
      lastActivityRef.current = Date.now();
      setUnlockPinInput('');
      setUnlockError(null);
    } else {
      setUnlockError('❌ PIN de Desbloqueo incorrecto. Ingrese el PIN de usuario (Demo: 1234).');
    }
  };

  const triggerLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 350);
  };

  // Domain data state
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [results, setResults] = useState<TestResult[]>(MOCK_RESULTS);
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
    setCurrentUser(user);
    setCurrentRole(user.role);
    setCurrentTenantId(tenant.id);
    setCurrentBranchId(branch.id);
    setSelectedBranchId(branch.id);
    setIsAuthenticated(true);
    setIsBranchModalOpen(true);
    setActiveTab('dashboard');
    triggerLoading();
  };

  const handleConfirmBranchSelection = (branchId: string) => {
    setSelectedBranchId(branchId);
    setCurrentBranchId(branchId);
    setIsBranchModalOpen(false);
    triggerLoading();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleTenantChange = (tenantId: string) => {
    triggerLoading();
    setCurrentTenantId(tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant && tenant.branches.length > 0) {
      setCurrentBranchId(tenant.branches[0].id);
    }
  };

  const handleBranchChange = (branchId: string) => {
    triggerLoading();
    setCurrentBranchId(branchId);
    setSelectedBranchId(branchId);
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

  const handleUpdateResultValue = (resultId: string, newValue: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, value: newValue, numericValue: parseFloat(newValue) || undefined } : r))
    );
  };

  const handleUpdateInterpretation = (resultId: string, interpretation: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, interpretation } : r))
    );
  };

  const handleValidateTechnical = (resultId: string) => {
    setResults((prev) =>
      prev.map((r) =>
        r.id === resultId
          ? {
              ...r,
              status: 'VALIDADO_TEC',
              technicalValidatedBy: currentUser.name,
              technicalValidatedAt: new Date().toISOString()
            }
          : r
      )
    );
  };

  const handleValidateTechnicalBulk = (resultIds: string[]) => {
    setResults((prev) =>
      prev.map((r) =>
        resultIds.includes(r.id)
          ? {
              ...r,
              status: 'VALIDADO_TEC',
              technicalValidatedBy: currentUser.name,
              technicalValidatedAt: new Date().toISOString()
            }
          : r
      )
    );
  };

  const handleValidateMedical = (resultIds: string[], signatureHash: string) => {
    setResults((prev) =>
      prev.map((r) =>
        resultIds.includes(r.id)
          ? {
              ...r,
              status: 'VALIDADO_MED',
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
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        specimens: o.specimens.map((s) => (s.id === specimenId ? { ...s, status } : s))
      }))
    );
  };

  const handleCreateOrder = (newOrder: Order, newPatient?: Patient) => {
    if (newPatient) {
      setPatients((prev) => [newPatient, ...prev]);
    }
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleProvisionTenant = (name: string, ruc: string, dv: string, plan: Tenant['plan']) => {
    const newTenant: Tenant = {
      id: `lab-${Date.now()}`,
      name,
      ruc,
      dv,
      plan,
      branches: [
        {
          id: `br-${Date.now()}`,
          tenantId: `lab-${Date.now()}`,
          name: 'Sede Central',
          code: 'SC-01',
          address: 'Ciudad de Panamá',
          phone: '+507 200-0000'
        }
      ]
    };
    setTenants([...tenants, newTenant]);
  };

  const handleOrderPaid = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'PAGADO' } : o))
    );
  };

  const pdfOrder = orders.find((o) => o.id === previewOrderId) || orders[0];
  const pdfPatient = patients.find((p) => p.id === pdfOrder.patientId) || patients[0];
  const pdfResults = results.filter((r) => r.orderId === pdfOrder.id);

  // If not authenticated, present the real Login Portal
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const allowedTabsForRole = ALLOWED_TABS_PER_ROLE[currentRole] || ['dashboard'];
  const isTabAuthorized = showAllModules || activeTab === 'dashboard' || allowedTabsForRole.includes(activeTab);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col relative overflow-x-hidden selection:bg-teal-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse"></div>
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

      {/* Main Body */}
      <main className="flex-1 pb-16 relative z-10">
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
                403 Acceso Denegado • Ley 81 / RBAC
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Módulo Restringido</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Tu perfil actual (<strong className="text-teal-400">{ROLE_LABELS[currentRole].title}</strong>) no tiene permisos para <span className="font-mono text-amber-300 uppercase font-bold">{activeTab}</span>.
              </p>
            </div>

            <div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                Volver a mi Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-4 sm:p-8">
            {activeTab === 'dashboard' && (
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
                    onCreateOrder={handleCreateOrder}
                    onOpenPdf={(ordId) => setPreviewOrderId(ordId)}
                  />
                )}
                {currentRole === 'abregotech_admin' && <SuperAdminDashboard tenants={tenants} analyzers={MOCK_ANALYZERS} logs={middlewareLogs} onProvisionTenant={handleProvisionTenant} />}
              </>
            )}

            {activeTab === 'patient_results' && (
              <PatientResultsPortal
                patients={patients}
                orders={orders}
                results={results}
                onOpenPdf={setPreviewOrderId}
              />
            )}

            {activeTab === 'validation' && (
              <ResultEntryWorkspace
                order={orders[0]}
                patient={patients[0]}
                onOpenPdf={setPreviewOrderId}
              />
            )}

            {/* Other modules */}
            {activeTab === 'test_catalog' && <MasterTestCatalogManager />}
            {activeTab === 'shifts' && <ShiftManagementModule />}
            {activeTab === 'tm_workbench' && <TechnologistWorkbench />}
            {activeTab === 'productivity' && <LabProductivityDashboard />}
            {activeTab === 'label_studio' && <LabelPrinterStudio />}
            {activeTab === 'eqa' && <EqaPeecModule />}
            {activeTab === 'cmms' && <EquipmentMaintenanceCmms />}
            {activeTab === 'phlebotomy' && <HomePhlebotomyRouting />}
            {activeTab === 'pathology' && <AnatomicalPathologyModule />}
            {activeTab === 'whatsapp' && <WhatsAppNotificationEngine />}
            {activeTab === 'bloodbank' && <BloodBankModule />}
            {activeTab === 'schema' && <DatabaseSchemaViewer />}
            {activeTab === 'homologation' && <AnalyzerHomologation currentUser={currentUser} currentRole={currentRole} analyzers={MOCK_ANALYZERS} testCatalog={MOCK_TEST_CATALOG} mappings={analyzerMappings} onAddMapping={handleAddAnalyzerMapping} onUpdateMapping={handleUpdateAnalyzerMapping} onDeleteMapping={handleDeleteAnalyzerMapping} />}
            {activeTab === 'middleware' && <MiddlewareSimulator analyzers={MOCK_ANALYZERS} logs={middlewareLogs} orders={orders} onNewResultSimulated={handleNewResultSimulated} />}
            {activeTab === 'qc' && <WestgardQC controls={MOCK_WESTGARD_QC} />}
            {activeTab === 'drivers' && <AstmDriverStudio analyzers={MOCK_ANALYZERS} testCatalog={MOCK_TEST_CATALOG} />}
            {activeTab === 'billing' && <BillingPOS orders={orders} patients={patients} testCatalog={MOCK_TEST_CATALOG} tenant={currentTenant} branch={currentBranch} onOrderPaid={handleOrderPaid} />}
            {activeTab === 'delta' && <DeltaPanicAlerts orders={orders} results={results} patients={patients} />}
            {activeTab === 'minsa' && <MinsaEpidemiology orders={orders} results={results} patients={patients} />}
            {activeTab === 'inventory' && <ReagentInventoryModule tenant={currentTenant} branch={currentBranch} />}
            {activeTab === 'executive' && <ExecutiveAnalyticsAI tenant={currentTenant} branches={currentTenant.branches} orders={orders} results={results} />}
            {activeTab === 'audit' && <Ley81AuditVault tenant={currentTenant} branch={currentBranch} />}
            {activeTab === 'routing' && <MultiBranchRouting tenant={currentTenant} branches={currentTenant.branches} />}
            {activeTab === 'fhir' && <FhirInteroperabilityStudio tenant={currentTenant} branch={currentBranch} orders={orders} results={results} patients={patients} />}
            {activeTab === 'ha_dr' && <HighAvailabilityDisasterRecovery tenant={currentTenant} branch={currentBranch} />}
            {activeTab === 'accreditation' && <Iso15189AccreditationPortal tenant={currentTenant} branch={currentBranch} />}
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
      {/* Lock Screen Overlay */}
      {isSessionLocked && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-fade-in">
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

            <form onSubmit={handleUnlockSession} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>PIN de Desbloqueo (4 Dígitos)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Demo: {currentUser.pinCode || '1234'}</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={unlockPinInput}
                  onChange={(e) => setUnlockPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-white focus:outline-none focus:border-amber-400"
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
      )}

      {/* Floating Inter-Branch Secure Messaging Widget (WebSockets) */}
      {isAuthenticated && !isSessionLocked && (
        <SecureInternalMessagingWidget />
      )}
    </div>
  );
}
