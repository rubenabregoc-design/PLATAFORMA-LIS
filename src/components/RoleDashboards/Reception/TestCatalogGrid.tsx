import React from 'react';
import { TestCatalogItem } from '../../../types';
import {
  Search, Activity, Beaker, Timer, Clock
} from 'lucide-react';

interface TestCatalogGridProps {
  testSearchTerm: string;
  setTestSearchTerm: (term: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  selectedTestIds: string[];
  setSelectedTestIds: React.Dispatch<React.SetStateAction<string[]>>;
  filteredTests: TestCatalogItem[];
}

export const TestCatalogGrid: React.FC<TestCatalogGridProps> = ({
  testSearchTerm,
  setTestSearchTerm,
  activeCategory,
  setActiveCategory,
  selectedTestIds,
  setSelectedTestIds,
  filteredTests
}) => {
  return (
    <div className="flex-1 flex flex-col shrink-0 min-h-0 min-w-0">
      <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex flex-col space-y-6">
        <div className="bg-slate-950/80 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-teal-500 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Localizar análisis por nombre o código..."
              value={testSearchTerm}
              onChange={(e) => setTestSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-[11px] font-black text-white focus:border-teal-500/50 outline-none transition-all placeholder:text-slate-700 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['HEMATOLOGIA', 'QUIMICA', 'INMUNOLOGIA', 'URINALISIS', 'COAGULACION'].map(category => (
              <button
                key={category}
                onClick={() => { setActiveCategory(category); setTestSearchTerm(''); }}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === category ? 'bg-teal-500 border-teal-400 text-slate-950 shadow-lg scale-105' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-20 -mx-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 py-4">
            {filteredTests.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                  <Search className="w-8 h-8 text-slate-700" />
                </div>
                <div>
                  <h4 className="text-white font-black uppercase tracking-widest text-sm">No se encontraron análisis</h4>
                  <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-tighter">Intenta con otro nombre, código o revisa la ortografía</p>
                </div>
                <button onClick={() => setTestSearchTerm('')} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-teal-400 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Limpiar Búsqueda</button>
              </div>
            ) : filteredTests.map(test => {
              const isSelected = selectedTestIds.includes(test.id);
              const requiresFasting = test.category === 'QUIMICA' || test.category === 'INMUNOLOGIA';
              return (
                <button
                  key={test.id}
                  onClick={() => setSelectedTestIds(prev => isSelected ? prev.filter(id => id !== test.id) : [...prev, test.id])}
                  className={`flex items-center pl-4 pr-6 py-4 rounded-[2rem] border-2 transition-all duration-500 relative group overflow-hidden ${isSelected ? 'bg-teal-500/10 border-teal-500/60 shadow-xl scale-[1.04] z-10 ring-1 ring-inset ring-teal-500/30' : 'bg-slate-950/40 border-white/5 hover:border-white/10'}`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center mr-4 transition-all ${isSelected ? 'bg-teal-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-700 shadow-inner'}`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 text-left pr-2">
                    <div className={`text-[11px] xl:text-[12px] font-black uppercase leading-tight tracking-normal mb-1 truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>{test.name}</div>

                    <div className="flex items-center space-x-3 mb-1.5">
                      <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest opacity-60">Ref: {test.code}</div>
                      <div className="h-1 w-1 rounded-full bg-slate-800"></div>
                      <div className="flex items-center text-[7px] font-black uppercase text-teal-500/70 tracking-tighter">
                         <Beaker className="w-2.5 h-2.5 mr-1" /> {test.specimenType}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {requiresFasting && (
                        <span className="text-[7px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-tighter flex items-center">
                          <Timer className="w-2.5 h-2.5 mr-1" /> Requiere Ayuno
                        </span>
                      )}
                      <span className="text-[7px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter flex items-center">
                        <Clock className="w-2.5 h-2.5 mr-1" /> TAT: {test.tatHours}h
                      </span>
                    </div>
                  </div>
                  <div className={`text-[11px] font-black font-mono flex-shrink-0 ml-3 ${isSelected ? 'text-teal-400' : 'text-slate-700'}`}>${test.price.toFixed(2)}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
