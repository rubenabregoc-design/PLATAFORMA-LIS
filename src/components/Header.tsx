import React, { useState } from 'react';
import { Role, Tenant, Branch, User } from '../types';
import {
  Activity, Building2, SlidersHorizontal, LogOut, MapPin, Filter, LayoutDashboard, Receipt, Package, Sparkles, Cpu, AlertTriangle, FileCheck2, BrainCircuit, ShieldCheck, Truck, Globe, Server, Award, Database, Microscope, FileText, ChevronDown, MoreHorizontal
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
  { id: 'patient_results', label: 'Expedientes', icon: FileText },
  { id: 'validation', label: 'Resultados', icon: Microscope },
  { id: 'homologation', label: 'Analizadores', icon: SlidersHorizontal },
  { id: 'billing', label: 'Facturación', icon: Receipt },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'qc', label: 'Calidad', icon: Activity },
  { id: 'middleware', label: 'Middleware', icon: Sparkles },
  { id: 'drivers', label: 'Drivers', icon: Cpu },
  { id: 'delta', label: 'Alertas', icon: AlertTriangle },
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
  owner: ['dashboard', 'patient_results', 'validation', 'executive', 'billing', 'inventory', 'schema', 'routing', 'audit', 'ha_dr'],
  lab_chief: ['dashboard', 'patient_results', 'validation', 'qc', 'middleware', 'delta', 'minsa', 'accreditation', 'audit'],
  tech_med: ['dashboard', 'patient_results', 'validation', 'middleware', 'drivers', 'qc', 'delta', 'inventory'],
  lab_tech: ['dashboard', 'patient_results', 'inventory'],
  receptionist: ['dashboard', 'patient_results', 'billing', 'inventory'],
  ext_doctor: ['dashboard'],
  patient: ['dashboard'],
  abregotech_admin: ['dashboard', 'patient_results', 'validation', 'homologation', 'billing', 'inventory', 'qc', 'middleware', 'drivers', 'delta', 'minsa', 'executive', 'audit', 'routing', 'fhir', 'ha_dr', 'accreditation', 'schema']
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  currentBranch,
  activeTab,
  setActiveTab,
  onLogout,
  showAllModules,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const allowedTabIds = showAllModules
    ? NAVIGATION_TABS.map((t) => t.id)
    : ALLOWED_TABS_PER_ROLE[currentRole] || ['dashboard'];

  const visibleTabs = NAVIGATION_TABS.filter((t) => allowedTabIds.includes(t.id));

  // High-priority tabs to show directly
  const mainTabs = visibleTabs.slice(0, 3);
  const secondaryTabs = visibleTabs.slice(3);

  return (
    <header className="bg-[#020617]/60 backdrop-blur-2xl text-white border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">

        {/* Brand Logo - More minimal */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 rotate-3">
            <Activity className="w-6 h-6 text-slate-950 -rotate-3" />
          </div>
          <span className="font-black tracking-tighter text-xl">LIS<span className="text-teal-400">CORE</span></span>
        </div>

        {/* Professional Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 flex-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl text-[13px] font-black transition-all duration-300 ${
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
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl text-[13px] font-black transition-all ${
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
                  <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-3 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 gap-1">
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
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex flex-col text-right">
              <span className="text-[13px] font-black text-white leading-tight uppercase tracking-tight">{currentUser.name}</span>
              <span className="text-[10px] text-teal-400 font-black uppercase tracking-[0.2em]">{currentBranch.name}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-teal-400 font-black text-sm shadow-xl">
              {currentUser.name.charAt(0)}
            </div>
          </div>

          <div className="h-8 w-px bg-white/5 hidden md:block"></div>

          <button
            onClick={onLogout}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 border border-white/5 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 transition-all duration-300 cursor-pointer group shadow-2xl"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
