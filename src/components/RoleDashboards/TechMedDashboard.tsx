import React, { useState } from 'react';
import { TestResult, Order, Analyzer, Patient } from '../../types';
import { useLisStore } from '../../store/useLisStore';
import {
  Users, FileText, Activity, AlertTriangle, ShieldCheck, HeartPulse,
  Search, ChevronRight, Microscope, Terminal, Calculator, Droplets,
  Clock, TrendingUp, Filter, Sparkles, CheckCircle2, UserCheck, Flame,
  XCircle, Check, ArrowUpRight, FlaskConical, ExternalLink
} from 'lucide-react';

interface TechMedDashboardProps {
  results: TestResult[];
  orders: Order[];
  analyzers: Analyzer[];
  patients?: Patient[];
  onValidateTechnical?: (resultId: string) => void;
  onValidateTechnicalBulk?: (resultIds: string[]) => void;
}

export const TechMedDashboard: React.FC<TechMedDashboardProps> = ({
  results,
  orders,
  analyzers,
  patients = [],
  onValidateTechnical
}) => {
  const { setActiveTab, setActiveOrder, validateResult, currentUser } = useLisStore();
  const [patientSearch, setPatientSearch] = useState('');

  // Local validated results tracker for real-time UI feedback
  const [validatedResultIds, setValidatedResultIds] = useState<string[]>([]);

  // Clinical Metrics Calculations
  const pendingValidation = results.filter(r => r.status === 'PENDIENTE' && !validatedResultIds.includes(r.id));
  const validatedResultsCount = results.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO' || validatedResultIds.includes(r.id)).length;
  const criticalResults = results.filter(r => r.flag?.includes('CRITICO') || (r.numericValue && r.numericValue > 100));
  const activeAnalyzersCount = analyzers.filter(a => a.status === 'ONLINE' || (a.status as any) === 'En línea').length;
  const rejectedSamplesCount = 3; // HIL 3+ Hemolyzed & Clotted pre-analytical rejections

  // Demographic Metrics (Mujeres vs Hombres)
  const femalePatientsCount = 14;
  const malePatientsCount = 10;
  const totalPatientsCount = femalePatientsCount + malePatientsCount;
  const femalePercent = Math.round((femalePatientsCount / totalPatientsCount) * 100);
  const malePercent = 100 - femalePercent;

  // Handle direct Technical Validation click
  const handleDirectValidation = (resultId: string, paramName: string) => {
    if (onValidateTechnical) {
      onValidateTechnical(resultId);
    } else {
      validateResult(resultId, currentUser?.name || 'Lic. Sofía Guardia (TM)');
    }

    setValidatedResultIds((prev) => [...prev, resultId]);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `✓ Analito '${paramName}' validado técnicamente por ${currentUser?.name || 'Lic. Sofía Guardia'}.`,
          type: 'success',
          duration: 3000
        }
      })
    );
  };

  // Handle direct navigation to full Order in ResultEntryWorkspace
  const handleOpenCompleteOrder = (orderId: string) => {
    setActiveOrder(orderId);
    setActiveTab('validation');
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `Cargando orden completa #${orderId} en Workstation de Validación...`,
          type: 'info',
          duration: 2500
        }
      })
    );
  };

  // Filtered Patient Test Results for Table
  const filteredResults = results.filter((r) => {
    const matchedOrder = orders.find(o => o.id === r.orderId);
    const matchedPatient = patients.find(p => p.id === matchedOrder?.patientId);

    const matchesSearch = !patientSearch.trim() ||
      r.orderId.toLowerCase().includes(patientSearch.toLowerCase()) ||
      r.parameterName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (matchedPatient && matchedPatient.name.toLowerCase().includes(patientSearch.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-100">

      {/* 🏥 Top 5 Clinical & Demographic KPI Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* 1. Demographic Gender Ratio (Mujeres vs Hombres) */}
        <div
          onClick={() => setActiveTab('patient_results')}
          className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-purple-500/30 hover:border-purple-400 p-4 rounded-3xl shadow-xl space-y-2 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest">
              Género
            </span>
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span className="text-rose-400 font-extrabold">👩 {femalePercent}%</span>
              <span className="text-slate-500 font-bold">/</span>
              <span className="text-cyan-400 font-extrabold">👨 {malePercent}%</span>
            </div>
            <div className="text-[11px] font-bold text-slate-300 mt-1 flex items-center justify-between">
              <span>{femalePatientsCount} Mujeres / {malePatientsCount} Hombres</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* 2. Validated Test Results */}
        <div
          onClick={() => setActiveTab('validation')}
          className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-emerald-500/30 hover:border-emerald-400 p-4 rounded-3xl shadow-xl space-y-2 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
              Firma TM
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span className="text-emerald-400">{validatedResultsCount}</span>
              <span className="text-xs text-slate-400 font-normal">analitos</span>
            </div>
            <div className="text-[11px] font-bold text-slate-300 mt-1 flex items-center justify-between">
              <span>Validados Técnicamente</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* 3. Pre-analytical Rejections & HIL Hemolysis */}
        <div
          onClick={() => setActiveTab('lis_hil')}
          className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-amber-500/30 hover:border-amber-400 p-4 rounded-3xl shadow-xl space-y-2 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
              Preanalítica
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span className="text-amber-300">{rejectedSamplesCount}</span>
              <span className="text-xs text-slate-400 font-normal">muestras</span>
            </div>
            <div className="text-[11px] font-bold text-slate-300 mt-1 flex items-center justify-between">
              <span>Rechazos / HIL 3+</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* 4. Total Tests Processed / In Progress */}
        <div
          onClick={() => setActiveTab('tm_workbench')}
          className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-cyan-500/30 hover:border-cyan-400 p-4 rounded-3xl shadow-xl space-y-2 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-widest">
              Bancada
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span>{results.length}</span>
              <span className="text-xs text-slate-400 font-normal">analitos hoy</span>
            </div>
            <div className="text-[11px] font-bold text-slate-300 mt-1 flex items-center justify-between">
              <span>Pruebas en Procesamiento</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* 5. Critical Panic Alerts ISO 15189 */}
        <div
          onClick={() => setActiveTab('lis_panic')}
          className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-rose-500/40 hover:border-rose-400 p-4 rounded-3xl shadow-xl space-y-2 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 uppercase tracking-widest animate-pulse">
              ISO 15189
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span className="text-rose-400">{criticalResults.length || 1}</span>
              <span className="text-xs text-slate-400 font-normal">alertas</span>
            </div>
            <div className="text-[11px] font-bold text-slate-300 mt-1 flex items-center justify-between">
              <span>Valores Críticos Pánico</span>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

      </div>

      {/* 🧪 CLINICAL DEMOGRAPHICS & EPIDEMIOLOGICAL PANEL (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT 2-COLUMNS: Demographic Data & Test Volume Trends */}
        <div className="lg:col-span-2 space-y-6">

          {/* Demographic & Clinical Insights Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Análisis Demográfico de Pacientes Atendidos
                  </h3>
                  <p className="text-[11px] text-slate-400">Distribución por género, grupos de edad y demanda por sección médica</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% Pacientes este Mes</span>
              </div>
            </div>

            {/* Gender & Demographic Ratio Bar */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-extrabold">
                <span className="text-rose-300 flex items-center gap-1">👩 Pacientes Mujeres: <strong>{femalePatientsCount} ({femalePercent}%)</strong></span>
                <span className="text-cyan-300 flex items-center gap-1">👨 Pacientes Hombres: <strong>{malePatientsCount} ({malePercent}%)</strong></span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400" style={{ width: `${femalePercent}%` }} title={`Mujeres: ${femalePercent}%`}></div>
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${malePercent}%` }} title={`Hombres: ${malePercent}%`}></div>
              </div>
            </div>

            {/* Demographic Distribution Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Grupo Pediátrico (&lt; 18 años)</span>
                <strong className="text-xl font-black text-white font-mono block">18% <span className="text-xs text-cyan-400 font-normal">(432 pac)</span></strong>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Adultos (18 - 60 años)</span>
                <strong className="text-xl font-black text-white font-mono block">58% <span className="text-xs text-blue-400 font-normal">(1,392 pac)</span></strong>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Adulto Mayor (&gt; 60 años)</span>
                <strong className="text-xl font-black text-white font-mono block">24% <span className="text-xs text-purple-400 font-normal">(576 pac)</span></strong>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '24%' }}></div>
                </div>
              </div>
            </div>

            {/* Test Demand by Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Demanda de Pruebas Clínicas por Sección</h4>
              <div className="space-y-2.5">
                {[
                  { section: 'Hematología Completa (Hemograma, Plaquetas, VSG)', count: '890 pruebas', percent: 85, color: 'bg-cyan-400' },
                  { section: 'Química Clínica (Glucosa, Perfil Lipídico, Renal, Hepático)', count: '1,120 pruebas', percent: 92, color: 'bg-blue-500' },
                  { section: 'Inmunología & Marcadores Cardíacos (Troponina, TSH, PSA)', count: '340 pruebas', percent: 64, color: 'bg-purple-500' },
                  { section: 'Urianálisis & Coprología', count: '130 pruebas', percent: 42, color: 'bg-amber-400' }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>{item.section}</span>
                      <span className="font-mono text-cyan-300">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 📊 Individual Test Determinations Breakdown Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Cantidades de Pruebas & Determinaciones Realizadas Individualmente
                  </h4>
                  <p className="text-[10px] text-slate-400">Total de exámenes procesados por analito específico en la jornada</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-1 rounded-full font-bold">
                702 Total Determinaciones
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { test: 'Leucocitos (WBC)', count: 142, category: 'Hematología', percent: 92 },
                { test: 'Hemoglobina (HGB)', count: 138, category: 'Hematología', percent: 90 },
                { test: 'Plaquetas (PLT)', count: 135, category: 'Hematología', percent: 88 },
                { test: 'Glucosa en Ayunas', count: 118, category: 'Química', percent: 82 },
                { test: 'Colesterol Total', count: 86, category: 'Química', percent: 75 },
                { test: 'Triglicéridos', count: 84, category: 'Química', percent: 72 },
                { test: 'Troponina I Ultrasensible', count: 48, category: 'Inmunología', percent: 65 },
                { test: 'TSH Ultrasensible', count: 64, category: 'Inmunología', percent: 60 },
                { test: 'Sodio / Potasio (Na+/K+)', count: 98, category: 'Electrolitos', percent: 78 },
                { test: 'Urianálisis Físico-Químico', count: 64, category: 'Urianálisis', percent: 55 },
                { test: 'Pruebas Cruzadas (Crossmatch)', count: 32, category: 'Banco Sangre', percent: 40 },
                { test: 'Coombs Directo / Indirecto', count: 28, category: 'Banco Sangre', percent: 35 },
              ].map((item, index) => (
                <div key={index} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 hover:border-cyan-500/40 transition">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.category}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.count} test
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white truncate">{item.test}</h5>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.percent}% de demanda</div>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style={{ width: `${item.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 📋 Live Patient Test Results Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">

            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Muestras de Pacientes en Proceso de Validación
                </h4>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente o examen..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Paciente / Orden</th>
                    <th className="p-3">Examen / Analito</th>
                    <th className="p-3 text-center">Resultado</th>
                    <th className="p-3 text-center">Bandera / Alerta</th>
                    <th className="p-3 text-right">Acción TM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredResults.slice(0, 6).map((r) => {
                    const matchedOrder = orders.find(o => o.id === r.orderId);
                    const matchedPatient = patients.find(p => p.id === matchedOrder?.patientId);
                    const isCritical = r.flag?.includes('CRITICO') || (r.numericValue && r.numericValue > 100);
                    const isValidated = r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO' || validatedResultIds.includes(r.id);

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/60 transition">
                        <td className="p-3">
                          <button
                            onClick={() => handleOpenCompleteOrder(r.orderId)}
                            className="font-extrabold text-white hover:text-cyan-300 cursor-pointer block text-left"
                            title="Click para ver la orden completa del paciente"
                          >
                            {matchedPatient?.name || 'Gonzalo A. Ríos'}
                          </button>
                          <button
                            onClick={() => handleOpenCompleteOrder(r.orderId)}
                            className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer flex items-center gap-1 mt-0.5"
                            title="Abrir orden completa en Workstation"
                          >
                            <span>#{r.orderId}</span>
                            <span>• {matchedPatient?.nationalId || '8-812-4432'}</span>
                            <ExternalLink className="w-3 h-3 text-cyan-400" />
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-200">{r.parameterName}</div>
                          <div className="text-[10px] text-slate-400">Ref: {r.referenceRange || '3.5 - 5.1'}</div>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-sm text-white">
                          {r.value} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span>
                        </td>
                        <td className="p-3 text-center">
                          {isValidated ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black flex items-center justify-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>VALIDADO TÉCNICAMENTE</span>
                            </span>
                          ) : isCritical ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse">
                              ⚠️ PÁNICO ISO
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              ⌛ PENDIENTE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isValidated ? (
                              <span className="text-[11px] font-mono font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Firmado</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDirectValidation(r.id, r.parameterName)}
                                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] transition shadow-md shadow-cyan-500/20 cursor-pointer"
                              >
                                Validar
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenCompleteOrder(r.orderId)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 transition cursor-pointer"
                              title="Abrir Orden Completa"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT 1-COLUMN: Epidemiological Alerts & TM Clinical Launchpad */}
        <div className="space-y-6">

          {/* Clean Analyzer Hardware Status Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Equipos en Línea: {activeAnalyzersCount}/{analyzers.length}
                </span>
              </div>

              <button
                onClick={() => setActiveTab('middleware')}
                className="text-[10px] font-mono font-bold text-cyan-400 underline hover:text-cyan-300 cursor-pointer"
              >
                Ver Middleware
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Los detalles técnicos de puertos/sockets ASTM están aislados en la sección dedicada de Middleware & Drivers.
            </p>
          </div>

          {/* Epidemiological Pandemic Alert Box (MINSA) */}
          <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-amber-300 font-black text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Alerta Epidemiológica Activa</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Dengue NS1 Antigen (+)</span>
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">Notificación Obligatoria</span>
                </div>
                <p className="text-[10px] text-slate-400">3 casos confirmados esta semana en Sede Vía España. Reporte MINSA generado.</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Influenza A H1N1 (+)</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">Brote Controlado</span>
                </div>
                <p className="text-[10px] text-slate-400">Muestras derivadas a tamizaje molecular.</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('minsa')}
              className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-2xl transition cursor-pointer text-center block"
            >
              Ir a Boletines MINSA
            </button>
          </div>

          {/* Clinical Workstation Shortcuts */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
              Atención Clínica Rápida
            </div>

            <div
              onClick={() => setActiveTab('lis_panic')}
              className="p-4 rounded-3xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-400 cursor-pointer group transition-all space-y-1.5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Bitácora de Pánicos ISO 15189</h4>
              <p className="text-[10px] text-slate-400 leading-snug">Registro telefónico obligatorio de resultados críticos</p>
            </div>

            <div
              onClick={() => setActiveTab('lis_hil')}
              className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400 cursor-pointer group transition-all space-y-1.5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  <Droplets className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Preanalítica & Hemólisis HIL</h4>
              <p className="text-[10px] text-slate-400 leading-snug">Inspección de muestras suero/plasma antes del informe final</p>
            </div>

            <div
              onClick={() => setActiveTab('lis_calculators')}
              className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400 cursor-pointer group transition-all space-y-1.5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <Calculator className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Calculadoras Clínicas</h4>
              <p className="text-[10px] text-slate-400 leading-snug">Depuración eGFR, LDL Martin-Hopkins & HOMA-IR</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
