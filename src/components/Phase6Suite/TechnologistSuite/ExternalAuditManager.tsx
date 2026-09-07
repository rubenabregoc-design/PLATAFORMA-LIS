import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Search,
  Plus,
  Calendar,
  History,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Zap,
  ArrowRight,
  Download,
  Award,
  Globe,
  MoreVertical,
  ChevronRight,
  Info
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const ExternalAuditManager: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [findings, setFindings] = useState<any[]>([]);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const data = await SupabaseService.externalAudit.getAudits();
      setAudits(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedAudit) fetchFindings();
  }, [selectedAudit]);

  const fetchFindings = async () => {
    try {
      const data = await SupabaseService.externalAudit.getFindings(selectedAudit.id);
      setFindings(data);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Gestión de Auditorías Externas</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Preparación y seguimiento para entes acreditadores internacionales y regulatorios (ISO, Gorgas, MINSA). Cumplimiento de ISO 15189 §8.8.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Programar Auditoría
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Audit Registry List */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Historial de Inspecciones</h3>
           {audits.map(audit => (
              <div
                key={audit.id}
                onClick={() => setSelectedAudit(audit)}
                className={`p-6 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between group ${
                  selectedAudit?.id === audit.id ? 'bg-slate-900 border-teal-500 shadow-xl' : 'bg-white border-slate-200 hover:border-teal-400'
                }`}
              >
                 <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl shadow-sm ${selectedAudit?.id === audit.id ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-50 text-slate-400'}`}>
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <p className={`font-black text-sm uppercase tracking-tight ${selectedAudit?.id === audit.id ? 'text-white' : 'text-slate-800'}`}>{audit.entity_name}</p>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(audit.start_date).toLocaleDateString()}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] font-black text-teal-600 uppercase">{audit.audit_type}</span>
                       </div>
                    </div>
                 </div>
                 <ChevronRight size={20} className={selectedAudit?.id === audit.id ? 'text-teal-400' : 'text-slate-300'} />
              </div>
           ))}
        </div>

        {/* Audit Detail / Findings Sidebar */}
        <div className="lg:col-span-2 space-y-6">
           {selectedAudit ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full animate-in slide-in-from-right-4">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hallazgos de Inspección</h3>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Entidad: {selectedAudit.entity_name}</p>
                    </div>
                    <button className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-100"><Download size={20} /></button>
                 </div>

                 <div className="space-y-4 flex-1">
                    {findings.map(finding => (
                       <div key={finding.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-200 transition-all group">
                          <div className="flex justify-between items-start mb-3">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                finding.severity === 'MAJOR' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                             }`}>
                                {finding.severity}
                             </span>
                             <span className="text-[10px] font-mono font-bold text-slate-400">Cláusula: {finding.clause_reference}</span>
                          </div>
                          <p className="text-xs text-slate-800 font-bold leading-relaxed">{finding.description}</p>
                          <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${finding.status === 'CLOSED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                <span className="text-[9px] font-black text-slate-500 uppercase">{finding.status === 'CLOSED' ? 'CORREGIDO' : 'PENDIENTE'}</span>
                             </div>
                             <button className="text-[9px] font-black text-teal-600 uppercase hover:underline">Ver Plan de Acción</button>
                          </div>
                       </div>
                    ))}
                    {findings.length === 0 && (
                       <div className="py-20 text-center opacity-40">
                          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                          <h4 className="font-black text-slate-800 text-sm uppercase">Cero No Conformidades</h4>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">Excelente desempeño institucional</p>
                       </div>
                    )}
                 </div>

                 <div className="mt-auto pt-8 border-t border-slate-50">
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
                       <div>
                          <h5 className="text-sm font-black uppercase">Resultado Global</h5>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{selectedAudit.result_summary || 'Evaluación en curso'}</p>
                       </div>
                       <Award size={32} className="text-teal-400" />
                    </div>
                 </div>
              </div>
           ) : (
              <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                 <ClipboardCheck size={64} className="text-slate-200 mb-6" />
                 <h4 className="font-black text-slate-400 uppercase tracking-widest">Seleccione una Auditoría</h4>
                 <p className="text-[10px] text-slate-300 font-medium mt-2 max-w-xs">Consulte el detalle de los hallazgos y el estatus de las acciones correctivas exigidas por el ente externo.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ExternalAuditManager;
