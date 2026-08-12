import React from 'react';
import { Tenant, Branch, Order } from '../../types';
import { DollarSign, Activity, Building2, Clock, Zap, Package, ChevronRight, TrendingUp } from 'lucide-react';

interface OwnerDashboardProps {
  tenant: Tenant;
  branch: Branch;
  orders: Order[];
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ tenant, orders }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0) + 1420.00;
  const totalOrdersCount = orders.length + 84;
  const avgTatHours = 1.4;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 3D Glass Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Mensuales', value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
          { label: 'Órdenes Activas', value: totalOrdersCount, icon: Activity, color: 'from-teal-400 to-cyan-500', shadow: 'shadow-teal-500/20' },
          { label: 'Tiempo de Entrega', value: `${avgTatHours}h`, icon: Clock, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
          { label: 'Sedes Operativas', value: tenant.branches.length, icon: Building2, color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20' }
        ].map((stat, idx) => (
          <div key={idx} className={`relative group bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-start space-y-4 hover:bg-slate-800/60 transition-all duration-500 ${stat.shadow} shadow-2xl`}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-slate-950 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
            </div>
            {/* Simple sparkline simulation */}
            <div className="w-full h-8 flex items-end gap-1 mt-2">
               {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                 <div key={i} className={`flex-1 rounded-t-sm transition-all duration-1000 ${stat.shadow.includes('emerald') ? 'bg-emerald-500/20' : stat.shadow.includes('teal') ? 'bg-teal-500/20' : stat.shadow.includes('amber') ? 'bg-amber-500/20' : 'bg-blue-500/20'}`} style={{ height: `${h}%` }}></div>
               ))}
            </div>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Sections with Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Branch Matrix - Glass Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Rendimiento por Sede</h3>
            <button className="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-widest flex items-center">
              Gestionar Sedes <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenant.branches.map((b) => (
              <div key={b.id} className="relative overflow-hidden bg-slate-900/60 border border-slate-800 p-5 rounded-[2rem] group hover:border-teal-500/40 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 text-slate-400 group-hover:text-teal-400 group-hover:border-teal-500/20 transition-all">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-white text-base">{b.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">{b.code} • {b.address.split(',')[0]}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 text-lg font-black tracking-tight">$420</div>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] text-slate-400 uppercase font-black">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Panel */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 px-2">Alertas de IA</h3>
          <div className="bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px]"></div>

             <div className="flex items-start space-x-5 group">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 shrink-0 border border-rose-500/20 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-black text-white text-sm tracking-tight">Validaciones Retrasadas</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Detectamos un cuello de botella en Sede Chiriquí. 12 muestras requieren firma inmediata.</p>
                </div>
             </div>

             <div className="flex items-start space-x-5 group">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-black text-white text-sm tracking-tight">Stock bajo: Glucosa HK</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">El inventario actual solo cubrirá 3 días de operación normal.</p>
                </div>
             </div>

             <div className="pt-4">
               <button className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-teal-500/20 transform hover:-translate-y-1 active:scale-95">
                 Ver Reporte Ejecutivo
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* New Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Distribución de Pruebas (Mensual)</h3>
            <div className="flex items-center justify-between gap-4 h-48">
               {[
                 { label: 'HEM', val: 85, color: 'bg-teal-500' },
                 { label: 'QUI', val: 65, color: 'bg-emerald-500' },
                 { label: 'INM', val: 45, color: 'bg-blue-500' },
                 { label: 'COA', val: 30, color: 'bg-rose-500' },
                 { label: 'URA', val: 20, color: 'bg-amber-500' }
               ].map((bar, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-3">
                    <div className="flex-1 w-full flex items-end justify-center px-1 sm:px-2">
                       <div className={`${bar.color} w-full rounded-xl shadow-lg transition-all duration-1000 animate-in slide-in-from-bottom-full`} style={{ height: `${bar.val}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-slate-500">{bar.label}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Eficiencia Operativa</h3>
              <div className="space-y-5">
                 {[
                   { label: 'Ocupación de Equipos', val: 78, color: 'from-blue-400 to-indigo-500' },
                   { label: 'Validación Técnica Automática', val: 92, color: 'from-teal-400 to-emerald-500' },
                   { label: 'Repetición de Pruebas', val: 4, color: 'from-rose-400 to-red-500' }
                 ].map((metric, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-400">{metric.label}</span>
                         <span className="text-white">{metric.val}%</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                         <div className={`h-full rounded-full bg-gradient-to-r ${metric.color} transition-all duration-1000`} style={{ width: `${metric.val}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
            <div className="mt-8 p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl flex items-center justify-between">
               <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Puntualidad en TAT</div>
               <div className="text-xl font-black text-teal-400">98.2%</div>
            </div>
         </div>
      </div>
    </div>
  );
};
