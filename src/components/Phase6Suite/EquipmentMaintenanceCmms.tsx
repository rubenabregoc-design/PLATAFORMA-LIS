import React, { useState } from 'react';
import {
  Wrench,
  Settings,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Plus,
  RotateCw,
  Search,
  Filter,
  Activity,
  Zap,
  ShieldAlert,
  FileCheck2,
  Sparkles,
  Server,
  PenTool,
  Check
} from 'lucide-react';

export interface MaintenanceLog {
  id: string;
  analyzerId: string;
  analyzerName: string;
  serialNumber: string;
  location: string;
  maintenanceType: 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'CALIBRACION' | 'CORRECTIVO';
  componentTarget: string; // e.g. "Lámpara Halógena 12V", "Electrodos Na/K/Cl", "Aguja de Aspiración"
  performedBy: string;
  executionDate: string;
  nextDueDate: string;
  status: 'COMPLETADO' | 'PENDIENTE' | 'REQUERIDO_URGENTE';
  notes: string;
}

const INITIAL_LOGS: MaintenanceLog[] = [
  {
    id: 'cmms-01',
    analyzerId: 'anz-01',
    analyzerName: 'Vitros 4600 Bioquímica',
    serialNumber: 'SN-VIT-9912',
    location: 'Sede Vía España',
    maintenanceType: 'CALIBRACION',
    componentTarget: 'Módulo Fotométrico MicroSlide & ISE (Na/K/Cl)',
    performedBy: 'Ing. Alejandro Solís (Ortho Service)',
    executionDate: '2026-08-10',
    nextDueDate: '2026-09-10',
    status: 'COMPLETADO',
    notes: 'Calibración con calibradores Lote #V9812. Slope y Span dentro de especificación del fabricante.'
  },
  {
    id: 'cmms-02',
    analyzerId: 'anz-02',
    analyzerName: 'Sysmex XN-1000 Hematología',
    serialNumber: 'SN-SYS-4011',
    location: 'Sede Vía España',
    maintenanceType: 'DIARIO',
    componentTarget: 'Limpieza Auto-Rinse Cellclean & Depósito de Lisado',
    performedBy: 'Lic. Sofía Guardia',
    executionDate: '2026-08-12',
    nextDueDate: '2026-08-13',
    status: 'COMPLETADO',
    notes: 'Lavado automático ejecutado con Cellclean. Fondo de recuento en blanco < 0.1 x10^3/µL.'
  },
  {
    id: 'cmms-03',
    analyzerId: 'anz-03',
    analyzerName: 'Mindray CL-1200i Inmunoensayo',
    serialNumber: 'SN-MND-8820',
    location: 'Sede Chiriquí (David)',
    maintenanceType: 'MENSUAL',
    componentTarget: 'Lámpara Fotométrica UV & Filtro Óptico 450nm',
    performedBy: 'Lic. Manuel Rodríguez',
    executionDate: '2026-07-15',
    nextDueDate: '2026-08-15',
    status: 'PENDIENTE',
    notes: 'Lectura de intensidad de lámpara al 82%. Programado reemplazo antes del 15 de agosto.'
  },
  {
    id: 'cmms-04',
    analyzerId: 'anz-04',
    analyzerName: 'ACL TOP 300 Coagulación',
    serialNumber: 'SN-ACL-1092',
    location: 'Sede Vía España',
    maintenanceType: 'CORRECTIVO',
    componentTarget: 'Sonda de Aspiración de Plasma & Sensor de Nivel',
    performedBy: 'Ing. Fernando Varela',
    executionDate: '2026-08-05',
    nextDueDate: '2026-11-05',
    status: 'COMPLETADO',
    notes: 'Reemplazo de junta O-ring y desobstrucción de sonda con solución de lavado concentrado.'
  }
];

export const EquipmentMaintenanceCmms: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceLog[]>(INITIAL_LOGS);
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Log Form Fields
  const [formAnalyzerName, setFormAnalyzerName] = useState<string>('Vitros 4600 Bioquímica');
  const [formType, setFormType] = useState<'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'CALIBRACION' | 'CORRECTIVO'>('MENSUAL');
  const [formComponent, setFormComponent] = useState<string>('Lámpara Fotométrica UV');
  const [formPerformer, setFormPerformer] = useState<string>('Lic. Sofía Guardia');
  const [formDueDate, setFormDueDate] = useState<string>('2026-09-12');
  const [formNotes, setFormNotes] = useState<string>('Mantenimiento preventivo periódico y lubricación de guías.');

  const filteredLogs = logs.filter(l => {
    if (selectedType !== 'TODOS' && l.maintenanceType !== selectedType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return l.analyzerName.toLowerCase().includes(term) || l.componentTarget.toLowerCase().includes(term);
    }
    return true;
  });

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: MaintenanceLog = {
      id: `cmms-${Date.now()}`,
      analyzerId: 'anz-custom',
      analyzerName: formAnalyzerName,
      serialNumber: 'SN-CUSTOM-2026',
      location: 'Sede Vía España',
      maintenanceType: formType,
      componentTarget: formComponent,
      performedBy: formPerformer,
      executionDate: new Date().toISOString().split('T')[0],
      nextDueDate: formDueDate,
      status: 'COMPLETADO',
      notes: formNotes
    };

    setLogs(prev => [newLog, ...prev]);
    setIsModalOpen(false);
    alert('¡Registro de Mantenimiento Preventivo / Calibración guardado en la Bitácora CMMS!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Gestión de Mantenimiento y Calibraciones (CMMS) • ISO 15189 Cláusula 6.4</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Mantenimiento Preventivo & Calibraciones de Analizadores
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Programación automatizada de intervenciones técnicas, cambio de lámparas, electrodos ISE, calibraciones con trazabilidad NIST y hoja de vida de equipos LIS.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Mantenimiento / Calibración</span>
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analizadores en Red</div>
            <div className="text-2xl font-black font-mono text-white">12 Equipos</div>
            <div className="text-[10px] text-teal-400 font-bold">100% Operativos</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mantenimientos al Día</div>
            <div className="text-2xl font-black font-mono text-emerald-400">11 / 12</div>
            <div className="text-[10px] text-emerald-400 font-bold">Cumplimiento 91.6%</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Próximas Calibraciones</div>
            <div className="text-2xl font-black font-mono text-amber-400">2 Programadas</div>
            <div className="text-[10px] text-amber-400 font-bold">En los próximos 7 días</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Órdenes de Servicio</div>
            <div className="text-2xl font-black font-mono text-indigo-300">3 Activas</div>
            <div className="text-[10px] text-indigo-400 font-bold">Proveedor Técnico Exclusivo</div>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-400" />
            <span>Hoja de Vida de Mantenimiento de Analizadores</span>
          </h3>

          <div className="flex items-center space-x-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="DIARIO">Mantenimiento Diario</option>
              <option value="SEMANAL">Mantenimiento Semanal</option>
              <option value="MENSUAL">Mantenimiento Mensual</option>
              <option value="CALIBRACION">Calibración Técnica</option>
              <option value="CORRECTIVO">Mantenimiento Correctivo</option>
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar analizador o componente..."
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Analizador / Serie</th>
                <th className="p-3">Ubicación / Sede</th>
                <th className="p-3">Intervención / Componente</th>
                <th className="p-3">Ejecutado Por</th>
                <th className="p-3 text-center">Última Fecha</th>
                <th className="p-3 text-center">Próxima Fecha</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3">
                    <div className="font-bold text-white flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-teal-400" />
                      <span>{log.analyzerName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.serialNumber}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-300">
                    {log.location}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-teal-300">{log.componentTarget}</span>
                    <div className="text-[10px] text-slate-400 italic">{log.notes}</div>
                  </td>
                  <td className="p-3 font-bold text-slate-200">
                    {log.performedBy}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-300">
                    {log.executionDate}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-amber-300">
                    {log.nextDueDate}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      log.status === 'COMPLETADO'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for New CMMS Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-teal-400" />
                <span>Registrar Intervención en CMMS</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Analizador:</label>
                <select
                  value={formAnalyzerName}
                  onChange={(e) => setFormAnalyzerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="Vitros 4600 Bioquímica">Vitros 4600 Bioquímica</option>
                  <option value="Sysmex XN-1000 Hematología">Sysmex XN-1000 Hematología</option>
                  <option value="Mindray CL-1200i Inmunoensayo">Mindray CL-1200i Inmunoensayo</option>
                  <option value="ACL TOP 300 Coagulación">ACL TOP 300 Coagulación</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Tipo de Intervención:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="DIARIO">Mantenimiento Diario</option>
                    <option value="SEMANAL">Mantenimiento Semanal</option>
                    <option value="MENSUAL">Mantenimiento Mensual</option>
                    <option value="CALIBRACION">Calibración Técnica</option>
                    <option value="CORRECTIVO">Mantenimiento Correctivo</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Próximo Vencimiento:</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Componente / Módulo Intervenido:</label>
                <input
                  type="text"
                  value={formComponent}
                  onChange={(e) => setFormComponent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Técnico / Especialista Responsable:</label>
                <input
                  type="text"
                  value={formPerformer}
                  onChange={(e) => setFormPerformer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Observaciones / Lote de Calibrador Usado:</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black">Guardar Registro CMMS</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
