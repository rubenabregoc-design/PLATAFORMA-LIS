import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  History,
  FileText,
  Zap,
  ArrowRight,
  ClipboardCheck,
  Scale,
  Settings,
  MoreVertical,
  ChevronRight,
  Award,
  BookOpen,
  PieChart as PieChartIcon
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const ISOAuditDashboard: React.FC = () => {
  const [clauses, setClauses] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      const [clsData, fndData] = await Promise.all([
        SupabaseService.isoAudit.getClauses(),
        SupabaseService.isoAudit.getAuditFindings()
      ]);
      setClauses(clsData);
      setFindings(fndData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getComplianceRate = () => {
    if (clauses.length === 0) return 0;
    const compliantCount = clauses.filter(c => findings.some(f => f.clause_id === c.id && f.status === 'COMPLIANT')).length;
    return Math.round((compliantCount / clauses.length) * 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Audit Banner */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Auditoría Interna ISO 15189:2022</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Sistema de verificación de cumplimiento normativo. Mapeo automático de los 42 módulos de PLATAFORMA-LIS contra los requisitos de acreditación.
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-teal-500/10 border border-teal-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Compliance Rate</p>
              <h4 className="text-3xl font-black text-white">{getComplianceRate()}%</h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ISO Clauses Checklist */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-lg font-black text-slate-800">Estatus de Requisitos (Mapeo de Evidencia)</h3>
                 <button className="p-2 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-slate-900 transition-all"><Settings size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                 {clauses.map(cls => {
                    const finding = findings.find(f => f.clause_id === cls.id);
                    return (
                       <div key={cls.id} className="p-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 flex items-center justify-between group hover:bg-white hover:border-teal-400 hover:shadow-xl transition-all">
                          <div className="flex items-center gap-5">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm ${
                                finding?.status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                             }`}>
                                {cls.clause_number}
                             </div>
                             <div>
                                <p className="font-black text-slate-800 text-sm uppercase">{cls.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{cls.category}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             {finding ? (
                                <div className="text-right">
                                   <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                      finding.status === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                   }`}>
                                      {finding.status}
                                   </span>
                                   <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase italic">Evidencia: Módulo {finding.related_module_id}</p>
                                </div>
                             ) : (
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Pendiente Eval</span>
                             )}
                             <div className="h-10 w-px bg-slate-100 mx-2"></div>
                             <button className="p-2 text-slate-300 hover:text-teal-600 transition-colors"><ChevronRight size={20} /></button>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* Audit Intelligence Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <ClipboardCheck className="text-blue-500" size={18} />
                 Resumen Operativo
              </h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase">
                       <span className="text-slate-500">Puntos Críticos</span>
                       <span className="text-slate-900">8 / 10</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-teal-500 w-[80%]"></div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase">
                       <span className="text-slate-500">Hallazgos Técnicos</span>
                       <span className="text-slate-900">2 / 10</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-400 w-[20%]"></div>
                    </div>
                 </div>
              </div>

              <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                 <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <Award size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Listo para Acreditación</span>
                 </div>
                 <p className="text-[10px] text-emerald-900 leading-relaxed font-medium text-justify">
                    "El laboratorio ha alcanzado el 80% de cumplimiento en requisitos críticos de la norma 2022. Se recomienda cerrar las no conformidades del Módulo 20 para auditoría externa."
                 </p>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <BookOpen className="text-teal-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Reporte de Auditoría</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium">
                 Genere el informe final de auditoría interna cruzando los 42 módulos para presentar ante el Consejo Técnico de Salud.
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">Descargar Informe Auditoría</button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ISOAuditDashboard;
