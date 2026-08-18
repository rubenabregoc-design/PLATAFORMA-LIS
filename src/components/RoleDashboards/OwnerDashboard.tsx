import React from 'react';
import { Tenant, Branch, Order } from '../../types';
import { DollarSign, Activity, Building2, Clock, Zap, Package, ChevronRight, TrendingUp, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { IotColdChainMonitor } from '../IotColdChainMonitor';

interface OwnerDashboardProps {
  tenant: Tenant;
  branch: Branch;
  orders: Order[];
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ tenant, orders }) => {
  const [activeView, setActiveView] = React.useState<'PERFORMANCE' | 'REVENUE_INTEGRITY'>('PERFORMANCE');
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0) + 1420.00;
  const totalOrdersCount = orders.length + 84;
  const avgTatHours = 1.4;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* View Selector */}
      <div className="flex items-center space-x-2 bg-slate-950/50 p-1 rounded-2xl border border-white/5 w-fit">
         <button
          onClick={() => setActiveView('PERFORMANCE')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'PERFORMANCE' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
         >
           Rendimiento General
         </button>
         <button
          onClick={() => setActiveView('REVENUE_INTEGRITY')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'REVENUE_INTEGRITY' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
         >
           Integridad de Ingresos
         </button>
      </div>

      {activeView === 'PERFORMANCE' ? (
        <div className="space-y-12 animate-in fade-in duration-500">
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

            {/* Analyzer ROI Comparison */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Rentabilidad por Equipo</h3>
              <div className="space-y-6 flex-1 justify-center flex flex-col">
                  {[
                    { name: 'Sysmex XN-1000', cost: 0.85, volume: 1240, color: 'from-teal-400 to-emerald-500' },
                    { name: 'Vitros 4600', cost: 1.20, volume: 850, color: 'from-blue-400 to-indigo-500' },
                    { name: 'Mindray BS-480', cost: 0.95, volume: 620, color: 'from-purple-400 to-fuchsia-500' }
                  ].map((eq, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-black text-white uppercase">{eq.name}</span>
                          <span className="text-[9px] font-mono text-teal-400">${eq.cost.toFixed(2)} / prueba</span>
                      </div>
                      <div className="h-2.5 bg-slate-950 rounded-full border border-white/5 p-0.5 overflow-hidden">
                          <div
                          className={`h-full rounded-full bg-gradient-to-r ${eq.color} shadow-lg`}
                          style={{ width: `${(eq.volume / 1500) * 100}%` }}
                          ></div>
                      </div>
                      <div className="text-[8px] font-black text-slate-600 uppercase text-right">{eq.volume} Pruebas / Mes</div>
                    </div>
                  ))}
              </div>
              <div className="pt-4 border-t border-white/5">
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                    Analizar Costos Operativos
                  </button>
              </div>
            </div>
          </div>

          {/* Heatmap and IoT Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <IotColdChainMonitor />

              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Mapa de Calor: Carga de Trabajo (24h)</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-600 uppercase">Pico: 09:00 AM</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-12 md:grid-cols-24 gap-1 sm:gap-1.5 h-32 items-end">
                      {[20, 15, 10, 5, 8, 35, 75, 95, 85, 60, 45, 30, 25, 40, 55, 65, 50, 40, 30, 20, 15, 10, 5, 5].map((val, i) => (
                        <div key={i} className={`flex flex-col items-center gap-2 group relative ${i >= 12 ? 'hidden md:flex' : 'flex'}`}>
                          <div
                            className={`w-full rounded-md transition-all duration-700 ${val > 70 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : val > 40 ? 'bg-amber-500' : 'bg-teal-500/40'}`}
                            style={{ height: `${val}%` }}
                          >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[8px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-white/10">
                                {val} Pacientes
                              </div>
                          </div>
                          {(i % 4 === 0 || i === 23) && <span className="text-[6px] sm:text-[7px] font-black text-slate-600 font-mono">{i}:00</span>}
                        </div>
                      ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      El gráfico indica una saturación crítica entre las <strong className="text-rose-400">07:00 y 10:00 AM</strong>. Se recomienda reforzar el personal de flebotomía en este rango.
                  </p>
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
      ) : (
        /* REVENUE INTEGRITY AUDIT VIEW */
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Ingresos no Facturados', val: '$320.50', color: 'text-rose-400', icon: AlertTriangle, desc: 'Órdenes sin comprobante fiscal' },
                { label: 'Excesos de Consumo', val: '+12%', color: 'text-amber-400', icon: Package, desc: 'Reactivo usado vs Pruebas facturadas' },
                { label: 'Recuperación Aseguradoras', val: '88%', color: 'text-teal-400', icon: ShieldCheck, desc: 'Tasa de pago de reclamos' }
              ].map((m, i) => (
                <div key={i} className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
                   <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl bg-white/5 ${m.color}`}><m.icon className="w-5 h-5" /></div>
                      <span className={`text-2xl font-black ${m.color}`}>{m.val}</span>
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">{m.label}</div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">{m.desc}</div>
                   </div>
                </div>
              ))}
           </div>

           <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Auditoría de Desperdicio de Reactivos</h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-[10px]">
                    <thead>
                       <tr className="text-slate-600 font-black uppercase tracking-widest border-b border-white/5">
                          <th className="pb-4">Equipo Analítico</th>
                          <th className="pb-4">Pruebas Ejecutadas</th>
                          <th className="pb-4">Pruebas Facturadas</th>
                          <th className="pb-4">Desviación (Fuga)</th>
                          <th className="pb-4 text-right">Costo Estimado Pérdida</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {[
                         { eq: 'Sysmex XN-1000', run: 1240, bill: 1210, diff: '2.4%', loss: '$25.50' },
                         { eq: 'Vitros 4600', run: 850, bill: 780, diff: '8.2%', loss: '$84.00' },
                         { eq: 'Mindray BS-480', run: 620, bill: 615, diff: '0.8%', loss: '$4.75' }
                       ].map((r, i) => (
                         <tr key={i} className="group hover:bg-white/[0.02]">
                            <td className="py-5 font-black text-white">{r.eq}</td>
                            <td className="py-5 text-slate-400 font-mono">{r.run}</td>
                            <td className="py-5 text-slate-400 font-mono">{r.bill}</td>
                            <td className="py-5">
                               <span className={`px-2 py-0.5 rounded-full font-black ${parseFloat(r.diff) > 5 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                  {r.diff}
                               </span>
                            </td>
                            <td className="py-5 text-right font-black text-white">{r.loss}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="mt-8 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <span className="text-[9px] font-black text-rose-200 uppercase tracking-widest">Fuga Detectada: El 8.2% de pruebas en Vitros no tienen orden de pago asociada.</span>
                 </div>
                 <button className="px-4 py-2 bg-rose-500 text-white font-black text-[8px] uppercase rounded-lg">Investigar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
