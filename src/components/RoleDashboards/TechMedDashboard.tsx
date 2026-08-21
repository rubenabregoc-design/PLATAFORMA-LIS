import React from 'react';
import { TestResult, Order, Analyzer } from '../../types';
import { Cpu, CheckCircle2, Clock, Zap, Microscope, FileText, TrendingUp, AlertTriangle } from 'lucide-react';

interface TechMedDashboardProps {
  results: TestResult[];
  orders: Order[];
  analyzers: Analyzer[];
}

export const TechMedDashboard: React.FC<TechMedDashboardProps> = ({ results, orders, analyzers }) => {
  const pendingValidation = results.filter(r => r.status === 'PENDIENTE').length;
  const criticalResults = results.filter(r => r.flag?.includes('CRITICO')).length;
  const activeAnalyzers = analyzers.filter(a => a.status === 'ONLINE').length;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 3D Glass Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Pendientes Validar', value: pendingValidation, icon: Zap, color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20' },
          { label: 'Alertas Críticas', value: criticalResults, icon: AlertTriangle, color: 'from-rose-400 to-red-500', shadow: 'shadow-rose-500/20' },
          { label: 'Equipos Activos', value: `${activeAnalyzers}/${analyzers.length}`, icon: Cpu, color: 'from-teal-400 to-emerald-500', shadow: 'shadow-teal-500/20' },
          { label: 'TAT Promedio (Hoy)', value: '1.2h', icon: Clock, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' }
        ].map((stat, idx) => (
          <div key={idx} className={`relative group bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-start space-y-4 hover:bg-slate-800/60 transition-all duration-500 ${stat.shadow} shadow-2xl`}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-slate-950 shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Performance Chart Area (Visual Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Productivity Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Resumen Operativo Mensual</h3>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors"></div>
            <div className="relative z-10 space-y-8">
               <div className="flex items-end justify-between">
                  <div>
                    <div className="text-4xl font-black text-white">2,480</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Exámenes Procesados este Mes</div>
                  </div>
                  <div className="flex items-center text-emerald-400 font-black text-sm space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12.5%</span>
                  </div>
               </div>

               {/* Simple Visual Bars */}
               <div className="space-y-4">
                  {[
                    { label: 'Hematología', val: 85, color: 'bg-blue-500' },
                    { label: 'Química Clínica', val: 92, color: 'bg-teal-500' },
                    { label: 'Inmunología', val: 64, color: 'bg-purple-500' },
                    { label: 'Urianálisis', val: 45, color: 'bg-amber-500' }
                  ].map((bar, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-slate-400">
                        <span>{bar.label}</span>
                        <span>{bar.val}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.val}%` }}></div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Analyzer Status Sidebar */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 px-2">Integridad de Equipos</h3>
          <div className="space-y-3">
            {analyzers.map((a) => (
              <div key={a.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-3xl flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${a.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">{a.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{a.protocol} • Port {a.port}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
