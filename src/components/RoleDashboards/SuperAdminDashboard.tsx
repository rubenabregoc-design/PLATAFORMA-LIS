import React, { useState } from 'react';
import { Tenant, Analyzer, MiddlewareMessageLog } from '../../types';
import { Shield, Building2, Cpu, Activity, Plus, Server, CheckCircle2, AlertTriangle, Layers, Award, Terminal, HardDrive, Globe, RefreshCw, Search, Zap, Share2, X, Wifi, ShieldCheck } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'vault' | 'bridge'>('bridge');
  const [isBridgeActive, setIsBridgeActive] = useState(false);
  const [activeNodeDetail, setActiveNodeNodeDetail] = useState<'analyzers' | 'bridge' | 'cloud' | null>(null);

  const [linkedAnalyzers, setLinkedAnalyzers] = useState<Record<string, 'idle' | 'negotiating' | 'linked'>>({});
  const [syncStatus, setSyncStatus] = useState<'idle' | 'linking' | 'connected'>('idle');
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
    alert(`¡Laboratorio "${newLabName}" aprovisionado con éxito!`);
  };

  const offlineAnalyzers = analyzers.filter(a => a.status !== 'ONLINE');
  const middlewareErrors = logs.filter(l => l.status === 'ERROR_PARSER' || l.status === 'ORDEN_NO_ENCONTRADA');

  const filteredLogs = logs.filter(l =>
    l.analyzerName.toLowerCase().includes(searchVault.toLowerCase()) ||
    l.rawPayload.toLowerCase().includes(searchVault.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header del Tablero */}
      <div className="bg-[#020617] rounded-3xl p-7 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-teal-400 to-indigo-600"></div>
        <div className="flex-1">
          <div className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Infraestructura Global Core</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Centro de Mando Multi-Sede</h1>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button onClick={() => setActiveTab('infrastructure')} className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'infrastructure' ? 'bg-teal-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}>Infraestructura</button>
            <button onClick={() => setActiveTab('bridge')} className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'bridge' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-white'}`}>Control Bridge</button>
            <button onClick={() => setActiveTab('vault')} className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'vault' ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}>Bóveda RAW</button>
          </div>
        </div>
      </div>

      {activeTab === 'infrastructure' ? (
        <div className="animate-in fade-in duration-500 space-y-6">
           {/* Métricas Rápidas */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Inquilinos', val: tenants.length, icon: Building2, color: 'text-teal-400' },
                { label: 'Analizadores Desconectados', val: offlineAnalyzers.length, icon: Cpu, color: 'text-rose-400' },
                { label: 'Errores de Trama', val: middlewareErrors.length, icon: Terminal, color: 'text-amber-400' },
                { label: 'Carga Global', val: '14%', icon: HardDrive, color: 'text-indigo-400' }
              ].map((m, i) => (
                <div key={i} className="bg-slate-900 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between">
                   <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</div>
                      <div className={`text-2xl font-black ${m.color}`}>{m.val}</div>
                   </div>
                   <m.icon className={`w-8 h-8 opacity-20 ${m.color}`} />
                </div>
              ))}
           </div>

           {/* Listado de Nodos Agrupados por Área */}
           <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" /> Nodos de Integración por Departamento</h3>
              <div className="space-y-10">
                 {['HEMATOLOGIA', 'QUIMICA', 'INMUNOLOGIA', 'URINALISIS', 'MICROBIOLOGIA', 'COAGULACION', 'ESPECIALES', 'MOLECULAR'].map(area => {
                    const areaAnalyzers = analyzers.filter(a => a.area === area);
                    if (areaAnalyzers.length === 0) return null;
                    return (
                       <div key={area} className="space-y-4">
                          <div className="flex items-center gap-3 px-2">
                             <div className="h-4 w-1 bg-teal-500 rounded-full"></div>
                             <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">{area}</span>
                             <span className="text-[9px] text-slate-600 font-bold bg-white/5 px-2 py-0.5 rounded-full">{areaAnalyzers.length} EQUIPOS</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {areaAnalyzers.map(a => (
                                <div key={a.id} className="p-5 bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-teal-500/30 transition-all">
                                   <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}><Cpu className="w-6 h-6" /></div>
                                      <div>
                                         <div className="text-xs font-black text-white uppercase">{a.name}</div>
                                         <div className="text-[9px] text-slate-500 font-mono tracking-tighter">{a.ipAddress || 'Puente Serial'}</div>
                                      </div>
                                   </div>
                                   <div className={`text-[10px] font-black px-3 py-1 rounded-lg ${a.status === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5'}`}>{a.status === 'ONLINE' ? 'EN LÍNEA' : 'DESCONECTADO'}</div>
                                </div>
                             ))}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      ) : activeTab === 'bridge' ? (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
           <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),transparent)] pointer-events-none"></div>
              <div className="flex flex-col lg:flex-row items-center justify-around gap-16 relative z-10">
                 <div onClick={() => setActiveTab('infrastructure')} className="flex flex-col items-center gap-4 group cursor-pointer">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-950 border-2 border-white/10 flex items-center justify-center shadow-2xl group-hover:border-teal-500 transition-all transform group-hover:scale-110">
                       <Cpu className={`w-12 h-12 ${isBridgeActive ? 'text-teal-400 animate-pulse' : 'text-slate-700'}`} />
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-teal-400 transition-colors">Analizadores</span>
                 </div>
                 <div className="flex-1 h-1 bg-slate-800 rounded-full relative overflow-hidden hidden lg:block">
                    {isBridgeActive && (
                       <>
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-indigo-500 to-blue-500 animate-[moveRight_4s_infinite]"></div>
                          <div className="absolute -top-2 left-1/2 w-4 h-4 bg-white rounded-full blur-md animate-pulse"></div>
                       </>
                    )}
                 </div>
                 <div onClick={() => setActiveNodeNodeDetail('bridge')} className="flex flex-col items-center gap-6 cursor-pointer group">
                    <div className={`w-36 h-36 rounded-[3rem] transition-all duration-700 flex items-center justify-center border-4 relative ${isBridgeActive ? 'bg-indigo-600 shadow-[0_0_60px_rgba(79,70,229,0.5)] border-white/20 animate-bounce-slow' : 'bg-slate-900 border-white/5 grayscale'}`}>
                       <Zap className={`w-16 h-16 ${isBridgeActive ? 'text-white' : 'text-slate-700'}`} />
                       <div className={`absolute -top-4 -right-4 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20 transition-colors ${isBridgeActive ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                          <Wifi className={`w-5 h-5 ${isBridgeActive ? 'text-slate-950' : 'text-slate-600'}`} />
                       </div>
                       {isBridgeActive && <div className="absolute -inset-4 border-2 border-indigo-500/30 rounded-[3.5rem] animate-[ping_3s_infinite]"></div>}
                    </div>
                    <div className="text-center">
                       <div className={`text-sm font-black uppercase italic transition-colors ${isBridgeActive ? 'text-white' : 'text-slate-600'}`}>AbregoBridge v2.0</div>
                       <div className="text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2 justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full transition-all ${isBridgeActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-rose-500'}`}></div>
                          <span className={isBridgeActive ? 'text-emerald-400' : 'text-rose-500'}>{isBridgeActive ? 'WEBSOCKET SEGURO: CONECTADO' : 'PUENTE DESCONECTADO'}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex-1 h-1 bg-slate-800 rounded-full relative overflow-hidden hidden lg:block">
                    {isBridgeActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 animate-[moveRight_3s_infinite_reverse]"></div>}
                 </div>
                 <div onClick={() => setActiveNodeNodeDetail('cloud')} className="flex flex-col items-center gap-4 group cursor-pointer">
                    <div className={`w-24 h-24 rounded-[2rem] border-2 flex items-center justify-center shadow-2xl transition-all transform group-hover:scale-110 ${isBridgeActive ? 'bg-slate-950 border-white/10 group-hover:border-blue-500' : 'bg-slate-900 border-white/5 grayscale'}`}>
                       <Globe className={`w-12 h-12 ${isBridgeActive ? 'text-blue-400' : 'text-slate-700'}`} />
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-blue-400 transition-colors">LIS Core Cloud</span>
                 </div>
              </div>
              <div className="mt-12 flex flex-col items-center gap-6">
                 <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5 gap-1">
                    <button onClick={() => alert('Modo Manual Activo')} className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all">Manual</button>
                    <button onClick={() => alert('Modo Automático Activo')} className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Automático</button>
                 </div>
                 <button onClick={() => { if (!isBridgeActive) { setSyncStatus('linking'); setTimeout(() => { setIsBridgeActive(true); setSyncStatus('connected'); setTimeout(() => setSyncStatus('idle'), 3000); }, 1200); } else { setIsBridgeActive(false); setSyncStatus('idle'); } }} className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center gap-4 ${isBridgeActive ? 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 animate-pulse shadow-emerald-500/20'}`}>{isBridgeActive ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}{isBridgeActive ? 'DETENER COMUNICACIÓN' : 'INICIAR VINCULACIÓN BRIDGE'}</button>
                 <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{isBridgeActive ? 'Puerto de escucha activo en 0.0.0.0:5000' : 'Esperando ejecución del cliente local...'}</p>
              </div>
           </div>

           {activeNodeDetail && (
             <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">{activeNodeDetail === 'bridge' ? <Zap className="w-6 h-6 text-indigo-400" /> : <Globe className="w-6 h-6 text-blue-400" />}{activeNodeDetail === 'bridge' ? 'Configuración del Nodo Local' : 'Estado de Nube AbregoTech'}</h3>
                   <button onClick={() => setActiveNodeNodeDetail(null)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {activeNodeDetail === 'bridge' ? (
                     <>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Licencia de Nodo</span><div className="text-xs text-indigo-300 font-mono">PTY-1-PREMIUM-2026</div></div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Último Despliegue</span><div className="text-xs text-slate-300">v2.0.4 build 2026.08.18</div></div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Encriptación</span><div className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> AES-256 GCM</div></div>
                     </>
                   ) : (
                     <>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Cluster de Datos</span><div className="text-xs text-blue-300">AWS Region: us-east-1</div></div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Bases de Datos</span><div className="text-xs text-slate-300 font-bold flex items-center gap-2 italic"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sincronizadas</div></div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Certificado SSL</span><div className="text-xs text-teal-400 font-bold uppercase flex items-center gap-2 italic"><Award className="w-3.5 h-3.5" /> DigiCert Global Root</div></div>
                     </>
                   )}
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {analyzers.slice(0,4).map(a => {
                    const equipmentLogs = logs.filter(l => l.analyzerId === a.id);
                    const lastLog = equipmentLogs[0];
                    const currentLinkStatus = linkedAnalyzers[a.id] || 'idle';

                    return (
                      <div key={a.id} className={`bg-slate-900 border rounded-[2rem] p-6 space-y-4 transition-all group shadow-xl ${
                         isBridgeActive && currentLinkStatus === 'linked' ? 'border-indigo-500/40' : 'border-white/5'
                      }`}>
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-colors ${
                                 isBridgeActive && currentLinkStatus === 'linked' ? 'text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'text-slate-700'
                               }`}>
                                  {a.connectionType === 'RS232_SERIAL' ? <Terminal className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
                               </div>
                               <div>
                                  <h4 className={`text-xs font-black uppercase ${isBridgeActive && currentLinkStatus === 'linked' ? 'text-white' : 'text-slate-600'}`}>{a.name}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <span className="text-[8px] px-1.5 py-0.5 bg-white/5 text-slate-500 rounded font-mono uppercase">{a.protocol}</span>
                                     <span className="text-[8px] text-indigo-500 font-bold font-mono">{a.connectionType === 'TCP_IP' ? a.ipAddress : a.comPort || 'SERIAL'}</span>
                                  </div>
                               </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all ${
                              !isBridgeActive
                                ? 'bg-slate-950 text-slate-700 border-white/5'
                                : currentLinkStatus === 'linked'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                  : currentLinkStatus === 'negotiating'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                    : 'bg-slate-950 text-slate-500 border-white/5'
                            }`}>
                               {!isBridgeActive ? 'Puerto Bloqueado' :
                                currentLinkStatus === 'linked' ? 'Vinculado' :
                                currentLinkStatus === 'negotiating' ? 'Negociando...' : 'Sin Enlace'}
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                               <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Actividad de Socket</div>
                               <div className="flex gap-0.5 items-end h-4">
                                  {[1,2,3,4,5,6,7,8].map(b => (
                                    <div
                                      key={b}
                                      className={`flex-1 rounded-full transition-all duration-500 ${isBridgeActive && currentLinkStatus === 'linked' && b <= 6 ? 'bg-teal-500' : 'bg-slate-800'}`}
                                      style={{ height: `${isBridgeActive && currentLinkStatus === 'linked' ? 30 + (Math.random() * 70) : 20}%` }}
                                    ></div>
                                  ))}
                               </div>
                            </div>
                            <div className="text-right flex flex-col justify-end">
                               <span className="text-[7px] font-black text-slate-600 uppercase block mb-1">Tramas en Bóveda</span>
                               <span className={`text-sm font-mono font-black ${isBridgeActive && currentLinkStatus === 'linked' ? 'text-white' : 'text-slate-800'}`}>
                                  {isBridgeActive && currentLinkStatus === 'linked' ? equipmentLogs.length.toLocaleString() : '0'}
                               </span>
                            </div>
                         </div>

                         <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                               <div className={`w-1.5 h-1.5 rounded-full ${isBridgeActive && currentLinkStatus === 'linked' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`}></div>
                               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Socket {a.port || 'TTY'}</span>
                            </div>
                            {isBridgeActive && currentLinkStatus !== 'linked' ? (
                               <button
                                 onClick={() => {
                                    setLinkedAnalyzers(prev => ({ ...prev, [a.id]: 'negotiating' }));
                                    setTimeout(() => {
                                       setLinkedAnalyzers(prev => ({ ...prev, [a.id]: 'linked' }));
                                    }, 1500);
                                 }}
                                 className="px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-white text-[9px] font-black uppercase rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                               >
                                  Abrir Canal
                               </button>
                            ) : isBridgeActive && (
                               <div className="text-right">
                                  <span className="text-[7px] font-black text-slate-600 uppercase block leading-none mb-1">Sincronización</span>
                                  <span className="text-[9px] font-bold text-slate-400 italic">
                                     {lastLog ? new Date(lastLog.timestamp).toLocaleTimeString() : 'SIN ACTIVIDAD'}
                                  </span>
                               </div>
                            )}
                         </div>
                      </div>
                    );
                 })}
              </div>
              <div className={`lg:col-span-4 bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 shadow-inner relative transition-opacity duration-1000 ${isBridgeActive ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                 <div className="flex justify-between items-center mb-6"><h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Inyección Live Stream</h3><span className="text-[9px] font-black text-indigo-400 uppercase">Recibiendo Tramas...</span></div>
                 <div className="space-y-3">
                    {[{ pat: 'Gabriela Pinzón', test: 'Leucocitos', val: '7.2', time: 'Justo ahora' }, { pat: 'Gonzalo Ríos', test: 'Glucosa', val: '112', time: 'Hace 4m' }].map((r, i) => (
                      <div key={i} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between border-l-2 border-l-teal-500 animate-in slide-in-from-bottom-2 duration-300">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400"><Activity className="w-4 h-4" /></div>
                            <div><div className="text-[10px] font-black text-white uppercase leading-none">{r.pat}</div><div className="text-[9px] text-slate-500 font-bold mt-1">{r.test}: <span className="text-teal-400">{r.val}</span></div></div>
                         </div>
                         <span className="text-[8px] font-mono text-slate-600">{r.time}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 animate-in fade-in duration-500">
           <div className="border-b border-white/5 pb-6 mb-6"><h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3"><Terminal className="w-6 h-6 text-amber-500" /> Bóveda de Tramas ASCII</h3></div>
           <div className="space-y-3">{filteredLogs.map(log => (<div key={log.id} className="bg-slate-950 p-4 rounded-2xl font-mono text-[10px] text-amber-500/80 border border-white/5 overflow-x-auto whitespace-pre">{log.rawPayload}</div>))}</div>
        </div>
      )}

      {/* TOAST NOTIFICATION PRO - GLOBAL */}
      {syncStatus !== 'idle' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex items-center gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.8)] min-w-[400px]">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${syncStatus === 'linking' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                 {syncStatus === 'linking' ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                 <div className="text-xs font-black text-white uppercase tracking-widest">{syncStatus === 'linking' ? 'Estableciendo Enlace' : 'Enlace Sincronizado'}</div>
                 <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{syncStatus === 'linking' ? 'Negociando Handshake con Nodo PTY-1...' : 'Sesión WebSocket Activa - Escuchando Tramas'}</div>
                 {syncStatus === 'linking' && (
                    <div className="h-1 w-full bg-slate-950 rounded-full mt-3 overflow-hidden">
                       <div className="h-full bg-amber-500 animate-[moveRight_1.5s_infinite]"></div>
                    </div>
                 )}
              </div>
              {syncStatus === 'connected' && <X className="w-4 h-4 text-slate-700 cursor-pointer" onClick={() => setSyncStatus('idle')} />}
           </div>
        </div>
      )}
    </div>
  );
};
