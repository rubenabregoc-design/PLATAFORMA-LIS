import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Zap,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Filter,
  Search,
  CheckCheck,
  PhoneCall,
  FileCheck,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  Eye,
  Send,
  Timer,
  Activity,
  Layers,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useLisStore } from '../../../store/useLisStore';

export interface StatQueueItem {
  id: string;
  orderNumber: string;
  sampleBarcode: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  location: string;
  analyte: string;
  category: 'Marcadores Cardíacos' | 'Gases Arteriales' | 'Coagulación' | 'Hematología STAT' | 'Bioquímica';
  resultValue: number;
  unit: string;
  referenceRange: string;
  minNormal: number;
  maxNormal: number;
  criticalLow?: number;
  criticalHigh?: number;
  urgency: 'STAT / Crítico' | 'Urgente' | 'Rutina';
  slaMinutesTotal: number;
  elapsedSeconds: number;
  previousValue?: number;
  previousDate?: string;
  deltaPercent?: number;
  deltaFlag?: 'DELTA_NORMAL' | 'DELTA_ALERT' | 'DELTA_CRITICAL';
  status: 'PENDIENTE' | 'VALIDADO_TEC' | 'RECHAZADO';
  analyzerName: string;
  hilStatus: 'NORMAL' | 'HEMOLISIS' | 'ICTERICIA' | 'LIPEMIA';
  clinicalPhysician?: string;
  physicianPhone?: string;
}

const INITIAL_QUEUE: StatQueueItem[] = [
  {
    id: 'stat-01',
    orderNumber: 'ORD-2026-9001',
    sampleBarcode: 'BAR-CARD-01',
    patientName: 'Ríos, Gonzalo A.',
    patientAge: 59,
    patientGender: 'M',
    location: 'Urgencias / Box Reanimación 1',
    analyte: 'Troponina I High-Sensitivity',
    category: 'Marcadores Cardíacos',
    resultValue: 3.42,
    unit: 'ng/mL',
    referenceRange: '< 0.040 ng/mL',
    minNormal: 0.0,
    maxNormal: 0.04,
    criticalHigh: 0.04,
    urgency: 'STAT / Crítico',
    slaMinutesTotal: 30,
    elapsedSeconds: 1680, // 28 mins elapsed (2 mins SLA remaining)
    previousValue: 0.02,
    previousDate: '10/05/2026',
    deltaPercent: 17000,
    deltaFlag: 'DELTA_CRITICAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas e411',
    hilStatus: 'NORMAL',
    clinicalPhysician: 'Dr. Alejandro Méndez (Urgenciólogo)',
    physicianPhone: '+507 6899-2211'
  },
  {
    id: 'stat-02',
    orderNumber: 'ORD-2026-9002',
    sampleBarcode: 'BAR-GAS-02',
    patientName: 'Morales, Valeria M.',
    patientAge: 44,
    patientGender: 'F',
    location: 'UCI Adultos / Cama 4',
    analyte: 'Lactato Sérico STAT',
    category: 'Gases Arteriales',
    resultValue: 4.8,
    unit: 'mmol/L',
    referenceRange: '0.5 - 2.2 mmol/L',
    minNormal: 0.5,
    maxNormal: 2.2,
    criticalHigh: 4.0,
    urgency: 'STAT / Crítico',
    slaMinutesTotal: 15,
    elapsedSeconds: 1020, // 17 mins elapsed (BREACHED)
    previousValue: 1.4,
    previousDate: '01/08/2026',
    deltaPercent: 242.8,
    deltaFlag: 'DELTA_CRITICAL',
    status: 'PENDIENTE',
    analyzerName: 'Radiometer ABL90',
    hilStatus: 'NORMAL',
    clinicalPhysician: 'Dra. Carmen Valdés (Intensivista)',
    physicianPhone: '+507 6511-9044'
  },
  {
    id: 'stat-03',
    orderNumber: 'ORD-2026-9003',
    sampleBarcode: 'BAR-COAG-03',
    patientName: 'Castillo, Esteban R.',
    patientAge: 67,
    patientGender: 'M',
    location: 'Quirófano 2 / Pre-Op',
    analyte: 'TTPa (Tiempo de Tromboplastina)',
    category: 'Coagulación',
    resultValue: 68.5,
    unit: 'segundos',
    referenceRange: '25.0 - 36.0 seg',
    minNormal: 25.0,
    maxNormal: 36.0,
    criticalHigh: 60.0,
    urgency: 'Urgente',
    slaMinutesTotal: 45,
    elapsedSeconds: 2160, // 36 mins elapsed (9 mins SLA)
    previousValue: 31.0,
    previousDate: '20/07/2026',
    deltaPercent: 120.9,
    deltaFlag: 'DELTA_ALERT',
    status: 'PENDIENTE',
    analyzerName: 'Sysmex CS-2500',
    hilStatus: 'NORMAL',
    clinicalPhysician: 'Dr. Roberto De Gracia (Cirujano)',
    physicianPhone: '+507 6233-8822'
  },
  {
    id: 'stat-04',
    orderNumber: 'ORD-2026-9004',
    sampleBarcode: 'BAR-HEM-04',
    patientName: 'Vega, Lucía S.',
    patientAge: 31,
    patientGender: 'F',
    location: 'Ginecología / Observación',
    analyte: 'Hemoglobina (Hb)',
    category: 'Hematología STAT',
    resultValue: 6.2,
    unit: 'g/dL',
    referenceRange: '12.0 - 15.5 g/dL',
    minNormal: 12.0,
    maxNormal: 15.5,
    criticalLow: 7.0,
    urgency: 'STAT / Crítico',
    slaMinutesTotal: 30,
    elapsedSeconds: 1080, // 18 mins elapsed (12 mins SLA)
    previousValue: 12.8,
    previousDate: '15/06/2026',
    deltaPercent: -51.5,
    deltaFlag: 'DELTA_CRITICAL',
    status: 'PENDIENTE',
    analyzerName: 'Sysmex XN-1000',
    hilStatus: 'NORMAL',
    clinicalPhysician: 'Dr. Franklin Espino (Ginecólogo)',
    physicianPhone: '+507 6700-1122'
  },
  {
    id: 'stat-05',
    orderNumber: 'ORD-2026-9005',
    sampleBarcode: 'BAR-BIO-05',
    patientName: 'Paredes, Héctor F.',
    patientAge: 72,
    patientGender: 'M',
    location: 'Medicina Interna / Sala 10',
    analyte: 'Potasio Sérico (K+)',
    category: 'Bioquímica',
    resultValue: 6.4,
    unit: 'mmol/L',
    referenceRange: '3.5 - 5.1 mmol/L',
    minNormal: 3.5,
    maxNormal: 5.1,
    criticalHigh: 6.0,
    criticalLow: 2.8,
    urgency: 'STAT / Crítico',
    slaMinutesTotal: 40,
    elapsedSeconds: 1500, // 25 mins elapsed (15 mins SLA)
    previousValue: 4.3,
    previousDate: '12/08/2026',
    deltaPercent: 48.8,
    deltaFlag: 'DELTA_ALERT',
    status: 'PENDIENTE',
    analyzerName: 'Cobas ISE 900',
    hilStatus: 'HEMOLISIS',
    clinicalPhysician: 'Dra. María Chen (Internista)',
    physicianPhone: '+507 6444-9988'
  },
  {
    id: 'stat-06',
    orderNumber: 'ORD-2026-9006',
    sampleBarcode: 'BAR-CARD-06',
    patientName: 'Gómez, Ana Patricia',
    patientAge: 53,
    patientGender: 'F',
    location: 'Urgencias / Triage 2',
    analyte: 'D-Dímero Cuantitativo',
    category: 'Marcadores Cardíacos',
    resultValue: 3850,
    unit: 'ng/mL D-DU',
    referenceRange: '< 500 ng/mL',
    minNormal: 0,
    maxNormal: 500,
    criticalHigh: 2000,
    urgency: 'STAT / Crítico',
    slaMinutesTotal: 40,
    elapsedSeconds: 2280, // 38 mins elapsed (2 mins SLA)
    previousValue: 320,
    previousDate: '04/05/2026',
    deltaPercent: 1103.1,
    deltaFlag: 'DELTA_CRITICAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas e411',
    hilStatus: 'NORMAL',
    clinicalPhysician: 'Dr. Alejandro Méndez (Urgenciólogo)',
    physicianPhone: '+507 6899-2211'
  },
  {
    id: 'stat-07',
    orderNumber: 'ORD-2026-9007',
    sampleBarcode: 'BAR-BIO-07',
    patientName: 'Batista, Ramón E.',
    patientAge: 60,
    patientGender: 'M',
    location: 'Consulta Externa',
    analyte: 'Glucosa Basal',
    category: 'Bioquímica',
    resultValue: 94,
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    minNormal: 70,
    maxNormal: 99,
    urgency: 'Rutina',
    slaMinutesTotal: 90,
    elapsedSeconds: 1200,
    previousValue: 96,
    previousDate: '20/07/2026',
    deltaPercent: -2.0,
    deltaFlag: 'DELTA_NORMAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas 6000 c501',
    hilStatus: 'NORMAL'
  },
  {
    id: 'stat-08',
    orderNumber: 'ORD-2026-9008',
    sampleBarcode: 'BAR-BIO-08',
    patientName: 'Santana, Clara I.',
    patientAge: 45,
    patientGender: 'F',
    location: 'Consulta Externa',
    analyte: 'Colesterol Total',
    category: 'Bioquímica',
    resultValue: 182,
    unit: 'mg/dL',
    referenceRange: '120 - 200 mg/dL',
    minNormal: 120,
    maxNormal: 200,
    urgency: 'Rutina',
    slaMinutesTotal: 90,
    elapsedSeconds: 1320,
    previousValue: 188,
    previousDate: '15/05/2026',
    deltaPercent: -3.1,
    deltaFlag: 'DELTA_NORMAL',
    status: 'PENDIENTE',
    analyzerName: 'Cobas 6000 c501',
    hilStatus: 'NORMAL'
  }
];

export const StatPendingQueue: React.FC = () => {
  const { currentUser } = useLisStore();
  const [queue, setQueue] = useState<StatQueueItem[]>(INITIAL_QUEUE);
  const [filterMode, setFilterMode] = useState<'ALL' | 'STAT_ONLY' | 'CRITICAL_ONLY' | 'SLA_RISK' | 'HIL_ALERT'>('STAT_ONLY');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  // Rapid Validation Modal
  const [validatingItem, setValidatingItem] = useState<StatQueueItem | null>(null);
  const [readBackDoctorName, setReadBackDoctorName] = useState<string>('');
  const [readBackNotes, setReadBackNotes] = useState<string>('');
  const [pinConfirmation, setPinConfirmation] = useState<string>('');
  const [validationSuccessToast, setValidationSuccessToast] = useState<string | null>(null);

  // Live Timer Update
  useEffect(() => {
    const timer = setInterval(() => {
      setQueue((prev) =>
        prev.map((item) => {
          if (item.status === 'VALIDADO_TEC') return item;
          return {
            ...item,
            elapsedSeconds: item.elapsedSeconds + 1
          };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter and Sort Queue by Urgency Priority
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      // Search
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.analyte.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sampleBarcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter Mode
      if (filterMode === 'STAT_ONLY') {
        return item.urgency === 'STAT / Crítico' || item.urgency === 'Urgente';
      }
      if (filterMode === 'CRITICAL_ONLY') {
        const isCritical =
          (item.criticalHigh !== undefined && item.resultValue >= item.criticalHigh) ||
          (item.criticalLow !== undefined && item.resultValue <= item.criticalLow) ||
          item.deltaFlag === 'DELTA_CRITICAL';
        return isCritical;
      }
      if (filterMode === 'SLA_RISK') {
        const remainingMinutes = (item.slaMinutesTotal * 60 - item.elapsedSeconds) / 60;
        return remainingMinutes <= 10 && item.status === 'PENDIENTE';
      }
      if (filterMode === 'HIL_ALERT') {
        return item.hilStatus !== 'NORMAL';
      }

      return true;
    }).sort((a, b) => {
      // Sort priority: Pending first, then STAT, then lowest remaining SLA
      if (a.status === 'PENDIENTE' && b.status !== 'PENDIENTE') return -1;
      if (a.status !== 'PENDIENTE' && b.status === 'PENDIENTE') return 1;

      const aIsStat = a.urgency === 'STAT / Crítico' ? 2 : a.urgency === 'Urgente' ? 1 : 0;
      const bIsStat = b.urgency === 'STAT / Crítico' ? 2 : b.urgency === 'Urgente' ? 1 : 0;
      if (aIsStat !== bIsStat) return bIsStat - aIsStat;

      const aRem = a.slaMinutesTotal * 60 - a.elapsedSeconds;
      const bRem = b.slaMinutesTotal * 60 - b.elapsedSeconds;
      return aRem - bRem;
    });
  }, [queue, filterMode, searchQuery]);

  // SLA Time Helper
  const getSlaInfo = (item: StatQueueItem) => {
    const remainingSeconds = item.slaMinutesTotal * 60 - item.elapsedSeconds;
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const isBreached = remainingSeconds <= 0;

    let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    let ring = '';

    if (isBreached) {
      color = 'text-rose-400 bg-rose-500/20 border-rose-500/50 animate-pulse';
      ring = 'ring-2 ring-rose-500/50';
    } else if (remainingMinutes <= 5) {
      color = 'text-red-400 bg-red-500/20 border-red-500/50 animate-pulse';
      ring = 'ring-2 ring-red-500/50';
    } else if (remainingMinutes <= 15) {
      color = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    }

    return {
      remainingMinutes,
      remainingSeconds,
      isBreached,
      color,
      ring,
      formattedRemaining: isBreached
        ? `Vencido (+${Math.abs(remainingMinutes)}m)`
        : `${remainingMinutes} min restantes`
    };
  };

  const isCriticalResult = (item: StatQueueItem) => {
    return (
      (item.criticalHigh !== undefined && item.resultValue >= item.criticalHigh) ||
      (item.criticalLow !== undefined && item.resultValue <= item.criticalLow) ||
      item.deltaFlag === 'DELTA_CRITICAL'
    );
  };

  // 1-Click Fast Technical Validation
  const handleOpenFastValidate = (item: StatQueueItem) => {
    setValidatingItem(item);
    setReadBackDoctorName(item.clinicalPhysician || '');
    setReadBackNotes(`Aviso telefónico inmediato realizado a ${item.clinicalPhysician || 'médico tratante'}. Read-Back confirmado.`);
    setPinConfirmation(currentUser?.pinCode || '1234');
  };

  const handleConfirmValidation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatingItem) return;

    setQueue((prev) =>
      prev.map((q) =>
        q.id === validatingItem.id
          ? {
              ...q,
              status: 'VALIDADO_TEC'
            }
          : q
      )
    );

    setValidationSuccessToast(
      `✓ Resultado de ${validatingItem.analyte} (${validatingItem.resultValue} ${validatingItem.unit}) validado técnicamente. Read-back guardado en auditoría ISO 15189.`
    );
    setTimeout(() => setValidationSuccessToast(null), 5000);
    setValidatingItem(null);
  };

  // Batch Auto-Validation for Delta-Safe Normals
  const handleAutoValidateNormals = () => {
    let count = 0;
    setQueue((prev) =>
      prev.map((q) => {
        const isNormal =
          q.resultValue >= q.minNormal &&
          q.resultValue <= q.maxNormal &&
          q.deltaFlag === 'DELTA_NORMAL' &&
          q.hilStatus === 'NORMAL';

        if (isNormal && q.status === 'PENDIENTE') {
          count++;
          return { ...q, status: 'VALIDADO_TEC' };
        }
        return q;
      })
    );

    if (count > 0) {
      setValidationSuccessToast(`⚡ Auto-validación completada: ${count} resultados normales y seguros validados en lote.`);
    } else {
      setValidationSuccessToast(`ℹ️ No se encontraron resultados normales pendientes adicionales para auto-validar.`);
    }
    setTimeout(() => setValidationSuccessToast(null), 4000);
  };

  const pendingStatsCount = queue.filter(
    (q) => (q.urgency === 'STAT / Crítico' || q.urgency === 'Urgente') && q.status === 'PENDIENTE'
  ).length;

  const criticalPendingCount = queue.filter(
    (q) => isCriticalResult(q) && q.status === 'PENDIENTE'
  ).length;

  return (
    <div className="space-y-6" id="stat-pending-queue-view">
      {/* Toast Notification */}
      {validationSuccessToast && (
        <div className="p-4 bg-teal-500/20 border border-teal-500/50 rounded-2xl text-teal-300 font-bold text-xs sm:text-sm flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <span>{validationSuccessToast}</span>
          </div>
          <button
            onClick={() => setValidationSuccessToast(null)}
            className="text-teal-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & STAT Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Cola de Pendientes STAT & Validación Crítica
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Alta Prioridad
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Priorización inteligente de muestras de urgencia, cálculo de SLA en vivo y liberación inmediata de valores de pánico.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAutoValidateNormals}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-black flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-teal-400" />
              Auto-Validar Normales Seguros
            </button>

            <button
              onClick={() => setSoundAlerts(!soundAlerts)}
              className={`p-2.5 rounded-xl border transition ${
                soundAlerts
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title={soundAlerts ? 'Alertas sonoras activas' : 'Alertas sonoras silenciadas'}
            >
              {soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">STAT Pendientes</span>
              <div className="text-xl font-black text-amber-300 font-mono">{pendingStatsCount}</div>
            </div>
            <Flame className="w-5 h-5 text-amber-400/60" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Valores Críticos</span>
              <div className="text-xl font-black text-rose-400 font-mono">{criticalPendingCount}</div>
            </div>
            <ShieldAlert className="w-5 h-5 text-rose-400/60" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Tiempo Respuesta</span>
              <div className="text-xl font-black text-teal-400 font-mono">18m Prom.</div>
            </div>
            <Timer className="w-5 h-5 text-teal-400/60" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Cumplimiento SLA</span>
              <div className="text-xl font-black text-emerald-400 font-mono">97.4%</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterMode('STAT_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'STAT_ONLY'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Solo STAT / Urgentes ({pendingStatsCount})
          </button>

          <button
            onClick={() => setFilterMode('CRITICAL_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'CRITICAL_ONLY'
                ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Valores Críticos ({criticalPendingCount})
          </button>

          <button
            onClick={() => setFilterMode('SLA_RISK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'SLA_RISK'
                ? 'bg-red-500 text-white font-black shadow-lg shadow-red-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Riesgo SLA (&lt;10m)
          </button>

          <button
            onClick={() => setFilterMode('HIL_ALERT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'HIL_ALERT'
                ? 'bg-teal-500 text-slate-950 font-black shadow-lg shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Índice HIL
          </button>

          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-slate-700 text-white font-black'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos ({queue.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar paciente, analito, tubo..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>

      {/* Main Priority Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Prioridad / SLA</th>
                <th className="py-3 px-4">Muestra & Paciente</th>
                <th className="py-3 px-4">Analito & Sección</th>
                <th className="py-3 px-4">Resultado & Referencia</th>
                <th className="py-3 px-4">Delta Check</th>
                <th className="py-3 px-4">Estado & HIL</th>
                <th className="py-3 px-4 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    No hay muestras que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const sla = getSlaInfo(item);
                  const isCrit = isCriticalResult(item);
                  const isValidated = item.status === 'VALIDADO_TEC';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCrit && !isValidated
                          ? 'bg-rose-950/10 hover:bg-rose-950/20'
                          : item.urgency === 'STAT / Crítico' && !isValidated
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* 1. Prioridad / SLA */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                item.urgency === 'STAT / Crítico'
                                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                                  : item.urgency === 'Urgente'
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {item.urgency === 'STAT / Crítico' && <Flame className="w-3 h-3 animate-bounce" />}
                              {item.urgency}
                            </span>
                          </div>

                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${sla.color} ${sla.ring}`}>
                            <Timer className="w-3 h-3" />
                            <span>{sla.formattedRemaining}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Muestra & Paciente */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.patientName}</span>
                            <span className="text-[10px] text-slate-400">({item.patientAge}a • {item.patientGender})</span>
                          </div>
                          <div className="text-[11px] text-teal-400 font-mono">{item.sampleBarcode} • {item.orderNumber}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>📍 {item.location}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Analito & Sección */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-200 flex items-center gap-1.5">
                            <span>{item.analyte}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.analyzerName}</div>
                        </div>
                      </td>

                      {/* 4. Resultado & Referencia */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-base font-black font-mono px-2 py-0.5 rounded-lg ${
                                isCrit
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                  : item.resultValue < item.minNormal || item.resultValue > item.maxNormal
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'text-slate-100'
                              }`}
                            >
                              {item.resultValue}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Ref: {item.referenceRange}</div>
                          {isCrit && (
                            <span className="inline-block text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.2 rounded">
                              🚨 VALOR CRÍTICO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Delta Check */}
                      <td className="py-3.5 px-4">
                        {item.previousValue !== undefined ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              {item.deltaPercent !== undefined && item.deltaPercent > 0 ? (
                                <TrendingUp className={`w-3.5 h-3.5 ${item.deltaFlag === 'DELTA_CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`} />
                              ) : (
                                <TrendingDown className={`w-3.5 h-3.5 ${item.deltaFlag === 'DELTA_CRITICAL' ? 'text-rose-400' : 'text-teal-400'}`} />
                              )}
                              <span
                                className={`text-[11px] font-bold font-mono ${
                                  item.deltaFlag === 'DELTA_CRITICAL'
                                    ? 'text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30'
                                    : item.deltaFlag === 'DELTA_ALERT'
                                    ? 'text-amber-300'
                                    : 'text-slate-300'
                                }`}
                              >
                                {item.deltaPercent && item.deltaPercent > 0 ? `+${item.deltaPercent}%` : `${item.deltaPercent}%`}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">Ant: {item.previousValue} ({item.previousDate})</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Sin previo</span>
                        )}
                      </td>

                      {/* 6. Estado & HIL */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isValidated
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                : 'bg-slate-800 text-amber-300 border border-slate-700'
                            }`}
                          >
                            {isValidated ? <CheckCircle2 className="w-3 h-3 text-teal-400" /> : <Clock className="w-3 h-3" />}
                            {item.status}
                          </span>

                          <div>
                            {item.hilStatus !== 'NORMAL' ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                ⚠️ {item.hilStatus}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500 font-mono">HIL Normal</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 7. Acción Rápida */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isValidated ? (
                          <span className="text-[11px] text-teal-400 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Validado
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {isCrit ? (
                              <button
                                onClick={() => handleOpenFastValidate(item)}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-rose-500/20 cursor-pointer animate-pulse"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Validar Crítico
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenFastValidate(item)}
                                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-500/20 cursor-pointer"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Validar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAST VALIDATION MODAL WITH READ-BACK CONFIRMATION */}
      {validatingItem && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isCriticalResult(validatingItem) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                }`}>
                  {isCriticalResult(validatingItem) ? <ShieldAlert className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isCriticalResult(validatingItem) ? 'Validación de Valor Crítico & Notificación' : 'Validación Técnica Rápida'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Protocolo ISO 15189 • Firma Digital y Registro Read-Back
                  </p>
                </div>
              </div>
              <button
                onClick={() => setValidatingItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test & Result Details Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <div className="font-bold text-white">{validatingItem.patientName}</div>
                  <div className="text-[11px] text-slate-400">{validatingItem.sampleBarcode} • {validatingItem.location}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {validatingItem.urgency}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{validatingItem.analyte}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl font-black font-mono ${isCriticalResult(validatingItem) ? 'text-rose-400' : 'text-teal-400'}`}>
                    {validatingItem.resultValue}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{validatingItem.unit}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Rango Normal: {validatingItem.referenceRange}</span>
                {validatingItem.deltaPercent && (
                  <span className="font-mono text-amber-400">Delta: {validatingItem.deltaPercent}%</span>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmValidation} className="space-y-4">
              {isCriticalResult(validatingItem) && (
                <div className="space-y-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-rose-400" />
                    Notificación Read-Back Obligatoria
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Médico Notificado</label>
                    <input
                      type="text"
                      value={readBackDoctorName}
                      onChange={(e) => setReadBackDoctorName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-rose-400"
                      placeholder="Nombre del médico / Sala"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Confirmación Verbal Read-Back</label>
                    <textarea
                      value={readBackNotes}
                      onChange={(e) => setReadBackNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-rose-400"
                      placeholder="Detalles de la confirmación telefónica..."
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>PIN de Firma Técnica (Licenciado TM)</span>
                  <span className="text-[10px] text-teal-400 font-mono">Demo: {currentUser?.pinCode || '1234'}</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinConfirmation}
                  onChange={(e) => setPinConfirmation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-base font-mono tracking-widest text-white mt-1 focus:outline-none focus:border-teal-400"
                  placeholder="••••"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setValidatingItem(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`w-1/2 py-2.5 font-black rounded-xl text-xs transition shadow-lg cursor-pointer ${
                    isCriticalResult(validatingItem)
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
                  }`}
                >
                  Firmar & Liberar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
