import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Settings,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus,
  User,
  History,
  Cpu
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const AnalyzerMaintenanceManager: React.FC = () => {
  const [analyzers, setAnalyzers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [anzData, schData, logData] = await Promise.all([
        SupabaseService.analyzers.getAll(),
        SupabaseService.maintenance.getSchedules(),
        SupabaseService.maintenance.getLogs()
      ]);
      setAnalyzers(anzData);
      setSchedules(schData);
      setLogs(logData);
    } catch (error) {
      console.error("Error fetching maintenance data", error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalyzerLogs = (id: string) => logs.filter(l => l.analyzer_id === id);
  const getAnalyzerSchedules = (id: string) => schedules.filter(s => s.analyzer_id === id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Wrench size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Ingeniería y Mantenimiento</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Preventive Maintenance & Service History</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
          <Plus size={18} />
          REGISTRAR SERVICIO TÉCNICO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Analyzer List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] px-2">Instrumentos Activos</h3>
          {analyzers.map((analyzer) => (
            <button
              key={analyzer.id}
              onClick={() => setSelectedAnalyzerId(analyzer.id)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                selectedAnalyzerId === analyzer.id
                  ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${selectedAnalyzerId === analyzer.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                  <Cpu size={16} />
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  analyzer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {analyzer.status}
                </span>
              </div>
              <div>
                <p className={`font-black text-sm ${selectedAnalyzerId === analyzer.id ? 'text-white' : 'text-slate-800'}`}>{analyzer.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{analyzer.model}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {selectedAnalyzerId ? (
            <>
              {/* Overdue Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle size={20} />
                    <span className="font-black text-xs uppercase">Tareas Vencidas</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-800">
                    {getAnalyzerSchedules(selectedAnalyzerId).filter(s => new Date(s.next_due_at) < new Date()).length}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-bold mt-1">Acción correctiva inmediata requerida.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <History size={20} />
                    <span className="font-black text-xs uppercase">Último Mantenimiento Anual</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-800">
                    {analyzers.find(a => a.id === selectedAnalyzerId)?.last_maintenance ?
                      new Date(analyzers.find(a => a.id === selectedAnalyzerId).last_maintenance).toLocaleDateString() : 'Pendiente'}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-bold mt-1">Certificación de fábrica vigente.</p>
                </div>
              </div>

              {/* Maintenance Schedule Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h4 className="font-black text-slate-800 flex items-center gap-2">
                    <Calendar size={18} className="text-amber-500" />
                    Programa de Mantenimiento Preventivo (PM)
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4">Frecuencia</th>
                        <th className="px-6 py-4">Tarea / Descripción</th>
                        <th className="px-6 py-4">Próximo Vencimiento</th>
                        <th className="px-6 py-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {getAnalyzerSchedules(selectedAnalyzerId).map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wider">
                              {s.frequency}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-800">{s.task_name}</p>
                            <p className="text-[10px] text-slate-400">{s.description}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-600">
                              <Clock size={14} className={new Date(s.next_due_at) < new Date() ? 'text-red-500' : 'text-slate-400'} />
                              {new Date(s.next_due_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-amber-600 hover:text-amber-700 text-xs font-black uppercase tracking-widest hover:underline">
                              Ejecutar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Logs / Service History */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h4 className="font-black text-slate-800 flex items-center gap-2">
                    <History size={18} className="text-blue-500" />
                    Bitácora de Servicios y Calibraciones Recientes
                  </h4>
                </div>
                <div className="p-6 space-y-4">
                  {getAnalyzerLogs(selectedAnalyzerId).map((log) => (
                    <div key={log.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all">
                      <div className={`p-2 rounded-xl h-fit ${log.status === 'COMPLETADO' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {log.status === 'COMPLETADO' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-black text-slate-800 text-sm">{log.task_name}</h5>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{log.notes}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                            <User size={12} /> {log.performed_by || 'Sistema'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase">
                            <Settings size={12} /> {log.parameter_value || '--'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getAnalyzerLogs(selectedAnalyzerId).length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-slate-400 text-xs font-bold uppercase">No hay registros históricos para este instrumento.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="p-6 bg-white rounded-full shadow-sm mb-6">
                <Wrench className="text-slate-200 w-12 h-12" />
              </div>
              <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Seleccione un analizador para ver su hoja de vida técnica</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzerMaintenanceManager;
