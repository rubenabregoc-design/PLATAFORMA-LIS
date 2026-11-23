import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Order, TestResult, Patient, Analyzer, User } from '../../types';
import { MOCK_TEST_CATALOG, MOCK_ANALYZERS } from '../../data/mockData';
import { groupResultsByClinicalArea } from '../../utils/clinicalAreaClassifier';
import { ResultsAlertsCenter } from './ResultsAlertsCenter';
import { ResultsClinicalCalculator } from './ResultsClinicalCalculator';
import { ResultsTelemetryDashboard } from './ResultsTelemetryDashboard';
import {
  UserCircle, RefreshCw, Disc, Timer, Layers, Search, X, Zap,
  PencilLine, Cpu, Mic, Calculator, MessageSquare, TrendingUp,
  Smartphone, Trash2, RotateCcw, Beaker, CheckCircle2, Printer,
  Barcode, Plus, PhoneCall, Sliders, ShieldAlert, Activity, Fingerprint,
  ArrowRight, ChevronRight, ChevronDown, ChevronUp, Minimize2, Maximize2, BrainCircuit, Terminal, Wrench, ArrowUp, ArrowDown,
  Microscope, AlertTriangle, Check, Lock, ShieldCheck,
  FlaskConical, MessageSquareText, Undo2,
  Filter, Clock, Info, LayoutGrid, FileText, Droplets, Sparkles, HeartPulse, Calendar,
  Building2, Truck, MapPin, Stethoscope
} from 'lucide-react';
import { notifyToast } from '../../utils/toastNotification';
import { useLisStore } from '../../store/useLisStore';

// Localized helpers for multi-language (ES / EN) support in technical validation
const getLocalizedAreaName = (area: { id: string; name: string }, isEn: boolean) => {
  if (!isEn) return area.name;
  const enNames: Record<string, string> = {
    HEMATOLOGIA: 'CLINICAL HEMATOLOGY',
    COAGULACION: 'COAGULATION & HEMOSTASIS',
    QUIMICA: 'CLINICAL CHEMISTRY & ENZYMES',
    ELECTROLITOS: 'ELECTROLYTES & BLOOD GAS',
    GASOMETRIA_STAT: 'CARDIAC MARKERS & STAT TESTS',
    ENDOCRINOLOGIA: 'ENDOCRINOLOGY & HORMONES',
    MARCADORES_TUMORALES: 'TUMOR MARKERS & ONCOLOGY',
    URINALISIS: 'URINALYSIS & BODY FLUIDS',
    COPROLOGIA: 'PARASITOLOGY & STOOL',
    INMUNOLOGIA: 'IMMUNOLOGY & SEROLOGY',
    SEROLOGIA: 'IMMUNOLOGY & SEROLOGY',
    MICROBIOLOGIA: 'MICROBIOLOGY & CULTURES',
    BANCO_SANGRE: 'IMMUNOHEMATOLOGY & BLOOD BANK',
    BIOLOGIA_MOLECULAR: 'MOLECULAR BIOLOGY & PCR',
    GENERAL: 'GENERAL LABORATORY'
  };
  return enNames[area.id] || area.name;
};

const getLocalizedParameterName = (name: string, isEn: boolean) => {
  if (!isEn || !name) return name;
  const upper = name.toUpperCase().trim();
  const translations: Record<string, string> = {
    'LEUCOCITOS TOTALES (WBC)': 'WHITE BLOOD CELLS (WBC)',
    'HEMOGLOBINA (HGB)': 'HEMOGLOBIN (HGB)',
    'PLAQUETAS TOTALES (PLT)': 'TOTAL PLATELETS (PLT)',
    'HEMATOCRITO (HCT)': 'HEMATOCRIT (HCT)',
    'GLUCOSA BASAL': 'FASTING GLUCOSE',
    'GLUCOSA': 'GLUCOSE',
    'CREATININA SÉRICA': 'SERUM CREATININE',
    'CREATININA': 'CREATININE',
    'NITRÓGENO DE UREA (BUN)': 'BLOOD UREA NITROGEN (BUN)',
    'COLESTEROL TOTAL': 'TOTAL CHOLESTEROL',
    'TRIGLICÉRIDOS': 'TRIGLYCERIDES',
    'COLESTEROL HDL': 'HDL CHOLESTEROL',
    'COLESTEROL LDL': 'LDL CHOLESTEROL',
    'ÁCIDO ÚRICO': 'URIC ACID',
    'SODIO (NA+)': 'SODIUM (NA+)',
    'POTASIO (K+)': 'POTASSIUM (K+)',
    'CLORO (CL-)': 'CHLORIDE (CL-)',
    'CALCIO TOTAL': 'TOTAL CALCIUM',
    'TGP / ALANINA AMINOTRANSFERASA (ALT)': 'ALT / ALANINE AMINOTRANSFERASE',
    'TGO / ASPARTATO AMINOTRANSFERASA (AST)': 'AST / ASPARTATE AMINOTRANSFERASE',
    'HORMONA ESTIMULANTE DE TIROIDES (TSH 3RA GEN)': 'THYROID STIMULATING HORMONE (TSH 3RD GEN)',
    'TIROXINA LIBRE (T4 LIBRE)': 'FREE THYROXINE (FREE T4)',
    'TIEMPO DE PROTROMBINA (TP/PT)': 'PROTHROMBIN TIME (PT)',
    'TIEMPO DE TROMBOPLASTINA PARCIAL (TTP/APTT)': 'PARTIAL THROMBOPLASTIN TIME (aPTT)',
    'FIBRINÓGENO': 'FIBRINOGEN',
    'DÍMERO D': 'D-DIMER',
    'FOSFATASA ALCALINA': 'ALKALINE PHOSPHATASE',
    'BILIRRUBINA TOTAL': 'TOTAL BILIRUBIN',
    'BILIRRUBINA DIRECTA': 'DIRECT BILIRUBIN',
    'PROTEÍNAS TOTALES': 'TOTAL PROTEINS',
    'ALBÚMINA': 'ALBUMIN'
  };
  return translations[upper] || name;
};

const getLocalizedTestName = (name: string, isEn: boolean) => {
  if (!isEn || !name) return name;
  const upper = name.toUpperCase().trim();
  const translations: Record<string, string> = {
    'HEMOGRAMA COMPLETO': 'Complete Blood Count (CBC)',
    'PERFIL LIPÍDICO': 'Lipid Panel',
    'QUÍMICA GENERAL': 'Basic Chemistry Panel',
    'ELECTROLITOS SÉRICOS': 'Serum Electrolytes',
    'PRUEBAS DE COAGULACIÓN': 'Coagulation Profile',
    'PERFIL TIROIDEO': 'Thyroid Panel',
    'PERFIL HEPÁTICO': 'Hepatic Function Panel',
    'URIANÁLISIS COMPLETO': 'Complete Urinalysis',
    'COPROLÓGICO GENERAL': 'Stool Examination'
  };
  return translations[upper] || name;
};

interface ResultEntryWorkspaceProps {
  order: Order; patient: Patient; results: TestResult[]; analyzers: Analyzer[];
  currentUser: User;
  onUpdateResultValue: (resultId: string, newValue: string, resultData?: TestResult) => void;
  onUpdateInterpretation: (resultId: string, interpretation: string) => void;
  onUpdateResultStatus: (resultId: string, status: TestResult['status']) => void;
  onOpenPdf: (orderId: string) => void;
  onConsultInterBranch?: (order: Order, patient: Patient, testName: string) => void;
  onUpdateOrderTests?: (orderId: string, testIds: string[]) => void;
  onUpdateOrderNotes?: (orderId: string, notes: string) => void;
  allOrders?: Order[]; allPatients?: Patient[];
}

const ResultValueInput: React.FC<{
  result: TestResult;
  isValidated: boolean;
  canEdit: boolean;
  onSave: (resultId: string, val: string, result: TestResult) => void;
}> = ({ result, isValidated, canEdit, onSave }) => {
  const language = useLisStore((state) => state.language);
  const isEn = language === 'EN';
  const [val, setVal] = useState(result.value || '');

  useEffect(() => {
    setVal(result.value || '');
  }, [result.value]);

  const handleChange = (newVal: string) => {
    setVal(newVal);
    onSave(result.id, newVal, result);
  };

  const isCritical = result.flag?.includes('CRITICO') || result.flag === 'PANICO';
  const isHigh = result.flag === 'ALTO';
  const isLow = result.flag === 'BAJO';
  const isAbnormal = isCritical || isHigh || isLow;

  const pillClass = isCritical
    ? 'bg-rose-950/80 border border-rose-500 text-rose-200'
    : isAbnormal
    ? 'bg-[#3b2005] border border-amber-500 text-amber-300'
    : 'bg-[#063328] border border-emerald-500/60 text-emerald-300';

  if (isValidated || !canEdit) {
    return (
      <span className={`inline-block px-3.5 py-0.5 rounded-full font-mono font-bold text-xs shadow-sm ${pillClass}`}>
        {result.value || (isValidated ? (isEn ? 'VALIDATED' : 'VALIDADO') : '—')}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        value={val}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="—"
        className={`w-24 text-center px-2 py-0.5 rounded-full font-mono font-bold text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all shadow-sm ${pillClass}`}
      />
    </div>
  );
};

// 🎨 Paleta Clínica ISO 15189 por Área (Diferenciación instantánea por código de color)
const getClinicalAreaStyles = (areaId: string) => {
  const normalized = (areaId || '').toUpperCase();

  // 1. HEMATOLOGÍA: Púrpura / Lavanda / Violeta (Normativa tubo EDTA lila)
  if (normalized.includes('HEMATO')) {
    return {
      borderLeft: 'border-l-4 border-l-purple-500',
      rowBg: 'bg-gradient-to-r from-purple-950/70 via-purple-900/30 to-[#03091e]',
      badgeBg: 'bg-purple-500/25 border-purple-500/50 text-purple-300',
      titleColor: 'text-purple-200',
      accentColor: 'text-purple-400',
      glow: 'shadow-[inset_4px_0_14px_rgba(168,85,247,0.3)]',
      btnBg: 'bg-purple-950/70 hover:bg-purple-900/80 border-purple-500/50 text-purple-200',
      pillBg: 'bg-purple-950/90 text-purple-300 border-purple-700/60',
      icon: Droplets,
    };
  }

  // 2. QUÍMICA CLÍNICA Y ENZIMAS: Ámbar / Dorado / Oro (Normativa tubo SST amarillo/oro)
  if (normalized.includes('QUIM') || normalized.includes('ENZIM')) {
    return {
      borderLeft: 'border-l-4 border-l-amber-500',
      rowBg: 'bg-gradient-to-r from-amber-950/70 via-amber-900/30 to-[#03091e]',
      badgeBg: 'bg-amber-500/25 border-amber-500/50 text-amber-300',
      titleColor: 'text-amber-200',
      accentColor: 'text-amber-400',
      glow: 'shadow-[inset_4px_0_14px_rgba(245,158,11,0.3)]',
      btnBg: 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-500/50 text-amber-200',
      pillBg: 'bg-amber-950/90 text-amber-300 border-amber-700/60',
      icon: FlaskConical,
    };
  }

  // 3. INMUNOLOGÍA Y SEROLOGÍA: Esmeralda / Verde Azulado
  if (normalized.includes('INMUNO') || normalized.includes('SEROL')) {
    return {
      borderLeft: 'border-l-4 border-l-emerald-500',
      rowBg: 'bg-gradient-to-r from-emerald-950/70 via-emerald-900/30 to-[#03091e]',
      badgeBg: 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300',
      titleColor: 'text-emerald-200',
      accentColor: 'text-emerald-400',
      glow: 'shadow-[inset_4px_0_14px_rgba(16,185,129,0.3)]',
      btnBg: 'bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/50 text-emerald-200',
      pillBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60',
      icon: ShieldCheck,
    };
  }

  // 4. COAGULACIÓN Y HEMOSTASIA: Celeste / Azul Cielo (Normativa tubo Citrato celeste)
  if (normalized.includes('COAGULA') || normalized.includes('HEMOST')) {
    return {
      borderLeft: 'border-l-4 border-l-sky-400',
      rowBg: 'bg-gradient-to-r from-sky-950/70 via-sky-900/30 to-[#03091e]',
      badgeBg: 'bg-sky-500/25 border-sky-500/50 text-sky-300',
      titleColor: 'text-sky-200',
      accentColor: 'text-sky-400',
      glow: 'shadow-[inset_4px_0_14px_rgba(56,189,248,0.3)]',
      btnBg: 'bg-sky-950/70 hover:bg-sky-900/80 border-sky-500/50 text-sky-200',
      pillBg: 'bg-sky-950/90 text-sky-300 border-sky-700/60',
      icon: Activity,
    };
  }

  // 5. MARCADORES CARDIACOS / PRUEBAS STAT: Rojo Carmesí Intenso
  if (normalized.includes('STAT') || normalized.includes('CARDIA') || normalized.includes('GASOM')) {
    return {
      borderLeft: 'border-l-4 border-l-rose-500',
      rowBg: 'bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-[#03091e]',
      badgeBg: 'bg-rose-500/30 border-rose-500/60 text-rose-200',
      titleColor: 'text-rose-200',
      accentColor: 'text-rose-400',
      glow: 'shadow-[inset_4px_0_16px_rgba(244,63,94,0.4)]',
      btnBg: 'bg-rose-950/70 hover:bg-rose-900/80 border-rose-500/50 text-rose-200',
      pillBg: 'bg-rose-950/90 text-rose-300 border-rose-700/60',
      icon: HeartPulse,
    };
  }

  // 6. URIANÁLISIS Y LÍQUIDOS: Amarillo / Lima
  if (normalized.includes('URI') || normalized.includes('ORINA')) {
    return {
      borderLeft: 'border-l-4 border-l-yellow-400',
      rowBg: 'bg-gradient-to-r from-yellow-950/70 via-yellow-900/30 to-[#03091e]',
      badgeBg: 'bg-yellow-500/25 border-yellow-500/50 text-yellow-300',
      titleColor: 'text-yellow-200',
      accentColor: 'text-yellow-400',
      glow: 'shadow-[inset_4px_0_14px_rgba(250,204,21,0.3)]',
      btnBg: 'bg-yellow-950/70 hover:bg-yellow-900/80 border-yellow-500/50 text-yellow-200',
      pillBg: 'bg-yellow-950/90 text-yellow-300 border-yellow-700/60',
      icon: Filter,
    };
  }

  // 7. ENDOCRINOLOGÍA Y HORMONAS: Índigo / Fucsia
  if (normalized.includes('ENDOCRIN') || normalized.includes('HORMON')) {
    return {
      borderLeft: 'border-l-4 border-l-indigo-400',
      rowBg: 'bg-gradient-to-r from-indigo-950/70 via-indigo-900/30 to-[#03091e]',
      badgeBg: 'bg-indigo-500/25 border-indigo-500/50 text-indigo-300',
      titleColor: 'text-indigo-200',
      accentColor: 'text-indigo-400',
      glow: 'shadow-[inset_4px_0_14px_rgba(129,140,248,0.3)]',
      btnBg: 'bg-indigo-950/70 hover:bg-indigo-900/80 border-indigo-500/50 text-indigo-200',
      pillBg: 'bg-indigo-950/90 text-indigo-300 border-indigo-700/60',
      icon: Microscope,
    };
  }

  // Por defecto: Cian / Azul LIS
  return {
    borderLeft: 'border-l-4 border-l-cyan-500',
    rowBg: 'bg-gradient-to-r from-cyan-950/60 via-blue-950/30 to-[#03091e]',
    badgeBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    titleColor: 'text-cyan-200',
    accentColor: 'text-cyan-400',
    glow: 'shadow-[inset_4px_0_12px_rgba(6,182,212,0.2)]',
    btnBg: 'bg-[#0c224d] hover:bg-[#12316e] border-blue-500/50 text-cyan-300',
    pillBg: 'bg-[#091b42] text-cyan-300 border-blue-800/60',
    icon: FlaskConical,
  };
};

// 🛡️ Regla Clínica ISO 15189: Un analito sin resultado ingresado NUNCA puede ser validado ni liberado.
export const hasResultValue = (r: TestResult | undefined | null): boolean => {
  if (!r) return false;
  if (r.value === undefined || r.value === null) return false;
  const trimmed = String(r.value).trim();
  return trimmed !== '' && trimmed !== '-' && trimmed.toLowerCase() !== 'sin valor' && trimmed.toLowerCase() !== 'pendiente';
};

export const isResultValidatable = (r: TestResult | undefined | null): boolean => {
  if (!r) return false;
  const isAlreadyValidated = r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO' || r.status === 'LIBERADO';
  if (isAlreadyValidated) return false;
  return hasResultValue(r);
};

export interface RejectionReasonTemplate {
  id: string;
  label: string;
  text: string;
  isCustom?: boolean;
}

export const DEFAULT_REJECTION_REASONS: RejectionReasonTemplate[] = [
  { id: 'def-1', label: '🩸 Hemólisis Severa (HIL 3+)', text: 'MUESTRA RECHAZADA: Hemólisis severa presente en suero/plasma (HIL 3+). Altera interferencias espectrofotométricas y analitos sensibles (K+, enzimas). Se requiere nueva muestra para garantizar resultados confiables.' },
  { id: 'def-2', label: '🧫 Muestra Coagulada', text: 'MUESTRA RECHAZADA: Presencia de microcoágulos de fibrina en tubo con anticoagulante. Se requiere nueva muestra para conteo hematológico y coagulación confiables.' },
  { id: 'def-3', label: '🧪 Volumen Insuficiente', text: 'MUESTRA RECHAZADA: Volumen de muestra menor al mínimo requerido para procesar todos los ensayos automatizados. Se solicita re-toma prioritaria de muestra.' },
  { id: 'def-4', label: '❌ Tubo Inadecuado', text: 'MUESTRA RECHAZADA: Muestra recolectada en tubo con anticoagulante incorrecto para las pruebas ordenadas. Requiere nueva muestra en el contenedor apropiado.' },
  { id: 'def-5', label: '🏷️ Error de Rotulación', text: 'MUESTRA RECHAZADA: Discrepancia en rotulación preanalítica. Por protocolo estricto de seguridad del paciente (ISO 15189), se requiere nueva toma verificada.' },
  { id: 'def-6', label: '❄️ Cadena de Frío', text: 'MUESTRA RECHAZADA: Interrupción de temperatura de transporte requerida. Se solicita nueva muestra para garantizar estabilidad biológica.' }
];

// 🔬 Resolución Inteligente del Estudio del Catálogo LIS para Pruebas Manuales y de Middleware
const resolveCatalogTest = (res: TestResult) => {
  if (res.testId && res.testId !== 'test-auto' && res.testId !== 'test-hl7') {
    const direct = MOCK_TEST_CATALOG.find(t => t.id === res.testId);
    if (direct) return direct;
  }
  const codeUpper = (res.parameterCode || '').toUpperCase();
  const nameUpper = (res.parameterName || '').toUpperCase();
  return MOCK_TEST_CATALOG.find(t =>
    t.code === res.parameterCode ||
    t.parameters?.some(p => 
      p.astmParamCode?.toUpperCase() === codeUpper ||
      p.id === res.parameterId ||
      p.name.toUpperCase() === nameUpper
    ) ||
    t.name.toUpperCase().includes(nameUpper.replace('ANALITO ', '')) ||
    (codeUpper === 'PH' && t.id === 'test-gasometria') ||
    (codeUpper === 'GLU' && t.id === 'test-glucosa') ||
    (codeUpper === 'WBC' && t.id === 'test-hemograma') ||
    (codeUpper === 'PT' && t.id === 'test-pt') ||
    (codeUpper === 'TRI' && t.id === 'test-lipidico')
  );
};

export const ResultEntryWorkspace: React.FC<ResultEntryWorkspaceProps> = ({
  order: initialOrder, patient: initialPatient, results, analyzers = MOCK_ANALYZERS, currentUser,
  onUpdateResultValue, onUpdateInterpretation, onUpdateResultStatus, onOpenPdf,
  onConsultInterBranch, onUpdateOrderTests, onUpdateOrderNotes, allOrders = [], allPatients = []
}) => {
  const language = useLisStore((state) => state.language);
  const isEn = language === 'EN';
  const [activeOrderId, setActiveOrderId] = useState<string>(initialOrder?.id || allOrders[0]?.id || '');
  const currentOrder = (allOrders.length > 0 ? allOrders.find(o => o.id === activeOrderId) : undefined) || initialOrder || allOrders[0];
  const currentPatient = (allPatients.length > 0 ? allPatients.find(p => p.id === currentOrder?.patientId) : undefined) || initialPatient || allPatients[0];
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'validated'>('all');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayOrdersCount = useMemo(() => {
    return allOrders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr)).length;
  }, [allOrders, todayStr]);
  const [orderDateFilter, setOrderDateFilter] = useState<'today' | 'all'>(() => {
    const hasToday = allOrders.some(o => o.createdAt && o.createdAt.startsWith(new Date().toISOString().split('T')[0]));
    return hasToday ? 'today' : 'all';
  });

  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [showTrendViewer, setShowTrendViewer] = useState(false);
  const [isTrendsLoading, setIsTrendsLoading] = useState(true);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // 🛡️ Trazabilidad de Auditoría ISO 15189 Real & Persistente
  const [auditTrailList, setAuditTrailList] = useState<Array<{
    id: string;
    orderId: string;
    type: 'DESVALIDACION' | 'VALIDACION' | 'LIBERACION' | 'RECEPCION' | 'MODIFICACION';
    title: string;
    userName: string;
    detail: string;
    reason?: string;
    analytes?: string[];
    timestamp: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lis_audit_events_' + (initialOrder?.id || allOrders[0]?.id || 'default'));
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'audit-init-1',
        orderId: initialOrder?.id || '',
        type: 'RECEPCION',
        title: 'Muestras ingresadas al sistema LIS',
        userName: 'Recepción Central LIS',
        detail: 'Orden registrada en el sistema con código de barras y analitos correspondientes.',
        timestamp: '2026-03-15 08:30:10'
      },
      {
        id: 'audit-init-2',
        orderId: initialOrder?.id || '',
        type: 'VALIDACION',
        title: 'Resultado validado por Middleware ASTM',
        userName: 'Middleware ASTM E1394',
        detail: 'Transmisión bidireccional y validación técnica previa.',
        timestamp: '2026-03-15 14:30:22'
      }
    ];
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && currentOrder?.id) {
      const saved = localStorage.getItem('lis_audit_events_' + currentOrder.id);
      if (saved) {
        try {
          setAuditTrailList(JSON.parse(saved));
          return;
        } catch (e) {}
      }
      setAuditTrailList([
        {
          id: 'audit-' + currentOrder.id + '-1',
          orderId: currentOrder.id,
          type: 'RECEPCION',
          title: 'Muestras ingresadas al sistema LIS',
          userName: 'Recepción Central LIS',
          detail: 'Orden #' + (currentOrder.orderNumber || currentOrder.id) + ' registrada en el sistema.',
          timestamp: '2026-03-15 08:30:10'
        },
        {
          id: 'audit-' + currentOrder.id + '-2',
          orderId: currentOrder.id,
          type: 'VALIDACION',
          title: 'Resultado validado por Middleware ASTM',
          userName: 'Middleware ASTM E1394',
          detail: 'Transmisión bidireccional y validación técnica previa.',
          timestamp: '2026-03-15 14:30:22'
        }
      ]);
    }
  }, [currentOrder?.id]);

  const addAuditEntry = (entry: {
    orderId: string;
    type: 'DESVALIDACION' | 'VALIDACION' | 'LIBERACION' | 'RECEPCION' | 'MODIFICACION';
    title: string;
    userName: string;
    detail: string;
    reason?: string;
    analytes?: string[];
  }) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formatted
    };

    setAuditTrailList(prev => {
      const updated = [newEntry, ...prev];
      if (typeof window !== 'undefined' && currentOrder?.id) {
        localStorage.setItem('lis_audit_events_' + currentOrder.id, JSON.stringify(updated));
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!activeOrderId && (initialOrder?.id || allOrders[0]?.id)) {
      setActiveOrderId(initialOrder?.id || allOrders[0]?.id || '');
    }
  }, [initialOrder, allOrders, activeOrderId]);

  useEffect(() => {
    if (showTrendViewer) {
      setIsTrendsLoading(true);
      const timer = setTimeout(() => setIsTrendsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showTrendViewer]);

  // Reglas de propiedad y permisos según Especificación LIS/HIS:
  // - JL, Dueño y Admin: autoridad de supervisión total sin restricción de propiedad
  // - TM: puede ver todas las órdenes, pero solo validar/desvalidar/modificar las suyas
  const isSupervisor = currentUser?.role === 'lab_chief' || currentUser?.role === 'owner' || currentUser?.role === 'abregotech_admin';
  const isOrderOwner = !currentOrder?.assignedTechMedId || currentOrder?.assignedTechMedId === currentUser?.id || currentOrder?.assignedTechMedId === currentUser?.username;
  const canModifyThisOrder = isSupervisor || isOrderOwner;
  const canReleaseThisOrder = isSupervisor || (currentUser?.role === 'tech_med' && isOrderOwner);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandingNotesId, setExpandingNotesId] = useState<string | null>(null);
  const [activeTraceabilityId, setActiveTraceabilityId] = useState<string | null>(null);
  const [unvalidateReason, setUnvalidateReason] = useState('');
  const [showUnvalidateModal, setShowUnvalidateModal] = useState(false);
  const [unauthorizedModalInfo, setUnauthorizedModalInfo] = useState<{
    isOpen: boolean;
    testName: string;
    validatedBy: string;
    validatedAt?: string;
    testResultId?: string;
  } | null>(null);

  const [showAlertsCenterModal, setShowAlertsCenterModal] = useState(false);
  const [showClinicalCalcModal, setShowClinicalCalcModal] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);

  // 💬 Informes & Comentarios (Analito individual y Orden general)
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsActiveTab, setCommentsActiveTab] = useState<'ANALYTE' | 'ORDER'>('ANALYTE');
  const [selectedCommentResultId, setSelectedCommentResultId] = useState<string>('');
  const [analyteCommentDraft, setAnalyteCommentDraft] = useState<string>('');
  const [orderGeneralComment, setOrderGeneralComment] = useState<string>('');
  const [commentAnalyteSearch, setCommentAnalyteSearch] = useState<string>('');

  // 🛡️ Plantillas de Motivos de Rechazo Preanalítico (ISO 15189) con persistencia personalizada
  const [rejectionReasonsList, setRejectionReasonsList] = useState<RejectionReasonTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lis_custom_rejection_reasons');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_REJECTION_REASONS;
  });

  const [isAddingCustomRejection, setIsAddingCustomRejection] = useState(false);
  const [newRejectionLabel, setNewRejectionLabel] = useState('');
  const [newRejectionText, setNewRejectionText] = useState('');

  const handleSaveCustomRejection = () => {
    if (!newRejectionLabel.trim() || !newRejectionText.trim()) {
      notifyToast.error('Por favor complete el nombre del botón y el texto explicativo del motivo.');
      return;
    }
    const newItem: RejectionReasonTemplate = {
      id: `custom-rej-${Date.now()}`,
      label: newRejectionLabel.trim(),
      text: newRejectionText.trim(),
      isCustom: true
    };
    const updated = [...rejectionReasonsList, newItem];
    setRejectionReasonsList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_custom_rejection_reasons', JSON.stringify(updated));
    }
    setNewRejectionLabel('');
    setNewRejectionText('');
    setIsAddingCustomRejection(false);
    notifyToast.success('Nuevo motivo de rechazo guardado exitosamente.');
  };

  const handleDeleteCustomRejection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rejectionReasonsList.filter(r => r.id !== id);
    setRejectionReasonsList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lis_custom_rejection_reasons', JSON.stringify(updated));
    }
    notifyToast.info('Motivo de rechazo personalizado eliminado.');
  };

  const [tempValue, setTempValue] = useState<string>('');
  const [tempNote, setTempNote] = useState<string>('');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [analyteFilter, setAnalyteFilter] = useState<'ALL' | 'PENDING' | 'CRITICAL' | 'VALIDATED' | 'MIDDLEWARE'>('ALL');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);


  const handleInitiateUnvalidate = (explicitResult?: TestResult) => {
    const selectedValidated = explicitResult
      ? [explicitResult]
      : patientResults.filter(r =>
          selectedResults.includes(r.id) &&
          (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO' || r.status === 'LIBERADO')
        );

    if (selectedValidated.length === 0) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            message: 'ℹ️ Seleccione al menos un analito en estado VALIDADO para poder desvalidar.',
            type: 'info',
            duration: 3500
          }
        })
      );
      return;
    }

    // Authorization check:
    // Supervisors (lab_chief, owner, abregotech_admin) have global unvalidation authority.
    const isSupervisorUser = currentUser?.role === 'lab_chief' || currentUser?.role === 'owner' || currentUser?.role === 'abregotech_admin';

    if (!isSupervisorUser) {
      const unauthorizedItem = selectedValidated.find(r => {
        const validator = r.technicalValidatedBy || r.medicalValidatedBy || '';
        const currentUserName = currentUser?.name || '';
        const isSelfValidated = Boolean(currentUserName && validator && validator.toLowerCase().includes(currentUserName.toLowerCase()));
        const isOrderOwnerUser = Boolean(currentOrder?.assignedTechMedId && (currentOrder.assignedTechMedId === currentUser?.id || currentOrder.assignedTechMedId === currentUser?.username));
        return !isSelfValidated && !isOrderOwnerUser;
      });

      if (unauthorizedItem) {
        const originalValidator = unauthorizedItem.technicalValidatedBy || unauthorizedItem.medicalValidatedBy || 'Lic. Sofía Guardia (TM-4091)';
        setUnauthorizedModalInfo({
          isOpen: true,
          testName: unauthorizedItem.parameterName,
          validatedBy: originalValidator,
          validatedAt: unauthorizedItem.technicalValidatedAt || '07:42 AM',
          testResultId: unauthorizedItem.id
        });
        return;
      }
    }

    if (explicitResult && !selectedResults.includes(explicitResult.id)) {
      setSelectedResults([explicitResult.id]);
    }
    setUnvalidateReason('');
    setShowUnvalidateModal(true);
  };

  const getTimeAgoData = (isoString?: string) => {
    if (!isoString) return { text: '', isLate: false };
    const diff = Math.floor((now - new Date(isoString).getTime()) / 60000);
    return { text: diff < 1 ? 'Justo ahora' : `${diff}m`, isLate: diff >= 30 };
  };

  const rawOrderResults = useMemo(() => {
    let list = results.filter(r => r.orderId === currentOrder?.id);

    // Auto-fallback: if an order has 0 results, generate test parameters from MOCK_TEST_CATALOG
    if (list.length === 0 && currentOrder && currentOrder.testIds && currentOrder.testIds.length > 0) {
      const generated: TestResult[] = [];
      currentOrder.testIds.forEach((testId) => {
        const catalogTest = MOCK_TEST_CATALOG.find((t) => t.id === testId);
        if (catalogTest && catalogTest.parameters) {
          catalogTest.parameters.forEach((param) => {
            generated.push({
              id: `res-${currentOrder.id}-${param.id}`,
              orderId: currentOrder.id,
              testId: testId,
              parameterId: param.id,
              parameterCode: param.astmParamCode || param.id,
              parameterName: param.name,
              unit: param.unit,
              value: '', // Ready for entry
              numericValue: undefined,
              flag: 'PENDIENTE',
              status: 'PENDIENTE',
              refRangeText: param.referenceRanges?.[0] ? `${param.referenceRanges[0].minValue} - ${param.referenceRanges[0].maxValue}` : 'Normal',
              source: 'RECEPCION_POS',
              analyzerName: 'Ingreso Manual / ACE'
            });
          });
        }
      });
      if (generated.length > 0) {
        list = generated;
      }
    }

    // Deduplicate repeated analytes: collapse identical test + parameter pairs into 1 unique row
    const uniqueMap = new Map<string, TestResult>();
    list.forEach((item) => {
      const key = `${item.testId || 't'}-${item.parameterId || item.parameterName || item.id}`;
      const existing = uniqueMap.get(key);
      if (!existing) {
        uniqueMap.set(key, item);
      } else {
        // If one has an actual value or is validated, keep that one
        const existingHasVal = existing.value && existing.value.trim() !== '';
        const itemHasVal = item.value && item.value.trim() !== '';
        if (!existingHasVal && itemHasVal) {
          uniqueMap.set(key, item);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [currentOrder, results]);

  const patientResults = useMemo(() => {
    let list = rawOrderResults;
    if (analyteFilter === 'PENDING') {
      list = list.filter(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED' && r.status !== 'VALIDADO');
    } else if (analyteFilter === 'CRITICAL') {
      list = list.filter(r => r.flag?.includes('CRITICO') || r.flag === 'PANICO');
    } else if (analyteFilter === 'VALIDATED') {
      list = list.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO');
    } else if (analyteFilter === 'MIDDLEWARE') {
      list = list.filter(r => r.source === 'MIDDLEWARE_ASTM' || r.source === 'ANALYZER_DIRECT');
    }
    return list;
  }, [rawOrderResults, analyteFilter]);

  // Group results by clinical area for segregated workstation and report views
  const groupedResults = useMemo(() => {
    return groupResultsByClinicalArea(patientResults, MOCK_TEST_CATALOG);
  }, [patientResults]);

  const analyteCounts = useMemo(() => {
    return {
      all: rawOrderResults.length,
      pending: rawOrderResults.filter(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED' && r.status !== 'VALIDADO').length,
      critical: rawOrderResults.filter(r => r.flag?.includes('CRITICO') || r.flag === 'PANICO').length,
      validated: rawOrderResults.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO').length,
      middleware: rawOrderResults.filter(r => r.source === 'MIDDLEWARE_ASTM' || r.source === 'ANALYZER_DIRECT').length
    };
  }, [rawOrderResults]);

  // Action Bar Status & Counter Metrics
  const pendingReleaseCount = useMemo(() => {
    return patientResults.filter(r => r.status !== 'LIBERADO').length;
  }, [patientResults]);

  const criticalResultsCount = useMemo(() => {
    return patientResults.filter(r => r.flag?.includes('CRITICO') || r.flag === 'PANICO').length;
  }, [patientResults]);

  const selectedUnvalidatedCount = useMemo(() => {
    return selectedResults.filter(id => {
      const res = results.find(r => r.id === id);
      return res && res.status !== 'VALIDADO_TEC' && res.status !== 'VALIDADO_MED' && res.status !== 'VALIDADO' && res.status !== 'LIBERADO';
    }).length;
  }, [selectedResults, results]);

  const selectedValidatedCount = useMemo(() => {
    return selectedResults.filter(id => {
      const res = results.find(r => r.id === id);
      return res && (res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED' || res.status === 'VALIDADO' || res.status === 'LIBERADO');
    }).length;
  }, [selectedResults, results]);

  // Analitos pendientes que SÍ tienen resultado cargado y están listos para ser validados técnicamente
  const validatableCount = useMemo(() => {
    return patientResults.filter(r => isResultValidatable(r)).length;
  }, [patientResults]);

  // Analitos que aún no tienen ningún resultado cargado (verdaderamente pendientes de laboratorio)
  const missingValueCount = useMemo(() => {
    return patientResults.filter(r => {
      const isDone = (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO' || r.status === 'LIBERADO') && hasResultValue(r);
      return !isDone && !hasResultValue(r);
    }).length;
  }, [patientResults]);

  // Analitos seleccionados en casillas que son aptos para validar (tienen resultado)
  const selectedValidatableCount = useMemo(() => {
    return selectedResults.filter(id => {
      const res = results.find(r => r.id === id);
      return isResultValidatable(res);
    }).length;
  }, [selectedResults, results]);

  // Analitos seleccionados en casillas que NO tienen resultado aún
  const selectedMissingValueCount = useMemo(() => {
    return selectedResults.filter(id => {
      const res = results.find(r => r.id === id);
      return res && !hasResultValue(res) && res.status !== 'VALIDADO_TEC' && res.status !== 'VALIDADO_MED' && res.status !== 'VALIDADO' && res.status !== 'LIBERADO';
    }).length;
  }, [selectedResults, results]);

  // Mantener compatibilidad con unvalidatedCount (analitos pendientes con resultado listos para validar)
  const unvalidatedCount = validatableCount;

  const toReleaseCount = useMemo(() => {
    return patientResults.filter(r =>
      hasResultValue(r) &&
      (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO') &&
      r.status !== 'LIBERADO'
    ).length;
  }, [patientResults]);

  const filteredCommentResults = useMemo(() => {
    if (!commentAnalyteSearch.trim()) return patientResults;
    const q = commentAnalyteSearch.toLowerCase().trim();
    return patientResults.filter(r =>
      r.parameterName.toLowerCase().includes(q) ||
      r.parameterCode.toLowerCase().includes(q) ||
      (r.testName && r.testName.toLowerCase().includes(q))
    );
  }, [patientResults, commentAnalyteSearch]);

  const getFlagStyle = (flag?: string) => {
    if (flag?.includes('CRITICO')) return 'bg-rose-500/25 border-2 border-rose-500 text-rose-200 font-black text-sm px-3.5 py-1 rounded-xl shadow-lg shadow-rose-500/30 animate-pulse';
    if (flag === 'ALTO') return 'bg-amber-500/25 border-2 border-amber-500/60 text-amber-300 font-black text-sm px-3.5 py-1 rounded-xl shadow-md shadow-amber-500/20';
    if (flag === 'BAJO') return 'bg-blue-500/25 border-2 border-blue-500/60 text-blue-300 font-black text-sm px-3.5 py-1 rounded-xl shadow-md shadow-blue-500/20';
    return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-xl';
  };

  const tatData = useMemo(() => {
    if (!currentOrder) {
      return { value: '—', sub: 'Sin orden activa', isLate: false, colorClass: 'text-slate-500' };
    }
    const isFinished = currentOrder.status === 'VALIDADA_TEC' || currentOrder.status === 'VALIDADA_MED' || currentOrder.status === 'LIBERADA' || currentOrder.status === 'COMPLETADA';
    if (isFinished) {
      return { value: '✓ Listo', sub: 'TAT Cumplido', isLate: false, colorClass: 'text-emerald-400' };
    }
    const targetMinutes = currentOrder.priority === 'STAT' ? 45 : (currentOrder.priority === 'URGENTE' ? 90 : 180);
    const createdMs = currentOrder.createdAt ? new Date(currentOrder.createdAt).getTime() : now;
    const elapsedMinutes = Math.max(0, Math.floor((now - createdMs) / 60000));
    const remainingMinutes = targetMinutes - elapsedMinutes;
    if (remainingMinutes > 0) {
      return {
        value: `${remainingMinutes}`,
        sub: 'min restantes',
        isLate: false,
        colorClass: remainingMinutes <= 15 ? 'text-amber-300' : 'text-teal-300'
      };
    } else {
      return {
        value: `${Math.abs(remainingMinutes)}`,
        sub: 'min excedido',
        isLate: true,
        colorClass: 'text-rose-400 animate-pulse'
      };
    }
  }, [currentOrder, now]);

  const patientFullName = currentPatient
    ? `${currentPatient.firstName} ${currentPatient.lastName}`
    : (currentOrder?.patientName || 'Sin Paciente Seleccionado');

  const patientNationalId = currentPatient?.nationalId || currentOrder?.patientNationalId || 'N/A';
  const orderNumberDisplay = currentOrder?.orderNumber || 'N/A';

  const patientAgeDisplay = currentOrder?.patientAge
    ? `${currentOrder.patientAge} años`
    : (currentPatient?.dob
        ? `${Math.max(0, new Date().getFullYear() - new Date(currentPatient.dob).getFullYear())} años`
        : (currentOrder ? 'Edad N/D' : '—'));

  const patientGenderDisplay = ((currentOrder?.patientGender || currentPatient?.gender) === 'M')
    ? 'Masculino'
    : (((currentOrder?.patientGender || currentPatient?.gender) === 'F')
        ? 'Femenino'
        : '—');

  const cleanServiceOrigin = useMemo(() => {
    const raw = currentOrder?.serviceOrigin || (currentOrder ? 'Consulta Externa' : '—');
    return raw.replace(/^[\p{Emoji}\u200d\s]+/u, '').trim() || 'Laboratorio Central';
  }, [currentOrder?.serviceOrigin, currentOrder]);

  const cleanDoctorDisplay = useMemo(() => {
    if (!currentOrder?.doctorName) return currentOrder ? 'Sin Médico Referente' : '—';
    const raw = currentOrder.doctorName.replace(/^[\p{Emoji}\u200d\s]+/u, '').trim();
    // Eliminar prefijos redundantes como Dr., Dra., Dr(a). para evitar "Dr(a). Dr."
    const nameWithoutPrefix = raw.replace(/^(Dr\.|Dra\.|Dr\(a\)\.?|Doctor|Doctora)\s+/i, '').trim();
    return `Dr(a). ${nameWithoutPrefix}`;
  }, [currentOrder?.doctorName, currentOrder]);

  const serviceOriginDisplay = cleanServiceOrigin;
  const doctorDisplay = cleanDoctorDisplay;

  const specimensDisplay = currentOrder?.specimens && currentOrder.specimens.length > 0
    ? currentOrder.specimens.map(s => `${s.type || 'Muestra'} (${s.barcode || 'S/C'})`).join(' + ')
    : (currentOrder ? 'Muestras por recolectar' : 'Sin muestras asociadas');

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const q = orderSearchQuery.toLowerCase().trim();
      const cleanQ = q.replace(/[-]/g, '');
      const cleanNatId = (o.patientNationalId || '').toLowerCase().replace(/[-]/g, '');

      // Coincidencia amplia: Número de orden, Paciente, Cédula o Códigos de barra de tubos
      const matchesBarcode = (o.specimens || []).some(s => 
        (s.barcode && s.barcode.toLowerCase().includes(q)) ||
        (s.barcode && q.includes(s.barcode.toLowerCase()))
      );

      // Compatibilidad si escriben sufijo o prefijo (ej: "BAR-0001", "0001", "90001")
      const matchesSuffix = q.startsWith('bar-') && o.orderNumber.endsWith(q.replace('bar-', ''));

      const matchesSearch = !q ||
                          o.patientName.toLowerCase().includes(q) ||
                          o.orderNumber.toLowerCase().includes(q) ||
                          (cleanNatId && cleanQ.length >= 3 && cleanNatId.includes(cleanQ)) ||
                          matchesBarcode ||
                          matchesSuffix;

      const orderResults = results.filter(r => r.orderId === o.id);
      const isPending = orderResults.some(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED' && r.status !== 'VALIDADO' && r.status !== 'LIBERADO');

      const matchesDate = orderDateFilter === 'all' || (o.createdAt && o.createdAt.startsWith(todayStr));
      if (!matchesDate) return false;

      if (orderStatusFilter === 'pending') return matchesSearch && isPending;
      if (orderStatusFilter === 'validated') return matchesSearch && !isPending;
      return matchesSearch;
    });
  }, [allOrders, orderSearchQuery, orderStatusFilter, orderDateFilter, results, todayStr]);

  const pendingCount = useMemo(() => {
    return allOrders.filter(o =>
      results.filter(r => r.orderId === o.id).some(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED' && r.status !== 'VALIDADO' && r.status !== 'LIBERADO')
    ).length;
  }, [allOrders, results]);

  const toggleSelectAll = () => {
    const allIds = patientResults.map(r => r.id);
    if (selectedResults.length === allIds.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(allIds);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-full flex-1 min-h-0 bg-[#020617] overflow-hidden border border-slate-800/80 shadow-2xl relative w-full">
      {/* Sidebar: Órdenes (Diseño Adaptativo clamp 260px - 330px, Colapsable elegante a 74px) */}
      <div className={`${isSidebarCollapsed ? "w-full lg:w-[74px]" : "w-full lg:w-[clamp(270px,20vw,330px)]"} bg-[#030a21] border-b lg:border-b-0 lg:border-r border-blue-950/80 flex flex-col transition-all duration-300 relative shrink-0 h-full overflow-hidden`}>
        <div className={`${isSidebarCollapsed ? "p-1.5" : "p-2.5 sm:p-3"} flex flex-col h-full space-y-2 overflow-hidden`}>
          {/* Header Bandeja de Órdenes */}
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-blue-950/60 pt-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                title={isEn ? "Expand full order tray (View patients and filters)" : "Expandir bandeja de órdenes completa (Ver pacientes y filtros)"}
                className="w-12 h-10 bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 hover:from-cyan-500 hover:to-blue-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/50 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg shadow-cyan-500/10 group"
              >
                <ChevronRight className="w-4 h-4 group-hover:scale-125 transition-transform" />
                <span className="text-[7.5px] font-black uppercase tracking-tight text-cyan-200 group-hover:text-slate-950">{isEn ? 'OPEN' : 'ABRIR'}</span>
              </button>
              <span
                title={isEn ? `${pendingCount || filteredOrders.length} orders in tray` : `${pendingCount || filteredOrders.length} órdenes en bandeja`}
                className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-black shadow-[0_0_8px_rgba(244,63,94,0.6)] cursor-default"
              >
                {pendingCount || filteredOrders.length}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FlaskConical className="w-5 h-5 text-cyan-400 shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <h3 className="text-xs font-black text-white tracking-wider uppercase truncate">
                  {isEn ? 'Orders Tray' : 'Bandeja de Órdenes'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {pendingCount || filteredOrders.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  title={isEn ? "Collapse sidebar" : "Colapsar bandeja lateral"}
                  className="px-2 py-0.5 bg-slate-900/90 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-400/40 rounded-lg flex items-center gap-1 transition-all cursor-pointer text-[10px] font-bold shrink-0"
                >
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 rotate-180" />
                  <span className="hidden xl:inline">{isEn ? 'Collapse' : 'Colapsar'}</span>
                </button>
              </div>
            </div>
          )}

          {!isSidebarCollapsed && (
            <div className="space-y-2 shrink-0">
              {/* Search Bar with Filter Icon */}
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder={isEn ? "Search patient, order or barcode..." : "Buscar paciente u orden..."}
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-[#071333] border border-blue-900/60 rounded-xl py-1.5 pl-8 pr-8 text-[11px] text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  title={isEn ? "Filter orders" : "Filtrar órdenes"}
                  className="absolute right-2.5 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filtro Rápido Fecha: Hoy vs Todas */}
              <div className="flex gap-1 bg-[#02071a] p-1 rounded-xl border border-blue-950/80">
                <button
                  type="button"
                  onClick={() => setOrderDateFilter('today')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    orderDateFilter === 'today'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                  title={isEn ? "Show only orders entered today" : "Mostrar únicamente órdenes ingresadas en la fecha de hoy"}
                >
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span>{isEn ? `Today (${todayOrdersCount})` : `Solo Hoy (${todayOrdersCount})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDateFilter('all')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    orderDateFilter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                  title={isEn ? "Show orders from all dates" : "Mostrar órdenes de todas las fechas acumuladas"}
                >
                  <span>{isEn ? `All (${allOrders.length})` : `Todas (${allOrders.length})`}</span>
                </button>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex gap-1.5 bg-[#03091e] p-1 rounded-xl border border-blue-950">
                {(["all", "pending", "validated"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatusFilter(status)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      orderStatusFilter === status
                        ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    {status === "all" ? (isEn ? "All" : "Todo") : status === "pending" ? (isEn ? "Pend." : "Pend.") : (isEn ? "Val." : "Val.")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders Scroll Container */}
          <div className={`overflow-y-auto space-y-2.5 flex-1 min-h-0 overflow-x-hidden pt-1.5 pb-2 px-1 ${
            isSidebarCollapsed ? "no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" : "custom-scrollbar"
          }`}>
            {filteredOrders.map(o => {
              const orderResults = results.filter(r => r.orderId === o.id);
              const uniqueParams = Array.from(new Set(orderResults.map(r => r.parameterId)));
              const validatedCount = uniqueParams.filter(pId =>
                orderResults.find(r => r.parameterId === pId && (r.status === "VALIDADO_TEC" || r.status === "VALIDADO_MED" || r.status === "VALIDADO"))
              ).length;
              const hasCritical = orderResults.some(r => r.flag?.includes("CRITICO") || r.flag === "PANICO");
              const isStat = o.priority === "STAT" || o.priority === "URGENTE";
              const isActive = o.id === activeOrderId;
              const progressPct = Math.round((validatedCount / Math.max(1, uniqueParams.length)) * 100);
              const isFullyValidated = uniqueParams.length > 0 && validatedCount === uniqueParams.length;

              // Vista compacta cuando la bandeja está colapsada (Pills cilíndricos con iniciales y micro-barra)
              if (isSidebarCollapsed) {
                const initials = o.patientName
                  ? o.patientName.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("")
                  : "PX";
                const orderShortCode = (o.orderNumber || o.id).slice(-4);

                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setActiveOrderId(o.id)}
                    title={`${o.orderNumber || o.id} - ${o.patientName} (${validatedCount}/${uniqueParams.length} Validados)`}
                    className={`w-12 h-14 mx-auto rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer relative shrink-0 group ${
                      isActive
                        ? (isStat || hasCritical
                            ? "bg-rose-950/90 border-2 border-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.6)] text-white ring-2 ring-rose-500/50 scale-105"
                            : "bg-cyan-950/90 border-2 border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.5)] text-white ring-2 ring-cyan-400/50 scale-105")
                        : (isStat || hasCritical
                            ? "bg-[#0c1430] border border-rose-900/60 hover:border-rose-500 text-rose-300 hover:scale-102"
                            : "bg-[#07112b] border border-blue-950 hover:border-cyan-500/50 text-slate-300 hover:scale-102")
                    }`}
                  >
                    {/* Indicador de estado */}
                    {(hasCritical || isStat) && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse" />
                    )}
                    {!hasCritical && !isStat && isFullyValidated && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    )}
                    {!hasCritical && !isStat && !isFullyValidated && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute top-1 right-1 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                    )}

                    {/* Iniciales del Paciente */}
                    <span className="text-[11px] font-black tracking-tight leading-none text-white">
                      {initials}
                    </span>

                    {/* Últimos 4 dígitos de la orden */}
                    <span className="text-[9px] font-mono font-bold text-slate-400 leading-none">
                      {orderShortCode}
                    </span>

                    {/* Micro barra de progreso */}
                    <div className="w-7 h-1 bg-slate-900/90 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isStat || hasCritical ? "bg-rose-500" : isFullyValidated ? "bg-emerald-400" : "bg-cyan-400"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </button>
                );
              }

              // Vista expandida normal
              return (
                <button
                  key={o.id}
                  onClick={() => setActiveOrderId(o.id)}
                  className={`w-full text-left rounded-xl border p-2.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? (isStat || hasCritical
                          ? "bg-[#0f1738] border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                          : "bg-[#091538] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]")
                      : (isStat || hasCritical
                          ? "bg-[#0c1430] border-rose-900/50 hover:border-rose-500/60"
                          : "bg-[#07112b] border-blue-950 hover:border-blue-800")
                  }`}
                >
                  {/* Top row: Order Number & Alert Badge */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-mono font-bold tracking-tight ${
                      isStat || hasCritical ? "text-rose-400" : "text-slate-400"
                    }`}>
                      {o.orderNumber || o.id}
                    </span>
                    {(isStat || hasCritical) && (
                      <span className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center justify-center text-[10px] font-black animate-pulse">
                        !
                      </span>
                    )}
                  </div>

                  {/* Middle row: Patient Name */}
                  <div className="text-xs font-black uppercase text-white line-clamp-2 leading-snug" title={o.patientName}>
                    {o.patientName}
                  </div>

                  {/* Bottom row: Progress bar + Time & Val Count */}
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isStat || hasCritical ? "bg-rose-500" : "bg-cyan-400"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 inline" />
                        12/10/2026 09:42 AM
                      </span>
                      <span className={`font-bold ${isStat || hasCritical ? "text-rose-400" : "text-cyan-400"}`}>
                        {validatedCount} / {uniqueParams.length} VAL.
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Patient Clinical Header & Segmented Filters (Diseño Exacto del Mock) */}
        <div className="p-2 sm:p-2.5 shrink-0">
          <div className="bg-[#061130] border border-blue-900/60 rounded-2xl p-2.5 shadow-lg flex flex-col gap-2 transition-all duration-300">
            {/* Fila 1: Datos Principales del Paciente */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-950/60 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)] shrink-0">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="font-black text-white uppercase tracking-tight text-sm">
                    {patientFullName}
                  </span>
                  {currentOrder && (currentOrder.priority === 'STAT' || currentOrder.priority === 'URGENTE') && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-md shadow-rose-600/30">
                      ▲ {isEn ? 'URGENCY' : 'URGENCIA'}
                    </span>
                  )}
                  <span className="text-blue-500/40">|</span>
                  <span className="text-cyan-400 font-mono font-bold text-xs flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                    {patientNationalId}
                  </span>
                  <span className="text-blue-500/40">•</span>
                  <span className="text-slate-300 text-xs font-mono">
                    {isEn ? 'Order:' : 'Orden:'} <strong className="text-white">{orderNumberDisplay}</strong>
                  </span>
                  <span className="text-blue-500/40">•</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-900/50 text-slate-200 text-xs">
                    <UserCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{patientAgeDisplay} • {patientGenderDisplay}</span>
                  </span>
                </div>
              </div>

              {/* Controles de Minimizar / Abrir Encabezado */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {isHeaderCollapsed && (
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-md hidden sm:inline-flex items-center gap-1">
                    <Filter className="w-2.5 h-2.5 text-cyan-400" />
                    {analyteFilter === 'ALL' ? (isEn ? `All (${analyteCounts.all})` : `Todos (${analyteCounts.all})`) :
                     analyteFilter === 'PENDING' ? (isEn ? `Pending (${analyteCounts.pending})` : `Pendientes (${analyteCounts.pending})`) :
                     analyteFilter === 'CRITICAL' ? (isEn ? `Critical (${analyteCounts.critical})` : `Críticos (${analyteCounts.critical})`) :
                     analyteFilter === 'VALIDATED' ? (isEn ? `Validated (${analyteCounts.validated})` : `Validados (${analyteCounts.validated})`) :
                     `Middleware (${analyteCounts.middleware})`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  title={isHeaderCollapsed 
                    ? (isEn ? "Open patient details & filters" : "Abrir datos y filtros del paciente") 
                    : (isEn ? "Minimize patient header to maximize workspace" : "Minimizar encabezado para maximizar espacio de trabajo")}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/90 hover:bg-cyan-500/20 text-cyan-300 border border-blue-900/70 hover:border-cyan-400/50 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                >
                  {isHeaderCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
                      <span>{isEn ? 'Open' : 'Abrir'}</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
                      <span>{isEn ? 'Minimize' : 'Minimizar'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isHeaderCollapsed && (
              <>
                {/* Fila 2: Demográficos de Sede, Ubicación / Servicio y Médico */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Demográfico de Sede */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold shadow-xs">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {currentOrder?.branchName || (currentOrder?.branchId === 'branch-david' ? (isEn ? 'Chiriquí Branch (David)' : 'Sede Chiriquí (David)') : (isEn ? 'Vía España Branch' : 'Sede Vía España'))}
                      <span className="text-cyan-400 font-black"> [{currentOrder?.branchCode || (currentOrder?.branchId === 'branch-david' ? 'CH-02' : 'VE-01')}]</span>
                      <span className="text-slate-400 font-medium"> • {currentOrder?.branchRegion || (currentOrder?.branchId === 'branch-david' ? 'Chiriquí' : 'Panamá Centro')}</span>
                    </span>
                  </span>

                  {currentOrder?.isInterBranchReferral && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold shadow-xs">
                      <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{isEn ? 'Referral:' : 'Remisión:'} {currentOrder.originBranchName || (isEn ? 'Origin Branch' : 'Sede Origen')} ➔ {currentOrder.processingBranchName || 'Hub Central'}</span>
                    </span>
                  )}

                  {/* Origen de Solicitud / Servicio Hospitalario */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800/90 text-slate-200 text-[11px] shadow-xs hover:border-slate-700 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-slate-400 font-semibold text-[10.5px] uppercase tracking-wider">{isEn ? 'Origin:' : 'Origen:'}</span>
                    <span className="font-bold text-slate-100">{serviceOriginDisplay || (isEn ? 'Central Laboratory' : 'Laboratorio Central')}</span>
                  </span>

                  {/* Médico Solicitante */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800/90 text-slate-200 text-[11px] shadow-xs hover:border-slate-700 transition-colors">
                    <Stethoscope className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-slate-400 font-semibold text-[10.5px] uppercase tracking-wider">{isEn ? 'Physician:' : 'Médico:'}</span>
                    <span className="font-bold text-cyan-300">{doctorDisplay || (isEn ? 'No Referring Physician' : 'Sin Médico Referente')}</span>
                  </span>
                </div>

                {/* Fila 3: Filtros de Estado de Analitos (Pills en Una Sola Fila) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-950">
                  <button
                    type="button"
                    onClick={() => setAnalyteFilter('ALL')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                      analyteFilter === 'ALL'
                        ? 'bg-cyan-500/25 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEn ? `All (${analyteCounts.all})` : `Todos (${analyteCounts.all})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalyteFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                      analyteFilter === 'PENDING'
                        ? 'bg-blue-500/25 border-2 border-blue-400 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                        : 'bg-blue-950/40 border border-blue-900/60 text-blue-300/80 hover:text-blue-200'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{isEn ? `Pending (${analyteCounts.pending})` : `Pendientes (${analyteCounts.pending})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalyteFilter('CRITICAL')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                      analyteFilter === 'CRITICAL'
                        ? 'bg-rose-500/30 border-2 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                        : 'bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:text-rose-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{isEn ? `Critical (${analyteCounts.critical})` : `Críticos (${analyteCounts.critical})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalyteFilter('VALIDATED')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                      analyteFilter === 'VALIDATED'
                        ? 'bg-emerald-500/25 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 hover:text-emerald-100'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isEn ? `Validated (${analyteCounts.validated})` : `Validados (${analyteCounts.validated})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnalyteFilter('MIDDLEWARE')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                      analyteFilter === 'MIDDLEWARE'
                        ? 'bg-purple-500/25 border-2 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-purple-950/40 border border-purple-900/60 text-purple-300 hover:text-purple-100'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Middleware ({analyteCounts.middleware})</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-6 space-y-2 custom-scrollbar">

           {/* Banner de Protección por Propiedad de la Orden (Normativa LIS/HIS) */}
           {!canModifyThisOrder && (
             <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center space-x-2 text-amber-200 text-xs shadow-sm">
               <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
               <div className="text-[10px]">
                 <strong className="text-white mr-1.5 font-bold">{isEn ? 'Read-only mode:' : 'Modo lectura:'}</strong>
                 <span>{isEn ? 'This order belongs to another Medical Technologist. Only its owner or management can modify it.' : 'Esta orden pertenece a otro Tecnólogo Médico. Solo su dueño o la Jefatura pueden modificarla.'}</span>
               </div>
             </div>
           )}

           {/* Mobile Card View (< md) Grouped by Clinical Area */}
           <div className="block md:hidden space-y-4">
              {groupedResults.map(({ area, results: areaResults }) => (
                <div key={`mob-area-${area.id}`} className="space-y-3">
                  <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-800 pb-2">
                    <span className="font-mono font-black text-xs uppercase tracking-wider text-teal-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                      {getLocalizedAreaName(area, isEn)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300 font-bold">
                      {areaResults.length} {isEn ? (areaResults.length === 1 ? 'analyte' : 'analytes') : (areaResults.length === 1 ? 'analito' : 'analitos')}
                    </span>
                  </div>
                  {areaResults.map((res, index) => {
                 const isValidated = res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED' || res.status === 'VALIDADO';
                 const isHigh = res.flag === 'ALTO';
                 const isCritical = res.flag?.includes('CRITICO');
                  const catalogTest = resolveCatalogTest(res);
                  const testCode = catalogTest?.code || (res.testId && res.testId !== 'test-auto' && res.testId !== 'test-hl7' ? res.testId.replace('test-', '').slice(0, 4) : (res.parameterCode || '8003'));

                 return (
                    <div
                      key={`mob-res-${res.id}-${index}`}
                      onClick={() => setActiveTraceabilityId(res.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isCritical
                          ? 'bg-rose-950/30 border-2 border-rose-500 shadow-lg shadow-rose-500/20'
                          : isHigh
                          ? 'bg-amber-950/20 border-2 border-amber-500/60 shadow-md'
                          : selectedResults.includes(res.id)
                          ? 'bg-teal-500/10 border-teal-400'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                       {/* Mobile Card Header */}
                       <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedResults(prev => prev.includes(res.id) ? prev.filter(id => id !== res.id) : [...prev, res.id]);
                               }}
                               className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                 selectedResults.includes(res.id)
                                   ? 'bg-teal-500 border-teal-500 text-slate-950 font-black'
                                   : 'bg-slate-950 border-slate-800 text-transparent'
                               }`}
                             >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                             </button>
                             <span className="px-1.5 py-0.5 rounded bg-blue-950/90 border border-cyan-500/50 text-cyan-300 font-mono font-black text-[10px] shrink-0 shadow-xs">
                                 #{testCode}
                              </span>
                              <span className="font-black text-white text-xs uppercase">{res.parameterName}</span>
                          </div>

                          {isValidated ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase rounded-full">
                              {isEn ? 'VALIDATED' : 'VALIDADO'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase rounded-full">
                              {isEn ? 'PENDING' : 'PENDIENTE'}
                            </span>
                          )}
                       </div>

                       {/* Mobile Value Display */}
                       <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                          <div>
                             <span className="text-[9px] text-slate-500 font-bold uppercase block">{isEn ? 'Result' : 'Resultado'}</span>
                             <span className={`text-lg font-black font-mono ${isCritical ? 'text-rose-400 animate-pulse' : isHigh ? 'text-amber-300' : 'text-emerald-400'}`}>
                                {res.value} <span className="text-xs text-slate-400 font-normal">{res.unit}</span>
                             </span>
                          </div>

                          <div className="text-right">
                             <span className="text-[9px] text-slate-500 font-bold uppercase block">{isEn ? 'Reference Range' : 'Valor Referencia'}</span>
                             <span className="text-xs text-slate-300 font-mono italic">{res.refRangeText}</span>
                          </div>
                       </div>

                       {/* Mobile Alert Banner if High/Critical */}
                       {(isHigh || isCritical) && (
                          <div className={`p-2.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 ${isCritical ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'}`}>
                             <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                             <span>{isCritical ? (isEn ? 'CRITICAL PANIC VALUE — Mandatory notification (ISO 15189).' : 'VALOR CRÍTICO DE PÁNICO — Notificación obligatoria (ISO 15189).') : (isEn ? `RANGE ALERT: ${getLocalizedParameterName(res.parameterName, isEn)} (${res.value} ${res.unit}) exceeds maximum limit.` : `ALERTA DE RANGO: ${res.parameterName} (${res.value} ${res.unit}) excede el valor máximo.`)}</span>
                          </div>
                       )}
                    </div>
                 );
                  })}
                </div>
              ))}
           </div>

           {/* Desktop 3D Glassmorphic Table Container (>= md) */}
           <div className="hidden md:block bg-[#030a21] border border-blue-900/60 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                 <thead className="bg-[#030a21] text-slate-300 font-bold uppercase text-[11px] tracking-wider border-b border-blue-900/60 sticky top-0 z-20 backdrop-blur-md">
                    <tr>
                      <th className="py-1.5 px-2.5 w-12 text-center">
                        <button
                          onClick={toggleSelectAll}
                          className={`w-4 h-4 rounded border transition-all flex items-center justify-center mx-auto cursor-pointer ${
                            selectedResults.length > 0 && selectedResults.length === patientResults.length
                              ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                              : selectedResults.length > 0
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                              : 'border-blue-800 bg-transparent hover:border-cyan-400'
                          }`}
                        >
                          {selectedResults.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      </th>
                      <th className="py-1.5 px-2.5 text-left">
                        <div className="inline-flex items-center gap-2 text-cyan-300 border-b-2 border-cyan-400 pb-1 font-bold text-[11px] tracking-wider">
                          <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isEn ? 'ANALYTE / TEST' : 'ANALITO / EXAMEN'}</span>
                        </div>
                      </th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">
                        <div className="leading-tight">
                          <div>{isEn ? 'CLINICAL' : 'RESULTADO'}</div>
                          <div>{isEn ? 'RESULT' : 'CLÍNICO'}</div>
                        </div>
                      </th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">{isEn ? 'UNIT' : 'UNIDAD'}</th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">{isEn ? 'REFERENCE RANGE' : 'INTERVALO DE REFERENCIA'}</th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">{isEn ? 'SOURCE / INSTRUMENT' : 'ORIGEN / EQUIPO'}</th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">{isEn ? 'STATUS' : 'ESTADO'}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-blue-950/60">
                    {groupedResults.map(({ area, results: areaResults }) => {
                      const allAreaValidated = areaResults.every(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO');
                      const allAreaSelected = areaResults.every(r => selectedResults.includes(r.id));
                      const hasCriticalInArea = areaResults.some(r => r.flag?.includes('CRITICO'));
                      const areaStyle = getClinicalAreaStyles(area.id);
                      const AreaIcon = areaStyle.icon;

                      return (
                        <React.Fragment key={`area-section-${area.id}`}>
                          {/* Fila Encabezado de Área Diferenciada por Color ISO 15189 */}
                          <tr className={`${areaStyle.rowBg} ${areaStyle.borderLeft} ${areaStyle.glow} border-y border-blue-900/60 transition-all`}>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (allAreaSelected) {
                                    const idsToRemove = new Set(areaResults.map(r => r.id));
                                    setSelectedResults(prev => prev.filter(id => !idsToRemove.has(id)));
                                  } else {
                                    const idsToAdd = areaResults.map(r => r.id);
                                    setSelectedResults(prev => Array.from(new Set([...prev, ...idsToAdd])));
                                  }
                                }}
                                className={`w-4 h-4 rounded border transition-all flex items-center justify-center mx-auto cursor-pointer ${
                                  allAreaSelected
                                    ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                                    : 'border-blue-800 bg-transparent hover:border-cyan-400'
                                }`}
                              >
                                {allAreaSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                            </td>
                            <td colSpan={6} className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-lg ${areaStyle.badgeBg} flex items-center justify-center shrink-0 shadow-sm`}>
                                      <AreaIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className={`font-black text-xs sm:text-[13px] uppercase tracking-wider ${areaStyle.titleColor}`}>
                                      {getLocalizedAreaName(area, isEn)}
                                    </span>
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${areaStyle.pillBg}`}>
                                    {areaResults.length} {isEn ? (areaResults.length === 1 ? 'analyte' : 'analytes') : (areaResults.length === 1 ? 'analito' : 'analitos')}
                                  </span>
                                  <span className="text-[11px] text-cyan-400/80 flex items-center gap-1 font-mono">
                                    <Info className="w-3 h-3 text-cyan-400" /> {isEn ? 'Analytes:' : 'Analitos:'} {areaResults.length}
                                  </span>
                                  {hasCriticalInArea && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-black text-rose-300 flex items-center gap-1 animate-pulse">
                                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                                      <span>{isEn ? 'CRITICAL ALERT' : 'ALERTA CRÍTICA'}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#052923] border border-emerald-500/40 text-emerald-300">
                                    {areaResults.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO').length}/{areaResults.length} {isEn ? 'Validated' : 'Validados'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (allAreaSelected) {
                                        const idsToRemove = new Set(areaResults.map(r => r.id));
                                        setSelectedResults(prev => prev.filter(id => !idsToRemove.has(id)));
                                      } else {
                                        const idsToAdd = areaResults.map(r => r.id);
                                        setSelectedResults(prev => Array.from(new Set([...prev, ...idsToAdd])));
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm ${areaStyle.btnBg}`}
                                  >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span>{isEn ? (allAreaSelected ? 'DESELECT AREA' : 'SELECT AREA') : (allAreaSelected ? 'DESELECCIONAR ÁREA' : 'SELECCIONAR ÁREA')}</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Analitos de esta Área */}
                          {areaResults.map((res, index) => {
                            const isValidated = (res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED' || res.status === 'VALIDADO') && hasResultValue(res);
                            const isNoteExpanded = expandingNotesId === res.id;
                            const isHigh = res.flag === 'ALTO';
                            const isLow = res.flag === 'BAJO';
                            const isCritical = res.flag?.includes('CRITICO') || res.flag === 'PANICO';
                            const catalogTest = resolveCatalogTest(res);
                            const testCode = catalogTest?.code || (res.testId && res.testId !== 'test-auto' && res.testId !== 'test-hl7' ? res.testId.replace('test-', '').slice(0, 4) : (res.parameterCode || '8003'));

                            return (
                              <React.Fragment key={`frag-${res.id}-${index}`}>
                                <tr
                                  key={`tr-main-${res.id}-${index}`}
                                  onClick={() => setActiveTraceabilityId(res.id)}
                                  className={`cursor-pointer transition-colors border-b border-blue-950/40 hover:bg-[#061438]/80 ${areaStyle.borderLeft.replace("border-l-4", "border-l-2 border-l-opacity-60")} ${
                                    isCritical
                                      ? 'bg-[#1f0b14]/50'
                                      : isHigh
                                      ? 'bg-[#1e1708]/40'
                                      : selectedResults.includes(res.id)
                                      ? 'bg-cyan-950/30'
                                      : 'bg-transparent'
                                  }`}
                                >
                                  <td className="py-1.5 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => setSelectedResults(prev => prev.includes(res.id) ? prev.filter(id => id !== res.id) : [...prev, res.id])}
                                      className={`w-4 h-4 rounded border transition-all flex items-center justify-center mx-auto cursor-pointer ${
                                        selectedResults.includes(res.id)
                                          ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                                          : 'border-blue-900 bg-transparent hover:border-cyan-400'
                                      }`}
                                    >
                                      {selectedResults.includes(res.id) && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                  </td>
                                  <td className="py-1.5 px-2.5 text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded bg-blue-950/90 border border-cyan-500/50 text-cyan-300 font-mono font-black text-[10px] tracking-wider shrink-0 shadow-xs">
                                        #{testCode}
                                      </span>
                                      <span className="font-bold text-xs uppercase text-white tracking-wide">
                                        {getLocalizedParameterName(res.parameterName, isEn)}
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      {catalogTest && (
                                        <>
                                          <span className="text-slate-300 font-semibold">{getLocalizedTestName(catalogTest.name.split('(')[0].trim(), isEn)}</span>
                                          <span className="text-slate-600">•</span>
                                        </>
                                      )}
                                      <span className="text-cyan-300 font-medium">{res.parameterCode || res.parameterName.slice(0, 4)}</span>
                                      <span className="text-slate-600">•</span>
                                      <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]" title={isEn ? "Laboratory analyzer / instrument that processed the sample" : "Equipo / Analizador de laboratorio que procesó la muestra"}>
                                        <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                                        <span>{isEn ? 'Instrument:' : 'Equipo:'} {res.analyzerName || (isEn ? 'Manual Entry / ACE' : 'Ingreso Manual / ACE')}</span>
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <ResultValueInput
                                      result={res}
                                      isValidated={isValidated}
                                      canEdit={canModifyThisOrder}
                                      onSave={onUpdateResultValue}
                                    />
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center text-slate-300 font-mono text-xs font-semibold">
                                    {res.unit || '—'}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center">
                                    <div className="font-mono text-xs text-slate-200 font-medium">{res.refRangeText || (isEn ? 'Normal' : 'Normal')}</div>
                                    {/* Visual Range Gauge Slider Bar */}
                                    <div className="w-24 h-1.5 bg-[#071333] border border-blue-900/60 rounded-full mx-auto mt-1 relative overflow-hidden">
                                      <div className="absolute inset-y-0 bg-emerald-500/30" style={{ left: '20%', width: '60%' }} />
                                      <div
                                        className={`absolute top-0 bottom-0 w-2 rounded-full ${
                                          isCritical
                                            ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                                            : isHigh
                                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                                            : isLow
                                            ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                                            : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                                        }`}
                                        style={{
                                          left: isHigh || isCritical ? '80%' : isLow ? '10%' : '50%'
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center text-slate-400 text-xs font-medium">
                                    {res.analyzerName || (isEn ? 'Manual Tech' : 'Manual TM')}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    {isValidated && hasResultValue(res) ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#052923] border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>{isEn ? 'VALIDATED' : 'VALIDADO'}</span>
                                      </span>
                                    ) : res.status === 'LIBERADO' && hasResultValue(res) ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#072445] border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>{isEn ? 'RELEASED' : 'LIBERADO'}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2e1d05] border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full" title={!hasResultValue(res) ? (isEn ? 'Pending: Result entry required' : 'Pendiente: Requiere ingresar resultado') : (isEn ? 'Pending validation' : 'Pendiente de validación')}>
                                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{isEn ? 'PENDING' : 'PENDIENTE'}</span>
                                      </span>
                                    )}
                                  </td>
                                </tr>

                                {/* Inline Clinical Alert Card for High or Critical Values (Exacto al Mock) */}
                                {(res.flag === 'ALTO' || res.flag?.includes('CRITICO') || res.flag === 'BAJO') && (
                                  <tr key={`tr-alert-${res.id}-${index}`} className="bg-[#240b15] border-y border-rose-900/60">
                                    <td className="py-2 px-3 text-center">
                                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black mx-auto shadow-sm shadow-rose-600/50">!</span>
                                    </td>
                                    <td colSpan={6} className="py-2 px-2 text-left">
                                      <div className="text-xs font-bold">
                                        <span className="text-rose-400 uppercase font-black tracking-tight">
                                          {res.flag?.includes('CRITICO') ? (isEn ? 'CRITICAL ALERT: ' : 'ALERTA CRÍTICA: ') : (isEn ? 'RANGE ALERT: ' : 'ALERTA DE RANGO: ')}
                                        </span>
                                        <span className="text-rose-200 font-medium">
                                          {getLocalizedParameterName(res.parameterName, isEn)} ({res.value} {res.unit}) {res.flag?.includes('CRITICO') ? (isEn ? 'requires immediate notification.' : 'requiere notificación inmediata.') : (isEn ? `exceeds reference range (${res.refRangeText}).` : `excede el límite de referencia (${res.refRangeText}).`)}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {isNoteExpanded && (
                                  <tr key={`tr-note-${res.id}-${index}`} className="bg-[#040e2b] border-b border-blue-900/60">
                                    <td colSpan={7} className="p-3">
                                      <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                                          <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Observaciones del Analito</span>
                                            <div className="flex gap-2">
                                              <button onClick={() => { onUpdateInterpretation(res.id, tempNote); setExpandingNotesId(null); }} className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg uppercase cursor-pointer transition">Guardar</button>
                                              <button onClick={() => setExpandingNotesId(null)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg uppercase cursor-pointer transition">Cerrar</button>
                                            </div>
                                          </div>
                                          <textarea
                                            disabled={isValidated}
                                            value={tempNote}
                                            onChange={(e) => setTempNote(e.target.value)}
                                            className="w-full bg-[#03091e] border border-blue-900/60 rounded-xl p-2.5 text-xs text-slate-200 min-h-[60px] focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-600"
                                            placeholder="Ingrese observaciones técnicas del analito..."
                                          />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Barra de Acciones Fija en la Parte Inferior (Diseño Adaptativo Responsive) */}
        <div className="min-h-[48px] sm:h-[54px] shrink-0 border-t border-blue-900/60 bg-[#03091e] px-2 sm:px-3 py-1 flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar z-20 shadow-2xl isolate">

          {/* 1. Alertas y Pánicos (Rojo) */}
          <button
            type="button"
            onClick={() => setShowAlertsCenterModal(true)}
            title={isEn ? "Identify critical results and alerts (ISO 15189)" : "Identificar resultados críticos y alertas (ISO 15189)"}
            className="shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-rose-500/80 bg-rose-950/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold shadow-[0_0_12px_rgba(244,63,94,0.15)] cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="whitespace-nowrap">{isEn ? 'Alerts' : 'Alertas'}</span>
            {criticalResultsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {criticalResultsCount}
              </span>
            )}
          </button>

          {/* 2. Calculadoras (Amarillo) */}
          <button
            type="button"
            onClick={() => setShowClinicalCalcModal(true)}
            title={isEn ? "Access clinical calculation tools (eGFR, LDL, HOMA-IR, De Ritis)" : "Acceder a herramientas de cálculo clínico (eGFR, LDL, HOMA-IR, De Ritis)"}
            className="shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-amber-500/80 bg-amber-950/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">{isEn ? 'Calculations' : 'Cálculos'}</span>
          </button>

          {/* 3. Telemetría (Turquesa) */}
          <button
            type="button"
            onClick={() => setShowTelemetryModal(true)}
            title={isEn ? "View analyzer telemetry and monitoring status" : "Consultar información de monitoreo y telemetría de analizadores"}
            className="shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-teal-500/80 bg-teal-950/30 text-teal-300 hover:bg-teal-500/20 hover:border-teal-400 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold shadow-[0_0_12px_rgba(20,184,166,0.15)] cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">{isEn ? 'Telemetry' : 'Telemetría'}</span>
          </button>

          {/* 4. Trazabilidad (Azul grisáceo) */}
          <button
            type="button"
            onClick={() => setShowAuditLog(true)}
            title={isEn ? "Consult ISO 15189 audit trail and event logs" : "Consultar el historial y bitácora de auditoría ISO 15189"}
            className="shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-slate-600/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">{isEn ? 'Audit Trail' : 'Auditoría'}</span>
          </button>

          {/* 5. Informe Carta (Cian) */}
          <button
            type="button"
            onClick={() => currentOrder?.id && onOpenPdf(currentOrder.id)}
            title={isEn ? "Generate or print official Letter-size clinical reports" : "Generar o imprimir informes clínicos oficiales en tamaño Carta"}
            className="shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-cyan-500/80 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">{isEn ? 'Report' : 'Reporte'}</span>
          </button>

          {/* 6. Desvalidar (Morado) */}
          <button
            type="button"
            onClick={() => {
              if (selectedValidatedCount > 0) {
                handleInitiateUnvalidate();
              } else {
                const validatedInOrder = patientResults.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO' || r.status === 'LIBERADO');
                if (validatedInOrder.length > 0) {
                  setSelectedResults(validatedInOrder.map(r => r.id));
                  handleInitiateUnvalidate();
                } else {
                  notifyToast.info(isEn ? 'No validated analytes found in this order to unvalidate.' : 'No hay analitos validados en esta orden para desvalidar.');
                }
              }
            }}
            title={isEn ? "Revert validation of analytes with mandatory justification (ISO 15189)" : "Revertir la validación de analitos con justificación obligatoria (ISO 15189)"}
            className="shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-purple-500/80 bg-purple-950/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold shadow-[0_0_12px_rgba(168,85,247,0.2)] cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="whitespace-nowrap">
              {isEn ? 'Unvalidate' : 'Desvalidar'} {selectedValidatedCount > 0 ? `(${selectedValidatedCount})` : ''}
            </span>
          </button>

          {/* 7. Validar Analitos (Unificado Inteligente: Solo analitos con resultado) */}
          <button
            type="button"
            disabled={!canModifyThisOrder || (selectedResults.length > 0 ? selectedValidatableCount === 0 : validatableCount === 0)}
            onClick={() => {
              if (!canModifyThisOrder) return;

              // Caso A: Hay casillas seleccionadas
              if (selectedResults.length > 0) {
                if (selectedMissingValueCount > 0 && selectedValidatableCount === 0) {
                  notifyToast.warning(isEn ? 'ISO 15189: Cannot validate pending analytes without a result.' : 'Norma ISO 15189: No se pueden validar analitos en estado pendiente sin resultado ingresado.');
                  return;
                }

                const toValidate = selectedResults.filter(id => {
                  const res = results.find(r => r.id === id);
                  return isResultValidatable(res);
                });

                if (toValidate.length === 0) {
                  notifyToast.info(isEn ? 'No selected analytes with results ready to validate.' : 'No hay analitos seleccionados con resultado listos para validar.');
                  return;
                }

                toValidate.forEach(id => onUpdateResultStatus(id, 'VALIDADO_TEC'));
                const validatedNames = toValidate.map(id => results.find(r => r.id === id)?.parameterName || id);
                addAuditEntry({
                  orderId: currentOrder?.id || '',
                  type: 'VALIDACION',
                  title: isEn ? 'Technical Validation of Analytes' : 'Validación Técnica de Analitos',
                  userName: currentUser?.name || 'Ing. Rubén Ábrego',
                  detail: `Validación técnica aprobada bajo ISO 15189 (${toValidate.length} analitos con resultado: ${validatedNames.join(', ')}).`,
                  analytes: validatedNames
                });
                setSelectedResults([]);

                if (selectedMissingValueCount > 0) {
                  notifyToast.success(isEn ? `Validated ${toValidate.length} analytes with results. (${selectedMissingValueCount} skipped as pending without results).` : `Validados ${toValidate.length} analitos con resultado. (${selectedMissingValueCount} omitidos por estar pendientes sin resultado).`);
                } else {
                  notifyToast.success(isEn ? `${toValidate.length} analyte(s) successfully validated.` : `${toValidate.length} analito(s) validado(s) con éxito.`);
                }
                return;
              }

              // Caso B: No hay casillas seleccionadas -> Validar todos los pendientes QUE TENGAN RESULTADO
              if (validatableCount === 0) {
                if (missingValueCount > 0) {
                  notifyToast.warning(isEn ? `Cannot validate: ${missingValueCount} analyte(s) remain pending without a result.` : `No es posible validar: ${missingValueCount} analito(s) continúan en estado pendiente sin resultado ingresado.`);
                } else {
                  notifyToast.info(isEn ? 'All analytes for this order are already validated.' : 'Todos los analitos de esta orden ya están validados.');
                }
                return;
              }

              const unvalidatedWithValues = patientResults.filter(r => isResultValidatable(r));
              if (unvalidatedWithValues.length === 0) return;

              unvalidatedWithValues.forEach(r => onUpdateResultStatus(r.id, 'VALIDADO_TEC'));
              const approvedNames = unvalidatedWithValues.map(r => r.parameterName);

              addAuditEntry({
                orderId: currentOrder?.id || '',
                type: 'VALIDACION',
                title: isEn ? 'Technical Validation of Analytes with Results' : 'Validación Técnica de Analitos con Resultado',
                userName: currentUser?.name || 'Ing. Rubén Ábrego',
                detail: `Validación técnica de analitos con resultado cargado (${unvalidatedWithValues.length} analitos: ${approvedNames.join(', ')}).`,
                analytes: approvedNames
              });
              setSelectedResults([]);

              if (missingValueCount > 0) {
                notifyToast.success(isEn ? `Validated ${unvalidatedWithValues.length} analytes with results. (${missingValueCount} remain pending without results).` : `Validados ${unvalidatedWithValues.length} analitos con resultado. (${missingValueCount} permanecen pendientes por falta de resultado).`);
              } else {
                notifyToast.success(isEn ? `All analytes (${unvalidatedWithValues.length}) have been validated.` : `Todos los analitos (${unvalidatedWithValues.length}) han sido validados.`);
              }
            }}
            title={
              selectedResults.length > 0
                ? selectedValidatableCount > 0
                  ? (isEn ? `Validate the ${selectedValidatableCount} selected analytes with results` : `Validar los ${selectedValidatableCount} analitos seleccionados con resultado`)
                  : (isEn ? 'Selected analytes do not have a result entered' : 'Los analitos seleccionados no tienen resultado ingresado')
                : validatableCount > 0
                ? (isEn ? `Validate all analytes with results (${validatableCount}) in this order` : `Validar todos los analitos con resultado (${validatableCount}) de la orden`)
                : missingValueCount > 0
                ? (isEn ? 'Cannot validate: pending analytes without results' : 'No se puede validar: analitos pendientes sin resultado')
                : (isEn ? 'All analytes are already validated' : 'Todos los analitos ya están validados')
            }
            className={`shrink-0 h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl border text-[10px] sm:text-[11px] flex items-center gap-1.5 font-bold transition-all ${
              (selectedResults.length > 0 ? selectedValidatableCount > 0 : validatableCount > 0) && canModifyThisOrder
                ? 'border-blue-400/80 bg-blue-950/50 text-blue-200 hover:bg-blue-900/60 hover:border-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.35)] cursor-pointer'
                : 'border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${(selectedResults.length > 0 ? selectedValidatableCount > 0 : validatableCount > 0) && canModifyThisOrder ? 'text-blue-400' : 'text-slate-600'}`} />
            <span className="whitespace-nowrap">
              {selectedResults.length > 0
                ? (isEn ? `Validate Selected (${selectedValidatableCount})` : `Validar Selección (${selectedValidatableCount})`)
                : validatableCount > 0
                ? (isEn ? `Validate All (${validatableCount})` : `Validar Todo (${validatableCount})`)
                : missingValueCount > 0
                ? (isEn ? 'No Results' : 'Sin Resultados')
                : (isEn ? 'Validated' : 'Validados')}
            </span>
          </button>

          {/* 8. Informes / Comentarios (Turquesa) */}
          <button
            type="button"
            onClick={() => {
              if (selectedResults.length === 1) {
                setSelectedCommentResultId(selectedResults[0]);
                const res = patientResults.find(r => r.id === selectedResults[0]);
                setAnalyteCommentDraft(res?.interpretation || '');
              } else if (patientResults.length > 0 && !selectedCommentResultId) {
                setSelectedCommentResultId(patientResults[0].id);
                setAnalyteCommentDraft(patientResults[0].interpretation || '');
              }
              setOrderGeneralComment(currentOrder?.notes || '');
              setShowCommentsModal(true);
            }}
            title={isEn ? "Add observations and comments to individual results or to the order" : "Agregar observaciones e informes a resultados individuales o a la orden"}
            className="shrink-0 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl border border-teal-500/80 bg-teal-950/30 text-teal-300 hover:bg-teal-500/20 hover:border-teal-400 transition-all flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold shadow-[0_0_12px_rgba(20,184,166,0.2)] cursor-pointer"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">{isEn ? 'Comments' : 'Comentarios'}</span>
          </button>

          {/* 9. Validar y Siguiente Orden (Val. y Sig.) */}
          <button
            type="button"
            disabled={!canModifyThisOrder || (validatableCount === 0 && allOrders.length <= 1)}
            onClick={() => {
              // 1. Validar analitos pendientes QUE TENGAN RESULTADO si los hay
              if (canModifyThisOrder && validatableCount > 0) {
                const toValidate = selectedResults.length > 0
                  ? selectedResults.filter(id => {
                      const res = results.find(r => r.id === id);
                      return isResultValidatable(res);
                    })
                  : patientResults.filter(r => isResultValidatable(r)).map(r => r.id);

                if (toValidate.length > 0) {
                  toValidate.forEach(id => onUpdateResultStatus(id, 'VALIDADO_TEC'));
                  const validatedNames = toValidate.map(id => results.find(r => r.id === id)?.parameterName || id);
                  addAuditEntry({
                    orderId: currentOrder?.id || '',
                    type: 'VALIDACION',
                    title: isEn ? 'Technical Validation and Auto Advance' : 'Validación Técnica y Avance Automático',
                    userName: currentUser?.name || 'Ing. Rubén Ábrego',
                    detail: `Validación de ${toValidate.length} analitos con resultado (${validatedNames.join(', ')}). Avanzando a la siguiente orden.`,
                    analytes: validatedNames
                  });
                }
                setSelectedResults([]);
              } else if (selectedResults.length > 0 && selectedMissingValueCount > 0 && selectedValidatableCount === 0) {
                notifyToast.warning(isEn ? 'ISO 15189: Cannot validate pending analytes without results.' : 'Norma ISO 15189: No se pueden validar analitos pendientes sin resultado.');
                return;
              }

              // 2. Buscar la siguiente orden en la lista
              const orderList = allOrders.length > 0 ? allOrders : [currentOrder].filter(Boolean) as Order[];
              const currentIndex = orderList.findIndex(o => o.id === currentOrder?.id);

              // Priorizar órdenes que tengan analitos pendientes de validar con resultado
              const pendingOrders = orderList.filter(o =>
                o.id !== currentOrder?.id &&
                results.filter(r => r.orderId === o.id).some(r => isResultValidatable(r))
              );

              let nextOrder = pendingOrders.find(o => {
                const idx = orderList.findIndex(item => item.id === o.id);
                return idx > currentIndex;
              });

              if (!nextOrder && pendingOrders.length > 0) {
                nextOrder = pendingOrders[0];
              }

              if (!nextOrder && orderList.length > 1) {
                const nextIdx = (currentIndex + 1) % orderList.length;
                nextOrder = orderList[nextIdx];
              }

              if (nextOrder && nextOrder.id !== currentOrder?.id) {
                setActiveOrderId(nextOrder.id);
                notifyToast.success(isEn ? `Advancing to order #${nextOrder.orderNumber}` : `Avanzando a orden #${nextOrder.orderNumber}`);
              } else {
                notifyToast.success(isEn ? 'No more pending orders in the list.' : 'No hay más órdenes pendientes en la lista.');
              }
            }}
            title={isEn ? "Validate analytes with results and automatically advance to next order" : "Validar analitos con resultado y avanzar automáticamente a la siguiente orden"}
            className={`shrink-0 h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl border text-[10px] sm:text-[11px] flex items-center gap-1.5 font-bold transition-all ${
              validatableCount > 0 && canModifyThisOrder
                ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer'
                : allOrders.length > 1
                ? 'border-slate-700/60 bg-slate-900/50 text-slate-300 hover:text-white hover:border-slate-600 cursor-pointer'
                : 'border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">{isEn ? 'Val. & Next' : 'Val. y Sig.'}</span>
            <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
          </button>

          {/* 10. Liberar (Azul-cian con Glow) */}
          <button
            type="button"
            disabled={!canReleaseThisOrder || toReleaseCount === 0}
            onClick={() => {
              const toRelease = patientResults.filter(r => (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO') && r.status !== 'LIBERADO');
              if (toRelease.length === 0) return;
              toRelease.forEach(r => onUpdateResultStatus(r.id, 'LIBERADO'));
              const releasedNames = toRelease.map(r => r.parameterName);
              addAuditEntry({
                orderId: currentOrder?.id || '',
                type: 'LIBERACION',
                title: isEn ? 'Official Release of Results' : 'Liberación Oficial de Resultados',
                userName: currentUser?.name || 'Ing. Rubén Ábrego',
                detail: `Firma digital y liberación formal de ${toRelease.length} analitos (${releasedNames.join(', ')}). Disponibles para reporte a médicos y pacientes.`,
                analytes: releasedNames
              });
              setSelectedResults([]);
              notifyToast.success(isEn ? `Formally released ${toRelease.length} analytes.` : `Se han liberado formalmente ${toRelease.length} analitos.`);
            }}
            title={isEn ? "Formally release results for delivery to physicians and patients" : "Liberar formalmente resultados para entrega a médicos y pacientes"}
            className={`shrink-0 h-8 sm:h-8.5 px-3 rounded-xl flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black tracking-wide uppercase transition-all ${
              toReleaseCount > 0 && canReleaseThisOrder
                ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.7)] hover:brightness-110 hover:shadow-[0_0_24px_rgba(6,182,212,0.9)] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span className="whitespace-nowrap">{isEn ? `Release (${toReleaseCount})` : `Liberar (${toReleaseCount})`}</span>
          </button>

        </div>

        {/* Modal / Overlays for Advanced Functions */}
        {showTrendViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-10">
            <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
               <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black text-white italic">Análisis de Tendencias</h3>
                    <p className="text-teal-400 font-bold uppercase text-[10px] tracking-widest mt-1">Histórico Clínico: {currentPatient.firstName} {currentPatient.lastName}</p>
                  </div>
                  <button onClick={() => setShowTrendViewer(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
               </div>
               <div className="flex-1 p-10 flex flex-col items-center justify-center">
                  {isTrendsLoading ? (
                    <div className="text-center space-y-4">
                      <TrendingUp className="w-20 h-20 text-teal-500/20 mx-auto animate-pulse" />
                      <p className="text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Cargando Motor de Gráficas High-End...</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="flex gap-4">
                           {['6 Meses', '1 Año', 'Todo'].map(t => (
                             <button key={t} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">{t}</button>
                           ))}
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] text-slate-500 font-black uppercase block">Último Valor</span>
                           <span className="text-3xl font-black text-teal-400 italic">14.5 <span className="text-xs not-italic text-slate-500">x10^3/µL</span></span>
                        </div>
                      </div>

                      {/* MOCK CHART AREA - High Visibility Neon Design */}
                      <div className="flex-1 bg-black/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex items-end p-12 gap-6 shadow-inner">
                         {/* Grid Lines */}
                         <div className="absolute inset-0 flex flex-col justify-between p-12 pointer-events-none opacity-20">
                            {[1,2,3,4].map(l => <div key={l} className="w-full h-px bg-slate-500/30 dashed"></div>)}
                         </div>

                         {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                           <div key={i} className="flex-1 flex flex-col items-center gap-4 group z-10 h-full justify-end">
                              <div
                                className="w-full bg-gradient-to-t from-teal-500/40 via-teal-400/60 to-teal-300 rounded-t-xl transition-all duration-700 ease-out relative border-t border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.2)] group-hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] group-hover:from-teal-400 group-hover:scale-[1.02]"
                                style={{ height: `${h}%` }}
                              >
                                 {/* Floating Value Tag */}
                                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-teal-400 text-slate-950 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-2xl scale-90 group-hover:scale-100 whitespace-nowrap">
                                    {10 + i}.{i} VAL
                                 </div>
                              </div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-teal-400 transition-colors">Ene {20 + i}</span>
                           </div>
                         ))}

                         {/* Ambient Glow Mask */}
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-teal-500/5 pointer-events-none"></div>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        
      {/* 🔒 Modal de Alerta de Seguridad ISO 15189 & Ley 81: Bloqueo de Custodia */}
      {unauthorizedModalInfo?.isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#020617]/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b132b] border-2 border-rose-500/50 rounded-2xl w-full max-w-lg shadow-[0_25px_80px_rgba(244,63,94,0.3)] overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-b border-rose-500/30 p-4 sm:p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Seguridad ISO 15189 • Ley 81
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Bloqueo de Custodia</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
                  Acción Restringida: No puede desvalidar este resultado
                </h3>
              </div>
              <button
                onClick={() => setUnauthorizedModalInfo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              
              {/* Detail Box */}
              <div className="bg-[#070d1f] border border-rose-500/25 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 text-[11px]">Analito / Examen:</span>
                  <span className="font-bold text-white text-[12.5px] truncate max-w-[280px]">
                    {unauthorizedModalInfo.testName}
                  </span>
                </div>

                <div className="h-px bg-slate-800/80" />

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 text-[11px]">Validado y firmado por:</span>
                  <span className="font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-md text-[11px]">
                    {unauthorizedModalInfo.validatedBy}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 text-[11px]">Hora de Firma Técnica:</span>
                  <span className="font-mono text-cyan-400 text-[11px]">
                    {unauthorizedModalInfo.validatedAt || '07:42 AM'}
                  </span>
                </div>
              </div>

              {/* Legal & Regulatory Explanation */}
              <div className="space-y-2 text-slate-300 text-[11.5px] leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <p className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Protección de Cadena de Custodia:</strong> Este análisis fue firmado por otro profesional colegiado. Para preservar la inalterabilidad jurídica de los informes clínicos, la plataforma prohíbe que un resultado sea desvalidado por un usuario distinto al que emitió la firma técnica.
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 pl-6">
                  ⚖️ Únicamente el profesional que realizó la validación original (<strong className="text-slate-200">{unauthorizedModalInfo.validatedBy}</strong>) o la <strong className="text-amber-300">Jefatura Médica de Laboratorio (lab_chief)</strong> cuentan con atribuciones para reabrir o desvalidar esta orden.
                </p>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="bg-[#070d1f] border-t border-slate-800/80 p-3.5 sm:p-4 flex items-center justify-between gap-2.5">
              <button
                onClick={() => {
                  const id = unauthorizedModalInfo.testResultId;
                  setUnauthorizedModalInfo(null);
                  if (id) setActiveTraceabilityId(id);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ver Trazabilidad & Custodia</span>
              </button>

              <button
                onClick={() => setUnauthorizedModalInfo(null)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

        {showAuditLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-4 sm:p-10">
            <div className="bg-[#03091e] border border-cyan-500/40 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
               {/* Encabezado Profesional */}
               <div className="p-6 border-b border-blue-900/60 flex justify-between items-center bg-[#040e2b] rounded-t-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Trazabilidad de Resultados (Audit Trail)</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Orden: <strong className="text-cyan-300">{orderNumberDisplay}</strong> • Paciente: <span className="text-white font-bold">{patientFullName}</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowAuditLog(false)} className="w-9 h-9 bg-slate-800 hover:bg-rose-500 rounded-xl flex items-center justify-center transition-all text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
               </div>

               {/* Timeline de Eventos Reales */}
               <div className="flex-1 overflow-y-auto p-6 space-y-3.5 custom-scrollbar">
                  {auditTrailList.map((entry, idx) => {
                    const isRevocation = entry.type === 'DESVALIDACION';
                    const isValidated = entry.type === 'VALIDACION';
                    const isLiberated = entry.type === 'LIBERACION';

                    return (
                      <div
                        key={entry.id || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isRevocation
                            ? 'bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-950/30'
                            : isValidated
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : isLiberated
                            ? 'bg-cyan-950/20 border-cyan-500/40'
                            : 'bg-[#061438]/60 border-blue-900/40'
                        }`}
                      >
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 border-b border-white/[0.06] pb-2">
                           <div className="flex items-center gap-2">
                             <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                               isRevocation
                                 ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                                 : isValidated
                                 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                                 : isLiberated
                                 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                                 : 'bg-slate-800 text-slate-300 border-slate-700'
                             }`}>
                               {entry.type}
                             </span>
                             <span className="text-xs font-black text-white">{entry.title}</span>
                           </div>
                           <span className="text-[11px] font-mono text-cyan-400 font-bold shrink-0">{entry.timestamp}</span>
                         </div>

                         <div className="text-xs text-slate-300 space-y-1.5">
                           <div className="flex items-center gap-1.5 text-slate-200">
                             <span className="text-slate-400">Responsable / Firma:</span>
                             <strong className="text-cyan-300 font-bold">{entry.userName}</strong>
                           </div>

                           <p className="text-slate-300 leading-relaxed">{entry.detail}</p>

                           {entry.reason && (
                             <div className="mt-2 p-2.5 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs">
                               <span className="text-purple-300 font-bold block mb-0.5">Motivo de revocación registrado (ISO 15189):</span>
                               <span className="text-purple-100 italic">"{entry.reason}"</span>
                             </div>
                           )}

                           {entry.analytes && entry.analytes.length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-2">
                               {entry.analytes.map((a, aIdx) => (
                                 <span key={aIdx} className="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                                   {a}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}

        {/* PRO TRACEABILITY SIDEBAR */}
        {activeTraceabilityId && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setActiveTraceabilityId(null)}></div>
            <div className="fixed top-0 right-0 h-full w-[450px] bg-[#020617] border-l border-white/10 z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500 flex flex-col">
              {(() => {
                const res = results.find(r => r.id === activeTraceabilityId);
                if (!res) return null;
                const isValidated = res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED' || res.status === 'VALIDADO' || res.status === 'LIBERADO';

                return (
                  <>
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                       <div>
                         <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{res.parameterName}</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${isValidated ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
                              {res.status.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">#{res.parameterCode}</span>
                         </div>
                       </div>
                       <button onClick={() => setActiveTraceabilityId(null)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-all">
                         <X className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                       {/* Current Result Card */}
                       <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultado Vigente</div>
                          <div className="flex items-end gap-3">
                             <div className={`text-4xl font-black italic ${getFlagStyle(res.flag).split(' ')[1] || 'text-white'}`}>{res.value}</div>
                             <div className="text-lg font-bold text-slate-500 mb-1">{res.unit}</div>
                             <div className="ml-auto flex flex-col items-end">
                                <div className="text-[10px] font-bold text-slate-400 italic">Ref: {res.refRangeText}</div>
                                {res.flag && <div className={`text-[10px] font-black uppercase ${getFlagStyle(res.flag).split(' ')[1]}`}>{res.flag}</div>}
                             </div>
                          </div>
                       </div>

                       {/* Information Grid */}
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                             <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Analizador Origen</div>
                             <div className="text-xs text-white font-bold flex items-center gap-2 italic">
                                <Cpu className="w-3 h-3 text-teal-400" /> {res.analyzerName || 'INGRESO MANUAL'}
                             </div>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                             <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Tipo de Muestra</div>
                             <div className="text-xs text-white font-bold flex items-center gap-2 italic">
                                <Beaker className="w-3 h-3 text-purple-400" /> {res.specimenType || 'SANGRE TOTAL'}
                             </div>
                          </div>
                       </div>

                       {/* Professional Traceability Timeline */}
                       <div className="space-y-6">
                          <div className="flex items-center justify-between">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Fingerprint className="w-4 h-4 text-teal-500" /> Trazabilidad ISO 15189
                             </h4>
                          </div>

                          <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                             {/* Mocked History based on real data + simulation */}

                             {isValidated && (
                               <div className="relative pl-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                     <CheckCircle2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                     <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-white uppercase tracking-tight">
                                          Validación Clínica Final
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-500">
                                          {res.technicalValidatedAt
                                            ? new Date(res.technicalValidatedAt).toLocaleString()
                                            : '18/08/2026 11:06'}
                                        </span>
                                     </div>
                                     <div className="text-[11px] text-teal-400 font-bold mt-0.5">
                                       {res.technicalValidatedBy || 'PROFESIONAL DE LABORATORIO'}
                                     </div>
                                  </div>
                                </div>
                             )}

                             <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                                   <PencilLine className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                   <div className="flex justify-between items-start">
                                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">Ingreso / Modificación</span>
                                      <span className="text-[9px] font-mono text-slate-500">18/08/2026 10:39</span>
                                   </div>
                                   <div className="text-[11px] text-indigo-300 font-bold mt-0.5">Lic. Sofía Guardia</div>
                                   <div className="mt-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                                         <div>
                                            <span className="text-slate-500 block uppercase font-black tracking-tighter">Anterior</span>
                                            <span className="text-slate-400 line-through">12.4</span>
                                         </div>
                                         <div>
                                            <span className="text-slate-500 block uppercase font-black tracking-tighter">Nuevo</span>
                                            <span className="text-white font-bold">{res.value}</span>
                                         </div>
                                      </div>
                                      <div className="mt-2 text-[9px] text-slate-500 italic">Motivo: Corrección de digitación post-lavado</div>
                                   </div>
                                </div>
                             </div>

                             <div className="relative pl-8 opacity-60">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                   <Cpu className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                   <div className="flex justify-between items-start">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Recibido del Analizador</span>
                                      <span className="text-[9px] font-mono text-slate-600">18/08/2026 10:21</span>
                                   </div>
                                   <div className="text-[11px] text-slate-500 font-bold mt-0.5">{res.analyzerName || 'Sistema ASTM'}</div>
                                   <div className="mt-1 text-[9px] text-slate-600">Tramas procesadas correctamente. Sin flags técnicos.</div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="p-8 border-t border-white/10 bg-slate-950/80 space-y-4">
                       {isValidated ? (
                         <button
                           onClick={() => {
                              const canUnvalidate = currentUser.role === 'abregotech_admin' ||
                                                  res.technicalValidatedBy === currentUser.name ||
                                                  res.medicalValidatedBy === currentUser.name;

                              if (!canUnvalidate) {
                                notifyToast.warning('Seguridad ISO 15189: Solo el profesional que firmó originalmente o la Dirección Médica pueden revocar esta validación.');
                                return;
                              }
                              setShowUnvalidateModal(true);
                           }}
                           className="w-full py-4 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-950 font-black rounded-[1.5rem] flex items-center justify-center gap-3 transition-all border border-amber-500/20 shadow-xl shadow-amber-500/5 group"
                         >
                            <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
                            <span className="uppercase tracking-widest text-xs">↩ Desvalidar Resultado</span>
                         </button>
                       ) : (
                         <button
                           disabled={!hasResultValue(res)}
                           onClick={() => {
                              if (!hasResultValue(res)) {
                                notifyToast.warning('Norma ISO 15189: No es posible validar técnicamente un analito sin valor de resultado.');
                                return;
                              }
                              onUpdateResultStatus(res.id, 'VALIDADO_TEC');
                              setActiveTraceabilityId(null);
                           }}
                           className={`w-full py-4 text-slate-950 font-black rounded-[1.5rem] flex items-center justify-center gap-3 transition-all ${
                             hasResultValue(res)
                               ? 'bg-emerald-500 hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 cursor-pointer'
                               : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                           }`}
                         >
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="uppercase tracking-widest text-xs">
                              {hasResultValue(res) ? 'Aprobar Técnica' : 'Pendiente: Sin Resultado'}
                            </span>
                         </button>
                       )}
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}

        {/* UNVALIDATE CONFIRMATION MODAL (SINGLE OR BATCH) */}
        {showUnvalidateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/95 backdrop-blur-xl p-4">
             <div className="bg-slate-900 border border-amber-500/30 rounded-[3rem] p-8 max-w-lg w-full space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/40">
                      <RotateCcw className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white italic">Revocación de Validación</h3>
                      <p className="text-xs text-slate-400 mt-1">Este evento quedará registrado permanentemente en la auditoría del paciente.</p>
                   </div>
                </div>

                <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                   {(() => {
                      const idsToRevoke = activeTraceabilityId ? [activeTraceabilityId] : selectedResults.filter(id => {
                        const res = results.find(r => r.id === id);
                        const isValidated = res?.status === 'VALIDADO_TEC' || res?.status === 'VALIDADO_MED' || res?.status === 'VALIDADO' || res?.status === 'LIBERADO';
                        const isSupervisorUser = currentUser?.role === 'abregotech_admin' || currentUser?.role === 'lab_chief' || currentUser?.role === 'owner';
                        const isSelfValidated = Boolean(currentUser?.name && res?.technicalValidatedBy && res.technicalValidatedBy.toLowerCase().includes(currentUser.name.toLowerCase()));
                        const isOrderOwnerUser = Boolean(currentOrder?.assignedTechMedId && (currentOrder.assignedTechMedId === currentUser?.id || currentOrder.assignedTechMedId === currentUser?.username));
                        return isValidated && (isSupervisorUser || isSelfValidated || isOrderOwnerUser);
                      });

                      return idsToRevoke.map(id => {
                        const r = results.find(res => res.id === id);
                        return (
                          <div key={id} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Analito</span>
                                <span className="text-xs font-bold text-white">{r?.parameterName}</span>
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Valor</span>
                                <div className="text-xs font-black text-amber-500">{r?.value} {r?.unit}</div>
                             </div>
                          </div>
                        );
                      });
                   })()}
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Motivo de la Desvalidación (Obligatorio)</label>
                   <textarea
                     autoFocus
                     value={unvalidateReason}
                     onChange={(e) => setUnvalidateReason(e.target.value)}
                     className="w-full bg-slate-950 border border-amber-500/20 rounded-2xl p-5 text-sm text-white min-h-[120px] focus:border-amber-500 outline-none transition-all placeholder:text-slate-800 shadow-inner"
                     placeholder="Ingrese el motivo clínico o administrativo para esta revocación masiva..."
                   />
                </div>

                <div className="grid grid-cols-2 gap-5 pt-4">
                   <button
                     onClick={() => { setShowUnvalidateModal(false); setUnvalidateReason(''); setActiveTraceabilityId(null); }}
                     className="py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl text-xs transition-all uppercase tracking-widest cursor-pointer"
                   >
                      Cancelar
                   </button>
                   <button
                     disabled={!unvalidateReason.trim()}
                     onClick={() => {
                        const idsToRevoke = activeTraceabilityId ? [activeTraceabilityId] : selectedResults.filter(id => {
                          const res = results.find(r => r.id === id);
                          const isValidated = res?.status === 'VALIDADO_TEC' || res?.status === 'VALIDADO_MED' || res?.status === 'VALIDADO' || res?.status === 'LIBERADO';
                          const canUnvalidate = currentUser?.role === 'abregotech_admin' || currentUser?.role === 'lab_chief' || res?.technicalValidatedBy === currentUser?.name || res?.medicalValidatedBy === currentUser?.name;
                          return isValidated && canUnvalidate;
                        });

                        if (idsToRevoke.length === 0) {
                          notifyToast.error('Acción denegada: No se encontraron resultados validados autorizados para revocación.');
                          return;
                        }

                        const affectedNames = idsToRevoke.map(id => results.find(r => r.id === id)?.parameterName || id);

                        idsToRevoke.forEach(id => {
                          onUpdateResultStatus(id, 'INGRESADO');
                          console.log(`[ISO 15189 AUDIT] Result ${id} REVOKED by ${currentUser?.name || 'Sistema'}. Reason: ${unvalidateReason}`);
                        });

                        addAuditEntry({
                          orderId: currentOrder?.id || '',
                          type: 'DESVALIDACION',
                          title: 'Revocación de Validación Técnica (Desvalidación)',
                          userName: currentUser?.name || 'Ing. Rubén Ábrego',
                          detail: `Validación técnica revocada por el profesional. Estado restablecido a INGRESADO para rectificación analítica. Analitos: ${affectedNames.join(', ')}.`,
                          reason: unvalidateReason.trim(),
                          analytes: affectedNames
                        });

                        setShowUnvalidateModal(false);
                        setUnvalidateReason('');
                        setActiveTraceabilityId(null);
                        setSelectedResults([]);
                        notifyToast.success(`Auditoría ISO 15189: Revocación procesada exitosamente (${idsToRevoke.length} ${idsToRevoke.length === 1 ? 'analito' : 'analitos'}). Registros habilitados para rectificación técnica.`);
                     }}
                     className="py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest disabled:opacity-30 disabled:grayscale cursor-pointer"
                   >
                      Confirmar Desvalidación
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Modals for Pulled GitHub Suites */}
        {showAlertsCenterModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-3 sm:p-5">
             <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
                {/* Header Superior Limpio con Botón de Salir no superpuesto */}
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800/80 shrink-0">
                   <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                         <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-wider">Centro de Alertas Críticas & Delta-Checks</h3>
                         <p className="text-[10px] text-slate-400 font-mono">Auditoría ISO 15189 • Orden #{currentOrder?.orderNumber || 'N/A'}</p>
                      </div>
                   </div>
                   <button
                      onClick={() => setShowAlertsCenterModal(false)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700/60 hover:border-rose-400 flex items-center gap-1.5 shadow-lg cursor-pointer"
                      title="Cerrar ventana"
                   >
                      <X className="w-4 h-4" />
                      <span>Cerrar</span>
                   </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                   <ResultsAlertsCenter
                     order={currentOrder}
                     patient={currentPatient}
                     results={patientResults}
                     currentUser={currentUser}
                     onUpdateInterpretation={onUpdateInterpretation}
                     onUpdateResultStatus={onUpdateResultStatus}
                   />
                </div>
             </div>
          </div>
        )}

        {showClinicalCalcModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-3 sm:p-5">
             <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800/80 shrink-0">
                   <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
                         <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-wider">Calculadoras Clínicas Automatizadas</h3>
                         <p className="text-[10px] text-slate-400 font-mono">Índices Fisiológicos • Orden #{currentOrder?.orderNumber || 'N/A'}</p>
                      </div>
                   </div>
                   <button
                      onClick={() => setShowClinicalCalcModal(false)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-teal-500 text-slate-300 hover:text-slate-950 rounded-xl text-xs font-bold transition-all border border-slate-700/60 hover:border-teal-400 flex items-center gap-1.5 shadow-lg cursor-pointer"
                      title="Cerrar ventana"
                   >
                      <X className="w-4 h-4" />
                      <span>Cerrar</span>
                   </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                   <ResultsClinicalCalculator
                     order={currentOrder}
                     patient={currentPatient}
                     results={patientResults}
                     onUpdateResultValue={onUpdateResultValue}
                   />
                </div>
             </div>
          </div>
        )}

        {showTelemetryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-3 sm:p-5">
             <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800/80 shrink-0">
                   <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                         <Activity className="w-4 h-4" />
                      </div>
                      <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-wider">Telemetría de Analizadores & Curvas QC</h3>
                         <p className="text-[10px] text-slate-400 font-mono">Conexión HL7 / ASTM • Orden #{currentOrder?.orderNumber || 'N/A'}</p>
                      </div>
                   </div>
                   <button
                      onClick={() => setShowTelemetryModal(false)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 rounded-xl text-xs font-bold transition-all border border-slate-700/60 hover:border-cyan-400 flex items-center gap-1.5 shadow-lg cursor-pointer"
                      title="Cerrar ventana"
                   >
                      <X className="w-4 h-4" />
                      <span>Cerrar</span>
                   </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                   <ResultsTelemetryDashboard
                     order={currentOrder}
                     patient={currentPatient}
                     results={patientResults}
                     analyzers={analyzers}
                   />
                </div>
             </div>
          </div>
        )}

        {/* 💬 Modal de Informes y Comentarios (Analito Individual y Orden General) */}
        {showCommentsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-[#030d2a] border border-cyan-500/50 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">

              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-cyan-500/30 bg-gradient-to-r from-blue-950/80 via-slate-900 to-blue-950/80 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    <MessageSquareText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                      Informes / Comentarios Clínicos
                    </h3>
                    <p className="text-[11px] text-cyan-300/80 font-mono">
                      Orden #{orderNumberDisplay} • {currentPatient?.firstName} {currentPatient?.lastName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-rose-500 hover:text-white border border-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Switcher: A (Analito) vs B (Orden) */}
              <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCommentsActiveTab('ANALYTE')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    commentsActiveTab === 'ANALYTE'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-slate-950 shadow-lg shadow-teal-500/20'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>A. Comentarios de Analitos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCommentsActiveTab('ORDER')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    commentsActiveTab === 'ORDER'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>B. Comentarios de Orden</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">

                {commentsActiveTab === 'ANALYTE' ? (
                  /* TAB A: Comentarios de analitos */
                  <div className="space-y-4">
                    <div className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-teal-500/30 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-black text-cyan-300 uppercase tracking-wider block">
                          1. Seleccionar Analito / Examen:
                        </label>
                        {patientResults.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {filteredCommentResults.length} de {patientResults.length} prueba{patientResults.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Buscador de prueba / analito en comentarios */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={commentAnalyteSearch}
                          onChange={(e) => {
                            const q = e.target.value;
                            setCommentAnalyteSearch(q);
                            if (q.trim()) {
                              const matches = patientResults.filter(r =>
                                r.parameterName.toLowerCase().includes(q.toLowerCase()) ||
                                r.parameterCode.toLowerCase().includes(q.toLowerCase()) ||
                                (r.testName && r.testName.toLowerCase().includes(q.toLowerCase()))
                              );
                              if (matches.length > 0 && !matches.some(m => m.id === selectedCommentResultId)) {
                                setSelectedCommentResultId(matches[0].id);
                                setAnalyteCommentDraft(matches[0].interpretation || '');
                              }
                            }
                          }}
                          placeholder="Buscar prueba por nombre o código (ej. Glucosa, TP, Hemoglobina...)"
                          className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                        />
                        {commentAnalyteSearch && (
                          <button
                            type="button"
                            onClick={() => setCommentAnalyteSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                            title="Limpiar búsqueda"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <select
                        value={selectedCommentResultId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedCommentResultId(id);
                          const res = patientResults.find(r => r.id === id);
                          setAnalyteCommentDraft(res?.interpretation || '');
                        }}
                        className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        {filteredCommentResults.length > 0 ? (
                          filteredCommentResults.map(r => (
                            <option key={r.id} value={r.id} className="bg-slate-950 text-white">
                              {r.parameterName} ({r.parameterCode}) — {hasResultValue(r) ? `${r.value} ${r.unit}` : 'Sin valor'} [{!hasResultValue(r) ? 'PENDIENTE' : r.status}]
                            </option>
                          ))
                        ) : (
                          <option value="" disabled className="bg-slate-950 text-slate-400">
                            No se encontraron pruebas que coincidan con "{commentAnalyteSearch}"
                          </option>
                        )}
                      </select>

                      {/* Card de analito activo */}
                      {(() => {
                        const currentActiveResult = patientResults.find(r => r.id === selectedCommentResultId);
                        if (!currentActiveResult) return null;
                        const isCritical = currentActiveResult.flag?.includes('CRITICO') || currentActiveResult.flag === 'PANICO';
                        const isHigh = currentActiveResult.flag === 'ALTO';

                        return (
                          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="font-black text-white">{currentActiveResult.parameterName}</span>
                              <span className="text-slate-400 ml-2 font-mono text-[11px]">({currentActiveResult.parameterCode})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-cyan-300">
                                {currentActiveResult.value} {currentActiveResult.unit}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                Ref: {currentActiveResult.refRangeText}
                              </span>
                              {isCritical && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse">
                                  CRÍTICO
                                </span>
                              )}
                              {isHigh && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                                  ALTO
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Quick Tags para Analitos */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Plantillas rápidas de observación técnica:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Muestra ligeramente hemolizada (+)',
                          'Resultado verificado y confirmado por duplicado',
                          'Verificado con dilución técnica 1:10',
                          'Alerta clínica notificada telefónicamente a médico tratante',
                          'Interferencia lipémica/ictérica descartada',
                          'Se confirma concordancia con el cuadro clínico'
                        ].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setAnalyteCommentDraft(prev => prev ? `${prev}. ${tag}` : tag);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-medium transition cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea para Analito */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                        Observación técnica / Interpretación del analito:
                      </label>
                      <textarea
                        rows={4}
                        value={analyteCommentDraft}
                        onChange={(e) => setAnalyteCommentDraft(e.target.value)}
                        placeholder="Escriba aquí la observación técnica, alteración del resultado o interpretación específica del analito..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-teal-400 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  /* TAB B: Comentarios de Orden */
                  <div className="space-y-4">
                    <div className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-blue-500/30 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-black text-cyan-300 uppercase tracking-wider">
                          Orden #{orderNumberDisplay}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold">
                          {specimensDisplay}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>Paciente: <strong className="text-white">{currentPatient?.firstName} {currentPatient?.lastName}</strong> ({patientAgeDisplay} / {patientGenderDisplay})</div>
                        <div>Médico tratante: <strong className="text-white">{doctorDisplay}</strong></div>
                        <div>Servicio de origen: <strong className="text-amber-300">{serviceOriginDisplay}</strong></div>
                        <div>Prioridad: <strong className="text-rose-400">{currentOrder?.priority || 'RUTINA'}</strong></div>
                      </div>
                    </div>

                    {/* Quick Tags para Orden */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Plantillas rápidas para la orden general:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Muestra tomada en estricto ayuno de 12 horas',
                          'Muestra recibida desde urgencias con transporte en cadena de frío',
                          'Paciente bajo tratamiento anticoagulante informado',
                          'Resultados emitidos y despachados con prioridad URGENCIA',
                          'Muestra con volumen límite; se priorizaron analitos críticos',
                          'Informe preliminar validado por el Tecnólogo Médico'
                        ].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setOrderGeneralComment(prev => prev ? `${prev}. ${tag}` : tag);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Criterios Preanalíticos de Rechazo de Muestra (ISO 15189 §7.3.4) */}
                    <div className="space-y-3 p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">⚠️</span>
                          <div>
                            <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider block">
                              Criterios de Rechazo Preanalítico (ISO 15189 §7.3.4):
                            </span>
                            <span className="text-[10px] text-rose-400 font-mono">Sale impreso en reporte del paciente</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAddingCustomRejection(!isAddingCustomRejection)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-400/40 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          {isAddingCustomRejection ? (
                            <>
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Crear Motivo Propio
                            </>
                          )}
                        </button>
                      </div>

                      {/* Formulario para crear motivo personalizado */}
                      {isAddingCustomRejection && (
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 space-y-2.5 shadow-lg">
                          <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-rose-400" />
                            Nuevo Motivo de Rechazo Personalizado
                          </div>
                          <div>
                            <label className="text-[10.5px] font-medium text-slate-300 block mb-1">
                              Nombre corto / Botón (ej: 🔬 Lipemia Severa 4+):
                            </label>
                            <input
                              type="text"
                              value={newRejectionLabel}
                              onChange={(e) => setNewRejectionLabel(e.target.value)}
                              placeholder="Ej: 🔬 Muestra Lipémica Severa"
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10.5px] font-medium text-slate-300 block mb-1">
                              Texto explicativo oficial para el reporte del paciente:
                            </label>
                            <textarea
                              value={newRejectionText}
                              onChange={(e) => setNewRejectionText(e.target.value)}
                              placeholder="Ej: MUESTRA RECHAZADA: Muestra altamente lipémica (quilomicrones elevados) que interfiere en lecturas ópticas. Se solicita re-toma con 12h de ayuno estricto."
                              rows={3}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-sans resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCustomRejection(false);
                                setNewRejectionLabel('');
                                setNewRejectionText('');
                              }}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveCustomRejection}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-900/50"
                            >
                              <Check className="w-3.5 h-3.5" /> Guardar Motivo
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-[10.5px] text-slate-400 leading-snug">
                        Toque cualquier motivo para auto-completar el reporte oficial al paciente y solicitar re-toma:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {rejectionReasonsList.map(rej => (
                          <div
                            key={rej.id}
                            className="group relative inline-flex items-center"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOrderGeneralComment(prev => prev ? `${prev}\n\n${rej.text}` : rej.text);
                              }}
                              className={`pl-2.5 ${rej.isCustom ? 'pr-7' : 'pr-2.5'} py-1 rounded-lg bg-rose-900/30 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 text-[10.5px] font-bold transition cursor-pointer text-left`}
                              title={rej.text}
                            >
                              + {rej.label}
                            </button>
                            {rej.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomRejection(rej.id, e)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-950/80 hover:bg-rose-700 text-rose-300 hover:text-white flex items-center justify-center text-[11px] font-bold opacity-75 hover:opacity-100 transition cursor-pointer"
                                title="Eliminar este motivo personalizado"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Textarea para Orden */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                        Observación general de la orden (Reporte al Paciente y Médico):
                      </label>
                      <textarea
                        rows={4}
                        value={orderGeneralComment}
                        onChange={(e) => setOrderGeneralComment(e.target.value)}
                        placeholder="Escriba aquí las observaciones generales aplicables a toda la orden clínica o motivo de rechazo de muestra..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition leading-relaxed"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (commentsActiveTab === 'ANALYTE') {
                      setAnalyteCommentDraft('');
                    } else {
                      setOrderGeneralComment('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Limpiar Texto
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCommentsModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Cerrar
                  </button>

                  {commentsActiveTab === 'ANALYTE' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedCommentResultId) {
                          notifyToast.error('Seleccione un analito primero.');
                          return;
                        }
                        onUpdateInterpretation(selectedCommentResultId, analyteCommentDraft);
                        const res = patientResults.find(r => r.id === selectedCommentResultId);
                        notifyToast.success(`Observación de ${res?.parameterName || 'analito'} guardada.`);
                        setShowCommentsModal(false);
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/30 hover:brightness-110 transition cursor-pointer"
                    >
                      Guardar Observación de Analito
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentOrder) {
                          currentOrder.notes = orderGeneralComment;
                        }
                        onUpdateOrderNotes?.(currentOrder?.id || '', orderGeneralComment);
                        notifyToast.success('Comentario general de la orden guardado con éxito.');
                        setShowCommentsModal(false);
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:brightness-110 transition cursor-pointer"
                    >
                      Guardar Comentario de la Orden
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
