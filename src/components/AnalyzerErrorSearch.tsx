import React, { useState } from 'react';
import { Search, AlertTriangle, ChevronRight, BookOpen, ExternalLink } from 'lucide-react';

export const AnalyzerErrorSearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setSearchQuery] = useState('');

  const errors = [
    { code: 'ERR-1002', equip: 'Sysmex XN', title: 'Pressure Error (Vacuum)', solution: 'Limpiar el puerto de vacío trasero y reiniciar el compresor.' },
    { code: 'VIT-92', equip: 'Ortho Vitros', title: 'Cuvette Jam', solution: 'Abrir compuerta lateral, retirar manualmente la cubeta trabada en el carrusel A.' },
    { code: 'MIN-005', equip: 'Mindray BS', title: 'Lamp Low Signal', solution: 'Vida útil de lámpara halógena al 5%. Solicitar reemplazo inmediato.' },
  ];

  const filtered = errors.filter(e => e.code.toLowerCase().includes(query.toLowerCase()) || e.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-8 bg-slate-950/50 border-b border-white/5">
           <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">Resolución de Errores</h2>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base de Conocimientos Técnica</p>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Cerrar</button>
           </div>

           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Ingrese código de error (ej: ERR-1002)..."
                value={query}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-teal-500 outline-none"
              />
           </div>
        </div>

        <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto">
           {filtered.map(err => (
             <div key={err.code} className="p-6 bg-slate-950 border border-white/5 rounded-[2.5rem] space-y-4 hover:border-rose-500/20 transition-all group">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-mono font-black text-rose-400 bg-rose-400/10 px-3 py-1 rounded-lg border border-rose-400/20">{err.code}</span>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{err.equip}</span>
                </div>
                <div>
                   <h3 className="text-white font-black uppercase text-sm tracking-tight">{err.title}</h3>
                   <p className="text-[11px] text-slate-400 mt-2 leading-relaxed"><strong>Solución sugerida:</strong> {err.solution}</p>
                </div>
                <button className="flex items-center space-x-2 text-teal-400 text-[9px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                   <span>Ver Manual Completo</span>
                   <ExternalLink className="w-3 h-3" />
                </button>
             </div>
           ))}
        </div>

        <div className="p-6 bg-slate-950/30 border-t border-white/5 text-center">
           <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Sincronizado con bases de datos de fabricantes (AbregoTech Cloud)</p>
        </div>
      </div>
    </div>
  );
};
