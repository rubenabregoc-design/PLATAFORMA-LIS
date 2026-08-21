import React, { useState } from 'react';
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
  Cpu
} from 'lucide-react';

interface QCPoint {
  day: number;
  date: string;
  value: number;
  sdScore: number; // z-score (-3 to +3)
  violation?: '1_3s' | '2_2s' | 'R_4s' | '4_1s' | '10_x' | '1_2s';
  technician: string;
}

interface AnalyzerQcProfile {
  id: string;
  analyzerName: string;
  analyte: string;
  unit: string;
  lotNumber: string;
  expirationDate: string;
  level: 'Nivel 1 (Normal)' | 'Nivel 2 (Patológico Alto)' | 'Nivel 3 (Patológico Bajo)';
  targetMean: number;
  targetSd: number;
  points: QCPoint[];
  status: 'OPTIMO' | 'ALERTA_1_2S' | 'BLOQUEADO_RECHAZO';
  activeViolation?: string;
  correctiveActionRecorded?: boolean;
}

const INITIAL_QC_PROFILES: AnalyzerQcProfile[] = [
  {
    id: 'qc-gluc-c501',
    analyzerName: 'Cobas 6000 c501',
    analyte: 'Glucosa Sérica',
    unit: 'mg/dL',
    lotNumber: 'PRECI-GLU-8821',
    expirationDate: '30/11/2026',
    level: 'Nivel 1 (Normal)',
    targetMean: 95.0,
    targetSd: 2.5,
    status: 'OPTIMO',
    points: [
      { day: 1, date: '01/08', value: 95.2, sdScore: 0.08, technician: 'TM-4091' },
      { day: 2, date: '02/08', value: 94.8, sdScore: -0.08, technician: 'TM-4091' },
      { day: 3, date: '03/08', value: 96.1, sdScore: 0.44, technician: 'TM-3180' },
      { day: 4, date: '04/08', value: 95.0, sdScore: 0.0, technician: 'TM-4091' },
      { day: 5, date: '05/08', value: 93.9, sdScore: -0.44, technician: 'TM-3180' },
      { day: 6, date: '06/08', value: 96.8, sdScore: 0.72, technician: 'TM-4091' },
      { day: 7, date: '07/08', value: 95.4, sdScore: 0.16, technician: 'TM-4091' },
      { day: 8, date: '08/08', value: 94.2, sdScore: -0.32, technician: 'TM-3180' },
      { day: 9, date: '09/08', value: 95.9, sdScore: 0.36, technician: 'TM-4091' },
      { day: 10, date: '10/08', value: 95.1, sdScore: 0.04, technician: 'TM-4091' },
      { day: 11, date: '11/08', value: 94.6, sdScore: -0.16, technician: 'TM-3180' },
      { day: 12, date: '12/08', value: 95.8, sdScore: 0.32, technician: 'TM-4091' },
      { day: 13, date: '13/08', value: 97.4, sdScore: 0.96, technician: 'TM-4091' },
      { day: 14, date: '14/08', value: 95.0, sdScore: 0.0, technician: 'TM-3180' },
      { day: 15, date: '15/08', value: 96.2, sdScore: 0.48, technician: 'TM-4091' }
    ]
  },
  {
    id: 'qc-trop-e601',
    analyzerName: 'Cobas e601 Inmuno',
    analyte: 'Troponina I High-Sensitivity',
    unit: 'ng/mL',
    lotNumber: 'TROP-LOT-9044',
    expirationDate: '15/10/2026',
    level: 'Nivel 2 (Patológico Alto)',
    targetMean: 0.450,
    targetSd: 0.025,
    status: 'BLOQUEADO_RECHAZO',
    activeViolation: 'Regla 1_3s (Valor excede +3.2 SD) - Error Aleatorio Severo',
    correctiveActionRecorded: false,
    points: [
      { day: 1, date: '01/08', value: 0.448, sdScore: -0.08, technician: 'TM-4091' },
      { day: 2, date: '02/08', value: 0.452, sdScore: 0.08, technician: 'TM-4091' },
      { day: 3, date: '03/08', value: 0.460, sdScore: 0.40, technician: 'TM-3180' },
      { day: 4, date: '04/08', value: 0.455, sdScore: 0.20, technician: 'TM-4091' },
      { day: 5, date: '05/08', value: 0.468, sdScore: 0.72, technician: 'TM-4091' },
      { day: 6, date: '06/08', value: 0.472, sdScore: 0.88, technician: 'TM-3180' },
      { day: 7, date: '07/08', value: 0.485, sdScore: 1.40, technician: 'TM-4091' },
      { day: 8, date: '08/08', value: 0.490, sdScore: 1.60, technician: 'TM-4091' },
      { day: 9, date: '09/08', value: 0.505, sdScore: 2.20, violation: '1_2s', technician: 'TM-3180' },
      { day: 10, date: '10/08', value: 0.532, sdScore: 3.28, violation: '1_3s', technician: 'TM-4091' }
    ]
  },
  {
    id: 'qc-hb-xn1000',
    analyzerName: 'Sysmex XN-1000',
    analyte: 'Hemoglobina (Hb)',
    unit: 'g/dL',
    lotNumber: 'EIGHT-CHECK-331',
    expirationDate: '28/09/2026',
    level: 'Nivel 1 (Normal)',
    targetMean: 13.5,
    targetSd: 0.35,
    status: 'OPTIMO',
    points: [
      { day: 1, date: '01/08', value: 13.4, sdScore: -0.28, technician: 'TM-4091' },
      { day: 2, date: '02/08', value: 13.6, sdScore: 0.28, technician: 'TM-4091' },
      { day: 3, date: '03/08', value: 13.5, sdScore: 0.0, technician: 'TM-3180' },
      { day: 4, date: '04/08', value: 13.3, sdScore: -0.57, technician: 'TM-4091' },
      { day: 5, date: '05/08', value: 13.7, sdScore: 0.57, technician: 'TM-3180' },
      { day: 6, date: '06/08', value: 13.5, sdScore: 0.0, technician: 'TM-4091' },
      { day: 7, date: '07/08', value: 13.4, sdScore: -0.28, technician: 'TM-4091' }
    ]
  }
];

interface MaintenanceTask {
  id: string;
  analyzer: string;
  category: 'DIARIO' | 'SEMANAL';
  taskDescription: string;
  parameterValue: string;
  status: 'COMPLETADO' | 'PENDIENTE';
  verifiedBy?: string;
  timeChecked?: string;
}

const INITIAL_MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: 'maint-1',
    analyzer: 'Cobas 6000 c501',
    category: 'DIARIO',
    taskDescription: 'Verificación de Temperatura de Baño de Incubación (37.0°C ± 0.1°C)',
    parameterValue: '37.05 °C (Óptimo)',
    status: 'COMPLETADO',
    verifiedBy: 'Lic. Valentina Soto (TM-4091)',
    timeChecked: '06:45 AM'
  },
  {
    id: 'maint-2',
    analyzer: 'Cobas 6000 c501',
    category: 'DIARIO',
    taskDescription: 'Lavado y Purga de Agujas de Muestra y Reactivo (CleanL / SysClean)',
    parameterValue: 'Ciclo Ejecutado Sin Obstrucción',
    status: 'COMPLETADO',
    verifiedBy: 'Lic. Valentina Soto (TM-4091)',
    timeChecked: '06:50 AM'
  },
  {
    id: 'maint-3',
    analyzer: 'Sysmex XN-1000',
    category: 'DIARIO',
    taskDescription: 'Control de Presión de Vacío y Nivel de Desecho Biológico',
    parameterValue: '-0.06 MPa / Recipiente 20%',
    status: 'COMPLETADO',
    verifiedBy: 'Lic. Rubén Abrego (TM-3180)',
    timeChecked: '07:10 AM'
  },
  {
    id: 'maint-4',
    analyzer: 'Cobas e601 Inmuno',
    category: 'SEMANAL',
    taskDescription: 'Reemplazo de Puntas y Cubetas de Ensayo & Limpieza de Vortex',
    parameterValue: 'Pendiente de Ejecución',
    status: 'PENDIENTE'
  }
];

export const InternalQualityControlQC: React.FC = () => {
  const [profiles, setProfiles] = useState<AnalyzerQcProfile[]>(INITIAL_QC_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('qc-trop-e601');
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(INITIAL_MAINTENANCE_TASKS);
  
  // Corrective Action Modal / Drawer Form State
  const [isCorrectiveModalOpen, setIsCorrectiveModalOpen] = useState<boolean>(false);
  const [rootCause, setRootCause] = useState<string>('Vial de control con evaporación / degradado por temperatura');
  const [actionTaken, setActionTaken] = useState<string>('Apertura de nuevo vial de control liofilizado, reconstitución con pipeta calibrada y corrida en duplicado.');
  const [technologistPin, setTechnologistPin] = useState<string>('TM-4091');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New point input form
  const [newPointVal, setNewPointVal] = useState<number>(0.452);

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  // Calculate stats
  const count = activeProfile.points.length;
  const currentMean = count > 0 ? activeProfile.points.reduce((acc, p) => acc + p.value, 0) / count : activeProfile.targetMean;
  const variance = count > 1 ? activeProfile.points.reduce((acc, p) => acc + Math.pow(p.value - currentMean, 2), 0) / (count - 1) : 0;
  const currentSd = Math.sqrt(variance) || activeProfile.targetSd;
  const currentCv = currentMean > 0 ? (currentSd / currentMean) * 100 : 0;

  // Add new QC Point and evaluate Westgard Rules
  const handleAddQcPoint = () => {
    const sdScore = Math.round(((newPointVal - activeProfile.targetMean) / activeProfile.targetSd) * 100) / 100;
    let violation: QCPoint['violation'] = undefined;
    let newStatus: AnalyzerQcProfile['status'] = 'OPTIMO';
    let violationDesc: string | undefined = undefined;

    if (Math.abs(sdScore) >= 3.0) {
      violation = '1_3s';
      newStatus = 'BLOQUEADO_RECHAZO';
      violationDesc = `Regla 1_3s: Valor (${newPointVal}) excede 3 SD (${sdScore} SD). Rechazo de corrida analítica.`;
    } else if (Math.abs(sdScore) >= 2.0) {
      // Check if previous point also exceeded 2 SD on same side
      const lastPoint = activeProfile.points[activeProfile.points.length - 1];
      if (lastPoint && ((sdScore >= 2.0 && lastPoint.sdScore >= 2.0) || (sdScore <= -2.0 && lastPoint.sdScore <= -2.0))) {
        violation = '2_2s';
        newStatus = 'BLOQUEADO_RECHAZO';
        violationDesc = `Regla 2_2s: Dos valores consecutivos exceden 2 SD en el mismo sentido. Error Sistemático.`;
      } else {
        violation = '1_2s';
        newStatus = 'ALERTA_1_2S';
        violationDesc = `Regla de Advertencia 1_2s (${sdScore} SD). Requiere inspección preventiva.`;
      }
    }

    const newPoint: QCPoint = {
      day: count + 1,
      date: new Date().toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit' }),
      value: newPointVal,
      sdScore,
      violation,
      technician: 'TM-4091'
    };

    setProfiles(prev => prev.map(prof => {
      if (prof.id === activeProfile.id) {
        return {
          ...prof,
          points: [...prof.points, newPoint],
          status: newStatus,
          activeViolation: violationDesc,
          correctiveActionRecorded: false
        };
      }
      return prof;
    }));

    setToastMsg(`✓ Punto QC de ${newPointVal} ${activeProfile.unit} registrado en Levey-Jennings.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Submit Corrective Action & Unlock Analyzer
  const handleSaveCorrectiveAction = () => {
    setProfiles(prev => prev.map(prof => {
      if (prof.id === activeProfile.id) {
        return {
          ...prof,
          status: 'OPTIMO',
          activeViolation: undefined,
          correctiveActionRecorded: true
        };
      }
      return prof;
    }));

    setIsCorrectiveModalOpen(false);
    setToastMsg(`✓ Acción Correctiva ISO 15189 registrada. Desbloqueo de validación técnica autorizado.`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleToggleMaintenance = (id: string) => {
    setMaintenanceTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isComp = task.status === 'COMPLETADO';
        return {
          ...task,
          status: isComp ? 'PENDIENTE' : 'COMPLETADO',
          verifiedBy: isComp ? undefined : 'Lic. Valentina Soto (TM-4091)',
          timeChecked: isComp ? undefined : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return task;
    }));
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
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
            activeProfile.status === 'BLOQUEADO_RECHAZO'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : activeProfile.status === 'ALERTA_1_2S'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {activeProfile.status === 'BLOQUEADO_RECHAZO' ? (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span>BLOQUEADO: Fallo Westgard</span>
              </>
            ) : activeProfile.status === 'ALERTA_1_2S' ? (
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
      {activeProfile.status === 'BLOQUEADO_RECHAZO' && (
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
                {activeProfile.activeViolation || 'Violación de regla crítica de Westgard detectada. Los resultados de pacientes para este analito no podrán ser liberados.'}
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
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="font-bold text-rose-400">1_3s (Rechazo)</div>
              <div className="text-[10px] text-slate-400">1 valor excede ±3 SD. Error aleatorio severo.</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="font-bold text-rose-400">2_2s (Rechazo)</div>
              <div className="text-[10px] text-slate-400">2 valores consecutivos exceden ±2 SD. Error sistemático.</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="font-bold text-amber-400">1_2s (Advertencia)</div>
              <div className="text-[10px] text-slate-400">1 valor excede ±2 SD. Gatilla evaluación de otras reglas.</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="font-bold text-teal-400">10_x (Alerta)</div>
              <div className="text-[10px] text-slate-400">10 valores consecutivos en el mismo lado de la media.</div>
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
    </div>
  );
};
