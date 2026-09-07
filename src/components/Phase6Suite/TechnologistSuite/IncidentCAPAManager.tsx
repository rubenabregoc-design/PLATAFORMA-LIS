import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Plus,
  ChevronRight,
  History,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock,
  FileText,
  User,
  X
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const IncidentCAPAManager: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await SupabaseService.incidents.getIncidents();
      setIncidents(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500 text-white';
      case 'HIGH': return 'bg-amber-500 text-white';
      case 'MEDIUM': return 'bg-blue-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-rose-500" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Gestión de No Conformidades & CAPA</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Sistema de reporte de incidentes y acciones correctivas/preventivas bajo la norma ISO 15189 §8.7.
            </p>
          </div>
          <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-rose-500/20">
            <Plus size={18} />
            REPORTAR INCIDENTE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Bitácora de Incidentes de Calidad</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input placeholder="Buscar no conformidad..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">ID / Título</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Severidad</th>
                  <th className="px-6 py-4">F. Reporte</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-slate-800 text-xs uppercase">{inc.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate max-w-[250px]">{inc.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wider">{inc.category?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getSeverityStyle(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-500 font-bold">{new Date(inc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                        inc.status === 'CLOSED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">No se han registrado incidentes en este ciclo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
             <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <ShieldAlert className="text-rose-500" size={24} />
                   <div>
                      <h3 className="text-lg font-black tracking-tight uppercase">Análisis de Causa Raíz (RCA)</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{selectedIncident.title}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedIncident(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
             </div>

             <div className="p-8 flex-1 overflow-y-auto space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Descripción del Hallazgo</h4>
                   <p className="text-sm text-slate-800 leading-relaxed font-medium italic">"{selectedIncident.description}"</p>
                </div>

                <div className="space-y-4">
                   <div className="p-5 border-l-4 border-l-rose-500 bg-rose-50/50 rounded-r-2xl space-y-2">
                      <h5 className="text-[10px] font-black text-rose-700 uppercase">I. Causa Raíz Identificada</h5>
                      <p className="text-xs text-slate-600 font-medium">{selectedIncident.root_cause || 'Investigación en curso...'}</p>
                   </div>

                   <div className="p-5 border-l-4 border-l-blue-500 bg-blue-50/50 rounded-r-2xl space-y-2">
                      <h5 className="text-[10px] font-black text-blue-700 uppercase">II. Acción Correctiva Inmediata</h5>
                      <p className="text-xs text-slate-600 font-medium">{selectedIncident.corrective_action || 'Pendiente de definir...'}</p>
                   </div>

                   <div className="p-5 border-l-4 border-l-teal-500 bg-teal-50/50 rounded-r-2xl space-y-2">
                      <h5 className="text-[10px] font-black text-teal-700 uppercase">III. Plan de Acción Preventiva (PA)</h5>
                      <p className="text-xs text-slate-600 font-medium">{selectedIncident.preventive_action || 'Pendiente de definir...'}</p>
                   </div>
                </div>
             </div>

             <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400">
                   <CheckCircle2 size={18} />
                   <span className="text-[10px] font-black uppercase">Firma de Aseguramiento de Calidad OK</span>
                </div>
                <button className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">
                   CERRAR CASO
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentCAPAManager;
