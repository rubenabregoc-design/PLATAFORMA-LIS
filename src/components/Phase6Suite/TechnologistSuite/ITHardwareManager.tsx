import React, { useState, useEffect } from 'react';
import {
  Server,
  Settings,
  Wifi,
  ShieldCheck,
  History,
  Plus,
  Search,
  ArrowRight,
  Database,
  Cpu,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Network
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const ITHardwareManager: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [astData, logData] = await Promise.all([
        SupabaseService.itHardware.getAssets(),
        SupabaseService.itHardware.getLogs()
      ]);
      setAssets(astData);
      setLogs(logData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-emerald-500 shadow-emerald-500/20';
      case 'MAINTENANCE': return 'bg-amber-500 shadow-amber-500/20';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Server className="text-teal-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Infraestructura y Redes (IT)</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Monitoreo de servidores, nodos de comunicación y equipos de respaldo (UPS). Gestión de alta disponibilidad del LIS.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all border border-white/10 backdrop-blur-md">
               TOPOLOGÍA DE RED
            </button>
            <button className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-teal-500/20">
              <Plus size={18} />
              AGREGAR DISPOSITIVO
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Hardware Status Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map(asset => (
            <div key={asset.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-teal-400 transition-all group">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                       {asset.hardware_type === 'SERVER' ? <Database size={24} /> : asset.hardware_type === 'SWITCH' ? <Network size={24} /> : <Cpu size={24} />}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">{asset.name}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{asset.ip_address || 'Sin IP'}</p>
                    </div>
                 </div>
                 <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${getStatusColor(asset.status)}`}></div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                 <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Uptime</p>
                    <p className="text-xs font-black text-slate-700">99.9%</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Last Reboot</p>
                    <p className="text-xs font-black text-slate-700">{asset.last_reboot ? new Date(asset.last_reboot).toLocaleDateString() : 'Never'}</p>
                 </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{asset.location}</span>
                 <button className="text-teal-600 hover:text-teal-700 transition-colors">
                    <Settings size={18} />
                 </button>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-2 py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <Server className="mx-auto text-slate-200 mb-4" size={48} />
               <p className="text-slate-400 font-black uppercase text-xs">No hay infraestructura IT registrada.</p>
            </div>
          )}
        </div>

        {/* Maintenance Feed */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <History className="text-blue-500" size={18} />
                 Bitácora de Sistemas
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
                 {logs.map(log => (
                    <div key={log.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                       <div className="p-2 bg-white rounded-xl h-fit shadow-sm"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{log.task_name}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-bold">{new Date(log.created_at).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-2 italic leading-tight">{log.description}</p>
                       </div>
                    </div>
                 ))}
                 {logs.length === 0 && (
                    <div className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">Sin actividad técnica</div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ITHardwareManager;
