import React, { useState } from 'react';
import { Tenant, Branch, Order, TestResult } from '../../types';
import { GoogleGenAI } from '@google/genai';
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
  CheckCircle2,
  AlertCircle,
  WifiOff
} from 'lucide-react';

interface ExecutiveAnalyticsAIProps {
  tenant: Tenant;
  branches: Branch[];
  orders: Order[];
  results: TestResult[];
}

// ─── Gemini AI Client Factory ──────────────────────────────────────────────────
/**
 * Builds the prompt payload for Gemini. Validates that the prompt is never
 * empty to prevent INVALID_ARGUMENT errors from the SDK.
 */
function buildAnalyticsPrompt(
  tenantName: string,
  totalOrders: number,
  totalRevenue: number,
  avgOrderValue: string,
  outOfRangeCount: number
): string {
  const contextLines: string[] = [
    `Laboratorio: ${tenantName.trim() || 'AbregoTech LIS'}`,
    `Fecha de análisis: ${new Date().toLocaleDateString('es-PA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Total órdenes procesadas hoy: ${totalOrders}`,
    `Ingresos totales (DGI POS): $${totalRevenue.toLocaleString('es-PA', { minimumFractionDigits: 2 })}`,
    `Ticket promedio por paciente: $${avgOrderValue}`,
    `Resultados fuera de rango: ${outOfRangeCount}`,
    `Sedes operativas: Vía España (Hub), David Chiriquí, Costa del Este, Colón`,
  ].filter(line => line.trim().length > 0);

  const systemContext = `Eres un analista experto en Business Intelligence para laboratorios clínicos de Panamá 
certificados bajo ISO 15189. Tu misión es generar insights ejecutivos accionables y concretos 
basados en métricas operativas y financieras del día.`;

  const userRequest = `Con base en los siguientes datos operativos del día:\n${contextLines.join('\n')}\n\n` +
    `Genera un informe ejecutivo con exactamente 3 insights clínicos-financieros estratégicos. ` +
    `Para cada insight incluye: tendencia observada, impacto estimado en rentabilidad y una recomendación concreta. ` +
    `Usa emojis relevantes. Responde en español profesional panameño.`;

  const finalPrompt = `${systemContext}\n\n${userRequest}`;

  // ── Validation: never send empty text to Gemini SDK ─────────────────────────
  if (!finalPrompt || finalPrompt.trim().length === 0) {
    throw new Error('VALIDATION_ERROR: El prompt ensamblado para Gemini está vacío. ' +
      'Verifique que los datos del laboratorio estén disponibles antes de llamar a la API.');
  }

  return finalPrompt;
}

/**
 * Calls the real Gemini API via @google/genai SDK.
 * Throws on empty prompt, missing API key, or SDK errors.
 */
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  // ── Pre-flight validation ───────────────────────────────────────────────────
  const trimmedPrompt = prompt?.trim();
  if (!trimmedPrompt || trimmedPrompt.length === 0) {
    throw new Error('INVALID_ARGUMENT prevenido: El prompt enviado al SDK de Gemini está vacío. ' +
      'Esto causaría "Text part must not be empty". Operación abortada.');
  }

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API_KEY_MISSING: No se encontró VITE_GEMINI_API_KEY en las variables de entorno. ' +
      'Configure la clave en .env.local: VITE_GEMINI_API_KEY=su-clave-aquí');
  }

  // ── SDK call ────────────────────────────────────────────────────────────────
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: trimmedPrompt,
  });

  const text = response.text;

  // ── Post-flight validation ──────────────────────────────────────────────────
  if (!text || text.trim().length === 0) {
    throw new Error('EMPTY_RESPONSE: La API de Gemini devolvió una respuesta vacía. ' +
      'Intente de nuevo o verifique los límites de la API.');
  }

  return text;
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
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<'real' | 'mock' | null>(null);

  // Financial & Operational KPI computations
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';
  const outOfRangeCount = results.filter(r => r.flag && r.flag !== 'NORMAL').length;

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

  const handleRunAiDiagnostics = async () => {
    setIsAiAnalyzing(true);
    setAiInsight(null);
    setAiError(null);
    setAiSource(null);

    try {
      // ── Build the validated prompt ──────────────────────────────────────────
      const prompt = buildAnalyticsPrompt(
        tenant?.name || 'AbregoTech LIS',
        totalOrders,
        totalRevenue,
        avgOrderValue,
        outOfRangeCount
      );

      // ── Check for API key ───────────────────────────────────────────────────
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

      if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('tu-clave')) {
        // ── Real Gemini API call ──────────────────────────────────────────────
        const text = await callGeminiAPI(prompt, apiKey);
        setAiInsight(text);
        setAiSource('real');
      } else {
        // ── Mock response (API key not configured) ────────────────────────────
        console.warn(
          '[ExecutiveAnalyticsAI] VITE_GEMINI_API_KEY no configurada. ' +
          'Usando respuesta simulada. Configure la clave en .env.local para activar la IA real.'
        );
        await new Promise(resolve => setTimeout(resolve, 1200));
        setAiInsight(
          `🤖 **Análisis Predictivo Gemini AI para ${tenant?.name || 'AbregoTech LIS'}**:\n\n` +
          `1. **Pico de Demanda Operativa**: Se detecta una concentración del 64% de la toma de ` +
          `muestras de rutina entre las 6:30 AM y las 9:30 AM en la Sede Vía España. Se sugiere ` +
          `redistribuir a 2 técnicos adicionales para optimizar el TAT de centrífuga.\n\n` +
          `2. **Rentabilidad por Reactivo**: El examen TSH Ultrasensible registra la mayor tasa ` +
          `de crecimiento (+31%) con un margen bruto estimado del 68%.\n\n` +
          `3. **Optimización de Reactivos**: El reactivo de Hemograma en Sede David alcanzará el ` +
          `umbral mínimo de seguridad en 4 días debido a la alta demanda de rutina de la CSS.\n\n` +
          `⚠️ *Modo simulación activo. Configure VITE_GEMINI_API_KEY en .env.local para activar IA real.*`
        );
        setAiSource('mock');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[ExecutiveAnalyticsAI] Error en Gemini AI:', errorMessage);
      setAiError(errorMessage);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-purple-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <span>Fase 4 — Inteligencia de Negocios &amp; Algoritmos Predictivos Gemini AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Executive Financial &amp; Operational BI Dashboard
          </h1>
          <p className="text-purple-100 text-sm mt-1 max-w-xl">
            Métricas ejecutivas consolidando todas las sedes del laboratorio en Panamá con pronóstico de volumen de muestras y analítica de rentabilidad.
          </p>
        </div>

        <button
          id="btn-gemini-ai-diagnostics"
          onClick={handleRunAiDiagnostics}
          disabled={isAiAnalyzing}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow-lg flex items-center space-x-2 shrink-0 border border-purple-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
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

      {/* AI Error Card */}
      {aiError && (
        <div className="bg-rose-950/80 border border-rose-500/60 p-5 rounded-2xl text-white shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>Error en Análisis Gemini AI</span>
          </div>
          <div className="text-xs text-rose-200 font-mono whitespace-pre-wrap leading-relaxed bg-rose-950 p-3 rounded-xl border border-rose-800">
            {aiError}
          </div>
          <p className="text-[11px] text-rose-300">
            Verifique que <code className="bg-rose-900 px-1 rounded">VITE_GEMINI_API_KEY</code> esté correctamente configurada en <code className="bg-rose-900 px-1 rounded">.env.local</code>
          </p>
        </div>
      )}

      {/* Gemini AI Insight Card */}
      {aiInsight && !aiError && (
        <div className="bg-gradient-to-r from-purple-900/90 to-slate-900 border border-purple-500/50 p-6 rounded-2xl text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span>Diagnóstico Predictivo &amp; Recomendaciones Estratégicas</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {aiSource === 'real' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Gemini Real</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase flex items-center space-x-1">
                  <WifiOff className="w-3 h-3" />
                  <span>Simulado</span>
                </span>
              )}
            </div>
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
            <span>Rendimiento Financiero &amp; SLA por Sede</span>
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
