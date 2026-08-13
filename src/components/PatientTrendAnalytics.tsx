import React from 'react';
import { Patient, TestResult, Order } from '../types';
import { X, TrendingUp, TrendingDown, Activity, Calendar, Microscope } from 'lucide-react';

interface PatientTrendAnalyticsProps {
  patient: Patient;
  orders: Order[];
  results: TestResult[];
  onClose: () => void;
}

export const PatientTrendAnalytics: React.FC<PatientTrendAnalyticsProps> = ({
  patient,
  orders,
  results,
  onClose
}) => {
  // Group results by parameter name for trend selection
  const allResults = results.filter(r => orders.some(o => o.id === r.orderId && o.patientId === patient.id));
  const parameters = Array.from(new Set(allResults.map(r => r.parameterName)));
  const [selectedParam, setSelectedParam] = React.useState(parameters[0] || '');

  const trendData = allResults
    .filter(r => r.parameterName === selectedParam)
    .sort((a, b) => new Date(orders.find(o => o.id === a.orderId)?.createdAt || '').getTime() -
                    new Date(orders.find(o => o.id === b.orderId)?.createdAt || '').getTime());

  const chartHeight = 200;
  const chartWidth = 500;
  const padding = 40;

  const maxVal = Math.max(...trendData.map(d => d.numericValue || 0), 1);
  const minVal = Math.min(...trendData.map(d => d.numericValue || 0), 0);
  const range = maxVal - minVal;

  const getY = (val: number) => chartHeight - padding - ((val - minVal) / (range || 1)) * (chartHeight - 2 * padding);
  const getX = (idx: number) => padding + (idx / (trendData.length - 1 || 1)) * (chartWidth - 2 * padding);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Análisis de Tendencias Históricas</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{patient.firstName} {patient.lastName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Selector */}
          <div className="flex flex-wrap gap-2">
             {parameters.map(p => (
               <button
                 key={p}
                 onClick={() => setSelectedParam(p)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   selectedParam === p ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                 }`}
               >
                 {p}
               </button>
             ))}
          </div>

          {trendData.length > 1 ? (
            <div className="space-y-6">
               {/* SVG Chart */}
               <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-white/5 relative">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* Grid lines */}
                    <line x1={padding} y1={getY(maxVal)} x2={chartWidth-padding} y2={getY(maxVal)} stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1={padding} y1={getY(minVal)} x2={chartWidth-padding} y2={getY(minVal)} stroke="#1e293b" strokeDasharray="4 4" />

                    {/* Data Line */}
                    <polyline
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={trendData.map((d, i) => `${getX(i)},${getY(d.numericValue || 0)}`).join(' ')}
                      className="drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]"
                    />

                    {/* Points */}
                    {trendData.map((d, i) => (
                      <g key={d.id} className="group/dot">
                        <circle
                          cx={getX(i)}
                          cy={getY(d.numericValue || 0)}
                          r="5"
                          fill="#020617"
                          stroke="#14b8a6"
                          strokeWidth="2"
                        />
                        <text
                          x={getX(i)}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {new Date(orders.find(o => o.id === d.orderId)?.createdAt || '').toLocaleDateString('es-PA', {month: 'short', day: 'numeric'})}
                        </text>
                      </g>
                    ))}
                  </svg>
               </div>

               {/* Comparison Insight */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                     <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor Actual</div>
                     <div className="text-2xl font-black text-white">{trendData[trendData.length-1].value} <span className="text-xs text-slate-500">{trendData[trendData.length-1].unit}</span></div>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                     <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Variación Global</div>
                     {(() => {
                        const first = trendData[0].numericValue || 0;
                        const last = trendData[trendData.length-1].numericValue || 0;
                        const diff = ((last - first) / (first || 1)) * 100;
                        return (
                          <div className={`flex items-center space-x-2 font-black ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {diff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                             <span className="text-lg">{Math.abs(diff).toFixed(1)}%</span>
                          </div>
                        );
                     })()}
                  </div>
               </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Microscope className="w-8 h-8 text-slate-600" />
               </div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Datos insuficientes para generar tendencia</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-950/30 border-t border-white/5">
           <button onClick={onClose} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all">Cerrar Visualizador</button>
        </div>
      </div>
    </div>
  );
};
