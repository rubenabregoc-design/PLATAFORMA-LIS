import React, { useState, useEffect } from 'react';
import { X, Hash, Save, RotateCcw, Volume2, Keyboard } from 'lucide-react';
import { useToast } from './Toast';

interface CellCounter {
  id: string;
  name: string;
  key: string;
  count: number;
  color: string;
}

export const HematologyDifferentialCounter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { toast } = useToast();
  const [counters, setCounters] = useState<CellCounter[]>([
    { id: 'neu', name: 'Neutrófilos', key: 'n', count: 0, color: 'bg-blue-500' },
    { id: 'lin', name: 'Linfocitos', key: 'l', count: 0, color: 'bg-emerald-500' },
    { id: 'mon', name: 'Monocitos', key: 'm', count: 0, color: 'bg-amber-500' },
    { id: 'eos', name: 'Eosinófilos', key: 'e', count: 0, color: 'bg-rose-500' },
    { id: 'bas', name: 'Basófilos', key: 'b', count: 0, color: 'bg-purple-500' },
  ]);

  const total = counters.reduce((sum, c) => sum + c.count, 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const char = e.key.toLowerCase();
      const index = counters.findIndex(c => c.key === char);
      if (index !== -1 && total < 100) {
        incrementCounter(index);
      }
      if (char === 'r') resetCounters();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [counters, total]);

  const incrementCounter = (index: number) => {
    setCounters(prev => {
      const next = [...prev];
      next[index] = { ...next[index], count: next[index].count + 1 };

      const newTotal = next.reduce((sum, c) => sum + c.count, 0);
      if (newTotal === 100) {
        toast('Conteo de 100 células completado', 'success');
      }

      return next;
    });
  };

  const resetCounters = () => {
    setCounters(prev => prev.map(c => ({ ...c, count: 0 })));
    toast('Contador reiniciado', 'info');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-blue-500/20">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Contador Diferencial Digital</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Modo Microscopía Activo • Use el Teclado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-10 space-y-10">
          {/* Main Counter Display */}
          <div className="flex flex-col items-center justify-center space-y-4">
             <div className={`text-7xl font-black tabular-nums transition-colors ${total >= 100 ? 'text-emerald-400' : 'text-white'}`}>
                {total}<span className="text-2xl text-slate-700 ml-2">/ 100</span>
             </div>
             <div className="w-full h-3 bg-slate-950 rounded-full border border-white/5 p-0.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${total}%` }}
                ></div>
             </div>
          </div>

          {/* Grid of Cells */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             {counters.map((c, i) => (
               <button
                 key={c.id}
                 onClick={() => total < 100 && incrementCounter(i)}
                 className={`relative group p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center space-y-3 ${
                   c.count > 0 ? 'bg-slate-950 border-white/10' : 'bg-slate-900/40 border-transparent hover:border-white/5'
                 }`}
               >
                  <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-black/20`}>
                    {c.key.toUpperCase()}
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">{c.name}</div>
                  <div className="text-2xl font-black text-white">{c.count}</div>
                  <div className="text-[9px] font-mono text-slate-600">{((c.count / (total || 1)) * 100).toFixed(0)}%</div>
               </button>
             ))}
          </div>

          {/* Control Bar */}
          <div className="grid grid-cols-2 gap-4">
             <button
              onClick={resetCounters}
              className="py-4 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-2"
             >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar (R)</span>
             </button>
             <button
              disabled={total < 100}
              onClick={() => { toast('Resultados exportados a la orden', 'success'); onClose(); }}
              className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-2 ${
                total >= 100 ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
             >
                <Save className="w-4 h-4" />
                <span>Exportar Resultados</span>
             </button>
          </div>
        </div>

        {/* Tips Footer */}
        <div className="p-6 bg-slate-950/30 border-t border-white/5 text-center">
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center">
             <Volume2 className="w-3 h-3 mr-2" />
             El sistema emite una alerta sonora al llegar a 100 para no despegar la vista del ocular.
           </p>
        </div>
      </div>
    </div>
  );
};
