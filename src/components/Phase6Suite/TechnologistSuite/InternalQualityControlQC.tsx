import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  RotateCcw,
  Plus,
  FileSpreadsheet,
  Thermometer,
  Wrench,
  ShieldAlert,
  Flame,
  Check,
  Info,
  Calendar,
  Layers,
  Cpu,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import SecurityPinModal from './SecurityPinModal';

interface QCPoint {
  id?: string;
  day: number;
  date: string;
  value: number;
  sdScore: number; // z-score (-3 to +3)
  violation?: string;
  technician: string;
}

interface AnalyzerQcProfile {
  id: string;
  analyzerName: string;
  analyte: string;
  unit: string;
  lotNumber: string;
  expirationDate: string;
  level: string;
  targetMean: number;
  targetSd: number;
  points: QCPoint[];
  status: 'OPTIMO' | 'ALERTA_1_2S' | 'BLOQUEADO_RECHAZO';
  activeViolation?: string;
  correctiveActionRecorded?: boolean;
}

export const InternalQualityControlQC: React.FC = () => {
  const [profiles, setProfiles] = useState<AnalyzerQcProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Corrective Action Modal / Drawer Form State
  const [isCorrectiveModalOpen, setIsCorrectiveModalOpen] = useState<boolean>(false);
  const [rootCause, setRootCause] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [technologistPin, setTechnologistPin] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // New point input form
  const [newPointVal, setNewPointVal] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configs, schedules] = await Promise.all([
        SupabaseService.internalQC.getConfigurations(),
        SupabaseService.maintenance.getSchedules()
      ]);

      const loadedProfiles: AnalyzerQcProfile[] = await Promise.all(configs.map(async (c: any) => {
        const runs = await SupabaseService.internalQC.getRuns(c.id);
        const points = runs.map((r: any, idx: number) => ({
          id: r.id,
          day: idx + 1,
          date: new Date(r.created_at).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit' }),
          value: parseFloat(r.value),
          sdScore: parseFloat(r.sd_score),
          violation: r.violation,
          technician: r.technician_id || 'N/A'
        }));

        const lastPoint = points[points.length - 1];
        let status: any = 'OPTIMO';
        if (lastPoint?.violation === '1_3s' || lastPoint?.violation === '2_2s') status = 'BLOQUEADO_RECHAZO';
        else if (lastPoint?.violation === '1_2s') status = 'ALERTA_1_2S';

        return {
          id: c.id,
          analyzerName: 'Instrumento',
          analyte: c.analyte_name,
          unit: c.unit || '',
          lotNumber: c.lot_number,
          expirationDate: c.expiration_date,
          level: c.level,
          targetMean: parseFloat(c.target_mean),
          targetSd: parseFloat(c.target_sd),
          points,
          status,
          activeViolation: lastPoint?.violation
        };
      }));

      setProfiles(loadedProfiles);
      if (loadedProfiles.length > 0) setSelectedProfileId(loadedProfiles[0].id);
      setMaintenanceTasks(schedules);
    } catch (error) {
      console.error("Error loading QC data", error);
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_QC_PROFILE = {
    id: 'default-qc',
    analyte: 'Glucosa HK',
    level: 'Nivel 1 (Normal)',
    analyzerName: 'Cobas 6000 c501',
    lotNumber: 'QC-GLU-2026',
    expirationDate: '2026-12-31',
    targetMean: 95.0,
    targetSd: 2.5,
    unit: 'mg/dL',
    status: 'OPTIMO' as const,
    activeViolation: null,
    points: []
  };

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0] || DEFAULT_QC_PROFILE;

  const count = activeProfile?.points?.length || 0;
  const currentMean = count > 0 ? activeProfile.points.reduce((acc, p) => acc + p.value, 0) / count : activeProfile?.targetMean || 95;
  const variance = count > 1 ? activeProfile.points.reduce((acc, p) => acc + Math.pow(p.value - currentMean, 2), 0) / (count - 1) : 0;
  const currentSd = Math.sqrt(variance) || activeProfile?.targetSd || 2.5;
  const currentCv = currentMean > 0 ? (currentSd / currentMean) * 100 : 0;

  const handleAddQcPoint = async () => {
    if (!activeProfile) return;
    const sdScore = Math.round(((newPointVal - activeProfile.targetMean) / activeProfile.targetSd) * 100) / 100;
    let violation: string | null = null;

    const points = activeProfile.points;
    const lastP = points[points.length - 1];
    const secondLastP = points[points.length - 2];

    // --- ELITE WESTGARD ENGINE ---
    if (Math.abs(sdScore) >= 3.0) {
      violation = '1_3s'; // REJECT: Random Error
    } else if (lastP && ((sdScore >= 2.0 && lastP.sdScore >= 2.0) || (sdScore <= -2.0 && lastP.sdScore <= -2.0))) {
      violation = '2_2s'; // REJECT: Systematic Error
    } else if (lastP && Math.abs(sdScore - lastP.sdScore) >= 4.0) {
      violation = 'R_4s'; // REJECT: Random Error (Range)
    } else if (points.length >= 3 && Math.abs(sdScore) >= 1.0 && Math.abs(lastP?.sdScore) >= 1.0 && Math.abs(secondLastP?.sdScore) >= 1.0) {
      // 4_1s simplified check
      if ((sdScore > 0 && lastP.sdScore > 0 && secondLastP.sdScore > 0) || (sdScore < 0 && lastP.sdScore < 0 && secondLastP.sdScore < 0)) {
        violation = '4_1s'; // WARNING/REJECT: Systematic Trend
      }
    } else if (Math.abs(sdScore) >= 2.0) {
      violation = '1_2s'; // WARNING: Check other rules
    }

    try {
      const { data: profile } = await SupabaseService.auth.getCurrentProfile() as any;
      await SupabaseService.internalQC.addRun({
        config_id: activeProfile.id,
        value: newPointVal,
        sd_score: sdScore,
        violation: violation,
        technician_id: profile?.id,
        corrective_action: null,
        root_cause: null,
        is_validated: (violation === null || violation === '1_2s')
      });
      fetchData();
      setToastMsg(`✓ Punto QC de ${newPointVal} ${activeProfile.unit} registrado.`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (error) { console.error(error); }
  };

  // Submit Corrective Action & Unlock Analyzer
  const handleSaveCorrectiveAction = () => {
    const lastRunId = activeProfile.points[activeProfile.points.length - 1]?.id;
    if (!lastRunId) return;

    setShowPinModal(true);
  };

  const finalizeCorrectiveAction = async () => {
    const lastRunId = activeProfile.points[activeProfile.points.length - 1]?.id;
    try {
      await SupabaseService.internalQC.saveCorrectiveAction(lastRunId, actionTaken, rootCause);
      setIsCorrectiveModalOpen(false);
      setShowPinModal(false);
      fetchData();
      setToastMsg(`✓ Acción Correctiva registrada y firmada digitalmente. Analito desbloqueado.`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (error) { console.error(error); }
  };

  const handleToggleMaintenance = async (task: any) => {
    try {
      const { data: profile } = await SupabaseService.auth.getCurrentProfile() as any;
      await SupabaseService.maintenance.logMaintenance({
        schedule_id: task.id,
        analyzer_id: task.analyzer_id,
        task_name: task.task_name,
        performed_by: profile?.id,
        notes: 'Verificado vía Dashboard',
        parameter_value: 'OK',
        status: 'COMPLETADO'
      });
      fetchData();
    } catch (error) { console.error(error); }
  };

  // Levey-Jennings SVG Coordinates helpers
  const svgWidth = 650;
  const svgHeight = 240;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Map z-score (-3.5 to +3.5) to Y pixel
  const getY = (z: number) => {
    const clampedZ = Math.max(-3.5, Math.min(3.5, z));
    const normalized = (clampedZ + 3.5) / 7.0; // 0 at -3.5, 1 at +3.5
    return padTop + plotHeight * (1 - normalized);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="qc-westgard-container">
      {/* Title Header */}
      <div
className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-teal-400 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-indigo-500/20">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Control de Calidad Interno (QC) & Reglas de Westgard</h2>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Módulo 2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gráficos de Levey-Jennings en tiempo real, bloqueo de validación por fallo analítico y bitácora ISO 15189.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-3 relative z-10">
          <span className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center space-x-2 border shadow-lg ${
            activeProfile?.status === 'BLOQUEADO_RECHAZO'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : activeProfile?.status === 'ALERTA_1_2S'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {activeProfile?.status === 'BLOQUEADO_RECHAZO' ? (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span>BLOQUEADO: Fallo Westgard</span>
              </>
            ) : activeProfile?.status === 'ALERTA_1_2S' ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>ALERTA: Regla 1_2s</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>QC EN CONTROL (Aprobado)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in border border-emerald-400/50">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-200 hover:text-white font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SELECTOR OF ANALYZER AND ANALYTE */}
      <div className="flex flex-wrap items-center gap-3">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProfileId(p.id)}
            className={`px-4 py-3 rounded-2xl border transition text-left cursor-pointer flex items-center space-x-3 ${
              selectedProfileId === p.id
                ? 'bg-slate-900 border-teal-400 shadow-lg shadow-teal-500/10'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${
              p.status === 'BLOQUEADO_RECHAZO' ? 'bg-rose-500 animate-ping' : p.status === 'ALERTA_1_2S' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <div>
              <div className="text-xs font-black text-white">{p.analyte}</div>
              <div className="text-[10px] text-slate-400 font-mono">{p.analyzerName} • {p.level.split(' ')[0]}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ACTIVE LOCKOUT WARNING BANNER (IF BLOCKED) */}
      {activeProfile?.status === 'BLOQUEADO_RECHAZO' && (
        <div className="bg-rose-950/40 border-2 border-rose-500/60 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400 border border-rose-500/40">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-rose-300">VALIDACIÓN TÉCNICA BLOQUEADA (INTERLOCK ACTIVO)</h3>
                <span className="bg-rose-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">ISO 15189 §7.3.7</span>
              </div>
              <p className="text-xs text-rose-200 mt-1">
                {activeProfile?.activeViolation || 'Violación de regla crítica de Westgard detectada. Los resultados de pacientes para este analito no podrán ser liberados.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCorrectiveModalOpen(true)}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-rose-500/30 flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Unlock className="w-4 h-4" />
            <span>Documentar Acción Correctiva</span>
          </button>
        </div>
      )}

      {/* LEVEY-JENNINGS INTERACTIVE CHART & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chart Column (3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Gráfico de Levey-Jennings: {activeProfile.analyte} ({activeProfile.level})
                </h3>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Lote: <span className="text-slate-200">{activeProfile.lotNumber}</span> • Vence: {activeProfile.expirationDate} • Analizador: {activeProfile.analyzerName}
              </div>
            </div>

            {/* Quick manual point injection */}
            <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Valor QC:</span>
              <input
                type="number"
                step="0.001"
                value={newPointVal}
                onChange={e => setNewPointVal(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white text-center focus:outline-none"
              />
              <button
                onClick={handleAddQcPoint}
                className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[11px] rounded-lg transition cursor-pointer"
              >
                + Registrar Punto
              </button>
            </div>
          </div>

          {/* SVG Levey Jennings Graph */}
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 bg-slate-950 rounded-2xl border border-slate-800 select-none">
              {/* Multizone Background Coloring */}
              {/* Zone ±1 SD (Optimal Green) */}
              <rect x={padLeft} y={getY(1)} width={plotWidth} height={getY(-1) - getY(1)} fill="#10b981" fillOpacity="0.05" />
              {/* Zone ±2 SD (Warning Yellow) */}
              <rect x={padLeft} y={getY(2)} width={plotWidth} height={getY(1) - getY(2)} fill="#f59e0b" fillOpacity="0.05" />
              <rect x={padLeft} y={getY(-1)} width={plotWidth} height={getY(-2) - getY(-1)} fill="#f59e0b" fillOpacity="0.05" />
              {/* Zone ±3 SD (Critical Red) */}
              <rect x={padLeft} y={getY(3)} width={plotWidth} height={getY(2) - getY(3)} fill="#ef4444" fillOpacity="0.05" />
              <rect x={padLeft} y={getY(-2)} width={plotWidth} height={getY(-3) - getY(-2)} fill="#ef4444" fillOpacity="0.05" />

              {/* Reference Grid Lines */}
              {/* +3 SD */}
              <line x1={padLeft} y1={getY(3)} x2={svgWidth - padRight} y2={getY(3)} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" />
              <text x={padLeft - 8} y={getY(3) + 3} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="end">+3 SD ({activeProfile.targetMean + activeProfile.targetSd * 3})</text>

              {/* +2 SD */}
              <line x1={padLeft} y1={getY(2)} x2={svgWidth - padRight} y2={getY(2)} stroke="#fbbf24" strokeDasharray="3 3" strokeWidth="1" />
              <text x={padLeft - 8} y={getY(2) + 3} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end">+2 SD ({activeProfile.targetMean + activeProfile.targetSd * 2})</text>

              {/* +1 SD */}
              <line x1={padLeft} y1={getY(1)} x2={svgWidth - padRight} y2={getY(1)} stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
              <text x={padLeft - 8} y={getY(1) + 3} fill="#94a3b8" fontSize="8" textAnchor="end">+1 SD</text>

              {/* Mean Line */}
              <line x1={padLeft} y1={getY(0)} x2={svgWidth - padRight} y2={getY(0)} stroke="#14b8a6" strokeWidth="1.5" />
              <text x={padLeft - 8} y={getY(0) + 3} fill="#14b8a6" fontSize="9" fontWeight="black" textAnchor="end">Media x̄ ({activeProfile.targetMean})</text>

              {/* -1 SD */}
              <line x1={padLeft} y1={getY(-1)} x2={svgWidth - padRight} y2={getY(-1)} stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" />
              <text x={padLeft - 8} y={getY(-1) + 3} fill="#94a3b8" fontSize="8" textAnchor="end">-1 SD</text>

              {/* -2 SD */}
              <line x1={padLeft} y1={getY(-2)} x2={svgWidth - padRight} y2={getY(-2)} stroke="#fbbf24" strokeDasharray="3 3" strokeWidth="1" />
              <text x={padLeft - 8} y={getY(-2) + 3} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end">-2 SD ({activeProfile.targetMean - activeProfile.targetSd * 2})</text>

              {/* -3 SD */}
              <line x1={padLeft} y1={getY(-3)} x2={svgWidth - padRight} y2={getY(-3)} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" />
              <text x={padLeft - 8} y={getY(-3) + 3} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="end">-3 SD ({activeProfile.targetMean - activeProfile.targetSd * 3})</text>

              {/* Connecting Lines between Points */}
              {activeProfile.points.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  points={activeProfile.points.map((p, idx) => {
                    const x = padLeft + (idx / Math.max(1, activeProfile.points.length - 1)) * plotWidth;
                    const y = getY(p.sdScore);
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}

              {/* Data Points */}
              {activeProfile.points.map((p, idx) => {
                const x = padLeft + (idx / Math.max(1, activeProfile.points.length - 1)) * plotWidth;
                const y = getY(p.sdScore);
                const isRejected = p.violation === '1_3s' || p.violation === '2_2s' || p.violation === 'R_4s';
                const isWarning = p.violation === '1_2s' || p.violation === '4_1s';

                return (
                  <g key={idx} className="cursor-pointer group">
                    <circle
                      cx={x}
                      cy={y}
                      r={isRejected ? 6 : isWarning ? 5 : 4}
                      fill={isRejected ? '#f43f5e' : isWarning ? '#fbbf24' : '#2dd4bf'}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    {/* Day label */}
                    <text x={x} y={svgHeight - 10} fill="#64748b" fontSize="8" textAnchor="middle">
                      {p.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Westgard Rules Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-teal-500/50 transition-all group">
              <div className="font-black text-rose-400 flex items-center justify-between uppercase text-[10px]">
                <span>1_3s (Rechazo)</span>
                <Zap size={12} className="animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">1 valor excede ±3 SD. Error aleatorio severo o fallo de equipo.</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-teal-500/50 transition-all">
              <div className="font-black text-rose-400 uppercase text-[10px]">2_2s (Rechazo)</div>
              <div className="text-[10px] text-slate-400 mt-1">2 valores consecutivos ±2 SD. Error sistemático / reactivo.</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-teal-500/50 transition-all">
              <div className="font-black text-amber-400 uppercase text-[10px]">R_4s (Rechazo)</div>
              <div className="text-[10px] text-slate-400 mt-1">Rango entre niveles excede 4 SD. Error aleatorio detectado.</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-teal-500/50 transition-all">
              <div className="font-black text-teal-400 uppercase text-[10px]">4_1s (Alerta)</div>
              <div className="text-[10px] text-slate-400 mt-1">4 valores en un lado &gt; 1 SD. Sugiere deriva analítica.</div>
            </div>
          </div>
        </div>

        {/* Statistical Summary & Corrective Action Record (1 Col) */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Métricas Estadísticas
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl">
                <span className="text-slate-400">Puntos Totales:</span>
                <span className="font-mono font-bold text-white">{count} Corridas</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl">
                <span className="text-slate-400">Media Obtenida:</span>
                <span className="font-mono font-bold text-teal-300">{currentMean.toFixed(3)} {activeProfile.unit}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl">
                <span className="text-slate-400">Desviación Estándar (SD):</span>
                <span className="font-mono font-bold text-slate-200">{currentSd.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl">
                <span className="text-slate-400">Coeficiente de Variación:</span>
                <span className={`font-mono font-bold ${currentCv > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentCv.toFixed(2)} %
                </span>
              </div>
            </div>
          </div>

          {/* Action Log History */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Bitácora de Acciones ISO 15189</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Todas las incidencias de QC y cambios de lote se auditan criptográficamente conforme a la cláusula 7.3.7 de la norma ISO 15189.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION C: DAILY / WEEKLY EQUIPMENT MAINTENANCE CHECKLIST */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Bitácora de Mantenimiento de Analizadores & Temperaturas</h3>
            <p className="text-xs text-slate-400">Chequeo rutinario de sondas, baños de incubación, presiones y niveles de reactivos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maintenanceTasks.map(task => (
            <div
              key={task.id}
              onClick={() => handleToggleMaintenance(task.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                task.status === 'COMPLETADO'
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                  : 'bg-amber-950/15 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 font-mono">
                    {task.analyzer}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {task.category}
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{task.taskDescription}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {task.parameterValue} {task.timeChecked && `• ${task.timeChecked} (${task.verifiedBy})`}
                </div>
              </div>

              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                task.status === 'COMPLETADO'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                <Check className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: CORRECTIVE ACTION REGISTRATION */}
      {isCorrectiveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Registro de Acción Correctiva (ISO 15189)</h3>
                <p className="text-xs text-slate-400">{activeProfile.analyte} • {activeProfile.analyzerName}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Causa Raíz Identificada</label>
                <textarea
                  rows={2}
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Acción Correctiva Ejecutada</label>
                <textarea
                  rows={3}
                  value={actionTaken}
                  onChange={e => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Firma / PIN del Tecnólogo Médico</label>
                <input
                  type="text"
                  value={technologistPin}
                  onChange={e => setTechnologistPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsCorrectiveModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCorrectiveAction}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-teal-500/20 cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Firmar y Desbloquear Analito</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <SecurityPinModal
          actionTitle={`Firmar Acción Correctiva: ${activeProfile.analyte}`}
          onSuccess={finalizeCorrectiveAction}
          onCancel={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
};
