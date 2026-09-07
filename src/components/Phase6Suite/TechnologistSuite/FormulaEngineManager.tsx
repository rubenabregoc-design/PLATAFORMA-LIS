import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Search,
  Plus,
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  History,
  Settings,
  FileCode,
  ArrowRight,
  ShieldCheck,
  FlaskConical,
  Database
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const FormulaEngineManager: React.FC = () => {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    try {
      const data = await SupabaseService.formulas.getFormulas();
      setFormulas(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Motor de Cálculos Automáticos</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Gestión de resultados derivados y fórmulas analíticas. Automatización de índices, depuraciones y perfiles lipídicos.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Nueva Fórmula
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Active Formulas List */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Catálogo de Fórmulas Analíticas</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input placeholder="Buscar por código..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[600px]">
             {formulas.map(formula => (
                <div key={formula.id} className="p-5 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-teal-400 hover:shadow-xl transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:text-teal-500 transition-colors">
                         <FileCode size={24} />
                      </div>
                      <span className="bg-slate-900 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">{formula.target_test_code}</span>
                   </div>
                   <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-1">{formula.formula_name}</h4>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-4 line-clamp-2 italic">"{formula.expression}"</p>

                   <div className="flex flex-wrap gap-1 mb-4">
                      {formula.required_variables.map((v: string) => (
                         <span key={v} className="bg-teal-50 text-teal-600 px-2 py-0.5 rounded text-[8px] font-black">{v}</span>
                      ))}
                   </div>

                   <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <div className={`w-2 h-2 rounded-full ${formula.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <button className="text-teal-600 hover:text-teal-700 transition-colors"><Settings size={18} /></button>
                   </div>
                </div>
             ))}
             {formulas.length === 0 && (
                <div className="col-span-2 py-20 text-center opacity-30 italic">No hay fórmulas configuradas en este tenant.</div>
             )}
          </div>
        </div>

        {/* Sidebar Intel */}
        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Ejecución en Tiempo Real</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium text-justify">
                 "El motor de cálculo monitorea cada validación analítica. Si los pre-requisitos se cumplen, el resultado derivado se inyecta automáticamente en la orden del paciente."
              </p>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <History className="text-blue-500" size={16} />
                 Logs de Cálculo
              </h3>
              <div className="space-y-3 opacity-50 grayscale pointer-events-none">
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-800">LDL_CALC</span>
                    <span className="text-[8px] font-bold text-emerald-600">SUCCESS</span>
                 </div>
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-800">TFG_EPI</span>
                    <span className="text-[8px] font-bold text-emerald-600">SUCCESS</span>
                 </div>
              </div>
           </div>

           <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <ShieldCheck className="text-emerald-500" size={24} />
              <p className="text-[9px] font-black text-emerald-800 uppercase">Validación Matemática OK</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FormulaEngineManager;
