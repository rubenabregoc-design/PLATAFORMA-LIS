import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  ChevronRight,
  TrendingUp,
  Target,
  Briefcase,
  Zap,
  ArrowRight,
  MoreVertical,
  Clock,
  DollarSign
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog (Ideas)', color: 'bg-slate-100 text-slate-500' },
  { id: 'DISCOVERY', label: 'Análisis / Diseño', color: 'bg-blue-100 text-blue-600' },
  { id: 'IN_PROGRESS', label: 'En Ejecución', color: 'bg-amber-100 text-amber-700' },
  { id: 'VALIDATING', label: 'Validación Lote', color: 'bg-purple-100 text-purple-600' },
  { id: 'DONE', label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700' }
];

const OpportunitiesBoard: React.FC = () => {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpps();
  }, []);

  const fetchOpps = async () => {
    try {
      const data = await SupabaseService.opportunities.getOpportunities();
      setOpps(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const moveOpp = async (id: string, newCol: string) => {
    try {
      await SupabaseService.opportunities.moveOpportunity(id, newCol);
      fetchOpps();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Tablero de Oportunidades y Mejora</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Estrategia de crecimiento: Leads comerciales, optimización de TAT y nuevos proyectos de laboratorio.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Nueva Oportunidad
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-thin">
        {COLUMNS.map(col => (
          <div key={col.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-[10px] font-black text-slate-400">{opps.filter(o => o.kanban_column === col.id).length}</span>
              </div>
              <MoreVertical size={16} className="text-slate-300" />
            </div>

            <div className="flex-1 space-y-4">
              {opps.filter(o => o.kanban_column === col.id).map(opp => (
                <div
                  key={opp.id}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-lg">
                      {opp.opportunity_type?.replace('_', ' ')}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${opp.priority === 1 ? 'bg-red-500' : opp.priority === 2 ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                  </div>

                  <h4 className="font-black text-slate-800 text-sm mb-2 group-hover:text-teal-600 transition-colors uppercase tracking-tight">{opp.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed line-clamp-3 mb-4 italic">"{opp.description}"</p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs">
                       <DollarSign size={14} />
                       {opp.estimated_value ? parseFloat(opp.estimated_value).toLocaleString() : '--'}
                    </div>
                    <div className="flex gap-1">
                      {COLUMNS.findIndex(c => c.id === col.id) < COLUMNS.length - 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveOpp(opp.id, COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1].id); }}
                          className="p-2 bg-slate-50 text-slate-400 hover:bg-teal-500 hover:text-white rounded-xl transition-all"
                        >
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {opps.filter(o => o.kanban_column === col.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-100 rounded-[2rem] flex items-center justify-center">
                   <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Vacío</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpportunitiesBoard;
