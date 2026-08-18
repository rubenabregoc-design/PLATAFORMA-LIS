import React, { useState } from 'react';
import { Tenant, Analyzer, MiddlewareMessageLog } from '../../types';
import { Shield, Building2, Cpu, Activity, Plus, Server, CheckCircle2, AlertTriangle, Layers, Award, Terminal, HardDrive, Globe, RefreshCw, Search } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'vault'>('infrastructure');
  const [newLabName, setNewLabName] = useState<string>('');
  const [newRuc, setNewRuc] = useState<string>('');
  const [newDv, setNewDv] = useState<string>('');
  const [newPlan, setNewPlan] = useState<Tenant['plan']>('Pro');

  const [searchVault, setSearchVault] = useState('');

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

  const offlineAnalyzers = analyzers.filter(a => a.status !== 'ONLINE');
  const middlewareErrors = logs.filter(l => l.status === 'ERROR_PARSER' || l.status === 'ORDEN_NO_ENCONTRADA');

  const filteredLogs = logs.filter(l =>
    l.analyzerName.toLowerCase().includes(searchVault.toLowerCase()) ||
    l.rawPayload.toLowerCase().includes(searchVault.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-[#020617] rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-teal-400 to-amber-600"></div>
        <div className="flex-1">
          <div className="text-amber-500 text-xs font-black uppercase tracking-[0.3em] mb-1.5 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Infraestructura Súper-Admin — Global Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none uppercase">
            Centro de Mando de Inquilinos & Cluster Middleware
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xl font-medium">
            Control maestro de instancias SaaS, salud de microservicios ASTM/HL7 y auditoría de integridad de base de datos.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-xs space-y-2 shrink-0 min-w-[200px]">
            <div className="text-white font-black flex items-center space-x-2 uppercase tracking-widest">
              <Globe className="w-4 h-4 text-teal-400" />
              <span>Región: PTY-1</span>
            </div>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               Uptime Global: 99.98%
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('infrastructure')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'infrastructure' ? 'bg-teal-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Infraestructura
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vault' ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Bóveda RAW
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'infrastructure' ? (
        <>
          {/* Admin Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
               { label: 'Total Inquilinos', val: tenants.length, icon: Building2, color: 'text-teal-400' },
               { label: 'Analizadores Offline', val: offlineAnalyzers.length, icon: Cpu, color: offlineAnalyzers.length > 0 ? 'text-rose-400' : 'text-slate-500' },
               { label: 'Middleware Errors', val: middlewareErrors.length, icon: Terminal, color: middlewareErrors.length > 0 ? 'text-amber-400' : 'text-slate-500' },
               { label: 'Server Load', val: '14%', icon: HardDrive, color: 'text-teal-400' }
             ].map((m, i) => (
               <div key={i} className="bg-slate-900 border border-white/5 p-4 rounded-[2rem] flex items-center justify-between">
                  <div>
                     <div className="text-xs font-black text-slate-500 uppercase tracking-tighter">{m.label}</div>
                     <div className={`text-2xl font-black ${m.color}`}>{m.val}</div>
                  </div>
                  <m.icon className={`w-8 h-8 opacity-20 ${m.color}`} />
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bento Cell 1: Tenant Provisioning Form (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div className="space-y-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Plus className="w-5 h-5 text-teal-500" />
                    Aprovisionar Laboratorio
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Creación de esquema aislado en PostgreSQL</p>
              </div>

              <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre del Laboratorio"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-xs font-black text-white focus:border-teal-500 outline-none transition-all"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="RUC"
                      value={newRuc}
                      onChange={(e) => setNewRuc(e.target.value)}
                      className="col-span-2 bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-xs font-mono font-black text-teal-400 focus:border-teal-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="DV"
                      value={newDv}
                      onChange={(e) => setNewDv(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-xs font-mono font-black text-teal-400 focus:border-teal-500 outline-none text-center"
                    />
                  </div>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-xs font-black text-slate-400 focus:border-teal-500 outline-none appearance-none"
                  >
                    <option value="Basic">Plan Básico ($150/mes)</option>
                    <option value="Pro">Plan Pro ($350/mes)</option>
                    <option value="Enterprise">Plan Enterprise ($750/mes)</option>
                  </select>
              </div>

              <button
                onClick={handleCreateTenant}
                className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-4 h-4" />
                Iniciar Deployment
              </button>
            </div>

            {/* Bento Cell 2: System Health Stream (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
               <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                     <div className="space-y-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                           <Activity className="w-5 h-5 text-emerald-500" />
                           Salud de Nodos de Integración
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Monitoreo activo de Sockets TCP/ASTM</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {analyzers.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${a.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                 <Cpu className="w-5 h-5" />
                              </div>
                              <div>
                                 <div className="text-[11px] font-black text-white uppercase">{a.name}</div>
                                 <div className="text-[9px] font-mono text-slate-500">{a.protocol} • {a.ipAddress || 'Serial'}</div>
                              </div>
                           </div>
                           <div className="text-right space-y-1">
                              <div className={`text-[10px] font-black uppercase ${a.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`}>{a.status}</div>
                              <div className="text-[8px] font-mono text-slate-600 uppercase">Last Ping: {new Date(a.lastPing).toLocaleTimeString()}</div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </>
      ) : (
        /* VISTA DE BÓVEDA DE TRAMAS RAW (Auditoría Técnica Imputable) */
        <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in fade-in duration-500">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
                    <Terminal className="w-6 h-6 text-amber-500" />
                    Bóveda de Auditoría: Tramas ASCII Crudas
                 </h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Almacenamiento Imputable de los últimos 30 días — Cumplimiento ISO 15189</p>
              </div>

              <div className="relative w-full md:w-80">
                 <Search className="w-4 h-4 text-slate-600 absolute left-4 top-3.5" />
                 <input
                   type="text"
                   placeholder="Buscar en el flujo ASCII..."
                   value={searchVault}
                   onChange={e => setSearchVault(e.target.value)}
                   className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-teal-400 placeholder:text-slate-800 outline-none focus:border-amber-500 transition-all shadow-inner"
                 />
              </div>
           </div>

           <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                   <Terminal className="w-12 h-12 text-slate-800 mx-auto opacity-20" />
                   <p className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">No se encontraron registros en la bóveda</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 border border-white/5 rounded-3xl overflow-hidden group">
                     {/* Metadata Header */}
                     <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${log.status === 'PROCESADO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {log.status}
                           </div>
                           <span className="text-[11px] font-black text-slate-300 uppercase">{log.analyzerName}</span>
                           <span className="text-[9px] font-mono text-slate-500">[{log.protocol}]</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString('es-PA')}</span>
                           <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">ID: {log.id}</span>
                        </div>
                     </div>

                     {/* RAW ASCII PAYLOAD */}
                     <div className="p-6 relative group-hover:bg-amber-500/[0.01] transition-colors">
                        <div className="absolute top-4 right-6 text-[8px] font-black text-slate-800 uppercase tracking-widest pointer-events-none">ASCII RAW STREAM</div>
                        <pre className="text-[11px] font-mono text-amber-500/90 leading-relaxed whitespace-pre-wrap break-all bg-black/30 p-4 rounded-xl border border-white/5 overflow-x-auto">
                           {log.rawPayload}
                        </pre>

                        {log.errorMessage && (
                          <div className="mt-3 flex items-center gap-2 text-rose-400 text-[10px] font-black bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                             <AlertTriangle className="w-3.5 h-3.5" />
                             <span>LOG ERROR: {log.errorMessage}</span>
                          </div>
                        )}
                     </div>

                     {/* Technical Actions */}
                     <div className="px-6 py-3 border-t border-white/5 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg transition-all">Exportar TXT</button>
                        <button className="text-[9px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-widest px-3 py-1 bg-teal-500/10 rounded-lg transition-all border border-teal-500/20">Re-Procesar Trama</button>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};
