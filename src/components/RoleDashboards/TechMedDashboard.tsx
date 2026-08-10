import React, { useState } from 'react';
import { TestResult, Order, Analyzer } from '../../types';
import { Cpu, CheckCircle2, AlertCircle, Edit3, Save, RefreshCw, Zap, Award, Activity } from 'lucide-react';

interface TechMedDashboardProps {
  results: TestResult[];
  orders: Order[];
  analyzers: Analyzer[];
  onUpdateResultValue: (resultId: string, newValue: string) => void;
  onValidateTechnical: (resultId: string) => void;
}

export const TechMedDashboard: React.FC<TechMedDashboardProps> = ({
  results,
  orders,
  analyzers,
  onUpdateResultValue,
  onValidateTechnical
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const handleStartEdit = (res: TestResult) => {
    setEditingId(res.id);
    setTempValue(res.value);
  };

  const handleSaveEdit = (resId: string) => {
    onUpdateResultValue(resId, tempValue);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-600"></div>
        <div>
          <div className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Dashboard — Tecnólogo Médico / Análisis Instrumental</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Procesamiento de Muestras & Validación Técnica
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Revisión técnica de valores provenientes de los analizadores o de carga manual. Comprobación de interferencias y banderas de alerta.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs space-y-1 shrink-0">
          <div className="text-slate-900 font-bold flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Lic. Sofía Guardia (TM-5920-PA)</span>
          </div>
          <div className="text-emerald-700 font-semibold">● Equipos Sysmex y Vitros Calibrados</div>
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell 1: Analyzers Calibration Status (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Estado de Analizadores LIS</span>
              </h3>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                ASTM / HL7
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              {analyzers.map((a) => (
                <div key={a.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{a.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Protocolo: <strong className="font-mono text-slate-700">{a.protocol}</strong></span>
                    <span>Puerto: <strong className="font-mono text-slate-700">{a.port}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
            <div className="font-bold flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Control de Calidad Westgard:</span>
            </div>
            <div>Controles Nivel 1 y Nivel 2 dentro de +1SD. Detección de interferencia hemolítica automática.</div>
          </div>
        </div>

        {/* Bento Cell 2: Main Processing Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Bandeja Técnica de Análisis Clinical Test Results</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {results.length} Parámetros
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">N° Orden / Paciente</th>
                  <th className="p-3">Examen / Parámetro</th>
                  <th className="p-3">Valor Obtenido</th>
                  <th className="p-3">Unidad</th>
                  <th className="p-3">Ref. Range</th>
                  <th className="p-3">Origen</th>
                  <th className="p-3">Estado Tec.</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {results.map((res) => {
                  const order = orders.find((o) => o.id === res.orderId);
                  const isEditing = editingId === res.id;

                  return (
                    <tr key={res.id} className={res.flag?.includes('CRITICO') ? 'bg-rose-50/80 font-bold' : 'hover:bg-slate-50/50'}>
                      <td className="p-3 font-bold text-slate-900">
                        <div className="font-mono text-xs">{order?.orderNumber || 'ORD-2026-00101'}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{order?.patientName}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{res.parameterName}</td>
                      <td className="p-3 font-mono text-sm">
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="bg-white border border-blue-500 rounded-lg px-2 py-1 text-xs w-24 font-mono focus:outline-none"
                          />
                        ) : (
                          <span className={res.flag?.includes('CRITICO') ? 'text-rose-700 font-black' : 'text-slate-900'}>
                            {res.value}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{res.unit}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{res.refRangeText}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold">
                          {res.source}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(res.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition shadow-sm"
                          >
                            Guardar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(res)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-[11px] transition"
                          >
                            Editar
                          </button>
                        )}

                        {res.status !== 'VALIDADO_TEC' && res.status !== 'VALIDADO_MED' && (
                          <button
                            onClick={() => onValidateTechnical(res.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition shadow-sm"
                          >
                            Validar Tec.
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
