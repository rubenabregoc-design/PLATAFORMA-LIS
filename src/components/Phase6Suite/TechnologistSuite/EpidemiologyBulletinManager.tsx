import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  FileText,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  History,
  Zap,
  Globe,
  Download,
  Filter,
  Microscope,
  Info,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const EpidemiologyBulletinManager: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveTab] = useState<'surveillance' | 'reports'>('surveillance');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [caseData, reportData] = await Promise.all([
        SupabaseService.epidemiology.getSurveillanceCases(),
        SupabaseService.epidemiology.getReports()
      ]);
      setCases(caseData);
      setReports(reportData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ACKNOWLEDGED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Epidemiology Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="text-rose-500" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Vigilancia Epidemiológica & Notificación MINSA</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Detección automática de enfermedades de notificación obligatoria y generación de boletines para el Departamento de Epidemiología del MINSA.
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
           <button
             onClick={() => setActiveTab('surveillance')}
             className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${activeView === 'surveillance' ? 'bg-teal-500 text-slate-950' : 'bg-white/5 text-slate-400 border border-white/10'}`}
           >
              Casos Detectados
           </button>
           <button
             onClick={() => setActiveTab('reports')}
             className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${activeView === 'reports' ? 'bg-teal-500 text-slate-950' : 'bg-white/5 text-slate-400 border border-white/10'}`}
           >
              Boletines Enviados
           </button>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
           {activeView === 'surveillance' ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-800">Alertas de Notificación Obligatoria</h3>
                    <div className="flex gap-2">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input placeholder="Buscar enfermedad o paciente..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
                       </div>
                    </div>
                 </div>

                 <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                             <th className="px-6 py-4">F. Detección</th>
                             <th className="px-6 py-4">Paciente</th>
                             <th className="px-6 py-4">Enfermedad / Marcador</th>
                             <th className="px-6 py-4">Resultado</th>
                             <th className="px-6 py-4">Procedencia</th>
                             <th className="px-6 py-4 text-right">Acción</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {cases.map(item => (
                             <tr key={item.result_id} className="hover:bg-rose-50/30 transition-colors group">
                                <td className="px-6 py-4 text-[10px] font-mono text-slate-500 font-bold">{new Date(item.detection_date).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                   <p className="font-black text-slate-800 text-xs uppercase">{item.first_name} {item.last_name}</p>
                                   <p className="text-[9px] text-slate-400 font-bold">{item.document_id}</p>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase">{item.disease_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="text-[10px] font-black text-slate-700">{item.result_value}</span>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.provenance_province}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <button className="p-2 bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all">
                                      <Send size={16} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {cases.length === 0 && (
                             <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">No se han detectado nuevos casos de notificación obligatoria</td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           ) : (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Historial de Boletines Epidemiológicos</h3>
                    <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/10">Generar Nuevo Boletín</button>
                 </div>
                 <div className="p-6 space-y-4">
                    {reports.map(rep => (
                       <div key={rep.id} className="flex items-center justify-between p-5 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all group">
                          <div className="flex items-center gap-5">
                             <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-teal-500 transition-colors">
                                <FileText size={24} />
                             </div>
                             <div>
                                <p className="font-black text-slate-800 text-sm uppercase">{rep.report_number}</p>
                                <div className="flex items-center gap-3 mt-1">
                                   <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(rep.report_date).toLocaleDateString()}</span>
                                   <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                   <span className="text-[10px] font-black text-teal-600 uppercase">{rep.total_cases} CASOS REPORTADOS</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusColor(rep.status)}`}>{rep.status}</span>
                             <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Download size={20} /></button>
                          </div>
                       </div>
                    ))}
                    {reports.length === 0 && (
                       <div className="py-20 text-center text-slate-300 font-black uppercase text-xs">No se han generado boletines aún</div>
                    )}
                 </div>
              </div>
           )}
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Zap className="text-yellow-400" size={18} />
                 Protocolo MINSA
              </h3>
              <div className="space-y-4">
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-800 uppercase mb-1">Ley de Vigilancia</p>
                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed italic text-justify">
                       "De acuerdo al Decreto Ejecutivo 1617, todo laboratorio clínico debe reportar hallazgos de VIH, Sífilis y Dengue en un plazo no mayor a 24 horas."
                    </p>
                 </div>
                 <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                    <Globe className="text-teal-400 mb-4" size={32} />
                    <h4 className="font-black text-sm uppercase tracking-widest">Enlace Digital</h4>
                    <p className="text-slate-400 text-[10px] mt-3 leading-relaxed">
                       Sincronización directa vía HL7/XML con la plataforma SISVIG del Ministerio de Salud.
                    </p>
                 </div>
              </div>

              <div className="mt-auto pt-8 border-t border-slate-50">
                 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <p className="text-[9px] font-black text-emerald-800 uppercase">Compliance OK</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EpidemiologyBulletinManager;
