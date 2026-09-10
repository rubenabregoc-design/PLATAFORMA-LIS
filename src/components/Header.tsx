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

export const ALLOWED_TABS_PER_ROLE: Record<Role, string[]> = {
  owner: ['dashboard', 'batch_reporting', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'executive', 'billing', 'inventory', 'schema', 'routing', 'audit', 'ha_dr'],
  lab_chief: ['dashboard', 'batch_reporting', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'qc', 'middleware', 'delta', 'minsa', 'accreditation', 'audit'],
  tech_med: ['dashboard', 'batch_reporting', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'middleware', 'drivers', 'qc', 'delta', 'inventory'],
  lab_tech: ['dashboard', 'batch_reporting', 'test_catalog', 'patient_results', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'phlebotomy', 'inventory'],
  receptionist: ['dashboard', 'batch_reporting', 'test_catalog', 'patient_results', 'productivity', 'label_studio', 'shifts', 'phlebotomy', 'whatsapp', 'billing', 'inventory'],
  ext_doctor: ['dashboard'],
  patient: ['dashboard'],
  abregotech_admin: ['dashboard', 'batch_reporting', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'homologation', 'billing', 'inventory', 'qc', 'middleware', 'drivers', 'delta', 'minsa', 'executive', 'audit', 'routing', 'fhir', 'ha_dr', 'accreditation', 'schema']
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

  // High-priority operational tabs to show directly (top 6-7 modules)
  const mainTabs = visibleTabs.slice(0, 6);
  const secondaryTabs = visibleTabs.slice(6);

  return (
    <header className="bg-[#020617]/70 backdrop-blur-2xl text-white border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4 sm:gap-6">

        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 rotate-3">
            <Activity className="w-5 h-5 text-slate-950 -rotate-3" />
          </div>
          <span className="font-black tracking-tighter text-lg sm:text-xl">LIS<span className="text-teal-400">CORE</span></span>
        </div>

        {/* Complete & Rich Navigation Bar */}
        <nav className="hidden lg:flex items-center space-x-1 flex-1 overflow-hidden">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-300 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 shadow-md border border-teal-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : ''}`} />
                <span className="uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}

          {secondaryTabs.length > 0 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  secondaryTabs.some(t => t.id === activeTab)
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-teal-400" />
                <span className="uppercase tracking-wider">Más Módulos ({secondaryTabs.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMoreOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-[440px] max-h-[420px] overflow-y-auto no-scrollbar bg-slate-950/95 backdrop-blur-3xl border border-teal-500/30 rounded-2xl p-3 shadow-2xl z-50 grid grid-cols-2 gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                    {secondaryTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setIsMoreOpen(false); }}
                          className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                              : 'text-slate-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-teal-400'}`} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
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

          <div className="hidden sm:flex items-center bg-white/5 border border-white/5 rounded-2xl px-4 py-1.5 gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{currentUser?.name}</span>
              <div className="mt-1 flex items-center justify-end space-x-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                 <span className="text-[9px] text-teal-400 font-bold uppercase tracking-widest opacity-80">{currentBranch?.name}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-950 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-xs shadow-inner shrink-0">
              {currentUser?.name.charAt(0)}
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
