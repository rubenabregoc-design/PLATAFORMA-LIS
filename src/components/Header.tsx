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
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'validation', label: 'Resultados', icon: Microscope },
  { id: 'tm_workbench', label: 'Estación TM', icon: Activity },
  { id: 'patient_results', label: 'Expedientes', icon: FileText },
  { id: 'billing', label: 'Facturación POS', icon: Receipt },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'test_catalog', label: 'Catálogo LIS', icon: BookOpen },
  { id: 'batch_reporting', label: 'Batch Reporting', icon: Files },
  { id: 'productivity', label: 'Productividad', icon: BarChart3 },
  { id: 'qc', label: 'Control Calidad', icon: SlidersHorizontal },
  { id: 'phlebotomy', label: 'Flebotomía GPS', icon: Truck },
  { id: 'bloodbank', label: 'Banco Sangre', icon: Droplets },
  { id: 'pathology', label: 'Patología', icon: Microscope },
  { id: 'whatsapp', label: 'WhatsApp LIS', icon: MessageSquare },
  { id: 'label_studio', label: 'Etiquetas', icon: Printer },
  { id: 'shifts', label: 'Turnos', icon: Calendar },
  { id: 'eqa', label: 'PEEC / EQA', icon: Target },
  { id: 'cmms', label: 'CMMS Equipos', icon: Wrench },
  { id: 'middleware', label: 'Middleware', icon: Sparkles },
  { id: 'homologation', label: 'Analizadores', icon: SlidersHorizontal },
  { id: 'drivers', label: 'Drivers ASTM', icon: Cpu },
  { id: 'delta', label: 'Alertas Delta', icon: AlertTriangle },
  { id: 'minsa', label: 'Reportes MINSA', icon: FileCheck2 },
  { id: 'executive', label: 'Analítica BI', icon: BrainCircuit },
  { id: 'audit', label: 'Auditoría Ley 81', icon: ShieldCheck },
  { id: 'routing', label: 'Ruteo Sedes', icon: Truck },
  { id: 'fhir', label: 'FHIR Interop', icon: Globe },
  { id: 'ha_dr', label: 'HA / Cluster', icon: Server },
  { id: 'accreditation', label: 'ISO 15189', icon: Award },
  { id: 'schema', label: 'Base de Datos', icon: Database },
];

const ALL_MODULE_TABS = [
  'dashboard', 'validation', 'tm_workbench', 'patient_results', 'billing', 'inventory',
  'test_catalog', 'batch_reporting', 'productivity', 'qc', 'phlebotomy', 'bloodbank',
  'pathology', 'whatsapp', 'label_studio', 'shifts', 'eqa', 'cmms', 'middleware',
  'homologation', 'drivers', 'delta', 'minsa', 'executive', 'audit', 'routing',
  'fhir', 'ha_dr', 'accreditation', 'schema'
];

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

  // Grand Domain Categories Definition (Concise single-line labels)
  const DOMAIN_CATEGORIES = [
    {
      id: 'lis',
      label: 'Laboratorio',
      icon: Microscope,
      badge: '10 Módulos',
      tabs: ['validation', 'tm_workbench', 'patient_results', 'test_catalog', 'qc', 'middleware', 'homologation', 'phlebotomy', 'pathology', 'batch_reporting']
    },
    {
      id: 'his',
      label: 'Hospital HIS',
      icon: Activity,
      badge: 'Hospital',
      tabs: ['patient_results', 'shifts', 'routing', 'fhir']
    },
    {
      id: 'bloodbank',
      label: 'Banco Sangre',
      icon: Droplets,
      badge: 'Transfusional',
      tabs: ['bloodbank', 'label_studio']
    },
    {
      id: 'bi',
      label: 'Gestión',
      icon: BrainCircuit,
      badge: 'Gerencial',
      tabs: ['billing', 'inventory', 'executive', 'minsa', 'audit', 'cmms', 'eqa', 'whatsapp', 'accreditation', 'schema']
    }
  ];

  const [activeCategoryMenu, setActiveCategoryMenu] = useState<string | null>(null);

  return (
    <header className="bg-[#03091e]/95 backdrop-blur-3xl text-white border-b border-cyan-500/30 sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4 sm:gap-6">

        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] rotate-3">
            <Activity className="w-5 h-5 text-slate-950 -rotate-3" />
          </div>
          <span className="font-black tracking-tighter text-lg sm:text-xl text-white">LIS<span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">CORE</span></span>
        </div>

        {/* Floating Luxury Glass Capsule Navigation Bar (Sistema Caro / High-End Enterprise) */}
        <nav className="hidden lg:flex items-center space-x-1 bg-[#02071a]/85 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.8)]">

          {/* Dashboard Direct Capsule Pill */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span className="uppercase tracking-wider">Dashboard</span>
          </button>

          {/* Domain Category Capsule Pills */}
          {DOMAIN_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const categoryTabObjects = NAVIGATION_TABS.filter(t => category.tabs.includes(t.id) && visibleTabs.some(v => v.id === t.id));
            const isCategoryActive = categoryTabObjects.some(t => t.id === activeTab);
            const isOpen = activeCategoryMenu === category.id;

            if (categoryTabObjects.length === 0) return null;

            return (
              <div key={category.id} className="relative">
                <button
                  onClick={() => setActiveCategoryMenu(isOpen ? null : category.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isCategoryActive
                      ? 'bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-cyan-500/30 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CategoryIcon className={`w-3.5 h-3.5 shrink-0 ${isCategoryActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-cyan-400'}`} />
                  <span className="uppercase tracking-wider whitespace-nowrap">{category.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Ultra-Sleek Glassmorphic Category Menu */}
                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveCategoryMenu(null)}></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[340px] bg-[#02081f]/95 backdrop-blur-3xl border-2 border-cyan-400/40 rounded-3xl p-3 shadow-[0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-cyan-500/30 z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-1.5 border-b border-cyan-500/20 text-[10px] font-black text-cyan-300 uppercase tracking-widest flex items-center justify-between">
                        <span>Plataforma {category.label}</span>
                        <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full text-[9px] font-mono">{categoryTabObjects.length} Módulos</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1 max-h-[360px] overflow-y-auto no-scrollbar">
                        {categoryTabObjects.map((tab) => {
                          const SubIcon = tab.icon;
                          const isSubActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => { setActiveTab(tab.id); setActiveCategoryMenu(null); }}
                              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer border ${
                                isSubActive
                                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-500/30'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-850 hover:border-cyan-500/50'
                              }`}
                            >
                              <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                              <span className="truncate">{getTabLabel(tab)}</span>
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

        {/* Right Section: Profile, Offline Sync, Inactivity Tracker & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {isDemoMode && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse mr-2">
               <Sparkles className="w-3 h-3 text-amber-400" />
               <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Demo Mode</span>
            </div>
          )}

          {isSyncing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full animate-pulse">
               <RefreshCw className="w-3 h-3 text-teal-400 animate-spin" />
               <span className="text-[10px] font-black text-teal-400 uppercase tracking-tighter">Syncing Cloud</span>
            </div>
          )}

          {/* Offline Data Sync & Local Storage Persistence Indicator */}
          <OfflineSyncIndicator />

          {/* Session Inactivity Countdown & Progress Bar (5 Min Auto-Lock) */}
          <SessionInactivityTracker onLockSession={onLockSession} timeoutSeconds={300} />

          <div className="h-7 w-px bg-white/10 hidden sm:block"></div>

          <div className="hidden sm:flex items-center bg-slate-900/80 border border-slate-700/60 rounded-2xl px-3 py-1.5 gap-2.5 shadow-md">
            <div className="flex flex-col text-right max-w-[140px]">
              <span className="text-[11px] font-black text-white uppercase tracking-tight leading-none truncate" title={currentUser?.name}>{currentUser?.name}</span>
              <div className="mt-1 flex items-center justify-end space-x-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                 <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider opacity-90 truncate max-w-[110px]">{currentBranch?.name}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shrink-0">
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
