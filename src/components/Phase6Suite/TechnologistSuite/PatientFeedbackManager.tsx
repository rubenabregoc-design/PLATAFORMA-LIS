import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  User,
  History,
  X,
  Send,
  Heart
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const PatientFeedbackManager: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const data = await SupabaseService.feedback.getAll();
      setFeedbacks(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleResolve = async () => {
    if (!selectedFeedback) return;
    try {
      await SupabaseService.feedback.resolveFeedback(selectedFeedback.id, resolutionNotes);
      setSelectedFeedback(null);
      setResolutionNotes('');
      fetchFeedback();
    } catch (error) { console.error(error); }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Gestión de Quejas y Sugerencias</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Sistema de atención al usuario y resolución de conflictos conforme a ISO 15189 §8.6. Mejora continua de la experiencia del paciente.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-teal-500/10 border border-teal-500/20 px-6 py-4 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-teal-400 uppercase mb-1">Satisfacción (NPS)</p>
              <h4 className="text-2xl font-black text-white">4.8 / 5.0</h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Bandeja de Entrada de Mensajes</h3>
            <div className="flex gap-2">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input placeholder="Filtrar mensajes..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">F. Reporte</th>
                  <th className="px-6 py-4">Paciente / Orden</th>
                  <th className="px-6 py-4">Tipo / Categoría</th>
                  <th className="px-6 py-4">Asunto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {feedbacks.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-500 font-bold">{new Date(f.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                       <p className="font-black text-slate-800 text-xs uppercase">{f.patients?.first_name} {f.patients?.last_name || 'Anónimo'}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">{f.orders?.order_number || '--'}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase w-fit ${f.type === 'COMPLAINT' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
                             {f.type}
                          </span>
                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{f.category}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-[10px] font-bold text-slate-700 line-clamp-1">{f.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getStatusStyle(f.status)}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button
                         onClick={() => setSelectedFeedback(f)}
                         className="p-2 bg-slate-100 text-slate-500 hover:bg-teal-500 hover:text-white rounded-lg transition-all"
                       >
                         <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
                {feedbacks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">No hay retroalimentación pendiente</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Feedback Resolution Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full h-[70vh] overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <History className="text-teal-400" size={24} />
                    <div>
                       <h3 className="text-lg font-black tracking-tight uppercase">Atención de No Conformidad de Cliente</h3>
                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ID: {selectedFeedback.id.slice(0,8)}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedFeedback(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-6">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mensaje del Paciente</h4>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium italic">"{selectedFeedback.message}"</p>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Acción Tomada / Resolución</label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Describa cómo se resolvió la inquietud del paciente..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[150px]"
                    />
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                 <div className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="text-teal-500" size={18} />
                    <span className="text-[10px] font-black uppercase">Respuesta Certificada ISO 15189</span>
                 </div>
                 <button
                   onClick={handleResolve}
                   disabled={!resolutionNotes}
                   className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                 >
                    <Send size={16} />
                    NOTIFICAR AL PACIENTE
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientFeedbackManager;
