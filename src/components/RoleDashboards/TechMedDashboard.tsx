import React from 'react';
import { TestResult, Order, Analyzer } from '../../types';
import { Cpu, CheckCircle2, Clock, Zap, Microscope, FileText, TrendingUp, AlertTriangle, Keyboard, Timer, Settings2, Wrench, AlertOctagon, ChevronRight } from 'lucide-react';
import { HematologyDifferentialCounter } from '../HematologyDifferentialCounter';
import { ReagentHealthMonitor } from '../ReagentHealthMonitor';
import { ReflexRulesManager } from '../ReflexRulesManager';
import { EquipmentMaintenanceLog } from '../EquipmentMaintenanceLog';
import { AnalyzerErrorSearch } from '../AnalyzerErrorSearch';

interface TechMedDashboardProps {
  results: TestResult[];
  orders: Order[];
  analyzers: Analyzer[];
}

export const TechMedDashboard: React.FC<TechMedDashboardProps> = ({ results, orders, analyzers }) => {
  const [showCounter, setShowCounter] = React.useState(false);
  const [showReflex, setShowReflex] = React.useState(false);
  const [showMaintenance, setShowMaintenance] = React.useState(false);
  const [showErrorSearch, setShowErrorSearch] = React.useState(false);

  const pendingValidation = results.filter(r => r.status === 'PENDIENTE').length;
  const criticalResults = results.filter(r => r.flag?.includes('CRITICO')).length;
  const activeAnalyzers = analyzers.filter(a => a.status === 'En línea').length;

  const statOrders = orders.filter(o => o.priority === 'STAT' && o.status !== 'COMPLETADA');

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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${a.status === 'En línea' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">{a.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{a.protocol} • Port {a.port}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Access Tools */}
          <div className="pt-6 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 px-2 mb-2">Mesa de Trabajo</h3>

            <button
              onClick={() => setShowCounter(true)}
              className="w-full bg-blue-500 hover:bg-blue-400 text-slate-950 p-5 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center space-x-4">
                 <Keyboard className="w-5 h-5" />
                 <span className="font-black uppercase tracking-tighter text-xs">Diferencial WBC</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowReflex(true)}
              className="w-full bg-slate-900 border border-white/5 hover:border-teal-500/30 text-white p-5 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center space-x-4">
                 <Settings2 className="w-5 h-5 text-teal-400" />
                 <span className="font-black uppercase tracking-tighter text-xs">Reglas Reflex</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <button
              onClick={() => setShowMaintenance(true)}
              className="w-full bg-slate-900 border border-white/5 hover:border-amber-500/30 text-white p-5 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center space-x-4">
                 <Wrench className="w-5 h-5 text-amber-400" />
                 <span className="font-black uppercase tracking-tighter text-xs">Bitácora ISO</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <button
              onClick={() => setShowErrorSearch(true)}
              className="w-full bg-slate-900 border border-white/5 hover:border-rose-500/30 text-white p-5 rounded-2xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center space-x-4">
                 <AlertOctagon className="w-5 h-5 text-rose-400" />
                 <span className="font-black uppercase tracking-tighter text-xs">Manual de Errores</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Urgent Samples Timer (TAT) */}
      <div className="bg-slate-950/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-rose-400 flex items-center">
               <Timer className="w-4 h-4 mr-2" /> Monitor de Urgencias (STAT)
            </h3>
            <span className="text-[9px] font-bold text-slate-500 uppercase">{statOrders.length} Prioritarias</span>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statOrders.map((o, i) => (
              <div key={o.id} className="bg-slate-900 border border-rose-500/20 p-5 rounded-2xl flex items-center justify-between group hover:border-rose-500/50 transition-all">
                 <div className="space-y-1">
                    <div className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{o.patientName}</div>
                    <div className="text-[8px] font-mono text-rose-400">{o.orderNumber}</div>
                 </div>
                 <div className="text-right">
                    <div className={`text-xl font-black tabular-nums ${i === 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                       00:{15 - i * 5}:20
                    </div>
                    <div className="text-[7px] font-black text-slate-500 uppercase">Restante TAT</div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Live Reagent Monitor Section */}
      <div className="grid grid-cols-1 gap-8">
         <ReagentHealthMonitor />
      </div>

      {/* Modals */}
      {showCounter && <HematologyDifferentialCounter onClose={() => setShowCounter(false)} />}
      {showReflex && <ReflexRulesManager onClose={() => setShowReflex(false)} />}
      {showMaintenance && <EquipmentMaintenanceLog onClose={() => setShowMaintenance(false)} />}
      {showErrorSearch && <AnalyzerErrorSearch onClose={() => setShowErrorSearch(false)} />}
    </div>
  );
};
