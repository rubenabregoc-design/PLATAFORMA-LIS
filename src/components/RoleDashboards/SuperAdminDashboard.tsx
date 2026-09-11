import React, { useState } from 'react';
import { Tenant, Analyzer, MiddlewareMessageLog } from '../../types';
import { useLisStore } from '../../store/useLisStore';
import {
  Shield, Building2, Cpu, Activity, Plus, Server, CheckCircle2,
  AlertTriangle, Layers, Award, Globe, ExternalLink, Copy, Check, QrCode, Stethoscope, Users
} from 'lucide-react';

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
  const { setActiveTab } = useLisStore();

  const [newLabName, setNewLabName] = useState<string>('');
  const [newRuc, setNewRuc] = useState<string>('');
  const [newDv, setNewDv] = useState<string>('');
  const [newPlan, setNewPlan] = useState<Tenant['plan']>('Pro');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCreateTenant = () => {
    if (!newLabName || !newRuc) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Por favor ingrese el Nombre del Laboratorio y el RUC.', type: 'warning' }
        })
      );
      return;
    }
    onProvisionTenant(newLabName, newRuc, newDv || '00', newPlan);
    setNewLabName('');
    setNewRuc('');
    setNewDv('');
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `¡Laboratorio "${newLabName}" aprovisionado con éxito en la plataforma multi-tenant!`, type: 'success' }
      })
    );
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(null), 2000);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Enlace público de ${name} copiado al portapapeles.`, type: 'info' }
      })
    );
  };

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500">

      {/* Executive Header Card (Dark LISCORE Theme) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"></div>
        <div>
          <div className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Plataforma Súper-Admin — AbregoTech Systems SaaS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestión Multi-Tenant & Configuración de Portales Públicos
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl font-medium leading-relaxed">
            Aprovisionamiento de nuevos laboratorios clientes, enrutamiento de esquemas aislados PostgreSQL 15 y enlaces de acceso público para Pacientes y Médicos.
          </p>
        </div>

        <div className="bg-slate-950 border border-cyan-500/30 p-4 rounded-2xl text-xs space-y-1 shrink-0">
          <div className="text-white font-black flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Total Clientes Activos: {tenants.length}</span>
          </div>
          <div className="text-emerald-400 font-bold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cluster Middleware: 100% Operational</span>
          </div>
        </div>
      </div>

      {/* 🌐 PUBLIC ACCESS PORTALS CONSOLE (Direct Links for Patients, Doctors & SaaS Admin) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Portales Públicos de Acceso Directo (Configurados & Activos)
              </h3>
              <p className="text-[11px] text-slate-400">URLs públicas de consulta de resultados y portal médico con autenticación de seguridad</p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
            ✓ SSL / TLS 1.3 Cifrado Activo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Public Link 1: Patient Portal */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/50 space-y-4 transition flex flex-col justify-between shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal Público de Pacientes</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Descarga de resultados en PDF con firma Ley 81, consulta por Cédula/Orden y envío directo a WhatsApp.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[10px] text-cyan-300 break-all border border-slate-800 flex items-center justify-between">
                <span>https://pacientes.liscore.pa/portal</span>
                <button
                  onClick={() => handleCopyLink('https://pacientes.liscore.pa/portal', 'Portal de Pacientes')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                  title="Copiar URL"
                >
                  {copiedLink === 'Portal de Pacientes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('patient_results')}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow"
            >
              <span>Abrir Portal Pacientes</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Public Link 2: External Doctor Portal */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 space-y-4 transition flex flex-col justify-between shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal de Médicos Referentes</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Acceso a expedientes de pacientes remitidos, firma electrónica médica e informes acumulativos.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[10px] text-indigo-300 break-all border border-slate-800 flex items-center justify-between">
                <span>https://medicos.liscore.pa/portal</span>
                <button
                  onClick={() => handleCopyLink('https://medicos.liscore.pa/portal', 'Portal de Médicos')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                  title="Copiar URL"
                >
                  {copiedLink === 'Portal de Médicos' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('batch_reporting')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow"
            >
              <span>Abrir Portal Médicos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Public Link 3: SuperAdmin SaaS Console */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 space-y-4 transition flex flex-col justify-between shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Consola Súper-Admin SaaS</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Aprovisionamiento multi-tenant, gestión de licencias, RUC/DV y clúster Middleware ASTM.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[10px] text-emerald-300 break-all border border-slate-800 flex items-center justify-between">
                <span>https://admin.liscore.pa/console</span>
                <button
                  onClick={() => handleCopyLink('https://admin.liscore.pa/console', 'Consola Admin')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                  title="Copiar URL"
                >
                  {copiedLink === 'Consola Admin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('schema')}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow"
            >
              <span>Ver Esquema Base de Datos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Bento Cell 1: Tenant Provisioning Form (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Aprovisionar Cliente (Tenant)</span>
              </h3>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                SaaS Multi-Tenant
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Nombre del Laboratorio:</label>
                <input
                  type="text"
                  placeholder="Ej. Laboratorio San Lucas"
                  value={newLabName}
                  onChange={(e) => setNewLabName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white w-full focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-300 block">RUC Panameño:</label>
                  <input
                    type="text"
                    placeholder="8-812-4432"
                    value={newRuc}
                    onChange={(e) => setNewRuc(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-white w-full focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">DV:</label>
                  <input
                    type="text"
                    placeholder="00"
                    value={newDv}
                    onChange={(e) => setNewDv(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-white w-full focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Plan de Suscripción LIS:</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white w-full focus:outline-none focus:border-cyan-400"
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
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Crear Tenant e Iniciar Aprovisionamiento</span>
          </button>
        </div>

        {/* Bento Cell 2: Registered Tenants List & Cluster Health (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Laboratorios Clientes Registrados en Panamá</span>
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/30">
              PostgreSQL Isolated Schemas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-2 hover:border-cyan-500/50 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm">{t.name}</span>
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {t.plan} Plan
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">RUC: <strong className="text-slate-200">{t.ruc}</strong> DV: <strong className="text-slate-200">{t.dv}</strong></div>
                <div className="text-[11px] text-slate-400 border-t border-slate-900 pt-2 font-medium">
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
