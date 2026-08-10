import React, { useState } from 'react';
import { WestgardQCControl } from '../types';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, BarChart3, HelpCircle } from 'lucide-react';

interface WestgardQCProps {
  controls: WestgardQCControl[];
}

export const WestgardQC: React.FC<WestgardQCProps> = ({ controls }) => {
  const [selectedControlId, setSelectedControlId] = useState<string>(controls[0]?.id || '');
  const activeControl = controls.find((c) => c.id === selectedControlId) || controls[0];

  const targetMean = activeControl.targetMean;
  const sd = activeControl.standardDeviation;

  // Render SVG Levey-Jennings Chart
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Range from Mean - 3.5SD to Mean + 3.5SD
  const yMin = targetMean - 3.5 * sd;
  const yMax = targetMean + 3.5 * sd;

  const getYCoordinate = (val: number) => {
    const ratio = (val - yMin) / (yMax - yMin);
    return chartHeight - paddingBottom - ratio * innerHeight;
  };

  const getXCoordinate = (index: number, total: number) => {
    if (total <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (total - 1)) * innerWidth;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="w-4 h-4" />
            <span>Módulo de Control de Calidad (QC) en LIS-Core</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">
            Gráficos de Levey-Jennings y Reglas Multirregla de Westgard
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Supervisión continua de la precisión e inexactitud analítica de los equipos. Detecta automáticamente desviaciones sistemáticas y errores aleatorios.
          </p>
        </div>

        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
          <div className="text-slate-300 font-bold">Control Activo:</div>
          <select
            value={selectedControlId}
            onChange={(e) => setSelectedControlId(e.target.value)}
            className="bg-slate-900 text-teal-300 font-semibold border border-slate-700 rounded-lg px-2.5 py-1"
          >
            {controls.map((c) => (
              <option key={c.id} value={c.id}>
                {c.testName} (Lote: {c.lotNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{activeControl.testName}</h3>
            <div className="text-xs text-slate-500 mt-0.5">
              Media Esperada (Target Mean): <strong className="text-slate-800">{targetMean} mg/dL</strong> | 1 SD: <strong className="text-slate-800">±{sd} mg/dL</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dentro de Control</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-medium border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Advertencia (1-2s)</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md font-medium border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Rechazo (1-3s / 2-2s)</span>
            </span>
          </div>
        </div>

        {/* Levey-Jennings SVG Visualization */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto max-h-[300px]">
            {/* Background Grid Lines & SD Labels */}
            {[-3, -2, -1, 0, 1, 2, 3].map((sdLevel) => {
              const val = targetMean + sdLevel * sd;
              const y = getYCoordinate(val);
              const isMean = sdLevel === 0;
              const isWarning = Math.abs(sdLevel) === 2;
              const isReject = Math.abs(sdLevel) === 3;

              let lineColor = '#334155'; // slate-700
              if (isMean) lineColor = '#10b981'; // emerald-500
              if (isWarning) lineColor = '#f59e0b'; // amber-500
              if (isReject) lineColor = '#f43f5e'; // rose-500

              return (
                <g key={sdLevel}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke={lineColor}
                    strokeWidth={isMean ? '2' : '1'}
                    strokeDasharray={isMean ? 'none' : '3 3'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    fill={lineColor}
                    fontSize="10"
                    textAnchor="end"
                    fontWeight={isMean ? 'bold' : 'normal'}
                  >
                    {sdLevel === 0 ? 'Media (95)' : `${sdLevel > 0 ? '+' : ''}${sdLevel}SD (${val})`}
                  </text>
                </g>
              );
            })}

            {/* Connecting Data Line */}
            {activeControl.runs.length > 1 && (
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                points={activeControl.runs
                  .map((r, i) => `${getXCoordinate(i, activeControl.runs.length)},${getYCoordinate(r.value)}`)
                  .join(' ')}
              />
            )}

            {/* Data Points */}
            {activeControl.runs.map((r, i) => {
              const x = getXCoordinate(i, activeControl.runs.length);
              const y = getYCoordinate(r.value);

              let pointColor = '#38bdf8'; // sky-400
              if (r.status === 'WARN') pointColor = '#f59e0b';
              if (r.status === 'FAIL') pointColor = '#f43f5e';

              return (
                <g key={r.id}>
                  <circle cx={x} cy={y} r={r.status === 'PASS' ? '4' : '6'} fill={pointColor} stroke="#020617" strokeWidth="2" />
                  <text x={x} y={chartHeight - 12} fill="#94a3b8" fontSize="9" textAnchor="middle">
                    {r.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Violations Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Historial de Calibración & Reglas de Westgard Evaluadas:</h4>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">Fecha Corrida</th>
                  <th className="p-3">Valor Obtenido</th>
                  <th className="p-3">Desviaciones (SD)</th>
                  <th className="p-3">Regla Westgard Activada</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeControl.runs.map((r) => {
                  const sdDiff = ((r.value - targetMean) / sd).toFixed(2);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{r.date}</td>
                      <td className="p-3 font-mono">{r.value} mg/dL</td>
                      <td className="p-3 font-mono text-slate-600">{sdDiff} SD</td>
                      <td className="p-3">
                        {r.violation ? (
                          <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            r.status === 'FAIL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.violation}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin violaciones</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          r.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : r.status === 'WARN' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.status}
                        </span>
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
