import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  XCircle,
  Activity,
  Filter,
  CheckCircle2,
  Building2,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  RefreshCw,
  Zap,
  Gauge,
  MapPin,
  Users,
  LayoutGrid
} from 'lucide-react';
import { LabSpatialMonitor } from './LabSpatialMonitor';

// Mock Data 1: TAT por Sede (Promedio Real vs Meta SLA en minutos)
const TAT_PER_BRANCH_DATA = [
  { branch: 'Vía España', tatReal: 38, tatSla: 45, totalOrders: 420 },
  { branch: 'Chiriquí (David)', tatReal: 42, tatSla: 50, totalOrders: 280 },
  { branch: 'Costa del Este', tatReal: 31, tatSla: 40, totalOrders: 310 },
  { branch: 'Transístmica', tatReal: 48, tatSla: 45, totalOrders: 190 }
];

// Mock Data 2: Tendencia Horaria de TAT (07:00 AM - 05:00 PM)
const HOURLY_TAT_TREND = [
  { hour: '07:00 AM', tatMin: 28, samplesProcessed: 45 },
  { hour: '08:00 AM', tatMin: 34, samplesProcessed: 85 },
  { hour: '09:00 AM', tatMin: 49, samplesProcessed: 120 }, // Peak
  { hour: '10:00 AM', tatMin: 42, samplesProcessed: 110 },
  { hour: '11:00 AM', tatMin: 36, samplesProcessed: 75 },
  { hour: '12:00 PM', tatMin: 30, samplesProcessed: 50 },
  { hour: '01:00 PM', tatMin: 32, samplesProcessed: 60 },
  { hour: '02:00 PM', tatMin: 35, samplesProcessed: 70 },
  { hour: '03:00 PM', tatMin: 31, samplesProcessed: 55 },
  { hour: '04:00 PM', tatMin: 29, samplesProcessed: 40 }
];

// Mock Data 3: Desglose de Errores Pre-analíticos & Muestras Rechazadas
const REJECTION_REASONS_DATA = [
  { name: 'Hemólisis en Suero', count: 18, color: '#f87171' },
  { name: 'Muestra Coagulada (EDTA)', count: 12, color: '#fbbf24' },
  { name: 'Volumen Insuficiente (QNS)', count: 9, color: '#38bdf8' },
  { name: 'Tubo / Anticoagulante Erróneo', count: 5, color: '#a78bfa' },
  { name: 'Muestra Mal Rotulada', count: 3, color: '#f43f5e' }
];

// Mock Data 4: Tasa Mensual de Rechazo vs Límite Objetivo (< 1.5%)
const MONTHLY_REJECTION_RATE = [
  { month: 'Mar', rate: 1.8, limit: 1.5 },
  { month: 'Abr', rate: 1.6, limit: 1.5 },
  { month: 'May', rate: 1.4, limit: 1.5 },
  { month: 'Jun', rate: 1.2, limit: 1.5 },
  { month: 'Jul', rate: 1.1, limit: 1.5 },
  { month: 'Ago', rate: 0.9, limit: 1.5 }
];

export const LabProductivityDashboard: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('TODAS');
  const [selectedShift, setSelectedShift] = useState<string>('MAÑANA');
  const [activeTab, setActiveTab] = useState<'spatial_monitor' | 'tat_analytics' | 'rejections_qc' | 'all_overview'>('spatial_monitor');

  const totalSamplesToday = 1200;
  const totalRejectionsToday = 47;
  const avgTatOverall = 39.7; // minutes
  const rejectionRateOverall = ((totalRejectionsToday / totalSamplesToday) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-950 border border-sky-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Dashboard de Eficiencia Operativa, Distribución Espacial & Control de Calidad</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Productividad del Laboratorio & Gestión Espacial de Carga
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Supervisión de mesones en tiempo real con D3.js para reasignación ágil de tecnólogos, monitoreo de TAT por sede y control estadístico de rechazos pre-analíticos.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-teal-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-500"
            >
              <option value="TODAS">Todas las Sedes</option>
              <option value="Vía España">Sede Vía España</option>
              <option value="Chiriquí (David)">Sede Chiriquí (David)</option>
              <option value="Costa del Este">Sede Costa del Este</option>
              <option value="Transístmica">Sede Transístmica</option>
            </select>
          </div>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>TAT Promedio Global</span>
            </div>
            <div className="text-2xl font-black font-mono text-teal-300">{avgTatOverall} min</div>
            <div className="text-[10px] text-emerald-400 font-bold">11.8% más rápido que la Meta SLA</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Muestras Procesadas Hoy</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{totalSamplesToday} Tubos</div>
            <div className="text-[10px] text-teal-400 font-bold">6 Mesones & 4 Analizadores Activos</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Muestras Rechazadas</span>
            </div>
            <div className="text-2xl font-black font-mono text-rose-400">{totalRejectionsToday} Muestras</div>
            <div className="text-[10px] text-rose-400 font-bold">Tasa de Error: {rejectionRateOverall}%</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cálculo ISO 15189</span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">98.2% Conforme</div>
            <div className="text-[10px] text-emerald-400 font-bold">Dentro del Límite de Calidad</div>
          </div>
        </div>

        {/* View Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/10 relative z-10">
          <button
            onClick={() => setActiveTab('spatial_monitor')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeTab === 'spatial_monitor'
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-300" />
            <span>Lab Spatial Monitor (D3.js)</span>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>Reasignar Personal</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tat_analytics')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeTab === 'tat_analytics'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analítica de TAT & Flujo Horario</span>
          </button>

          <button
            onClick={() => setActiveTab('rejections_qc')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeTab === 'rejections_qc'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Rechazos & Calidad Pre-analítica</span>
          </button>

          <button
            onClick={() => setActiveTab('all_overview')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeTab === 'all_overview'
                ? 'bg-slate-800 text-white border-slate-600'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Vista Integral Completa</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LAB SPATIAL MONITOR (D3) */}
      {(activeTab === 'spatial_monitor' || activeTab === 'all_overview') && (
        <div className="space-y-6">
          <LabSpatialMonitor />
        </div>
      )}

      {/* VIEW 2: TAT ANALYTICS (RECHARTS) */}
      {(activeTab === 'tat_analytics' || activeTab === 'all_overview') && (
        <div className="space-y-6">
          {/* Grid Layout 1: TAT per Branch & Hourly TAT Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Graph 1: TAT Real vs Target SLA por Sede */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <span>Tiempo de Respuesta (TAT) Real vs Meta SLA por Sede</span>
            </h3>
            <span className="text-[10px] bg-slate-950 text-slate-400 font-mono px-2.5 py-1 rounded-lg border border-slate-800">
              Minutos
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Comparativa del tiempo transcurrido desde la recepción del tubo en flebotomía hasta la validación técnica en el LIS.
          </p>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TAT_PER_BRANCH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="branch" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1 shadow-2xl">
                          <div className="font-bold text-teal-300">{label}</div>
                          <div className="text-emerald-400 font-mono">TAT Real: {payload[0].value} min</div>
                          <div className="text-amber-400 font-mono">Meta SLA: {payload[1].value} min</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="tatReal" name="TAT Real (min)" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
                <Bar dataKey="tatSla" name="Meta SLA (min)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Hourly TAT Trend & Sample Volume */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>Comportamiento Horario de TAT & Volumen de Muestras</span>
            </h3>
            <span className="text-[10px] bg-slate-950 text-slate-400 font-mono px-2.5 py-1 rounded-lg border border-slate-800">
              Pico 09:00 AM
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Fluctuación del TAT a lo largo del día. Identifica cuellos de botella en horas pico de toma de muestras.
          </p>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HOURLY_TAT_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1 shadow-2xl">
                          <div className="font-bold text-teal-300">{label}</div>
                          <div className="text-indigo-400 font-mono">TAT Promedio: {payload[0].value} min</div>
                          <div className="text-emerald-400 font-mono">Muestras: {payload[1].value} tubos</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="tatMin" name="TAT (minutos)" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="samplesProcessed" name="Muestras / Hora" stroke="#34d399" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )}

  {/* VIEW 3: PRE-ANALYTICAL REJECTIONS & QUALITY (RECHARTS) */}
  {(activeTab === 'rejections_qc' || activeTab === 'all_overview') && (
    <div className="space-y-6">
      {/* Grid Layout 2: Pre-analytical Rejections & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph 3: Pie Chart of Pre-Analytical Error Reasons */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Causas de Rechazo Pre-Analítico</span>
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Distribución de no conformidades en muestras recibidas durante la jornada.
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REJECTION_REASONS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {REJECTION_REASONS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs shadow-2xl">
                          <div className="font-bold text-white">{data.name}</div>
                          <div className="font-mono text-rose-400 font-bold">{data.count} casos ({((data.count / totalRejectionsToday) * 100).toFixed(1)}%)</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
            {REJECTION_REASONS_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </span>
                <span className="font-mono font-bold text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph 4: Monthly Rejection Rate vs Quality SLA Limit */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Evolución Mensual de la Tasa de Rechazo vs Meta SLA (&lt; 1.5%)</span>
            </h3>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-mono font-bold">
              Tendencia a la Baja 📉
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Medición histórica del porcentaje de tubos no aptos para análisis. Reducción sostenida gracias a la estandarización de flebotomía.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_REJECTION_RATE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1 shadow-2xl">
                          <div className="font-bold text-teal-300">Mes de {label}</div>
                          <div className="text-rose-400 font-mono font-bold">Tasa Rechazo: {payload[0].value}%</div>
                          <div className="text-emerald-400 font-mono">Límite SLA: {payload[1].value}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="rate" name="% Rechazo Real" fill="#f87171" radius={[8, 8, 0, 0]} />
                <Bar dataKey="limit" name="Límite Máximo SLA (1.5%)" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Action Plan Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Plan de Acción Recomendado:</span>
              <span className="text-slate-400">Realizar re-capacitación en técnica de venopunción para reducir hemólisis en hora pico (09:00 AM).</span>
            </div>
            <button
              onClick={() => alert('¡Plan de Capacitación Pre-analítica enviado a los supervisores de sede!')}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl shrink-0 cursor-pointer shadow"
            >
              Notificar Supervisores
            </button>
          </div>
        </div>

      </div>
    </div>
  )}
</div>
  );
};
