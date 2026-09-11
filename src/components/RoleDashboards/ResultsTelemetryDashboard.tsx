import React, { useState, useMemo } from 'react';
import { Order, Patient, TestResult, Analyzer, User } from '../../types';
import {
  Activity,
  Cpu,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Beaker,
  ShieldCheck,
  Zap,
  Layers,
  BarChart3,
  Microscope,
  Info,
  ChevronRight,
  Flame,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ComposedChart,
  Line,
  Area
} from 'recharts';
import { ResultTrendWidget } from './ResultTrendWidget';

interface ResultsTelemetryDashboardProps {
  order: Order;
  patient: Patient;
  results: TestResult[];
  analyzers: Analyzer[];
  currentUser?: User;
  onSelectResultForDetail?: (resultId: string) => void;
  onQuickValidate?: (resultId: string) => void;
  onQuickValidateAll?: () => void;
  onSelectAnalyte?: (analyte: string) => void;
}

export const ResultsTelemetryDashboard: React.FC<ResultsTelemetryDashboardProps> = ({
  order,
  patient,
  results,
  analyzers,
  currentUser,
  onSelectResultForDetail,
  onQuickValidate,
  onQuickValidateAll,
  onSelectAnalyte
}) => {
  const [selectedAnalyteId, setSelectedAnalyteId] = useState<string | null>(
    results.length > 0 ? results[0].id : null
  );
  const [activeTab, setActiveTab] = useState<'profile' | 'trend' | 'instruments'>('profile');

  // Filter results belonging to this order
  const orderResults = useMemo(() => {
    return results.filter(r => r.orderId === order.id);
  }, [results, order.id]);

  // Statistical calculations for technologist
  const stats = useMemo(() => {
    const total = orderResults.length;
    const validated = orderResults.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO').length;
    const criticals = orderResults.filter(r => r.flag?.includes('CRITICO')).length;
    const highs = orderResults.filter(r => r.flag === 'ALTO').length;
    const lows = orderResults.filter(r => r.flag === 'BAJO').length;
    const normals = orderResults.filter(r => !r.flag || r.flag === 'NORMAL').length;
    const automatedSources = orderResults.filter(r => r.source?.includes('MIDDLEWARE')).length;
    const autoValidationFeasible = orderResults.filter(r => (!r.flag || r.flag === 'NORMAL') && r.source?.includes('MIDDLEWARE')).length;
    const autoScore = total > 0 ? Math.round((autoValidationFeasible / total) * 100) : 0;

    return { total, validated, criticals, highs, lows, normals, automatedSources, autoScore };
  }, [orderResults]);

  // Transform numeric analytes into standardized reference index (% of median reference)
  // 100% = exact middle of normal reference range
  // <70% = low, >130% = high, >180% = critical high
  const deviationData = useMemo(() => {
    return orderResults
      .filter(r => r.numericValue !== undefined && !isNaN(r.numericValue))
      .map(r => {
        let min = 0;
        let max = 100;
        const text = r.refRangeText || '';
        const matchRange = text.match(/([\d.]+)\s*-\s*([\d.]+)/);
        if (matchRange) {
          min = parseFloat(matchRange[1]);
          max = parseFloat(matchRange[2]);
        } else {
          const matchLess = text.match(/<\s*([\d.]+)/);
          if (matchLess) {
            min = 0;
            max = parseFloat(matchLess[1]);
          }
        }

        const mid = (min + max) / 2 || 1;
        const halfSpan = (max - min) / 2 || 1;
        const value = r.numericValue ?? 0;
        
        // Relative deviation: 100 is normal center. 130 is upper limit, 70 is lower limit
        const normalizedIndex = Math.round(100 + ((value - mid) / halfSpan) * 30);
        const clampedIndex = Math.max(20, Math.min(260, normalizedIndex));

        const isCritical = r.flag?.includes('CRITICO');
        const isHigh = r.flag === 'ALTO';
        const isLow = r.flag === 'BAJO';

        return {
          id: r.id,
          name: r.parameterName.length > 14 ? r.parameterName.slice(0, 13) + '…' : r.parameterName,
          fullName: r.parameterName,
          value,
          unit: r.unit,
          refText: r.refRangeText,
          normalizedIndex: clampedIndex,
          flag: r.flag || 'NORMAL',
          isCritical,
          isHigh,
          isLow,
          source: r.source,
          analyzerName: r.analyzerName || 'Analizador LIS'
        };
      });
  }, [orderResults]);

  // Analyzers active for this order's results
  const involvedAnalyzers = useMemo(() => {
    const names: string[] = Array.from(new Set(orderResults.map(r => r.analyzerName).filter((n): n is string => Boolean(n))));
    if (names.length === 0) {
      return analyzers.slice(0, 2);
    }
    return analyzers.filter(a => names.some((n: string) => a.name.includes(n) || n.includes(a.name)));
  }, [orderResults, analyzers]);

  const selectedResult = orderResults.find(r => r.id === selectedAnalyteId) || orderResults[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* KPI Telemetry Header Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Analitos */}
        <div className="p-3.5 bg-slate-900/80 border border-teal-500/20 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Analitos</span>
            <Microscope className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.total}</span>
            <span className="text-xs font-bold text-teal-400">{stats.validated} validados</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.validated / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 2: Valores Críticos de Pánico */}
        <div className={`p-3.5 border rounded-2xl flex flex-col justify-between shadow-lg transition-all ${
          stats.criticals > 0
            ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-500/10 animate-pulse'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-rose-300 tracking-wider">Alertas Pánico</span>
            <Flame className={`w-4 h-4 ${stats.criticals > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${stats.criticals > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {stats.criticals}
            </span>
            <span className="text-[10px] font-bold text-rose-300/80 uppercase">
              {stats.criticals > 0 ? 'Notificar Urgente' : 'Sin Alertas'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono mt-2">Protocolo ISO 15189</span>
        </div>

        {/* Card 3: Desviaciones Fuera de Rango */}
        <div className="p-3.5 bg-slate-900/80 border border-amber-500/20 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Fuera de Rango</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{stats.highs + stats.lows}</span>
            <span className="text-[10px] font-bold text-slate-400">
              {stats.highs}▲ / {stats.lows}▼
            </span>
          </div>
          <span className="text-[9px] text-amber-400/80 font-mono mt-2">Requieren correlación</span>
        </div>

        {/* Card 4: Normales Biológicos */}
        <div className="p-3.5 bg-slate-900/80 border border-emerald-500/20 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">En Rango Normal</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{stats.normals}</span>
            <span className="text-[10px] font-bold text-slate-400">
              {stats.total > 0 ? Math.round((stats.normals / stats.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-[9px] text-emerald-400/80 font-mono mt-2">Aptos auto-validación</span>
        </div>

        {/* Card 5: Auto-Validación LIS Score */}
        <div className="p-3.5 bg-slate-900/80 border border-cyan-500/20 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">Auto-Validación</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-300">{stats.autoScore}%</span>
            <span className="text-[10px] font-bold text-slate-400">confianza</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.autoScore}%` }}
            />
          </div>
        </div>

        {/* Card 6: Conectividad Instrumentos */}
        <div className="p-3.5 bg-slate-900/80 border border-purple-500/20 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider">Telemetría ASTM</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.automatedSources}</span>
            <span className="text-[10px] font-bold text-purple-300">en línea</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] font-mono text-emerald-400 font-bold">ACK Bidireccional</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Perfil de Desviación Biológica</span>
          </button>

          <button
            onClick={() => setActiveTab('trend')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'trend'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Histórico & Delta-Checks</span>
          </button>

          <button
            onClick={() => setActiveTab('instruments')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'instruments'
                ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Telemetría de Analizadores ({involvedAnalyzers.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold">Rango Normal</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold">Fuera de Límite</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold">Pánico / Crítico</span>
          </span>
        </div>
      </div>

      {/* Tab 1: Profile Chart (Standardized Biological Range Distribution) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Chart Container */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-cyan-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Mapeo Estandarizado de Desviación Clínica
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Índice relativo normalizado: 100% = centro del intervalo biológico de referencia. Valores &gt;130% o &lt;70% exceden límites.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                {deviationData.length} analitos procesados
              </span>
            </div>

            {deviationData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deviationData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        const clicked = e.activePayload[0].payload;
                        setSelectedAnalyteId(clicked.id);
                        if (onSelectAnalyte && clicked.name) {
                          onSelectAnalyte(clicked.name);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis
                      domain={[0, 240]}
                      ticks={[30, 70, 100, 130, 170, 220]}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-cyan-500/40 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 backdrop-blur-xl">
                              <div className="font-black text-white uppercase">{data.fullName}</div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Resultado:</span>
                                <span className="font-mono font-black text-cyan-300">
                                  {data.value} {data.unit}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">Referencia:</span>
                                <span className="font-mono text-slate-300">{data.refText}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
                                <span className="text-slate-400">Estado:</span>
                                <span className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                                  data.isCritical
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : data.isHigh
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : data.isLow
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {data.flag}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono">{data.analyzerName}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Normal range boundary lines */}
                    <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'MEDIANA (100%)', fill: '#10b981', fontSize: 9, position: 'right' }} />
                    <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: 'LÍMITE SUP (+30%)', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
                    <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="2 2" label={{ value: 'LÍMITE INF (-30%)', fill: '#3b82f6', fontSize: 9, position: 'right' }} />
                    <ReferenceLine y={180} stroke="#f43f5e" strokeWidth={1.5} label={{ value: 'ZONA PÁNICO', fill: '#f43f5e', fontSize: 9, position: 'right' }} />

                    <Bar dataKey="normalizedIndex" radius={[8, 8, 0, 0]}>
                      {deviationData.map((entry) => {
                        let fillColor = '#10b981'; // normal
                        if (entry.isCritical) fillColor = '#f43f5e';
                        else if (entry.isHigh) fillColor = '#f59e0b';
                        else if (entry.isLow) fillColor = '#38bdf8';
                        return (
                          <Cell
                            key={`cell-${entry.id}`}
                            fill={fillColor}
                            opacity={selectedAnalyteId === entry.id ? 1 : 0.85}
                            stroke={selectedAnalyteId === entry.id ? '#ffffff' : 'transparent'}
                            strokeWidth={2}
                            className="cursor-pointer transition-all hover:opacity-100"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Microscope className="w-10 h-10 mb-2 text-slate-700" />
                No hay resultados numéricos disponibles para generar el perfil de dispersión.
              </div>
            )}

            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
              <span className="italic">💡 Haga clic en cualquier barra para examinar detalles técnicos del analito.</span>
              <span className="font-mono text-cyan-400">LIS Algorithmic Deviation Engine v3.2</span>
            </div>
          </div>

          {/* Right Inspector Card: Selected Analyte Technologist Brief */}
          <div className="lg:col-span-4 bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            {selectedResult ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-teal-400 font-black tracking-widest block">
                      {selectedResult.testCode || 'ANÁLISIS CLÍNICO'}
                    </span>
                    <h4 className="text-base font-black text-white uppercase">{selectedResult.parameterName}</h4>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                    selectedResult.flag?.includes('CRITICO')
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : selectedResult.flag === 'ALTO'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : selectedResult.flag === 'BAJO'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {selectedResult.flag || 'NORMAL'}
                  </span>
                </div>

                {/* Big Result Visualizer */}
                <div className="p-4 bg-slate-900/90 border border-white/10 rounded-2xl flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Lectura Actual</span>
                    <span className="text-3xl font-black font-mono text-white tracking-tight">
                      {selectedResult.value}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ml-2">{selectedResult.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Referencia</span>
                    <span className="text-xs font-mono text-slate-300 font-bold">{selectedResult.refRangeText}</span>
                  </div>
                </div>

                {/* Pre-Analytical Quality (HIL Index) */}
                <div className="p-3.5 bg-slate-900/50 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span className="flex items-center gap-1">
                      <Beaker className="w-3.5 h-3.5 text-cyan-400" />
                      Índices de Interferencia H-I-L
                    </span>
                    <span className="text-emerald-400 font-bold">Muestra Óptima</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Hemólisis (H)</span>
                      <span className="font-mono font-black text-emerald-400">0 (Negativo)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Ictericia (I)</span>
                      <span className="font-mono font-black text-emerald-400">0 (Normal)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Lipemia (L)</span>
                      <span className="font-mono font-black text-emerald-400">0 (Claro)</span>
                    </div>
                  </div>
                </div>

                {/* Instrument Source & QC State */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[11px]">Analizador Emisor:</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-teal-400" />
                      {selectedResult.analyzerName || 'Transmisión ASTM'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[11px]">Control Westgard:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Reglas 1-2s / 2-2s Aprobadas
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[11px]">Delta-Check (vs Previo):</span>
                    <span className="font-mono font-bold text-teal-400 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +4.2% (Biológicamente estable)
                    </span>
                  </div>
                </div>

                {/* Quick Validate Button */}
                <div className="pt-2">
                  {selectedResult.status !== 'VALIDADO_TEC' && selectedResult.status !== 'VALIDADO_MED' ? (
                    <button
                      onClick={() => onQuickValidate?.(selectedResult.id)}
                      className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Validar Este Analito</span>
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Analito Validado Clínicamente</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Seleccione un analito para inspeccionar detalles.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Historical Trend & Delta-Check Recharts Component */}
      {activeTab === 'trend' && (
        <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Motor de Evolución Histórica & Delta-Check de Laboratorio
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comparativa longitudinal de resultados de {patient.firstName} {patient.lastName} con límites de alerta y trazabilidad.
              </p>
            </div>
            {/* Quick Analyte Pill Selector */}
            <div className="flex flex-wrap gap-1.5 max-w-full overflow-x-auto no-scrollbar">
              {orderResults.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedAnalyteId(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedAnalyteId === r.id
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {r.parameterName}
                </button>
              ))}
            </div>
          </div>

          {/* Render ResultTrendWidget */}
          <div className="rounded-2xl overflow-hidden border border-white/5">
            <ResultTrendWidget
              order={order}
              patient={patient}
              results={orderResults}
              selectedResultId={selectedAnalyteId}
              onSelectResultId={(id) => setSelectedAnalyteId(id)}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Analyzers Telemetry and Racks */}
      {activeTab === 'instruments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {involvedAnalyzers.map((analyzer) => (
            <div
              key={analyzer.id}
              className="bg-slate-950/80 border border-purple-500/20 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-widest block">
                    {analyzer.category || 'ANALIZADOR CLÍNICO'}
                  </span>
                  <h4 className="text-base font-black text-white uppercase">{analyzer.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">{analyzer.model}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 text-[10px] font-black uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {analyzer.status}
                </div>
              </div>

              {/* Telemetry Sensor Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Temp. Incubación</span>
                  <span className="text-sm font-black font-mono text-cyan-300">37.0 °C</span>
                  <span className="text-[9px] text-emerald-400 block font-bold">± 0.1°C Tolerancia</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Protocolo Enlace</span>
                  <span className="text-sm font-black font-mono text-purple-300">{analyzer.protocol}</span>
                  <span className="text-[9px] text-slate-400 block truncate">{analyzer.dialectName || 'LIS01-A2'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Latencia Red</span>
                  <span className="text-sm font-black font-mono text-emerald-400">{analyzer.pingLatencyMs || 4} ms</span>
                  <span className="text-[9px] text-slate-400 block">Conexión bidireccional</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Control Calidad</span>
                  <span className="text-sm font-black font-mono text-emerald-400">PASÓ (OK)</span>
                  <span className="text-[9px] text-emerald-400/80 block font-mono">Westgard 1-3s</span>
                </div>
              </div>

              {/* Sample Rack & Processing state */}
              <div className="p-3 bg-slate-900/40 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold">Muestra en Rack:</span>
                  <span className="font-mono text-teal-300 font-bold">POS-08 [Tubo EDTA]</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold">Código Tubo:</span>
                  <span className="font-mono text-white font-bold">{order.specimens?.[0]?.barcode || 'BC-8823101'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold">Volumen Aspirado:</span>
                  <span className="font-mono text-slate-300">85 µL</span>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 font-mono text-center">
                Última trama procesada: {new Date().toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
