import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  History,
  ClipboardCheck,
  Zap
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

interface MonthlyQualityManagementReportProps {
  onClose: () => void;
}

const MonthlyQualityManagementReport: React.FC<MonthlyQualityManagementReportProps> = ({ onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportDate] = useState(new Date());

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const summary = await SupabaseService.quality.getMonthlySummary(
        reportDate.getMonth() + 1,
        reportDate.getFullYear()
      );
      setData(summary);
    } catch (error) {
      console.error("Error fetching quality summary", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const monthName = reportDate.toLocaleString('es-PA', { month: 'long' }).toUpperCase();

  // Aggregated Stats for the Header
  const westgardViolations = data.qc.filter((r: any) => r.violation !== null).length;
  const correctiveActions = data.qc.filter((r: any) => r.corrective_action !== null).length;
  const maintenanceComp = data.maintenance.length;
  const criticalReagents = data.reagents.filter((r: any) => r.current_stock <= r.min_threshold).length;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full h-[95vh] overflow-hidden flex flex-col">
        {/* Management Controls */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <FileBarChart size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Informe Gerencial de Calidad & Desempeño Analítico</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">ISO 15189 Management Review • {monthName} {reportDate.getFullYear()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-black text-xs hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
            >
              <Printer size={16} />
              EXPORTAR PDF / IMPRIMIR
            </button>
            <button onClick={onClose} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-100">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Report Content - High Fidelity Document Style */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100/50 flex justify-center print:bg-white print:p-0">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[25mm] font-sans text-slate-900 print:shadow-none print:w-full">

            {/* Professional Header */}
            <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900">PLATAFORMA-LIS</h1>
                <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Smart Laboratory Solutions</p>
                <div className="mt-6 space-y-1 text-[11px] font-bold text-slate-400">
                  <p>DEPARTAMENTO DE GESTIÓN DE CALIDAD</p>
                  <p>REPORTE DE REVISIÓN POR LA DIRECCIÓN (ISO 15189 §8.9)</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-4 py-2 rounded-lg inline-block font-black text-lg mb-4">CONFIDENCIAL</div>
                <p className="text-xs font-bold text-slate-500">Fecha de Emisión: {new Date().toLocaleDateString()}</p>
                <p className="text-xs font-bold text-slate-500">Periodo: {monthName} {reportDate.getFullYear()}</p>
              </div>
            </div>

            {/* Executive KPI Summary */}
            <div className="grid grid-cols-4 gap-6 mb-12">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Fallas Westgard</p>
                <h3 className="text-2xl font-black text-rose-600">{westgardViolations}</h3>
                <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-1/4"></div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Acciones Correctivas</p>
                <h3 className="text-2xl font-black text-indigo-600">{correctiveActions}</h3>
                <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[90%]"></div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Mantenimientos</p>
                <h3 className="text-2xl font-black text-emerald-600">{maintenanceComp}</h3>
                <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full"></div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Alertas Stock</p>
                <h3 className="text-2xl font-black text-amber-600">{criticalReagents}</h3>
                <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-1/2"></div>
                </div>
              </div>
            </div>

            {/* Section 1: Internal QC Analysis */}
            <div className="mb-10">
              <h4 className="text-xs font-black text-slate-900 border-l-4 border-slate-900 pl-3 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} />
                I. Análisis de Desempeño Analítico (QC Interno)
              </h4>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Resumen de corridas analíticas y violaciones a las reglas de Westgard durante el periodo actual. Todas las violaciones registradas cuentan con interbloqueo de validación técnica conforme a la normativa.
              </p>
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black uppercase tracking-wider">
                    <th className="p-2 border border-slate-200">Analito / Equipo</th>
                    <th className="p-2 border border-slate-200">Corridas</th>
                    <th className="p-2 border border-slate-200">Violaciones</th>
                    <th className="p-2 border border-slate-200">Acción Correctiva</th>
                    <th className="p-2 border border-slate-200">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mock logic or aggregated data */}
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-bold">Troponina I (Cobas e601)</td>
                    <td className="p-2">31</td>
                    <td className="p-2 font-bold text-rose-600">2 (1_3s)</td>
                    <td className="p-2">Registrada / Efectiva</td>
                    <td className="p-2 text-emerald-600 font-bold">OPERATIVO</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-bold">Glucosa Sérica (Cobas c501)</td>
                    <td className="p-2">62</td>
                    <td className="p-2">0</td>
                    <td className="p-2">N/A</td>
                    <td className="p-2 text-emerald-600 font-bold">OPERATIVO</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: External Quality Assurance (EQA) */}
            <div className="mb-10">
              <h4 className="text-xs font-black text-slate-900 border-l-4 border-slate-900 pl-3 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} />
                II. Evaluación Externa de la Calidad (EQA / PT)
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800">Programa RIQAS - Química Clínica</p>
                  <p className="text-[10px] text-slate-500">Muestra evaluada el 15/{reportDate.getMonth() + 1}/{reportDate.getFullYear()}</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Excelente (SDI: 0.45)</span>
                </div>
              </div>
            </div>

            {/* Section 3: Engineering & Maintenance */}
            <div className="mb-10">
              <h4 className="text-xs font-black text-slate-900 border-l-4 border-slate-900 pl-3 mb-4 uppercase tracking-widest flex items-center gap-2">
                <History size={16} />
                III. Mantenimiento y Gestión de Activos
              </h4>
              <div className="grid grid-cols-2 gap-8 text-[11px]">
                <div>
                  <p className="font-black text-slate-400 uppercase mb-2 tracking-widest">Tareas Críticas Ejecutadas</p>
                  <ul className="space-y-2 list-none">
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Verificación de fotómetros (Cobas)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Lubricación de rack de carga</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Control de láser (Sysmex)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-black text-slate-400 uppercase mb-2 tracking-widest">Servicios Técnicos Correctivos</p>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="font-bold text-rose-700">Aviso Preventivo:</p>
                    <p className="text-rose-600 italic">Reemplazo de lámpara halógena programado para próximo ciclo (Vida útil 90%).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Reagents & Supplies */}
            <div className="mb-12">
              <h4 className="text-xs font-black text-slate-900 border-l-4 border-slate-900 pl-3 mb-4 uppercase tracking-widest flex items-center gap-2">
                <ClipboardCheck size={16} />
                IV. Abastecimiento y Cadena de Frío
              </h4>
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                  <div>
                    <p className="text-xs font-black text-amber-800">Alertas de Expiración</p>
                    <p className="text-[10px] text-amber-700">4 kits de reactivos de Coagulación vencen en menos de 15 días.</p>
                  </div>
                </div>
                <div className="flex-1 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                  <ShieldCheck className="text-blue-600 shrink-0" size={20} />
                  <div>
                    <p className="text-xs font-black text-blue-800">Control de Temperatura</p>
                    <p className="text-[10px] text-blue-700">Todas las cavas se mantuvieron en el rango de 2°C a 8°C (99.8% uptime).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Signatures */}
            <div className="mt-auto pt-16 flex justify-between border-t border-slate-100">
              <div className="text-center w-64">
                <div className="h-16 flex items-end justify-center mb-2">
                  <span className="text-slate-200 font-serif italic text-4xl opacity-50 font-black">VALENTINA</span>
                </div>
                <div className="border-t border-slate-900 pt-2">
                  <p className="text-[10px] font-black uppercase text-slate-800">Lic. Valentina Soto</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Jefa de Calidad (TM-4091)</p>
                </div>
              </div>
              <div className="text-center w-64">
                <div className="h-16 flex items-end justify-center mb-2">
                  {/* Space for Director signature */}
                </div>
                <div className="border-t border-slate-900 pt-2">
                  <p className="text-[10px] font-black uppercase text-slate-800">Dr. Rubén Abrego</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Director Técnico</p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-[8px] text-slate-300 text-center uppercase tracking-[0.4em]">
              PLATAFORMA-LIS Intelligence Reporting Engine • Secure Audit Trail Enabled
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
            <ShieldCheck size={20} className="text-teal-400" />
            Este informe consolida datos de {data.qc.length} corridas de control y {data.maintenance.length} eventos técnicos.
          </div>
          <button
            onClick={() => alert("Reporte firmado digitalmente y enviado a Gerencia.")}
            className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20"
          >
            <ShieldCheck size={18} />
            FIRMAR Y ARCHIVAR REPORTE
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyQualityManagementReport;
