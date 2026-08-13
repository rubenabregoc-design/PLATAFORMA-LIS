import React, { useState } from 'react';
import { ClipboardCheck, Wrench, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const EquipmentMaintenanceLog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tasks, setTasks] = useState([
    { id: '1', equip: 'Sysmex XN-1000', task: 'Lavado Diario con CellClean', status: 'done', time: '07:15 AM' },
    { id: '2', equip: 'Sysmex XN-1000', task: 'Verificación de Blancos', status: 'done', time: '07:22 AM' },
    { id: '3', equip: 'Vitros 4600', task: 'Calibración Glucosa (Lote 22)', status: 'pending', time: '---' },
    { id: '4', equip: 'Vitros 4600', task: 'Cambio de Agua Desionizada', status: 'done', time: '08:05 AM' },
  ]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
                 <Wrench className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">Bitácora de Mantenimiento ISO 15189</h2>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Control Diario de Equipos Analíticos</p>
              </div>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Cerrar</button>
        </div>

        <div className="p-8 space-y-6">
           <div className="space-y-3">
              {tasks.map(t => (
                <div key={t.id} className={`p-5 rounded-[2rem] border transition-all flex items-center justify-between ${t.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-white/5'}`}>
                   <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.status === 'done' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                         <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div>
                         <div className="text-[11px] font-black text-white uppercase tracking-tight">{t.equip}</div>
                         <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{t.task}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      {t.status === 'done' ? (
                        <div className="flex flex-col items-end">
                           <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Completado</div>
                           <div className="text-[8px] text-slate-500 font-mono mt-0.5">{t.time}</div>
                        </div>
                      ) : (
                        <button className="px-4 py-2 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Marcar Hecho</button>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="p-8 bg-slate-950/30 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Audit Trail Activo (Imputable)</span>
           </div>
           <button className="bg-white/5 text-slate-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Ver Reporte Mensual</button>
        </div>
      </div>
    </div>
  );
};
