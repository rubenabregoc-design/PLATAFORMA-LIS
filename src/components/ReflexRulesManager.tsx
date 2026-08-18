import React, { useState } from 'react';
import { Plus, Zap, AlertCircle, Save, Trash2, Settings2 } from 'lucide-react';

interface ReflexRule {
  id: string;
  testTrigger: string;
  condition: string;
  value: number;
  testToAdd: string;
  isActive: boolean;
}

export const ReflexRulesManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [rules, setRules] = useState<ReflexRule[]>([
    { id: '1', testTrigger: 'Glucosa', condition: '>', value: 200, testToAdd: 'HbA1c (Hemoglobina Glicosilada)', isActive: true },
    { id: '2', testTrigger: 'Urianálisis', condition: 'contains', value: 1, testToAdd: 'Urocultivo', isActive: true },
    { id: '3', testTrigger: 'Hemoglobina', condition: '<', value: 8, testToAdd: 'Perfil de Hierro', isActive: false },
  ]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header - Fixed */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
                 <Zap className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestor de Reglas Reflex</h2>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Automatización de Cargas de Pruebas</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Cerrar</button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
           <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="p-5 bg-slate-950 border border-white/5 rounded-[2rem] flex items-center justify-between group">
                   <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                      <div>
                         <div className="text-[11px] font-black text-white uppercase tracking-tight">
                            Si <span className="text-teal-400">{rule.testTrigger}</span> es {rule.condition} {rule.value}
                         </div>
                         <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                            Añadir: <span className="text-amber-500">{rule.testToAdd}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center space-x-2">
                      <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><Settings2 className="w-4 h-4" /></button>
                      <button className="p-2 bg-slate-800 rounded-lg text-rose-400/50 hover:text-rose-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
           </div>

           <button className="w-full py-4 bg-teal-500/10 border-2 border-dashed border-teal-500/30 text-teal-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-slate-950 transition-all flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Añadir Nueva Regla Automática</span>
           </button>
        </div>

        {/* Footer - Fixed */}
        <div className="p-8 bg-slate-950/30 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
           <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Las reglas activas se aplican al validar técnicamente</span>
           </div>
           <button className="w-full sm:w-auto bg-teal-500 text-slate-950 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};
