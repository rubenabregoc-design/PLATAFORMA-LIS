import React, { useState } from 'react';
import { Role, Tenant, Branch, User } from '../types';
import {
  Activity, Building2, SlidersHorizontal, LogOut, MapPin, Filter, LayoutDashboard, Receipt, Package, Sparkles, Cpu, AlertTriangle, FileCheck2, BrainCircuit, ShieldCheck, Truck, Globe, Server, Award, Database, Microscope, FileText, ChevronDown, MoreHorizontal, Lock, Calendar, Target, Wrench, MessageSquare, Droplets, Printer, BarChart3, BookOpen, ShieldAlert, X, Terminal
} from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  currentUser: User;
  onRoleChange: (role: Role) => void;
  currentTenant: Tenant;
  currentBranch: Branch;
  onTenantChange: (tenantId: string) => void;
  onBranchChange: (branchId: string) => void;
  onOpenBranchModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onLockSession?: () => void;
  showAllModules: boolean;
  setShowAllModules: (show: boolean) => void;
  notificationCount?: number;
  systemAlerts?: { type: string; message: string; id: string }[];
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
  { id: 'test_catalog', label: 'Catálogo LIS', icon: BookOpen },
  { id: 'patient_results', label: 'Expedientes', icon: FileText },
  { id: 'validation', label: 'Resultados', icon: Microscope },
  { id: 'tm_workbench', label: 'Estación TM', icon: Microscope },
  { id: 'productivity', label: 'Productividad LIS', icon: BarChart3 },
  { id: 'label_studio', label: 'Impresora Etiquetas', icon: Printer },
  { id: 'shifts', label: 'Turnos', icon: Calendar },
  { id: 'eqa', label: 'PEEC / EQA', icon: Target },
  { id: 'cmms', label: 'CMMS Equipos', icon: Wrench },
  { id: 'phlebotomy', label: 'Flebotomía GPS', icon: Truck },
  { id: 'pathology', label: 'Patología', icon: Microscope },
  { id: 'whatsapp', label: 'WhatsApp LIS', icon: MessageSquare },
  { id: 'bloodbank', label: 'Banco Sangre', icon: Droplets },
  { id: 'homologation', label: 'Analizadores', icon: SlidersHorizontal },
  { id: 'billing', label: 'Facturación', icon: Receipt },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'qc', label: 'Calidad', icon: Activity },
  { id: 'middleware', label: 'Middleware', icon: Sparkles },
  { id: 'drivers', label: 'Drivers', icon: Cpu },
  { id: 'delta', label: 'Alertas', icon: AlertTriangle },
  { id: 'panic_registry', label: 'Bitácora Críticos', icon: ShieldAlert },
  { id: 'minsa', label: 'MINSA', icon: FileCheck2 },
  { id: 'executive', label: 'Analítica', icon: BrainCircuit },
  { id: 'audit', label: 'Auditoría', icon: ShieldCheck },
  { id: 'routing', label: 'Ruteo', icon: Truck },
  { id: 'fhir', label: 'FHIR', icon: Globe },
  { id: 'ha_dr', label: 'HA/Cluster', icon: Server },
  { id: 'accreditation', label: 'ISO 15189', icon: Award },
  { id: 'schema', label: 'Base de Datos', icon: Database },
];

export const ALLOWED_TABS_PER_ROLE: Record<Role, string[]> = {
  owner: ['dashboard', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'executive', 'billing', 'inventory', 'schema', 'routing', 'audit', 'ha_dr', 'panic_registry'],
  lab_chief: ['dashboard', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'qc', 'middleware', 'delta', 'panic_registry', 'minsa', 'accreditation', 'audit'],
  tech_med: ['dashboard', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'middleware', 'drivers', 'qc', 'delta', 'panic_registry', 'inventory'],
  lab_tech: ['dashboard', 'test_catalog', 'patient_results', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'phlebotomy', 'inventory'],
  receptionist: ['dashboard', 'test_catalog', 'patient_results', 'productivity', 'label_studio', 'shifts', 'phlebotomy', 'whatsapp', 'billing', 'inventory'],
  ext_doctor: ['dashboard'],
  patient: ['dashboard'],
  abregotech_admin: ['dashboard', 'test_catalog', 'patient_results', 'validation', 'tm_workbench', 'productivity', 'label_studio', 'shifts', 'eqa', 'cmms', 'phlebotomy', 'pathology', 'whatsapp', 'bloodbank', 'homologation', 'billing', 'inventory', 'qc', 'middleware', 'drivers', 'delta', 'minsa', 'executive', 'audit', 'routing', 'fhir', 'ha_dr', 'accreditation', 'schema']
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  currentBranch,
  onOpenBranchModal,
  activeTab,
  setActiveTab,
  onLogout,
  onLockSession,
  showAllModules,
  notificationCount = 0,
  systemAlerts = []
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const allowedTabIds = showAllModules
    ? NAVIGATION_TABS.map((t) => t.id)
    : ALLOWED_TABS_PER_ROLE[currentRole] || ['dashboard'];

  const visibleTabs = NAVIGATION_TABS.filter((t) => allowedTabIds.includes(t.id));

  // High-priority tabs to show directly - REDUCED TO 2 FOR BETTER SPACING
  const mainTabs = visibleTabs.slice(0, 2);
  const secondaryTabs = visibleTabs.slice(2);

  return (
    <header className="bg-[#020617]/80 backdrop-blur-2xl text-white border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-8">

        {/* Brand Logo - Compact area */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 rotate-3">
            <Activity className="w-5 h-5 text-slate-950 -rotate-3" />
          </div>
          <span className="font-black tracking-tighter text-lg hidden xl:inline uppercase">LIS<span className="text-teal-400 font-black italic">CORE</span></span>
        </div>

        {/* Professional Navigation - Flex space without overlapping */}
        <nav className="hidden lg:flex items-center space-x-2 min-w-0">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-2xl text-[12px] font-black transition-all duration-300 shrink-0 ${
                  isActive
                    ? 'bg-white/5 text-teal-400 shadow-xl border border-white/5'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}

          {secondaryTabs.length > 0 && (
            <div className="relative shrink-0 ml-1">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-2xl text-[12px] font-black transition-all ${
                  secondaryTabs.some(t => t.id === activeTab)
                    ? 'bg-white/5 text-teal-400 border border-white/5'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="uppercase tracking-widest">Módulos</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMoreOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 gap-1 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
                      {secondaryTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsMoreOpen(false); }}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-teal-500 text-slate-950'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Right Section: Profile & Logout */}
        <div className="flex items-center justify-end space-x-6 shrink-0">
          <div className="hidden lg:flex items-center gap-3">
            {/* Branch Indicator - Professional & Separate */}
            <div
              onClick={onOpenBranchModal}
              className="flex items-center bg-white/5 border border-white/5 rounded-2xl px-4 py-2 gap-3 shadow-inner group/branch transition-all hover:bg-white/10 cursor-pointer shrink-0"
            >
               <MapPin className="w-4 h-4 text-teal-400 group-hover/branch:scale-110 transition-transform" />
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Sucursal</span>
                  <span className="text-[10px] text-white font-black uppercase tracking-tighter whitespace-nowrap">{currentBranch.code}</span>
               </div>
            </div>

            {/* User Profile - Elite Styling */}
            <div className="flex items-center bg-teal-500/5 border border-white/5 rounded-2xl px-5 py-2 gap-6 group/user transition-all hover:bg-white/5 cursor-default">
              <div className="flex flex-col text-right">
                <span className="text-[11px] font-black text-white uppercase tracking-tight leading-none whitespace-nowrap">{currentUser.name}</span>
                <span className="text-[9px] text-teal-500/70 font-black uppercase tracking-widest mt-1 opacity-80">{ROLE_LABELS[currentRole].title}</span>
              </div>

              {/* Professional Avatar with Integrated Badges - Fixed Collision */}
              <div className="relative shrink-0 ml-2">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-base shadow-2xl group-hover/user:scale-105 transition-all duration-500">
                  {currentUser.name.charAt(0)}
                </div>

                {/* Notification Badge - Dinámico: Conteo de Carga de Trabajo o Alertas de Sistema */}
                {notificationCount > 0 && (
                  <div
                    onClick={(e) => {
                      if (currentRole === 'abregotech_admin') {
                        e.stopPropagation();
                        setIsAlertsOpen(!isAlertsOpen);
                      }
                    }}
                    title={currentRole === 'abregotech_admin'
                      ? `Haga clic para ver ${notificationCount} alertas de sistema`
                      : `Tienes ${notificationCount} órdenes pendientes por procesar`
                    }
                    className={`absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 text-white text-[9px] font-black rounded-full border-2 border-[#020617] flex items-center justify-center z-10 animate-in zoom-in duration-500 cursor-pointer hover:scale-110 transition-transform ${
                      currentRole === 'abregotech_admin'
                        ? 'bg-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                        : 'bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                    }`}
                  >
                    <span className="leading-none">{notificationCount}</span>
                  </div>
                )}

                {/* Dropdown de Alertas para Admin */}
                {isAlertsOpen && systemAlerts.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsAlertsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-4 w-72 bg-slate-900 border border-white/10 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-30 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                         <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Alertas de Infraestructura</span>
                         <button onClick={() => setIsAlertsOpen(false)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="space-y-2">
                        {systemAlerts.map((alert) => (
                          <div key={alert.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                            {alert.type === 'DEVICE' ? <Cpu className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /> : <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                            <span className="text-[11px] font-bold text-slate-200 leading-tight">{alert.message}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => { setActiveTab('middleware'); setIsAlertsOpen(false); }}
                        className="w-full mt-4 py-2.5 bg-amber-600/20 text-amber-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-amber-500/30 hover:bg-amber-600 hover:text-slate-950 transition-all"
                      >
                        Ver Consola Middleware
                      </button>
                    </div>
                  </>
                )}

                {/* Online Status Dot - Positioned Bottom-Right with Clear Separation */}
                <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-[#020617] rounded-full flex items-center justify-center shadow-xl">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/5 hidden lg:block mx-1"></div>

          <div className="flex items-center gap-1.5">
            {onLockSession && (
              <button
                onClick={onLockSession}
                title="Bloquear"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-all shadow-xl group"
              >
                <Lock className="w-4 h-4 text-slate-400 group-hover:scale-110" />
              </button>
            )}

            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all shadow-xl group"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Scroller - More elegant */}
      <div className="lg:hidden border-t border-white/5 px-4 py-3 bg-[#020617]/80 overflow-x-auto flex items-center space-x-3 no-scrollbar shrink-0">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
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
