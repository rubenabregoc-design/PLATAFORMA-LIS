import React, { useState, useMemo } from 'react';
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
  Gauge
} from 'lucide-react';

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
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());

  // Lógica de filtrado dinámico para profesionalizar el Dashboard al 100%
  const filteredData = useMemo(() => {
    if (selectedBranch === 'TODAS') return TAT_PER_BRANCH_DATA;
    return TAT_PER_BRANCH_DATA.filter(d => d.branch === selectedBranch);
  }, [selectedBranch]);

  // Cálculo de KPIs dinámicos basados en la selección
  const stats = useMemo(() => {
    const data = selectedBranch === 'TODAS'
      ? { samples: 1200, rejections: 47, tat: 39.7, compliance: 98.2 }
      : selectedBranch === 'Vía España'
      ? { samples: 420, rejections: 12, tat: 38.0, compliance: 97.1 }
      : selectedBranch === 'Chiriquí (David)'
      ? { samples: 280, rejections: 18, tat: 42.0, compliance: 93.5 }
      : selectedBranch === 'Costa del Este'
      ? { samples: 310, rejections: 5, tat: 31.0, compliance: 99.1 }
      : { samples: 190, rejections: 12, tat: 48.0, compliance: 92.0 };

    return data;
  }, [selectedBranch]);

  const handleRefresh = () => {
    setLastUpdate(new Date().toLocaleTimeString());
    // Aquí se dispararían las queries reales a la base de datos
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-950 border border-sky-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Dashboard de Eficiencia Operativa & Control de Errores Pre-Analíticos</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Productividad del Laboratorio & Tiempo de Respuesta (TAT)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Métricas en tiempo real impulsadas por Recharts: análisis de TAT promedio por sede, volumen de muestras rechazadas y tasa de errores pre-analíticos según ISO 15189.
            </p>
            <div className="flex items-center gap-4 mt-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Motor Live-Stream Activo</span>
               </div>
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter italic">Última sincronización: {lastUpdate}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-3 bg-slate-950 border border-white/5 rounded-2xl text-slate-400 hover:text-teal-400 transition-all active:rotate-180 duration-500"
              title="Sincronizar Datos"
            >
               <RefreshCw className="w-4 h-4" />
            </button>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-950 border border-white/10 text-xs font-black text-teal-400 rounded-2xl px-6 py-3.5 focus:ring-2 focus:ring-teal-500 outline-none shadow-2xl appearance-none cursor-pointer"
            >
              <option value="TODAS">🌎 Todas las Sedes</option>
              <option value="Vía España">📍 Sede Vía España</option>
              <option value="Chiriquí (David)">📍 Sede Chiriquí (David)</option>
              <option value="Costa del Este">📍 Sede Costa del Este</option>
              <option value="Transístmica">📍 Sede Transístmica</option>
            </select>
          </div>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1 group hover:border-teal-500/30 transition-all cursor-default shadow-inner">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1 group-hover:text-teal-400 transition-colors">
              <Clock className="w-3.5 h-3.5" />
              <span>TAT Promedio Global</span>
            </div>
            <div className="text-3xl font-black font-mono text-white tracking-tighter">{stats.tat} <span className="text-xs text-slate-500 font-sans">min</span></div>
            <div className="text-[10px] text-emerald-400 font-bold">11.8% más rápido que la Meta SLA</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1 group hover:border-indigo-500/30 transition-all cursor-default shadow-inner">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1 group-hover:text-indigo-400 transition-colors">
              <Activity className="w-3.5 h-3.5" />
              <span>Muestras Procesadas Hoy</span>
            </div>
            <div className="text-3xl font-black font-mono text-white tracking-tighter">{stats.samples} <span className="text-xs text-slate-500 font-sans">Tubos</span></div>
            <div className="text-[10px] text-teal-400 font-bold">4 Analizadores Activos</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1 group hover:border-rose-500/30 transition-all cursor-default shadow-inner">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1 group-hover:text-rose-400 transition-colors">
              <XCircle className="w-3.5 h-3.5" />
              <span>Muestras Rechazadas</span>
            </div>
            <div className="text-3xl font-black font-mono text-rose-500 tracking-tighter">{stats.rejections} <span className="text-xs text-slate-600 font-sans">Muestras</span></div>
            <div className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter">Tasa de Error: {((stats.rejections / stats.samples) * 100).toFixed(2)}%</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1 group hover:border-emerald-500/30 transition-all cursor-default shadow-inner">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center space-x-1 group-hover:text-emerald-400 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cálculo ISO 15189</span>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400 tracking-tighter">{stats.compliance}% <span className="text-xs text-slate-600 font-sans uppercase">Conforme</span></div>
            <div className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-tighter">Dentro del Límite de Calidad</div>
          </div>
        </div>
      </div>

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
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="branch"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 700 }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-xs space-y-2 shadow-2xl ring-1 ring-white/5">
                          <div className="font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-2">{label}</div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 font-bold">TAT Real:</span>
                            <span className="text-teal-400 font-mono font-black">{payload[0].value} min</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400 font-bold">Meta SLA:</span>
                            <span className="text-amber-400 font-mono font-black">{payload[1].value} min</span>
                          </div>
                          <div className="pt-2 border-t border-white/5 mt-2 flex items-center justify-between">
                             <span className="text-[9px] text-slate-500 font-black uppercase">Eficiencia:</span>
                             <span className="text-emerald-400 font-black">+{Math.round((1 - (payload[0].value as number / (payload[1].value as number))) * 100)}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                <Bar dataKey="tatReal" name="TAT Real" fill="#2dd4bf" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="tatSla" name="Meta SLA" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 700 }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 700 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-xs space-y-2 shadow-2xl ring-1 ring-white/5">
                          <div className="font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-2">Franja Horaria: {label}</div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                               TAT Promedio:
                            </span>
                            <span className="text-white font-mono font-black">{payload[0].value} min</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                               Carga de Trabajo:
                            </span>
                            <span className="text-white font-mono font-black">{payload[1].value} tubos</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                <Line
                  type="monotone"
                  dataKey="tatMin"
                  name="TAT (min)"
                  stroke="#818cf8"
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#818cf8', strokeWidth: 2, stroke: '#0f172a' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="samplesProcessed"
                  name="Muestras / Hora"
                  stroke="#34d399"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

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
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="count"
                  stroke="none"
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
                        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-xs shadow-2xl ring-1 ring-white/5">
                          <div className="font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-2">{data.name}</div>
                          <div className="flex items-center justify-between gap-4">
                             <span className="text-slate-400 font-bold">Incidencias:</span>
                             <span className="text-rose-400 font-mono font-black">{data.count} casos</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                             <span className="text-slate-400 font-bold">Porcentaje:</span>
                             <span className="text-white font-mono font-black">{((data.count / stats.rejections) * 100).toFixed(1)}%</span>
                          </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 700 }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 700 }}
                  unit="%"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-xs space-y-2 shadow-2xl ring-1 ring-white/5">
                          <div className="font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-2">Histórico: {label}</div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-rose-300 font-bold">Tasa Rechazo:</span>
                            <span className="text-white font-mono font-black">{payload[0].value}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-emerald-300 font-bold">Meta Calidad:</span>
                            <span className="text-white font-mono font-black">{payload[1].value}%</span>
                          </div>
                          <div className={`mt-2 py-1 px-3 rounded-lg text-[10px] font-black text-center uppercase tracking-tighter ${Number(payload[0].value) <= Number(payload[1].value) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                             {Number(payload[0].value) <= Number(payload[1].value) ? '✓ Objetivo Cumplido' : '⚠ Excede Límite'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                <Bar dataKey="rate" name="% Rechazo Real" fill="#f87171" radius={[6, 6, 0, 0]} barSize={35} />
                <Bar dataKey="limit" name="Límite Calidad (1.5%)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35} />
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
  );
};
