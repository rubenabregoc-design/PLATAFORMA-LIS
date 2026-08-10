import React, { useState } from 'react';
import { Tenant, Analyzer, MiddlewareMessageLog } from '../../types';
import { Shield, Building2, Cpu, Activity, Plus, Server, CheckCircle2, AlertTriangle, Layers, Award } from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  analyzers: Analyzer[];
  logs: MiddlewareMessageLog[];
  onProvisionTenant: (name: string, ruc: string, dv: string, plan: Tenant['plan']) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  tenants,
  analyzers,
  logs,
  onProvisionTenant
}) => {
  const [newLabName, setNewLabName] = useState<string>('');
  const [newRuc, setNewRuc] = useState<string>('');
  const [newDv, setNewDv] = useState<string>('');
  const [newPlan, setNewPlan] = useState<Tenant['plan']>('Pro');

  const handleCreateTenant = () => {
    if (!newLabName || !newRuc) {
      alert('Por favor ingrese nombre de laboratorio y RUC.');
      return;
    }
    onProvisionTenant(newLabName, newRuc, newDv || '00', newPlan);
    setNewLabName('');
    setNewRuc('');
    setNewDv('');
    alert(`¡Laboratorio "${newLabName}" aprovisionado en la plataforma multi-tenant de AbregoTech!`);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600"></div>
        <div>
          <div className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Plataforma Súper-Admin — AbregoTech Solutions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestión Multi-Tenant & Monitoreo Global de Middleware
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Aprovisionamiento de nuevos laboratorios clientes, métricas de uptime de sockets TCP/Serial y biblioteca de dialectos ASTM/HL7.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs space-y-1 shrink-0">
          <div className="text-slate-900 font-bold flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Total Clientes Activos: {tenants.length}</span>
          </div>
          <div className="text-emerald-700 font-semibold">● Middleware Cluster: 100% Operational</div>
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell 1: Tenant Provisioning Form (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Plus className="w-4 h-4 text-teal-600" />
                <span>Aprovisionar Cliente (Tenant)</span>
              </h3>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full">
                SaaS Multi-Tenant
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nombre del Laboratorio:</label>
                <input
                  type="text"
                  placeholder="Ej. Laboratorio San Lucas"
                  value={newLabName}
                  onChange={(e) => setNewLabName(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 block">RUC Panameño:</label>
                  <input
                    type="text"
                    placeholder="8-812-4432"
                    value={newRuc}
                    onChange={(e) => setNewRuc(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">DV:</label>
                  <input
                    type="text"
                    placeholder="00"
                    value={newDv}
                    onChange={(e) => setNewDv(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Plan de Suscripción LIS:</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Basic">Plan Básico ($150/mes)</option>
                  <option value="Pro">Plan Pro ($350/mes)</option>
                  <option value="Enterprise">Plan Enterprise ($750/mes)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateTenant}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center space-x-2 mt-4"
          >
            <Building2 className="w-4 h-4" />
            <span>Crear Tenant e Iniciar Aprovisionamiento</span>
          </button>
        </div>

        {/* Bento Cell 2: Registered Tenants List & Cluster Health (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Laboratorios Clientes Registrados en Panamá</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              PostgreSQL Isolated Schemas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 space-y-2 hover:border-teal-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {t.plan} Plan
                  </span>
                </div>
                <div className="text-xs text-slate-600">RUC: <strong className="font-mono">{t.ruc}</strong> DV: <strong className="font-mono">{t.dv}</strong></div>
                <div className="text-[11px] text-slate-500 border-t border-slate-200/80 pt-2">
                  Sedes Activas: {t.branches.map((b) => b.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
