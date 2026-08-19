import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TestTube,
  ShieldCheck,
  Zap,
  RotateCcw,
  Search,
  Filter,
  Plus,
  Flame,
  Activity,
  Layers,
  Thermometer,
  FileWarning,
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Check,
  Sliders,
  Send,
  Building2,
  Calendar
} from 'lucide-react';
import { Specimen } from '../../types';
import {
  evaluateSampleIntegrity,
  SampleIntegrityEvaluation,
  ISO_STABILITY_RULES,
  TubeStabilityRule,
  formatMinutes
} from '../../utils/sampleIntegrityEngine';
import { SampleIntegrityBadge, SampleIntegrityModal } from '../SampleIntegrityStatusWidget';

interface SampleIntegrityMonitorViewProps {
  onNotifySafety?: (msg: string) => void;
}

export const SampleIntegrityMonitorView: React.FC<SampleIntegrityMonitorViewProps> = ({
  onNotifySafety
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [filterTube, setFilterTube] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInspectionSpecimen, setSelectedInspectionSpecimen] = useState<Specimen | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulation controls
  const [simulatedDelayMinutes, setSimulatedDelayMinutes] = useState<number>(0);
  const [showNewSampleModal, setShowNewSampleModal] = useState<boolean>(false);

  // Mock Samples State representing active pre-analytical specimens across branches
  const [specimens, setSpecimens] = useState<Specimen[]>([
    {
      id: 'spec-iso-001',
      orderId: 'ORD-2026-9001',
      barcode: 'BC-EDTA-8821',
      tubeType: 'EDTA_MORADO',
      collectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      phlebotomyTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      receptionAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      collectedBy: 'Lic. Elena Morales (Flebotomía Central)',
      status: 'RECEPTADA',
      temperatureCondition: 'AMBIENTE_20_25',
      preanalyticalNotes: 'Extracción atraumática sin torniquete prolongado'
    },
    {
      id: 'spec-iso-002',
      orderId: 'ORD-2026-9002',
      barcode: 'BC-SUERO-8822',
      tubeType: 'SUERO_ROJO',
      collectedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(), // 1h 50m (close to 2h limit!)
      phlebotomyTime: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      receptionAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      collectedBy: 'Enf. Roberto Díaz (Sede Vía España)',
      status: 'RECEPTADA',
      temperatureCondition: 'AMBIENTE_20_25',
      preanalyticalNotes: 'Traslado motorizado desde sede satélite'
    },
    {
      id: 'spec-iso-003',
      orderId: 'ORD-2026-9003',
      barcode: 'BC-CITRAT-8823',
      tubeType: 'CITRATO_AZUL',
      collectedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(), // 1h 15m (Alert for centrifugation)
      phlebotomyTime: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      receptionAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      collectedBy: 'Lic. Sofía Guardia (Flebotomía Quirófano)',
      status: 'RECEPTADA',
      temperatureCondition: 'AMBIENTE_20_25',
      preanalyticalNotes: 'Tubo llenado exactamente al 100% de la marca'
    },
    {
      id: 'spec-iso-004',
      orderId: 'ORD-2026-9004',
      barcode: 'BC-GAS-8824',
      tubeType: 'HEPARINA_VERDE',
      collectedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 min -> Exceeded 30 min STAT limit!
      phlebotomyTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      receptionAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      collectedBy: 'Dr. Fernando Vega (UCI)',
      status: 'RECEPTADA',
      temperatureCondition: 'AMBIENTE_20_25',
      preanalyticalNotes: 'Jeringa heparinizada sin burbuja'
    },
    {
      id: 'spec-iso-005',
      orderId: 'ORD-2026-9005',
      barcode: 'BC-SUERO-8825',
      tubeType: 'SUERO_ROJO',
      collectedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      phlebotomyTime: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      centrifugedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      isSeparated: true,
      collectedBy: 'Lic. Elena Morales (Flebotomía Central)',
      status: 'EN_ANALIZADOR',
      temperatureCondition: 'REFRIGERADA_2_8',
      preanalyticalNotes: 'Centrifugado a 2000g x 10 min. Gel barrera intacto'
    },
    {
      id: 'spec-iso-006',
      orderId: 'ORD-2026-9006',
      barcode: 'BC-URI-8826',
      tubeType: 'ORINA',
      collectedAt: new Date(Date.now() - 130 * 60 * 1000).toISOString(), // > 2 hours -> Alert
      phlebotomyTime: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
      receptionAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      collectedBy: 'Paciente Ambulatorio',
      status: 'RECEPTADA',
      temperatureCondition: 'AMBIENTE_20_25',
      preanalyticalNotes: 'Segunda micción de la mañana'
    }
  ]);

  // Timer Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (onNotifySafety) onNotifySafety(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Evaluation computation for all specimens
  const evaluatedSpecimens = specimens.map((spec) => {
    // If delay simulation is applied
    let effectiveDate = new Date();
    if (simulatedDelayMinutes > 0) {
      effectiveDate = new Date(effectiveDate.getTime() + simulatedDelayMinutes * 60 * 1000);
    }
    const evalData = evaluateSampleIntegrity(spec, effectiveDate);
    return {
      specimen: spec,
      evalData
    };
  });

  // Filters
  const filteredList = evaluatedSpecimens.filter(({ specimen, evalData }) => {
    const matchesTube = filterTube === 'ALL' || evalData.tubeType === filterTube;
    const matchesStatus = filterStatus === 'ALL' || evalData.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      specimen.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specimen.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (specimen.collectedBy || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTube && matchesStatus && matchesSearch;
  });

  // Summary Metrics
  const totalCount = evaluatedSpecimens.length;
  const optimalCount = evaluatedSpecimens.filter((e) => e.evalData.status === 'OPTIMO' || e.evalData.status === 'ESTABILIZADO_SEPARADO').length;
  const alertCount = evaluatedSpecimens.filter((e) => e.evalData.status === 'ALERTA').length;
  const expiredCount = evaluatedSpecimens.filter((e) => e.evalData.status === 'CRITICO_EXPIRADO').length;

  // Actions
  const handleMarkCentrifuged = (specId: string) => {
    const nowIso = new Date().toISOString();
    setSpecimens((prev) =>
      prev.map((s) =>
        s.id === specId
          ? {
              ...s,
              centrifugedAt: nowIso,
              isSeparated: true,
              status: 'EN_ANALIZADOR'
            }
          : s
      )
    );
    showToast(`✓ Muestra ${specId} centrifugada y separada. Estabilidad preanalítica asegurada.`);
  };

  const handleMarkRefrigerated = (specId: string) => {
    setSpecimens((prev) =>
      prev.map((s) =>
        s.id === specId
          ? {
              ...s,
              temperatureCondition: 'REFRIGERADA_2_8'
            }
          : s
      )
    );
    showToast(`❄️ Muestra ${specId} transferida a cadena de frío (2-8°C). Ventana de estabilidad extendida.`);
  };

  const handleLogNonConformity = (specId: string, barcode: string) => {
    setSpecimens((prev) =>
      prev.map((s) =>
        s.id === specId
          ? {
              ...s,
              status: 'DESECHADA',
              preanalyticalNotes: 'NO CONFORMIDAD ISO 15189 §7.2.4: Muestra vencida preanalíticamente. Solicitada re-toma STAT.'
            }
          : s
      )
    );
    showToast(`⚠️ NO CONFORMIDAD REGISTRADA: Muestra #${barcode} rechazada por inestabilidad. Se generó solicitud de re-toma.`);
  };

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[250] bg-slate-900/95 border border-teal-500/60 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-[0_10px_35px_rgba(20,184,166,0.35)] backdrop-blur-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950/60 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-black uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Protocolo ISO 15189:2022 §7.2.4 & CLSI GP44-A4</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <Clock className="w-7 h-7 text-teal-400" />
              <span>Monitor de Integridad y Estabilidad de Muestras</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Supervisión cinética en tiempo real del tiempo transcurrido desde la <strong>flebotomía / punción</strong> hasta la centrifugación y entrada a analizadores para prevenir sesgos preanalíticos en glucosa, potasio, coagulación y hematimetría.
            </p>
          </div>

          {/* Simulation & Stress Testing Controls */}
          <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl space-y-3 shrink-0 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulador de Retraso de Transporte:</span>
              </span>
              <span className="font-mono font-bold text-amber-300">+{simulatedDelayMinutes} min</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSimulatedDelayMinutes(0)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                  simulatedDelayMinutes === 0 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Tiempo Real
              </button>
              <button
                onClick={() => setSimulatedDelayMinutes(45)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                  simulatedDelayMinutes === 45 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                +45 min (Tráfico)
              </button>
              <button
                onClick={() => setSimulatedDelayMinutes(120)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                  simulatedDelayMinutes === 120 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                +120 min (Crítico)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-white/5 p-4 sm:p-5 rounded-3xl space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Muestras en Proceso</div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-500">Supervisadas por ISO 15189</div>
        </div>

        <div className="bg-slate-900/70 border border-emerald-500/20 p-4 sm:p-5 rounded-3xl space-y-1">
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Estado Óptimo / Separado</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{optimalCount}</div>
          <div className="text-[10px] text-emerald-400/80">Dentro de ventana cinética</div>
        </div>

        <div className="bg-slate-900/70 border border-amber-500/30 p-4 sm:p-5 rounded-3xl space-y-1">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Alerta de Estabilidad</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{alertCount}</div>
          <div className="text-[10px] text-amber-400/80">Próximos a límite de tolerancia</div>
        </div>

        <div className="bg-slate-900/70 border border-rose-500/40 p-4 sm:p-5 rounded-3xl space-y-1">
          <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Crítico / Expirado ISO</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">{expiredCount}</div>
          <div className="text-[10px] text-rose-400/80">Riesgo de sesgo preanalítico</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por código de barras, orden o flebotomista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 font-bold rounded-lg transition ${
              filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('ALERTA')}
            className={`px-3 py-1.5 font-bold rounded-lg transition ${
              filterStatus === 'ALERTA' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Alertas ({alertCount})
          </button>
          <button
            onClick={() => setFilterStatus('CRITICO_EXPIRADO')}
            className={`px-3 py-1.5 font-bold rounded-lg transition ${
              filterStatus === 'CRITICO_EXPIRADO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Expirados ({expiredCount})
          </button>
        </div>

        {/* Tube Type Filter */}
        <select
          value={filterTube}
          onChange={(e) => setFilterTube(e.target.value)}
          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none focus:border-teal-500"
        >
          <option value="ALL">Todos los Tipos de Tubo</option>
          <option value="SUERO_ROJO">Suero Rojo/Oro (Química)</option>
          <option value="EDTA_MORADO">EDTA Morado (Hematología)</option>
          <option value="CITRATO_AZUL">Citrato Azul (Coagulación)</option>
          <option value="HEPARINA_VERDE">Heparina Verde (Gases/STAT)</option>
          <option value="ORINA">Orina / Sedimento</option>
          <option value="LCR">LCR / Cavidades</option>
        </select>
      </div>

      {/* Grid of Monitored Specimens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-dashed border-white/10">
            No se encontraron muestras que coincidan con los filtros de integridad seleccionados.
          </div>
        ) : (
          filteredList.map(({ specimen, evalData }) => {
            const isExpired = evalData.status === 'CRITICO_EXPIRADO';
            const isAlert = evalData.status === 'ALERTA';

            return (
              <div
                key={specimen.id}
                className={`bg-slate-900/80 border rounded-3xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between ${
                  isExpired
                    ? 'border-rose-500/60 bg-rose-950/20 ring-1 ring-rose-500/30'
                    : isAlert
                    ? 'border-amber-500/50 bg-amber-950/15'
                    : 'border-white/10 hover:border-teal-500/40'
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: evalData.rule.colorHex }}
                      />
                      <span className="font-mono font-black text-sm text-white">{specimen.barcode}</span>
                    </div>

                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full border ${evalData.statusBadgeColor}`}>
                      {evalData.statusLabel}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-bold mb-1">
                    {evalData.rule.displayName}
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                    <span>Orden: <strong className="text-white">{specimen.orderId}</strong></span>
                    <span>•</span>
                    <span>Toma: {new Date(evalData.phlebotomyTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Stability Progress Bar */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">
                      Transcurrido: <strong className="text-white">{evalData.elapsedFormatted}</strong>
                    </span>
                    <span className="text-teal-400">
                      Límite ISO: <strong>{formatMinutes(evalData.maxAllowedMinutes)}</strong>
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-500 ${evalData.progressBarColor}`}
                      style={{ width: `${Math.min(100, Math.round(evalData.fractionUsed * 100))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Flebotomía (0m)</span>
                    <span className={isExpired ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {isExpired ? 'VENTANA VENCIDA' : `${evalData.remainingFormatted} restantes`}
                    </span>
                  </div>
                </div>

                {/* Preanalytical Warnings if degraded */}
                {evalData.deviationSummary && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 space-y-1">
                    <div className="flex items-center space-x-1 font-bold">
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>Desviación Preanalítica Identificada:</span>
                    </div>
                    <p className="text-[9px] text-slate-300">{evalData.deviationSummary}</p>
                  </div>
                )}

                {/* Quick Technician Actions */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedInspectionSpecimen(specimen)}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-bold underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Auditar ISO 15189</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {!specimen.centrifugedAt && evalData.tubeType === 'SUERO_ROJO' && (
                      <button
                        onClick={() => handleMarkCentrifuged(specimen.id)}
                        className="px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Centrifugar suero y separar coágulo para estabilizar glucosa y potasio"
                      >
                        Centrifugar
                      </button>
                    )}

                    {specimen.temperatureCondition !== 'REFRIGERADA_2_8' && (
                      <button
                        onClick={() => handleMarkRefrigerated(specimen.id)}
                        className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Refrigerar a 2-8°C para extender estabilidad"
                      >
                        2-8°C
                      </button>
                    )}

                    {isExpired && (
                      <button
                        onClick={() => handleLogNonConformity(specimen.id, specimen.barcode)}
                        className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Registrar No Conformidad y solicitar re-toma"
                      >
                        Rechazar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ISO Reference Guideline Box */}
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center space-x-2">
          <Award className="w-4 h-4" />
          <span>Matriz de Estabilidad Preanalítica Normativa (CLSI / ISO 15189)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="font-bold text-slate-200">K2/K3 EDTA (Tubo Morado)</div>
            <div className="text-[11px] text-slate-400">Máx 6h a temp ambiente (24h a 2-8°C).</div>
            <div className="text-[10px] text-rose-400 font-mono">Sensible: Morfología leucocitaria, VCM, Plaquetas.</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="font-bold text-slate-200">Suero Rojo / Oro (Química)</div>
            <div className="text-[11px] text-slate-400">Máx 2h sin centrifugar (48h separado a 2-8°C).</div>
            <div className="text-[10px] text-rose-400 font-mono">Sensible: Glucosa (-7%/h), Potasio K+ (+0.4 mmol/h).</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <div className="font-bold text-slate-200">Citrato 3.2% (Coagulación)</div>
            <div className="text-[11px] text-slate-400">Máx 4h para TP; 2h para TPT/APTT. NO refrigerar.</div>
            <div className="text-[10px] text-rose-400 font-mono">Sensible: Factor VIII, Factor V, Fibrinógeno.</div>
          </div>
        </div>
      </div>

      {/* Modal for detailed inspection */}
      {selectedInspectionSpecimen && (
        <SampleIntegrityModal
          specimen={selectedInspectionSpecimen}
          evaluation={evaluateSampleIntegrity(selectedInspectionSpecimen, now)}
          onClose={() => setSelectedInspectionSpecimen(null)}
          onUpdateSpecimen={(updated) => {
            setSpecimens((prev) =>
              prev.map((s) => (s.id === selectedInspectionSpecimen.id ? { ...s, ...updated } : s))
            );
            setSelectedInspectionSpecimen(null);
          }}
        />
      )}
    </div>
  );
};
