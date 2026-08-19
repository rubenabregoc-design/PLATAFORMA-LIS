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
  lab_chief: { title: 'Jefe de Laboratorio', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', desc: 'Validación médica final, Control de Calidad' },
  tech_med: { title: 'Tecnólogo Médico', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', desc: 'Validación técnica, analizadores' },
  lab_tech: { title: 'Técnico de Lab', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', desc: 'Recepción, código de barras' },
  receptionist: { title: 'Recepcionista', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', desc: 'Registro, órdenes, cobros' },
  ext_doctor: { title: 'Médico Referente', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', desc: 'Portal médico externo' },
  patient: { title: 'Paciente / Cliente', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', desc: 'Portal personal' },
  abregotech_admin: { title: 'Admin AbregoTech', color: 'bg-slate-700/60 text-slate-200 border-slate-600', desc: 'Súper-admin SaaS' }
};

export const NAVIGATION_TABS = [
  { id: 'dashboard', label: 'Tablero', icon: LayoutDashboard, category: 'clinical' },
  { id: 'test_catalog', label: 'Catálogo LIS', icon: BookOpen, category: 'clinical' },
  { id: 'patient_results', label: 'Expedientes', icon: FileText, category: 'clinical' },
  { id: 'validation', label: 'Resultados', icon: Microscope, category: 'clinical' },
  { id: 'tm_workbench', label: 'Estación TM', icon: Microscope, category: 'clinical' },
  { id: 'productivity', label: 'Productividad', icon: BarChart3, category: 'tech' },
  { id: 'label_studio', label: 'Etiquetas', icon: Printer, category: 'ops' },
  { id: 'shifts', label: 'Turnos', icon: Calendar, category: 'ops' },
  { id: 'eqa', label: 'PEEC / EQA', icon: Target, category: 'quality' },
  { id: 'cmms', label: 'CMMS Equipos', icon: Wrench, category: 'tech' },
  { id: 'phlebotomy', label: 'Flebotomía', icon: Truck, category: 'ops' },
  { id: 'pathology', label: 'Patología', icon: Microscope, category: 'clinical' },
  { id: 'whatsapp', label: 'WhatsApp LIS', icon: MessageSquare, category: 'ops' },
  { id: 'bloodbank', label: 'Banco Sangre', icon: Droplets, category: 'clinical' },
  { id: 'homologation', label: 'Analizadores', icon: SlidersHorizontal, category: 'tech' },
  { id: 'billing', label: 'Facturación', icon: Receipt, category: 'ops' },
  { id: 'inventory', label: 'Inventario', icon: Package, category: 'ops' },
  { id: 'qc', label: 'Calidad', icon: Activity, category: 'quality' },
  { id: 'middleware', label: 'Middleware', icon: Sparkles, category: 'tech' },
  { id: 'drivers', label: 'Drivers', icon: Cpu, category: 'tech' },
  { id: 'delta', label: 'Alertas Delta', icon: AlertTriangle, category: 'quality' },
  { id: 'panic_registry', label: 'Críticos', icon: ShieldAlert, category: 'quality' },
  { id: 'minsa', label: 'MINSA', icon: FileCheck2, category: 'tech' },
  { id: 'executive', label: 'Analítica', icon: BrainCircuit, category: 'tech' },
  { id: 'audit', label: 'Auditoría', icon: ShieldCheck, category: 'quality' },
  { id: 'routing', label: 'Ruteo', icon: Truck, category: 'ops' },
  { id: 'fhir', label: 'Interop FHIR', icon: Globe, category: 'tech' },
  { id: 'ha_dr', label: 'Alta Disp.', icon: Server, category: 'tech' },
  { id: 'accreditation', label: 'ISO 15189', icon: Award, category: 'quality' },
  { id: 'schema', label: 'DB Schema', icon: Database, category: 'tech' },
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
  currentRole, currentUser, onRoleChange, currentTenant, currentBranch,
  onTenantChange, onBranchChange, onOpenBranchModal,
  activeTab, setActiveTab, onLogout, onLockSession, showAllModules, setShowAllModules,
  notificationCount = 0, systemAlerts = []
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const allowedTabIds = showAllModules
    ? NAVIGATION_TABS.map((t) => t.id)
    : ALLOWED_TABS_PER_ROLE[currentRole] || ['dashboard'];

  const visibleTabs = NAVIGATION_TABS.filter((t) => allowedTabIds.includes(t.id));

  // Professional space management: fewer direct tabs, more in "Módulos"
  const mainTabs = visibleTabs.slice(0, 2);
  const secondaryTabs = visibleTabs.slice(2);

  const categories = [
    { id: 'clinical', label: 'Gestión Clínica', color: 'text-blue-400' },
    { id: 'ops', label: 'Operaciones', color: 'text-amber-400' },
    { id: 'quality', label: 'Calidad & ISO', color: 'text-emerald-400' },
    { id: 'tech', label: 'Core & TI', color: 'text-purple-400' }
  ];

  return (
    <header className="bg-[#020617]/60 backdrop-blur-2xl text-white border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-4">

        {/* Pillar 1: Brand */}
        <div className="flex items-center space-x-3 shrink-0 lg:flex-1">
          <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 rotate-3">
            <Activity className="w-6 h-6 text-slate-950 -rotate-3" />
          </div>
          <span className="font-black tracking-tighter text-xl hidden sm:inline">LIS<span className="text-teal-400">CORE</span></span>
        </div>

        {/* Pillar 2: Navigation - Optimized spacing */}
        <nav className="hidden lg:flex items-center space-x-1.5 justify-center px-4 shrink-0">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-[12px] font-black transition-all duration-300 shrink-0 ${
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
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-[12px] font-black transition-all ${
                  secondaryTabs.some(t => t.id === activeTab)
                    ? 'bg-white/5 text-teal-400 border border-white/5'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="uppercase tracking-widest">Módulos</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMoreOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-80 bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[75vh] overflow-y-auto custom-scrollbar pr-2 space-y-6">
                      {categories.map(cat => {
                        const catModules = secondaryTabs.filter(t => t.category === cat.id);
                        if (catModules.length === 0) return null;

                        return (
                          <div key={cat.id} className="space-y-2">
                            <div className="flex items-center space-x-2 px-3">
                              <div className={`w-1 h-3 rounded-full ${cat.color.replace('text', 'bg')}`}></div>
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${cat.color} opacity-80`}>
                                {cat.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                              {catModules.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setIsMoreOpen(false); }}
                                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                                      isActive
                                        ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
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
        <div className="flex items-center space-x-4 shrink-0 lg:flex-1 lg:justify-end ml-auto">
          <div className="hidden lg:flex items-center gap-4">
            {/* Branch Indicator */}
            <div className="flex items-center bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 gap-3 shadow-inner group/branch transition-all hover:bg-white/10">
               <MapPin className="w-4 h-4 text-teal-400 group-hover/branch:scale-110 transition-transform" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Sucursal</span>
                  <span className="text-[9px] text-white font-black uppercase tracking-tighter whitespace-nowrap">{currentBranch.name}</span>
               </div>
            </div>

            {/* User Profile - Elite Styling */}
            <div className="flex items-center bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-2 gap-4 group/user hover:bg-teal-500/20 transition-all">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-white uppercase tracking-tight leading-none whitespace-nowrap">{currentUser.name}</span>
                <span className="text-[8px] text-teal-500 font-bold uppercase tracking-widest mt-1 opacity-80">{ROLE_LABELS[currentRole].title}</span>
              </div>

              {/* Professional Avatar with Integrated Badges */}
              <div className="relative shrink-0 ml-2">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-base shadow-2xl group-hover/user:scale-105 transition-all duration-500">
                  {currentUser.name.charAt(0)}
                </div>

                {/* Notification Badge - Pendientes / Alertas */}
                {notificationCount > 0 && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsNotificationsOpen(!isNotificationsOpen); }}
                      title={currentRole === 'abregotech_admin' ? `Tienes ${notificationCount} alertas de sistema` : `Tienes ${notificationCount} órdenes pendientes`}
                      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-500 border-[3px] border-[#020617] rounded-full flex items-center justify-center shadow-lg shadow-rose-500/40 z-10 animate-bounce cursor-pointer hover:scale-110 transition-transform"
                    >
                      <span className="text-[9px] font-black text-white leading-none">{notificationCount}</span>
                    </button>

                    {isNotificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsNotificationsOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-4 w-72 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center justify-between mb-3 px-2">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notificaciones</span>
                             <span className="text-[9px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">{notificationCount}</span>
                          </div>

                          <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                            {currentRole === 'abregotech_admin' ? (
                              systemAlerts.map((alert) => (
                                <div key={alert.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-3 group/notif hover:bg-white/10 transition-all">
                                   <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.type === 'DEVICE' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] text-white font-bold leading-tight">{alert.message}</span>
                                      <span className="text-[8px] text-slate-500 mt-1 uppercase font-black">{alert.type === 'DEVICE' ? 'Error de Hardware' : 'Error de Trama'}</span>
                                   </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                                 <Activity className="w-4 h-4 text-teal-400" />
                                 <div className="flex flex-col">
                                    <span className="text-[10px] text-white font-bold">{notificationCount} Órdenes Pendientes</span>
                                    <span className="text-[8px] text-slate-500 mt-1 uppercase font-black">Validación Técnica</span>
                                 </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => { setIsNotificationsOpen(false); setActiveTab(currentRole === 'abregotech_admin' ? 'homologation' : 'validation'); }}
                            className="w-full mt-3 py-2 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 text-[10px] font-black uppercase rounded-xl transition-all border border-teal-500/20"
                          >
                            Ir al Módulo
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Online Status Dot */}
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
    </header>
  );
};
