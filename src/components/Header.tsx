import React, { useState } from 'react';
import { Role, Tenant, Branch, User } from '../types';
import { useLisStore } from '../store/useLisStore';
import {
  Activity, Building2, SlidersHorizontal, LogOut, MapPin, Filter, LayoutDashboard, Receipt, Package, Sparkles, Cpu, AlertTriangle, FileCheck2, BrainCircuit, ShieldCheck, Truck, Globe, Server, Award, Database, Microscope, FileText, ChevronDown, MoreHorizontal, Lock, Calendar, Target, Wrench, MessageSquare, Droplets, Printer, BarChart3, BookOpen, Files, Archive, Mail, RefreshCw
} from 'lucide-react';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { SessionInactivityTracker } from './SessionInactivityTracker';

interface HeaderProps {
  onRoleChange: (role: Role) => void;
  onTenantChange: (tenantId: string) => void;
  onBranchChange: (branchId: string) => void;
  onOpenBranchModal?: () => void;
  onLockSession?: () => void;
  showAllModules: boolean;
  setShowAllModules: (show: boolean) => void;
}

export const ROLE_LABELS: Record<Role, { title: string; color: string; desc: string }> = {
  owner: { title: 'Dueño / Gerente', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', desc: 'Finanzas, métricas, gerencia' },
  lab_chief: { title: 'Jefe de Laboratorio', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', desc: 'Validación médica final, QC' },
  tech_med: { title: 'Tecnólogo Médico', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Validación técnica, analizadores' },
  lab_tech: { title: 'Técnico de Lab', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', desc: 'Recepción, código de barras' },
  receptionist: { title: 'Recepcionista', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'Registro, órdenes, cobros' },
  ext_doctor: { title: 'Médico Referente', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', desc: 'Portal médico externo' },
  patient: { title: 'Paciente / Cliente', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', desc: 'Portal personal' },
  abregotech_admin: { title: 'Admin AbregoTech', color: 'bg-slate-700/60 text-slate-200 border-slate-600', desc: 'Súper-admin SaaS' }
};

export const NAVIGATION_TABS = [
  // 🔬 LIS (Laboratorio Clínico - 15 Módulos)
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'validation', label: 'Resultados & Validación', icon: Microscope },
  { id: 'tm_workbench', label: 'Estación TM (Bancada)', icon: Activity },
  { id: 'lis_workstation', label: 'Workstation 3D Validación', icon: Sparkles },
  { id: 'patient_results', label: 'Expedientes & Muestras', icon: FileText },
  { id: 'test_catalog', label: 'Catálogo LIS & Pruebas', icon: BookOpen },
  { id: 'qc', label: 'Control Calidad QC', icon: SlidersHorizontal },
  { id: 'middleware', label: 'Middleware ASTM', icon: Sparkles },
  { id: 'homologation', label: 'Analizadores Clínicos', icon: SlidersHorizontal },
  { id: 'drivers', label: 'Drivers ASTM / HL7', icon: Cpu },
  { id: 'phlebotomy', label: 'Flebotomía GPS', icon: Truck },
  { id: 'pathology', label: 'Patología Anatómica', icon: Microscope },
  { id: 'batch_reporting', label: 'Batch Reporting PDF', icon: Files },
  { id: 'lis_hil', label: 'Preanalítica HIL', icon: Droplets },
  { id: 'lis_panic', label: 'Registro de Pánicos', icon: AlertTriangle },

  // 🏥 HIS (Suite Hospitalaria - 10 Módulos)
  { id: 'his_triage', label: 'Urgencias & Triage', icon: Activity },
  { id: 'his_beds', label: 'Censo & Mapa de Camas', icon: Building2 },
  { id: 'his_ehr', label: 'Historia Clínica EHR', icon: FileText },
  { id: 'his_kardex', label: 'Kardex Enfermería eMAR', icon: ShieldCheck },
  { id: 'his_operating', label: 'Quirófanos & Cirugías', icon: Wrench },
  { id: 'his_maternity', label: 'Maternidad & Neonatos', icon: Award },
  { id: 'his_ris_pacs', label: 'Radiología RIS / PACS', icon: Globe },
  { id: 'his_pharmacy', label: 'Farmacia Hospitalaria', icon: Package },
  { id: 'his_console', label: 'Consola Integración HL7', icon: Server },
  { id: 'shifts', label: 'Turnos & Citas', icon: Calendar },

  // 🩸 BANCO DE SANGRE (Medicina Transfusional - 15 Módulos)
  { id: 'bloodbank', label: 'Centro Banco de Sangre', icon: Droplets },
  { id: 'blood_donors', label: 'Cuestionario Donantes', icon: FileText },
  { id: 'blood_deferral', label: 'Diferimiento e Inaptitud', icon: AlertTriangle },
  { id: 'blood_apheresis', label: 'Aféresis & Extracción', icon: Activity },
  { id: 'blood_drives', label: 'Colectas Extramuros', icon: Truck },
  { id: 'blood_fractionation', label: 'Fraccionamiento Componentes', icon: Package },
  { id: 'blood_cold_chain', label: 'Cadena de Frío IoT', icon: Server },
  { id: 'blood_logistics', label: 'Logística Hemocomponentes', icon: Truck },
  { id: 'blood_crossmatch', label: 'Inmuno & Crossmatch', icon: Microscope },
  { id: 'blood_hemovigilance', label: 'Hemovigilancia Eventos', icon: ShieldCheck },
  { id: 'blood_waste', label: 'Desechos Biológicos', icon: Wrench },
  { id: 'blood_chemical_waste', label: 'Desechos Químicos', icon: Wrench },
  { id: 'blood_manifest', label: 'Manifiesto Descarte PDF', icon: Printer },
  { id: 'label_studio', label: 'Etiquetas ISBT 128', icon: Printer },
  { id: 'routing', label: 'Ruteo Inter-Sedes', icon: Truck },

  // 💼 GESTIÓN & BI (Administración - 15 Módulos)
  { id: 'billing', label: 'Facturación POS & DGI', icon: Receipt },
  { id: 'inventory', label: 'Inventario Reactivos FEFO', icon: Package },
  { id: 'executive', label: 'Analítica BI & Ejecutivo', icon: BrainCircuit },
  { id: 'productivity', label: 'Productividad & Métricas', icon: BarChart3 },
  { id: 'minsa', label: 'Reportes MINSA', icon: FileCheck2 },
  { id: 'audit', label: 'Auditoría Ley 81', icon: ShieldCheck },
  { id: 'cmms', label: 'Mantenimiento CMMS', icon: Wrench },
  { id: 'eqa', label: 'PEEC / Control Calidad EQA', icon: Target },
  { id: 'whatsapp', label: 'WhatsApp LIS Engine', icon: MessageSquare },
  { id: 'fhir', label: 'FHIR Interoperabilidad', icon: Globe },
  { id: 'ha_dr', label: 'HA / Cluster Alta Disponibilidad', icon: Server },
  { id: 'accreditation', label: 'Acreditación ISO 15189', icon: Award },
  { id: 'schema', label: 'Base de Datos & Esquemas', icon: Database },
];

const ALL_MODULE_TABS = NAVIGATION_TABS.map(t => t.id);

export const ALLOWED_TABS_PER_ROLE: Record<Role, string[]> = {
  owner: ALL_MODULE_TABS,
  lab_chief: ALL_MODULE_TABS,
  tech_med: ALL_MODULE_TABS,
  lab_tech: ALL_MODULE_TABS,
  receptionist: ALL_MODULE_TABS,
  ext_doctor: ALL_MODULE_TABS,
  patient: ALL_MODULE_TABS,
  abregotech_admin: ALL_MODULE_TABS
};

export const Header: React.FC<HeaderProps> = ({
  onOpenBranchModal,
  onLockSession,
  showAllModules,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const {
    currentRole,
    currentUser,
    currentBranch,
    activeTab,
    setActiveTab,
    logout,
    isSyncing,
    isDemoMode
  } = useLisStore();

  const allowedTabIds = showAllModules
    ? NAVIGATION_TABS.map((t) => t.id)
    : ALLOWED_TABS_PER_ROLE[currentRole || 'lab_tech'] || ['dashboard'];

  const visibleTabs = NAVIGATION_TABS.filter((t) => allowedTabIds.includes(t.id));

  const getTabLabel = (tab: { id: string; label: string }) => {
    if (tab.id === 'patient_results') {
      if (currentRole === 'receptionist') return 'Órdenes del día';
      if (currentRole === 'lab_tech') return 'Mis muestras';
      if (currentRole === 'tech_med' || currentRole === 'lab_chief') return 'Resultados de Pacientes';
    }
    return tab.label;
  };

  // Grand Domain Categories Definition (Explicitly mapping all 55 modules)
  const DOMAIN_CATEGORIES = [
    {
      id: 'lis',
      label: 'Laboratorio',
      icon: Microscope,
      badge: '15 Módulos',
      tabs: ['validation', 'tm_workbench', 'lis_workstation', 'patient_results', 'test_catalog', 'qc', 'middleware', 'homologation', 'drivers', 'phlebotomy', 'pathology', 'batch_reporting', 'lis_hil', 'lis_panic', 'lis_specialized']
    },
    {
      id: 'his',
      label: 'Hospital HIS',
      icon: Activity,
      badge: '10 Módulos',
      tabs: ['his_triage', 'his_beds', 'his_ehr', 'his_kardex', 'his_operating', 'his_maternity', 'his_ris_pacs', 'his_pharmacy', 'his_console', 'shifts']
    },
    {
      id: 'bloodbank',
      label: 'Banco Sangre',
      icon: Droplets,
      badge: '15 Módulos',
      tabs: ['bloodbank', 'blood_donors', 'blood_deferral', 'blood_apheresis', 'blood_drives', 'blood_fractionation', 'blood_cold_chain', 'blood_logistics', 'blood_crossmatch', 'blood_hemovigilance', 'blood_waste', 'blood_chemical_waste', 'blood_manifest', 'label_studio', 'routing']
    },
    {
      id: 'bi',
      label: 'Gestión',
      icon: BrainCircuit,
      badge: '15 Módulos',
      tabs: ['billing', 'inventory', 'executive', 'productivity', 'minsa', 'audit', 'cmms', 'eqa', 'whatsapp', 'fhir', 'ha_dr', 'accreditation', 'schema']
    }
  ];

  const [activeCategoryMenu, setActiveCategoryMenu] = useState<string | null>(null);

  return (
    <header className="bg-[#03091e]/95 backdrop-blur-3xl text-white border-b border-cyan-500/30 sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
      <div className="w-full px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-3">

        {/* Brand Logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] rotate-3">
            <Activity className="w-4.5 h-4.5 text-slate-950 -rotate-3" />
          </div>
          <span className="font-black tracking-tighter text-base sm:text-lg text-white">LIS<span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">CORE</span></span>
        </div>

        {/* Floating Luxury Glass Capsule Navigation Bar (Standalone Commercial Suites) */}
        <nav className="hidden lg:flex items-center space-x-1.5 bg-[#02071a]/85 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.8)] shrink-0">

          {/* Dashboard Direct Capsule Pill */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'dashboard' ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span className="uppercase tracking-wider whitespace-nowrap">Dashboard</span>
          </button>

          {/* Standalone Commercial Suite Buttons */}
          {DOMAIN_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const categoryTabObjects = NAVIGATION_TABS.filter(t => category.tabs.includes(t.id) && visibleTabs.some(v => v.id === t.id));
            const isCategoryActive = categoryTabObjects.some(t => t.id === activeTab);
            const isOpen = activeCategoryMenu === category.id;

            if (categoryTabObjects.length === 0) return null;

            return (
              <div key={category.id} className="relative shrink-0">
                <button
                  onClick={() => setActiveCategoryMenu(isOpen ? null : category.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isCategoryActive
                      ? 'bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-cyan-500/30 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CategoryIcon className={`w-3.5 h-3.5 shrink-0 ${isCategoryActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-cyan-400'}`} />
                  <span className="uppercase tracking-wider whitespace-nowrap">{category.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Glassmorphic Suite Dropdown Panel with Tooltips, Descriptions & Examples */}
                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveCategoryMenu(null)}></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-[500px] max-h-[480px] overflow-y-auto no-scrollbar bg-[#02081f]/95 backdrop-blur-3xl border-2 border-cyan-400/40 rounded-3xl p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-cyan-500/30 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-1.5 border-b border-cyan-500/20 text-[10px] font-black text-cyan-300 uppercase tracking-widest flex items-center justify-between">
                        <span>Plataforma Independiente {category.label}</span>
                        <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold">{categoryTabObjects.length} Módulos Especializados</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto no-scrollbar p-0.5">
                        {categoryTabObjects.map((tab: any) => {
                          const SubIcon = tab.icon;
                          const isSubActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              title={`${tab.label}: ${tab.desc || ''} (${tab.example || ''})`}
                              onClick={() => { setActiveTab(tab.id); setActiveCategoryMenu(null); }}
                              className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer group flex flex-col justify-between space-y-1 ${
                                isSubActive
                                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-500/30'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-850 hover:border-cyan-500/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`p-1.5 rounded-xl shrink-0 ${isSubActive ? 'bg-slate-950/20 text-slate-950' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                  <SubIcon className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold truncate leading-tight">{getTabLabel(tab)}</span>
                              </div>

                              {tab.desc && (
                                <p className={`text-[10px] line-clamp-2 leading-tight font-medium ${isSubActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                  {tab.desc}
                                </p>
                              )}

                              {tab.example && (
                                <span className={`text-[9px] font-mono font-bold tracking-tighter truncate ${isSubActive ? 'text-slate-950' : 'text-amber-400'}`}>
                                  {tab.example}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Section: Profile, Offline Sync, Inactivity Tracker & Logout (Fixed & Compact Shrink-0) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          
          {isDemoMode && (
            <div className="hidden xl:flex items-center space-x-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">
               <Sparkles className="w-3 h-3 text-amber-400" />
               <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Demo</span>
            </div>
          )}

          {isSyncing && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full animate-pulse">
               <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
               <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter">Sync</span>
            </div>
          )}

          {/* Offline Data Sync Indicator */}
          <OfflineSyncIndicator />

          {/* Session Inactivity Countdown */}
          <SessionInactivityTracker onLockSession={onLockSession} timeoutSeconds={300} />

          <div className="h-5 w-px bg-white/10 hidden sm:block"></div>

          {/* Fixed Compact User Profile Badge Pill */}
          <div className="hidden sm:flex items-center bg-[#02071a]/95 border border-cyan-500/40 rounded-full px-2.5 py-1 gap-1.5 shadow-lg shrink-0">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black text-white uppercase tracking-tight leading-none truncate max-w-[95px]" title={currentUser?.name}>
                {currentUser?.name || 'Lic. Sofía Guardia'}
              </span>
              <span className="text-[8px] text-cyan-300 font-bold uppercase tracking-wider opacity-90 truncate max-w-[85px]">
                {currentBranch?.name || 'Sede Vía España'}
              </span>
            </div>
            <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md shrink-0">
              {ROLE_LABELS[currentUser?.role || 'owner']?.title?.charAt(0) || 'D'}
            </div>
          </div>

          <div className="h-8 w-px bg-white/5 hidden md:block"></div>

          {onLockSession && (
            <button
              onClick={onLockSession}
              title="Bloquear Estación Manualmente (Auto-lock en 5 min inactividad)"
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/5 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-400 transition-all duration-300 cursor-pointer group shadow-2xl"
            >
              <Lock className="w-4.5 h-4.5 text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/5 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 transition-all duration-300 cursor-pointer group shadow-2xl"
          >
            <LogOut className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Scroller - More elegant */}
      <div className="lg:hidden border-t border-white/5 px-4 py-3 bg-[#020617]/80 overflow-x-auto flex items-center space-x-3">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                isActive ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20' : 'bg-white/5 text-slate-500 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
