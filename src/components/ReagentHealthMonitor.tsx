import React from 'react';
import { Beaker, Droplets, AlertCircle, Calendar, RefreshCw } from 'lucide-react';

interface Reagent {
  id: string;
  name: string;
  count: number;
  max: number;
  exp: string;
  type: string;
}

export const ReagentHealthMonitor: React.FC = () => {
  const reagents: Reagent[] = [
    { id: '1', name: 'Diluente hematológico (XN)', count: 420, max: 2000, exp: '2026-10-12', type: 'HEMATO' },
    { id: '2', name: 'Lyse White (XN)', count: 12, max: 500, exp: '2026-08-25', type: 'HEMATO' },
    { id: '3', name: 'Cuvettes Chemistry', count: 85, max: 100, exp: '---', type: 'QUIMICA' },
    { id: '4', name: 'Wash Fluid (Vitros)', count: 5, max: 50, exp: '2026-09-01', type: 'QUIMICA' },
  ];

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Salud de Reactivos & Consumibles</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-bold">Monitoreo Live de Estación de Trabajo</p>
        </div>
        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="space-y-6">
        {reagents.map(r => {
          const percent = (r.count / r.max) * 100;
          const isCritical = percent < 15;
          const isWarning = percent < 30;

          return (
            <div key={r.id} className="space-y-2">
              <div className="flex items-start justify-between">
                 <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isCritical ? 'bg-rose-500/10 text-rose-400' :
                      isWarning ? 'bg-amber-500/10 text-amber-400' :
                      'bg-teal-500/10 text-teal-400'
                    }`}>
                      {r.type === 'HEMATO' ? <Droplets className="w-4 h-4" /> : <Beaker className="w-4 h-4" />}
                    </div>
                    <div>
                       <div className="text-[11px] font-black text-white uppercase tracking-tight">{r.name}</div>
                       <div className="flex items-center space-x-2 text-[8px] font-bold text-slate-500 uppercase">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Exp: {r.exp}</span>
                       </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className={`text-xs font-black ${isCritical ? 'text-rose-400' : 'text-white'}`}>
                      {r.count} <span className="text-[9px] text-slate-500 font-bold">/ {r.max} tests</span>
                    </div>
                    {isCritical && (
                      <div className="flex items-center justify-end space-x-1 mt-0.5">
                         <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                         <span className="text-[8px] font-black text-rose-500 uppercase">Agotándose</span>
                      </div>
                    )}
                 </div>
              </div>

              <div className="h-2 bg-slate-950 rounded-full border border-white/5 p-0.5 overflow-hidden">
                 <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isCritical ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                    isWarning ? 'bg-amber-500' :
                    'bg-teal-500'
                  }`}
                  style={{ width: `${percent}%` }}
                 ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-white/5">
         <button className="w-full py-4 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 border border-teal-500/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all">
            Gestionar Órdenes de Suministro
         </button>
      </div>
    </div>
  );
};
