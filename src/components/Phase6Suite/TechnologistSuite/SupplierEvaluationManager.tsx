import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Star,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  History,
  Truck,
  ShieldCheck,
  Award,
  TrendingUp,
  FileText,
  X,
  User,
  Settings,
  MoreVertical
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const SupplierEvaluationManager: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [supData, evalData] = await Promise.all([
        SupabaseService.suppliers.getAll(),
        SupabaseService.suppliers.getEvaluations()
      ]);
      setSuppliers(supData);
      setEvaluations(evalData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CERTIFIED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Gestión & Evaluación de Proveedores</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Sistema de calificación y auditoría de proveedores externos conforme a ISO 15189 §5.3. Control de calidad en suministros.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Nuevo Proveedor
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Statistics Row */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Briefcase size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Proveedores</p>
                 <h3 className="text-2xl font-black text-slate-800">{suppliers.length}</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Certificados</p>
                 <h3 className="text-2xl font-black text-emerald-600">{suppliers.filter(s => s.certification_status === 'CERTIFIED').length}</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Star size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Rating Global</p>
                 <h3 className="text-2xl font-black text-amber-600">4.2 / 5.0</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Audit Pendiente</p>
                 <h3 className="text-2xl font-black text-rose-600">2</h3>
              </div>
           </div>
        </div>

        {/* Supplier List */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Directorio de Suministradores</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input placeholder="Buscar proveedor..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Empresa / RUC</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Score Desempeño</th>
                  <th className="px-6 py-4">Estatus Cert</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                       <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{sup.name}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">{sup.ruc || 'Sin RUC'}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{sup.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${sup.evaluation_score >= 80 ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'}`}>
                             {sup.evaluation_score || '--'}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusStyle(sup.certification_status)}`}>
                        {sup.certification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button
                         onClick={() => setSelectedSupplier(sup)}
                         className="p-2 bg-slate-100 text-slate-500 hover:bg-teal-500 hover:text-white rounded-lg transition-all"
                       >
                         <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Award className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest text-white">Evaluación Anual ISO</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium text-justify">
                 "El laboratorio debe evaluar anualmente el desempeño de sus proveedores basándose en la calidad del producto, tiempo de entrega y soporte técnico."
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Criterios de Evaluación</button>
           </div>

           <div className="p-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <History className="text-blue-500" size={16} />
                 Últimas Evaluaciones
              </h3>
              <div className="space-y-4">
                 {evaluations.slice(0, 3).map(ev => (
                    <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] font-black text-slate-800 uppercase">{ev.supplier_id.slice(0,8)}</p>
                          <span className="text-[9px] font-black text-teal-600">{ev.final_score}%</span>
                       </div>
                       <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(ev.evaluation_date).toLocaleDateString()}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

      {/* Supplier Detail / Eval Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="text-teal-400" size={24} />
                    <div>
                       <h3 className="text-lg font-black tracking-tight uppercase">Expediente de Proveedor Certificado</h3>
                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{selectedSupplier.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Información Fiscal</h4>
                       <div className="space-y-3">
                          <p className="text-xs font-black">RUC: <span className="text-slate-500">{selectedSupplier.ruc}</span></p>
                          <p className="text-xs font-black">CAT: <span className="text-slate-500">{selectedSupplier.category}</span></p>
                          <p className="text-xs font-black">TEL: <span className="text-slate-500">{selectedSupplier.phone || '--'}</span></p>
                       </div>
                    </div>
                    <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100">
                       <p className="text-[10px] font-black text-teal-800 uppercase mb-2">Puntuación Histórica</p>
                       <h3 className="text-4xl font-black text-teal-600">{selectedSupplier.evaluation_score}%</h3>
                       <p className="text-[9px] text-teal-500 font-bold mt-2">Nivel de Confianza: Élite</p>
                    </div>
                 </div>

                 <div className="md:col-span-2 space-y-6">
                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                       <History size={18} className="text-blue-500" />
                       Historial de Auditorías de Desempeño
                    </h4>
                    <div className="space-y-4">
                       {evaluations.filter(e => e.supplier_id === selectedSupplier.id).map(ev => (
                          <div key={ev.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-xl shadow-sm"><FileText size={20} className="text-slate-400" /></div>
                                <div>
                                   <p className="text-xs font-black text-slate-800">Evaluación de Periodo</p>
                                   <p className="text-[10px] text-slate-400 font-bold">{new Date(ev.evaluation_date).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="text-sm font-black text-slate-900">{ev.final_score}%</span>
                                <div className="flex gap-0.5 mt-1">
                                   {Array.from({length: 5}).map((_, i) => (
                                      <Star key={i} size={10} fill={i < (ev.final_score/20) ? '#f59e0b' : 'none'} className={i < (ev.final_score/20) ? 'text-amber-500' : 'text-slate-200'} />
                                   ))}
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                 <button className="text-rose-500 font-black text-[10px] uppercase tracking-widest hover:underline">Revocar Certificación</button>
                 <div className="flex gap-3">
                    <button className="bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all">Ver Contratos</button>
                    <button className="bg-teal-500 text-slate-950 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-teal-400 transition-all">Nueva Evaluación</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplierEvaluationManager;
