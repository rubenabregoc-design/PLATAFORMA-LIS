import React, { useState, useMemo } from 'react';
import { Tenant, Branch, Order } from '../../types';
import {
  BarChart3,
  CheckCircle2,
  Activity,
  Clock,
  TrendingUp,
  Filter,
  Building2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DailyProductionWidgetProps {
  tenant: Tenant;
  branch?: Branch;
  orders?: Order[];
}

// Base hourly production curve for a typical day in a clinical laboratory
const HOURLY_PRODUCTION_DATA = [
  { time: '06:00 - 08:00', label: '06:00 - 08:00', pruebas: 22, validados: 18, hematologia: 10, quimica: 8, inmunologia: 4 },
  { time: '08:00 - 10:00', label: '08:00 - 10:00', pruebas: 48, validados: 42, hematologia: 20, quimica: 18, inmunologia: 10 },
  { time: '10:00 - 12:00', label: '10:00 - 12:00', pruebas: 56, validados: 50, hematologia: 22, quimica: 22, inmunologia: 12 },
  { time: '12:00 - 14:00', label: '12:00 - 14:00', pruebas: 34, validados: 32, hematologia: 12, quimica: 14, inmunologia: 8 },
  { time: '14:00 - 16:00', label: '14:00 - 16:00', pruebas: 42, validados: 38, hematologia: 16, quimica: 16, inmunologia: 10 },
  { time: '16:00 - 18:00', label: '16:00 - 18:00', pruebas: 28, validados: 25, hematologia: 10, quimica: 12, inmunologia: 6 },
  { time: '18:00 - 20:00', label: '18:00 - 20:00', pruebas: 16, validados: 15, hematologia: 6, quimica: 6, inmunologia: 4 },
  { time: '20:00 - 22:00', label: '20:00 - 22:00', pruebas: 8, validados: 8, hematologia: 3, quimica: 3, inmunologia: 2 }
];

const YESTERDAY_PRODUCTION_DATA = [
  { time: '06:00 - 08:00', label: '06:00 - 08:00', pruebas: 18, validados: 16, hematologia: 8, quimica: 6, inmunologia: 4 },
  { time: '08:00 - 10:00', label: '08:00 - 10:00', pruebas: 42, validados: 38, hematologia: 18, quimica: 14, inmunologia: 10 },
  { time: '10:00 - 12:00', label: '10:00 - 12:00', pruebas: 50, validados: 46, hematologia: 20, quimica: 18, inmunologia: 12 },
  { time: '12:00 - 14:00', label: '12:00 - 14:00', pruebas: 30, validados: 28, hematologia: 10, quimica: 12, inmunologia: 8 },
  { time: '14:00 - 16:00', label: '14:00 - 16:00', pruebas: 38, validados: 35, hematologia: 14, quimica: 14, inmunologia: 10 },
  { time: '16:00 - 18:00', label: '16:00 - 18:00', pruebas: 24, validados: 22, hematologia: 8, quimica: 10, inmunologia: 6 },
  { time: '18:00 - 20:00', label: '18:00 - 20:00', pruebas: 12, validados: 12, hematologia: 4, quimica: 5, inmunologia: 3 },
  { time: '20:00 - 22:00', label: '20:00 - 22:00', pruebas: 6, validados: 6, hematologia: 2, quimica: 2, inmunologia: 2 }
];

const WEEKLY_PRODUCTION_DATA = [
  { time: 'Lunes', label: 'Lun', pruebas: 240, validados: 228, hematologia: 90, quimica: 100, inmunologia: 50 },
  { time: 'Martes', label: 'Mar', pruebas: 268, validados: 254, hematologia: 105, quimica: 110, inmunologia: 53 },
  { time: 'Miércoles', label: 'Mié', pruebas: 254, validados: 228, hematologia: 95, quimica: 105, inmunologia: 54 },
  { time: 'Jueves', label: 'Jue', pruebas: 282, validados: 270, hematologia: 110, quimica: 115, inmunologia: 57 },
  { time: 'Viernes', label: 'Vie', pruebas: 295, validados: 280, hematologia: 115, quimica: 120, inmunologia: 60 },
  { time: 'Sábado', label: 'Sáb', pruebas: 160, validados: 155, hematologia: 60, quimica: 65, inmunologia: 35 },
  { time: 'Domingo', label: 'Dom', pruebas: 85, validados: 82, hematologia: 30, quimica: 35, inmunologia: 20 }
];

export const DailyProductionWidget: React.FC<DailyProductionWidgetProps> = ({
  tenant,
  orders = []
}) => {
  const [timeframe, setTimeframe] = useState<'TODAY' | 'YESTERDAY' | 'WEEK'>('TODAY');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [chartMode, setChartMode] = useState<'COMPOSED' | 'LINE'>('COMPOSED');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Hace 2 minutos');

  // Compute scale multiplier based on branch selection
  const branchMultiplier = useMemo(() => {
    if (selectedBranchId === 'ALL') return 1.0;
    const totalBranches = tenant.branches.length || 1;
    return 1 / totalBranches + 0.15;
  }, [selectedBranchId, tenant.branches.length]);

  // Dynamic Chart Data with calculated metrics
  const chartData = useMemo(() => {
    let rawData = HOURLY_PRODUCTION_DATA;
    if (timeframe === 'YESTERDAY') rawData = YESTERDAY_PRODUCTION_DATA;
    if (timeframe === 'WEEK') rawData = WEEKLY_PRODUCTION_DATA;

    return rawData.map(item => {
      const pruebas = Math.round(item.pruebas * branchMultiplier);
      const validados = Math.min(pruebas, Math.round(item.validados * branchMultiplier));
      const pendientes = Math.max(0, pruebas - validados);
      const tasaValidacion = pruebas > 0 ? Math.round((validados / pruebas) * 100) : 100;

      return {
        ...item,
        pruebas,
        validados,
        pendientes,
        tasaValidacion
      };
    });
  }, [timeframe, branchMultiplier]);

  // Aggregate Total KPI Metrics
  const totalPruebas = useMemo(() => chartData.reduce((acc, curr) => acc + curr.pruebas, 0), [chartData]);
  const totalValidados = useMemo(() => chartData.reduce((acc, curr) => acc + curr.validados, 0), [chartData]);
  const totalPendientes = Math.max(0, totalPruebas - totalValidados);
  const tasaEficienciaGlobal = totalPruebas > 0 ? ((totalValidados / totalPruebas) * 100).toFixed(1) : '100.0';

  // Peak Hour Identification
  const peakBlock = useMemo(() => {
    return chartData.reduce((prev, current) => (prev.pruebas > current.pruebas ? prev : current), chartData[0]);
  }, [chartData]);

  const handleRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastUpdated('Justo ahora');
    }, 800);
  };

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-4 rounded-2xl shadow-2xl backdrop-blur-xl text-white space-y-2.5 min-w-[210px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-slate-300 font-mono">{label}</span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-bold uppercase">
              {timeframe === 'TODAY' ? 'Bloque Horario' : timeframe === 'YESTERDAY' ? 'Ayer' : 'Jornada'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center space-x-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                <span>Pruebas Realizadas:</span>
              </span>
              <span className="font-mono text-sm text-cyan-300 font-black">{data.pruebas}</span>
            </div>

            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                <span>Resultados Validados:</span>
              </span>
              <span className="font-mono text-sm text-emerald-300 font-black">{data.validados}</span>
            </div>

            <div className="flex items-center justify-between font-medium text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Pendientes Firma:</span>
              </span>
              <span className="font-mono font-bold text-amber-400">{data.pendientes}</span>
            </div>

            <div className="flex items-center justify-between font-medium text-[11px] text-slate-400">
              <span>Tasa de Validación:</span>
              <span className="font-mono font-black text-teal-300">{data.tasaValidacion}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-cyan-500/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Widget Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 relative z-10">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/30 rounded-2xl text-teal-400 shrink-0 shadow-lg shadow-teal-500/10">
            <Activity className="w-7 h-7 text-teal-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white tracking-tight">Resumen Diario de Producción</h2>
              <span className="px-2.5 py-0.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 font-mono text-[10px] rounded-full font-extrabold uppercase tracking-wider flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>LIS Real-Time</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              Monitoreo operativo del volumen de pruebas procesadas por analizadores vs. resultados validados médicamente por bloques de tiempo.
            </p>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Filter Selector */}
          <div className="relative">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 pl-8 focus:outline-none focus:border-teal-400 transition cursor-pointer appearance-none pr-8"
            >
              <option value="ALL">Todas las Sedes ({tenant.branches.length})</option>
              {tenant.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Building2 className="w-3.5 h-3.5 text-teal-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Timeframe Selector */}
          <div className="bg-slate-950/80 p-1 border border-slate-800 rounded-xl flex items-center space-x-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeframe('TODAY')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeframe === 'TODAY'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('YESTERDAY')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeframe === 'YESTERDAY'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('WEEK')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeframe === 'WEEK'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Días
            </button>
          </div>

          {/* Mode Switcher */}
          <button
            type="button"
            onClick={() => setChartMode(prev => prev === 'COMPOSED' ? 'LINE' : 'COMPOSED')}
            title="Cambiar tipo de gráfica"
            className="p-2 bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-teal-300 hover:border-slate-700 rounded-xl transition cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isSyncing}
            className="p-2 bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-teal-300 hover:border-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Sincronizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
        {/* KPI 1: Pruebas Procesadas */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Pruebas Realizadas</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
            {totalPruebas.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="text-emerald-400 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +12%
            </span>
            <span>vs. promedio horario</span>
          </div>
        </div>

        {/* KPI 2: Resultados Validados */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Resultados Validados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
            {totalValidados.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="text-emerald-400 font-bold">✓ {tasaEficienciaGlobal}%</span>
            <span>completados hoy</span>
          </div>
        </div>

        {/* KPI 3: Pendientes Firma */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Pendientes Firma</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
            {totalPendientes}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="text-amber-400 font-bold">Bandeja Activa</span>
            <span>tecnólogos en turno</span>
          </div>
        </div>

        {/* KPI 4: Bloque Pico de Producción */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Hora Pico de Producción</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-300 font-mono tracking-tight truncate">
            {peakBlock?.time || '10:00 - 12:00'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="text-indigo-400 font-bold">{peakBlock?.pruebas || 0} pruebas/bloque</span>
          </div>
        </div>
      </div>

      {/* Recharts Main Visualization Stage */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-6 relative z-10 space-y-4">
        {/* Recharts Legend & Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-md bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
              <span className="font-bold text-slate-200">Pruebas Realizadas (Volumen LIS)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="font-bold text-slate-200">Resultados Validados (Firma Médica)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
            <span>Última actualización:</span>
            <strong className="text-teal-300 font-mono">{lastUpdated}</strong>
          </div>
        </div>

        {/* Interactive Chart Canvas */}
        <div className="h-[320px] sm:h-[360px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Gradient Fill for Pruebas Realizadas Area */}
                <linearGradient id="gradientPruebas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>

                {/* Gradient Fill for Resultados Validados Area */}
                <linearGradient id="gradientValidados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>

                {/* Bar Gradient for Pruebas Realizadas */}
                <linearGradient id="barPruebas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                {/* Bar Gradient for Resultados Validados */}
                <linearGradient id="barValidados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <Tooltip content={<CustomTooltip />} />

              {chartMode === 'COMPOSED' ? (
                <>
                  {/* Pruebas Realizadas Area */}
                  <Area
                    type="monotone"
                    dataKey="pruebas"
                    name="Pruebas Realizadas"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradientPruebas)"
                  />

                  {/* Resultados Validados Bar */}
                  <Bar
                    dataKey="validados"
                    name="Resultados Validados"
                    fill="url(#barValidados)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />

                  {/* Trend Line for Validados */}
                  <Line
                    type="monotone"
                    dataKey="validados"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#34d399', stroke: '#022c22', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#6ee7b7', stroke: '#047857', strokeWidth: 3 }}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="pruebas"
                    name="Pruebas Realizadas"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0284c7', stroke: '#0f172a', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="validados"
                    name="Resultados Validados"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#059669', stroke: '#0f172a', strokeWidth: 2 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Production Breakdown by Category Summary Bar */}
      <div className="bg-slate-950/60 border border-slate-800/80 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold relative z-10">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <div>
            <span className="text-white block font-black">Distribución por Sección Diagnóstica:</span>
            <span className="text-slate-400 text-[11px]">
              Hematología (40%) • Química Clínica (38%) • Inmunología (22%)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>98.2% Cumplimiento SLA &lt; 2 Horas</span>
          </span>
        </div>
      </div>
    </div>
  );
};
