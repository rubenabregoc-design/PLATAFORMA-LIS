import React, { useState, useEffect } from 'react';
import {
  Microscope,
  Activity,
  Clock,
  Timer,
  TrendingUp,
  Zap,
  FlaskConical,
  Droplets,
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const SectionWorkloadDashboard: React.FC = () => {
  const [workload, setWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkload();
    const interval = setInterval(fetchWorkload, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchWorkload = async () => {
    try {
      const data = await SupabaseService.workload.getSectionWorkload();
      setWorkload(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const totalPending = workload.reduce((acc, w) => acc + parseInt(w.pending_count), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Real-time Monitor Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                 <h2 className="text-xl font-black tracking-tight">Carga Analítica en Tiempo Real</h2>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                 Monitor de saturación por secciones de laboratorio.
              </p>
           </div>
           <div className="mt-8 flex items-end justify-between">
              <div>
                 <h3 className="text-5xl font-black tracking-tighter">{totalPending}</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Muestras Pendientes Totales</p>
              </div>
              <button onClick={fetchWorkload} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                 <RefreshCw size={24} className="text-teal-400" />
              </button>
           </div>
           <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
              <Timer size={24} />
           </div>
           <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">TAT Promedio Actual</p>
              <h4 className="text-3xl font-black text-slate-800">4.2 <span className="text-sm font-bold">Horas</span></h4>
           </div>
           <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
              <TrendingUp size={14} className="rotate-180" /> -15% vs ayer
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
           <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit">
              <AlertCircle size={24} />
           </div>
           <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Alerta de Saturación</p>
              <h4 className="text-3xl font-black text-slate-800">NORMAL</h4>
           </div>
           <p className="text-[9px] text-slate-400 font-bold">Capacidad operativa al 64%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Workload Distribution Chart */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
               <BarChart3 className="text-blue-500" size={20} />
               Distribución de Carga por Sección
            </h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis
                        dataKey="section_code"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}}
                        width={100}
                     />
                     <Tooltip
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                     />
                     <Bar dataKey="pending_count" radius={[0, 8, 8, 0]} barSize={24}>
                        {workload.map((entry, index) => (
                           <Cell key={index} fill={parseInt(entry.pending_count) > 20 ? '#ef4444' : '#0f172a'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Detailed Section Cards */}
         <div className="space-y-4">
            <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] px-2 mb-2">Estado Crítico de Secciones</h3>
            {workload.map(section => (
               <div key={section.section_code} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-teal-400 transition-all">
                  <div className="flex items-center gap-4">
                     <div className={`p-2 rounded-xl ${parseInt(section.pending_count) > 20 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Microscope size={20} />
                     </div>
                     <div>
                        <p className="font-black text-slate-800 text-xs uppercase">{section.section_code}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Espera: {parseFloat(section.avg_wait_hours).toFixed(1)}h</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`text-xl font-black ${parseInt(section.pending_count) > 20 ? 'text-red-600' : 'text-slate-800'}`}>{section.pending_count}</p>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">PENDIENTES</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default SectionWorkloadDashboard;
