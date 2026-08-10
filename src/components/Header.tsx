import React from 'react';
import { Role, Tenant, Branch, User } from '../types';
import {
  Shield, Building2, Activity, Sparkles, Database,
  Receipt, Cpu, AlertTriangle, FileCheck2,
  BrainCircuit, ShieldCheck, Truck, Globe, Server, Award,
  ChevronDown, LayoutDashboard, SlidersHorizontal, LogOut, UserCheck,
  Package, Filter, CheckCircle2, RefreshCw, MapPin, Lock
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
  { id: 'dashboard', label: 'Dashboard de Rol', icon: LayoutDashboard },
  { id: 'homologation', label: 'Homologación Analizadores', icon: SlidersHorizontal },
  { id: 'billing', label: 'Facturación POS & DGI', icon: Receipt },
  { id: 'inventory', label: 'Inventario Reactivos', icon: Package },
  { id: 'qc', label: 'QC Westgard', icon: Activity },
  { id: 'middleware', label: 'Middleware ASTM/HL7', icon: Sparkles },
  { id: 'drivers', label: 'Drivers ASTM', icon: Cpu },
  { id: 'delta', label: 'Alertas Pánico', icon: AlertTriangle },
  { id: 'minsa', label: 'EPI MINSA', icon: FileCheck2 },
  { id: 'executive', label: 'BI Ejecutiva AI', icon: BrainCircuit },
  { id: 'audit', label: 'Auditoría Ley 81', icon: ShieldCheck },
  { id: 'routing', label: 'Ruteo Inter-Sedes', icon: Truck },
  { id: 'fhir', label: 'FHIR API', icon: Globe },
  { id: 'ha_dr', label: 'HA & Cluster', icon: Server },
  { id: 'accreditation', label: 'ISO 15189', icon: Award },
  { id: 'schema', label: 'Modelo DB PostgreSQL', icon: Database },
];

export const ALLOWED_TABS_PER_ROLE: Record<Role, string[]> = {
  owner: ['dashboard', 'executive', 'billing', 'inventory', 'schema', 'routing', 'audit', 'ha_dr'],
  lab_chief: ['dashboard', 'qc', 'middleware', 'delta', 'minsa', 'accreditation', 'audit'],
  tech_med: ['dashboard', 'middleware', 'drivers', 'qc', 'delta', 'inventory'],
  lab_tech: ['dashboard', 'inventory'],
  receptionist: ['dashboard', 'billing', 'inventory'],
  ext_doctor: ['dashboard'],
  patient: ['dashboard'],
  abregotech_admin: ['dashboard', 'homologation', 'billing', 'inventory', 'qc', 'middleware', 'drivers', 'delta', 'minsa', 'executive', 'audit', 'routing', 'fhir', 'ha_dr', 'accreditation', 'schema']
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onRoleChange,
  currentTenant,
  currentBranch,
  onTenantChange,
  onBranchChange,
  onOpenBranchModal,
  activeTab,
  setActiveTab,
  onLogout,
  onLockSession,
  showAllModules,
  setShowAllModules
}) => {
  // Calculate allowed tabs
  const allowedTabIds = showAllModules
    ? NAVIGATION_TABS.map((t) => t.id)
    : ALLOWED_TABS_PER_ROLE[currentRole] || ['dashboard'];

  const visibleTabs = NAVIGATION_TABS.filter((t) => allowedTabIds.includes(t.id));

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800/80 sticky top-0 z-40 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 text-xs">
        {/* Brand & Location Info */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-xl shadow-sm">
            <Activity className="w-4 h-4 text-slate-950" />
            <span className="tracking-tight text-sm">AbregoTech LIS</span>
            <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded-md uppercase font-black">
              v2.4
            </span>
          </div>

          {/* Tenant Indicator */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="font-bold text-white text-xs">{currentTenant.name}</span>
          </div>

          {/* Active Branch / Sede Selector */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Sede:</span>
            <select
              value={currentBranch.id}
              onChange={(e) => onBranchChange(e.target.value)}
              className="bg-transparent text-emerald-300 font-bold text-xs focus:outline-none cursor-pointer"
            >
              {currentTenant.branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            {onOpenBranchModal && (
              <button
                type="button"
                onClick={onOpenBranchModal}
                title="Cambiar Sede en Modal"
                className="ml-1 text-slate-400 hover:text-emerald-300 transition cursor-pointer p-0.5 rounded flex items-center justify-center"
              >
                <SlidersHorizontal className="w-3 h-3 text-slate-400 hover:text-teal-300" />
              </button>
            )}
          </div>
        </div>

        {/* User Account / Logout Button */}
        <div className="flex items-center space-x-3">
          {/* User Profile Badge */}
          <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800/90 p-1.5 pl-3 rounded-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-black flex items-center justify-center text-xs shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-white text-xs leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-teal-400 font-semibold flex items-center space-x-1">
                  <span>{ROLE_LABELS[currentRole].title}</span>
                  {currentUser.licenseNumber && (
                    <span className="text-[9px] text-slate-400 font-mono">({currentUser.licenseNumber})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lock & Logout Actions */}
            <div className="flex items-center space-x-1.5">
              {onLockSession && (
                <button
                  onClick={onLockSession}
                  className="bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 font-bold px-2.5 py-1.5 rounded-xl text-xs transition flex items-center space-x-1 shadow-sm cursor-pointer"
                  title="Bloquear pantalla por inactividad / seguridad"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Bloquear</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="Cerrar sesión e ir a Login de Sede"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Filtered Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs overflow-hidden">
        {/* Active Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-md ring-1 ring-teal-400 font-black'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle to view all modules */}
        <div className="shrink-0 hidden md:flex items-center space-x-2 border-l border-slate-800/80 pl-3">
          <button
            onClick={() => setShowAllModules(!showAllModules)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
              showAllModules
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>{showAllModules ? 'Ver Todo (Admin)' : 'Filtrado por Rol'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
