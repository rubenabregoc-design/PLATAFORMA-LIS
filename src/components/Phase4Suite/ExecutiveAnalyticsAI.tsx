import React, { useState } from 'react';
import { Tenant, Branch, Order, TestResult } from '../../types';
import {
  TrendingUp,
  BrainCircuit,
  DollarSign,
  BarChart3,
  Clock,
  Sparkles,
  Zap,
  Building,
  Activity,
  ArrowUpRight,
  PieChart,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface ExecutiveAnalyticsAIProps {
  tenant: Tenant;
  branches: Branch[];
  orders: Order[];
  results: TestResult[];
}

export const ExecutiveAnalyticsAI: React.FC<ExecutiveAnalyticsAIProps> = ({
  tenant,
  branches,
  orders,
  results
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Financial & Operational KPI computations
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';

  // Revenue by branch mock breakdown
  const branchMetrics = [
    { name: 'Sede Vía España (Hub Central)', revenue: 4250.00, volume: 68, avgTat: '42 min' },
    { name: 'Sede David, Chiriquí', revenue: 2180.00, volume: 34, avgTat: '55 min' },
    { name: 'Sede Costa del Este', revenue: 3410.00, volume: 45, avgTat: '38 min' },
    { name: 'Sede Colón', revenue: 1950.00, volume: 29, avgTat: '62 min' }
  ];

  // Most requested tests top 5
  const topTests = [
    { name: 'Química — Glucosa en Ayunas', count: 142, revenue: 1704.00, growth: '+18%' },
    { name: 'Hemograma Completo Automatizado', count: 128, revenue: 1920.00, growth: '+12%' },
    { name: 'Perfil Lipídico Completo', count: 95, revenue: 2375.00, growth: '+24%' },
    { name: 'Examen General de Orina (EGO)', count: 88, revenue: 704.00, growth: '+5%' },
    { name: 'Tiroides — TSH Ultrasensible', count: 64, revenue: 1600.00, growth: '+31%' }
  ];

  const handleRunAiDiagnostics = () => {
    setIsAiAnalyzing(true);
    setAiInsight(null);

    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiInsight(
        `🤖 **Análisis Predictivo Gemini AI para AbregoTech LIS**:
        
1. **Pico de Demanda Operativa**: Se detecta una concentración del 64% de la toma de muestras de rutina entre las 6:30 AM y las 9:30 AM en la Sede Vía España. Se sugiere redistribuir a 2 técnicos adicionales para optimizar el TAT de centrífuga.
2. **Rentabilidad por Reactivo**: El examen TSH Ultrasensible registra la mayor tasa de crecimiento (+31%) con un margen bruto estimado del 68%.
3. **Optimización de Reactivos**: El reactivo de Hemograma en Sede David alcanzará el umbral mínimo de seguridad en 4 días debido a la alta demanda de rutina de la CSS.`
      );
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-purple-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <span>Fase 4 — Inteligencia de Negocios & Algoritmos Predictivos Gemini AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Executive Financial & Operational BI Dashboard
          </h1>
          <p className="text-purple-100 text-sm mt-1 max-w-xl">
            Métricas ejecutivas consolidando todas las sedes del laboratorio en Panamá con pronóstico de volumen de muestras y analítica de rentabilidad.
          </p>
        </div>

        <button
          onClick={handleRunAiDiagnostics}
          disabled={isAiAnalyzing}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow-lg flex items-center space-x-2 shrink-0 border border-purple-400/40"
        >
          {isAiAnalyzing ? (
            <>
              <Zap className="w-4 h-4 animate-spin text-amber-300" />
              <span>Analizando con Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generar Informe Predictivo AI</span>
            </>
          )}
        </button>
      </div>

      {/* Gemini AI Insight Card if generated */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-purple-900/90 to-slate-900 border border-purple-500/50 p-6 rounded-2xl text-white shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Diagnóstico Predictivo & Recomendaciones Estratégicas</span>
          </div>
          <div className="text-xs text-purple-100 whitespace-pre-line leading-relaxed font-sans">
            {aiInsight}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
            <span>Ingresos Totales (DGI POS)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${totalRevenue.toLocaleString('es-PA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% respecto al mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
            <span>Volumen Total Órdenes</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalOrders} muestras
          </div>
          <div className="text-[11px] text-slate-500">
            En 4 sedes operativas Panamá
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
            <span>Ticket Promedio por Paciente</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${avgOrderValue}
          </div>
          <div className="text-[11px] text-slate-500">
            Incluye descuentos Ley 6 Jubilados
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
            <span>TAT Promedio Validación</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            46 mins
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">
            Cumple SLA objetivo (&lt; 60 mins)
          </div>
        </div>
      </div>

      {/* Grid Section: Branch Performance & Top Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Branch breakdown */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Building className="w-5 h-5 text-purple-600" />
            <span>Rendimiento Financiero & SLA por Sede</span>
          </h3>

          <div className="space-y-3">
            {branchMetrics.map((b, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{b.name}</div>
                  <div className="text-xs text-slate-500">
                    {b.volume} órdenes atendidas hoy | TAT Promedio: <strong className="text-slate-800">{b.avgTat}</strong>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-black text-slate-900 text-base">
                    ${b.revenue.toLocaleString('es-PA', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">POS Conectado</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Requested Tests */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            <span>Exámenes de Mayor Demanda y Crecimiento</span>
          </h3>

          <div className="space-y-3">
            {topTests.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-slate-500">{t.count} análisis procesados</div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-slate-900">${t.revenue.toFixed(2)}</div>
                  <div className="text-emerald-700 font-bold text-[10px]">{t.growth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
