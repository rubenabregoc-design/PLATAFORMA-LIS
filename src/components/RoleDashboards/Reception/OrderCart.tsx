import React from 'react';
import { TestCatalogItem } from '../../../types';
import {
  X, Zap, Clock, CheckCircle2, UserPlus, Stethoscope, Search
} from 'lucide-react';
import { MOCK_DOCTORS } from '../../../data/mockData';
import { useToast } from '../../Toast';

interface OrderCartProps {
  selectedTests: TestCatalogItem[];
  setSelectedTestIds: React.Dispatch<React.SetStateAction<string[]>>;
  isStat: boolean;
  setIsStat: (val: boolean) => void;
  isFasting: boolean;
  setIsFasting: (val: boolean) => void;
  totalAmount: number;
  handleCreateOrderSubmit: () => void;
  foundPatient: any;
  isRegistering: boolean;
}

export const OrderCart: React.FC<OrderCartProps> = ({
  selectedTests,
  setSelectedTestIds,
  isStat,
  setIsStat,
  isFasting,
  setIsFasting,
  totalAmount,
  handleCreateOrderSubmit,
  foundPatient,
  isRegistering
}) => {
  const { toast } = useToast();
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>('doc-001');
  const [isDoctorSearchOpen, setIsDoctorSearchOpen] = React.useState(false);

  const selectedDoctor = MOCK_DOCTORS.find(d => d.id === selectedDoctorId) || MOCK_DOCTORS[0];
  return (
    <div className="w-full lg:w-[280px] xl:w-[320px] flex flex-col shrink-0 min-h-0">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col relative group">
         <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-500/5 rounded-full blur-[100px]"></div>
         <div className="flex-1 space-y-6 relative z-10 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                 <div className="flex items-center space-x-2"><div className="w-6 h-6 bg-teal-500/20 rounded-lg flex items-center justify-center text-teal-400 font-black text-xs">{selectedTests.length}</div><span className="text-[11px] font-black text-white uppercase tracking-widest">Orden Paciente</span></div>
                 {selectedTests.length > 0 && <button onClick={() => setSelectedTestIds([])} className="text-[8px] font-black text-rose-500/40 hover:text-rose-500 uppercase">Limpiar</button>}
              </div>
              <div className="space-y-2 pr-1">
                 {selectedTests.map(t => (
                   <div key={t.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-2xl animate-in slide-in-from-right-4 transition-all">
                      <div className="min-w-0 flex-1 pr-2"><div className="text-[9px] font-black text-white uppercase truncate">{t.name}</div><div className="text-[8px] text-teal-400 font-mono mt-0.5">${t.price.toFixed(2)}</div></div>
                      <button onClick={() => setSelectedTestIds(prev => prev.filter(id => id !== t.id))} className="w-6 h-6 flex items-center justify-center bg-slate-950 hover:bg-rose-500 text-slate-700 hover:text-white rounded-lg transition-all shadow-xl"><X className="w-3.5 h-3.5" /></button>
                   </div>
                 ))}
                 {selectedTests.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Carrito Vacío</p>
                    </div>
                 )}
              </div>
            </div>

            {/* Doctor Selector Section */}
            <div className="space-y-3">
               <div className="flex items-center justify-between px-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center"><Stethoscope className="w-3 h-3 mr-1.5 text-blue-400" /> Procedencia</span>
               </div>
               <div className="relative">
                  <button
                    onClick={() => setIsDoctorSearchOpen(!isDoctorSearchOpen)}
                    className="w-full bg-slate-950 border border-white/5 p-3 rounded-2xl text-left transition-all hover:border-blue-500/30"
                  >
                    <div className="text-[10px] font-black text-white uppercase truncate">{selectedDoctor.name}</div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">{selectedDoctor.specialty} • {selectedDoctor.licenseNumber}</div>
                  </button>

                  {isDoctorSearchOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2">
                       {MOCK_DOCTORS.map(doc => (
                         <button
                           key={doc.id}
                           onClick={() => { setSelectedDoctorId(doc.id); setIsDoctorSearchOpen(false); }}
                           className="w-full p-3 text-left hover:bg-blue-500 group border-b border-white/5 last:border-0 transition-all"
                         >
                            <div className="text-[10px] font-black text-white group-hover:text-slate-950 uppercase">{doc.name}</div>
                            <div className="text-[8px] text-slate-500 group-hover:text-slate-900 font-bold">{doc.specialty}</div>
                         </button>
                       ))}
                       <button className="w-full p-3 text-left hover:bg-slate-800 transition-all border-t border-white/5">
                          <div className="text-[10px] font-black text-blue-400 uppercase">+ Médico Particular</div>
                       </button>
                    </div>
                  )}
               </div>
            </div>

            <div className="space-y-3 pt-2">
               <button onClick={() => setIsStat(!isStat)} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isStat ? 'bg-rose-500/10 border-rose-500/50 shadow-lg' : 'bg-slate-950 border-white/5'}`}>
                  <div className="flex items-center space-x-3"><Zap className={`w-4 h-4 ${isStat ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${isStat ? 'text-rose-400' : 'text-slate-500'}`}>Urgencia STAT</span></div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${isStat ? 'bg-rose-500' : 'bg-slate-800'}`}><div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${isStat ? 'left-5' : 'left-1'}`}></div></div>
               </button>
               <button onClick={() => setIsFasting(!isFasting)} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isFasting ? 'bg-teal-500/10 border-teal-500/50 shadow-lg' : 'bg-slate-950 border-white/5'}`}>
                  <div className="flex items-center space-x-3"><Clock className={`w-4 h-4 ${isFasting ? 'text-teal-400' : 'text-slate-700'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${isFasting ? 'text-teal-400' : 'text-slate-500'}`}>Paciente Ayunas</span></div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${isFasting ? 'bg-teal-500' : 'bg-slate-800'}`}><div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${isFasting ? 'left-5' : 'left-1'}`}></div></div>
               </button>
            </div>
         </div>

         <div className="pt-6 border-t border-white/10 space-y-6 relative z-10 shrink-0">
            <div className="flex flex-col items-center">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 text-center w-full">Monto Total de Servicio</span>
               <div className="flex items-center justify-center"><span className="text-lg font-black text-teal-500/80 mr-1">$</span><span className="text-5xl font-black text-white tracking-tighter">{totalAmount.toFixed(2)}</span></div>
            </div>
            <button
              onClick={handleCreateOrderSubmit}
              disabled={(!foundPatient && !isRegistering) || selectedTests.length === 0}
              className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-30 disabled:grayscale ${isStat ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white' : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950'}`}
            >
              <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              <span>Confirmar Ingreso</span>
            </button>
         </div>
      </div>
    </div>
  );
};
