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
  ArrowRight, ChevronRight, BrainCircuit, Terminal, Wrench, ArrowUp, ArrowDown,
  Microscope, AlertTriangle, Check, Lock, ShieldCheck,
  FlaskConical, MessageSquareText, Undo2,
  Filter, Clock, Info, LayoutGrid, FileText
} from 'lucide-react';
import { notifyToast } from '../../utils/toastNotification';

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
        {result.value || (isValidated ? 'VALIDADO' : '—')}
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

export const ResultEntryWorkspace: React.FC<ResultEntryWorkspaceProps> = ({
  order: initialOrder, patient: initialPatient, results, analyzers = MOCK_ANALYZERS, currentUser,
  onUpdateResultValue, onUpdateInterpretation, onUpdateResultStatus, onOpenPdf,
  onConsultInterBranch, onUpdateOrderTests, onUpdateOrderNotes, allOrders = [], allPatients = []
}) => {
  const [activeOrderId, setActiveOrderId] = useState<string>(initialOrder?.id || allOrders[0]?.id || '');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'validated'>('all');

  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [showTrendViewer, setShowTrendViewer] = useState(false);
  const [isTrendsLoading, setIsTrendsLoading] = useState(true);
  const [showAuditLog, setShowAuditLog] = useState(false);

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

  const currentOrder = (allOrders.length > 0 ? allOrders.find(o => o.id === activeOrderId) : undefined) || initialOrder || allOrders[0];
  const currentPatient = (allPatients.length > 0 ? allPatients.find(p => p.id === currentOrder?.patientId) : undefined) || initialPatient || allPatients[0];

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
    return list;
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

  const unvalidatedCount = useMemo(() => {
    return patientResults.filter(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED' && r.status !== 'VALIDADO' && r.status !== 'LIBERADO').length;
  }, [patientResults]);

  const toReleaseCount = useMemo(() => {
    return patientResults.filter(r => (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO') && r.status !== 'LIBERADO').length;
  }, [patientResults]);

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

  const serviceOriginDisplay = currentOrder?.serviceOrigin || (currentOrder ? 'Consulta Externa' : '—');
  const doctorDisplay = currentOrder?.doctorName ? `Dr(a). ${currentOrder.doctorName}` : (currentOrder ? 'Sin Médico Referente' : '—');

  const specimensDisplay = currentOrder?.specimens && currentOrder.specimens.length > 0
    ? currentOrder.specimens.map(s => `${s.type || 'Muestra'} (${s.barcode || 'S/C'})`).join(' + ')
    : (currentOrder ? 'Muestras por recolectar' : 'Sin muestras asociadas');

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const matchesSearch = o.patientName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                          o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase());

      const orderResults = results.filter(r => r.orderId === o.id);
      const isPending = orderResults.some(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED' && r.status !== 'VALIDADO' && r.status !== 'LIBERADO');

      if (orderStatusFilter === 'pending') return matchesSearch && isPending;
      if (orderStatusFilter === 'validated') return matchesSearch && !isPending;
      return matchesSearch;
    });
  }, [allOrders, orderSearchQuery, orderStatusFilter, results]);

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
      {/* Sidebar: Órdenes (Diseño Moderno Compacto 310px) */}
      <div className={`${isSidebarCollapsed ? "w-full lg:w-16" : "w-full lg:w-[310px]"} bg-[#030a21] border-b lg:border-b-0 lg:border-r border-blue-950/80 flex flex-col transition-all duration-300 relative shrink-0 h-full overflow-hidden`}>
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 bg-cyan-400 rounded-full items-center justify-center shadow-lg shadow-cyan-500/30 z-20 hover:scale-110 transition-transform cursor-pointer"
        >
          <ChevronRight className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>

        <div className="p-3 flex flex-col h-full space-y-2.5 overflow-hidden">
          {/* Header Bandeja de Órdenes */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              {!isSidebarCollapsed && (
                <h3 className="text-xs font-black text-white tracking-wider uppercase">
                  Bandeja de Órdenes
                </h3>
              )}
            </div>
            {!isSidebarCollapsed && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
                {pendingCount || filteredOrders.length}
              </span>
            )}
          </div>

          {!isSidebarCollapsed && (
            <div className="space-y-2">
              {/* Search Bar with Filter Icon */}
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar paciente u orden..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-[#071333] border border-blue-900/60 rounded-xl py-1.5 pl-8 pr-8 text-[11px] text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  title="Filtrar órdenes"
                  className="absolute right-2.5 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex gap-1.5 bg-[#03091e] p-1 rounded-xl border border-blue-950">
                {(['all', 'pending', 'validated'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatusFilter(status)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      orderStatusFilter === status
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    {status === 'all' ? 'Todo' : status === 'pending' ? 'Pend.' : 'Val.'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders Scroll Container */}
          <div className="overflow-y-auto space-y-2 flex-1 custom-scrollbar pr-0.5 min-h-0">
            {filteredOrders.map(o => {
              const orderResults = results.filter(r => r.orderId === o.id);
              const uniqueParams = Array.from(new Set(orderResults.map(r => r.parameterId)));
              const validatedCount = uniqueParams.filter(pId =>
                orderResults.find(r => r.parameterId === pId && (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO'))
              ).length;
              const hasCritical = orderResults.some(r => r.flag?.includes('CRITICO') || r.flag === 'PANICO');
              const isStat = o.priority === 'STAT' || o.priority === 'URGENTE';
              const isActive = o.id === activeOrderId;
              const progressPct = Math.round((validatedCount / Math.max(1, uniqueParams.length)) * 100);

              return (
                <button
                  key={o.id}
                  onClick={() => setActiveOrderId(o.id)}
                  className={`w-full text-left rounded-xl border p-2.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? (isStat || hasCritical
                          ? 'bg-[#0f1738] border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                          : 'bg-[#091538] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]')
                      : (isStat || hasCritical
                          ? 'bg-[#0c1430] border-rose-900/50 hover:border-rose-500/60'
                          : 'bg-[#07112b] border-blue-950 hover:border-blue-800')
                  }`}
                >
                  {/* Top row: Order Number & Alert Badge */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-mono font-bold tracking-tight ${
                      isStat || hasCritical ? 'text-rose-400' : 'text-slate-400'
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
                  <div className="text-xs font-black uppercase text-white truncate leading-snug">
                    {o.patientName}
                  </div>

                  {/* Bottom row: Progress bar + Time & Val Count */}
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isStat || hasCritical ? 'bg-rose-500' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 inline" />
                        12/10/2026 09:42 AM
                      </span>
                      <span className={`font-bold ${isStat || hasCritical ? 'text-rose-400' : 'text-cyan-400'}`}>
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
          <div className="bg-[#061130] border border-blue-900/60 rounded-2xl p-2.5 shadow-lg flex flex-col gap-2">
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
                      ▲ STAT
                    </span>
                  )}
                  <span className="text-blue-500/40">|</span>
                  <span className="text-cyan-400 font-mono font-bold text-xs flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                    {patientNationalId}
                  </span>
                  <span className="text-blue-500/40">|</span>
                  <span className="text-slate-300 text-xs font-mono">
                    Orden: <strong className="text-white">{orderNumberDisplay}</strong>
                  </span>
                  <span className="text-blue-500/40">|</span>
                  <span className="text-slate-300 text-xs flex items-center gap-1">
                    👤 {patientAgeDisplay} • {patientGenderDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* Fila 2: Ubicación / Servicio y Médico */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                📍 {serviceOriginDisplay || 'Laboratorio Central'}
              </span>
              <span className="text-blue-500/40">|</span>
              <span className="flex items-center gap-1 text-slate-300">
                👤 {doctorDisplay || 'Dr. Martinez'}
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
                <span>Todos ({analyteCounts.all})</span>
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
                <span>Pendientes ({analyteCounts.pending})</span>
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
                <span>Críticos ({analyteCounts.critical})</span>
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
                <span>Validados ({analyteCounts.validated})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-1.5 space-y-1.5 custom-scrollbar">

           {/* Banner de Protección por Propiedad de la Orden (Normativa LIS/HIS) */}
           {!canModifyThisOrder && (
             <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center space-x-2 text-amber-200 text-xs shadow-sm">
               <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
               <div className="text-[10px]">
                 <strong className="text-white mr-1.5 font-bold">🔒 Modo lectura:</strong>
                 <span>Esta orden pertenece a otro Tecnólogo Médico. Solo su dueño o la Jefatura pueden modificarla.</span>
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
                      {area.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300 font-bold">
                      {areaResults.length} {areaResults.length === 1 ? 'analito' : 'analitos'}
                    </span>
                  </div>
                  {areaResults.map((res, index) => {
                 const isValidated = res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED' || res.status === 'VALIDADO';
                 const isHigh = res.flag === 'ALTO';
                 const isCritical = res.flag?.includes('CRITICO');

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
                             <span className="font-black text-white text-xs uppercase">{res.parameterName}</span>
                          </div>

                          {isValidated ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase rounded-full">
                              VALIDADO
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase rounded-full">
                              PENDIENTE
                            </span>
                          )}
                       </div>

                       {/* Mobile Value Display */}
                       <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                          <div>
                             <span className="text-[9px] text-slate-500 font-bold uppercase block">Resultado</span>
                             <span className={`text-lg font-black font-mono ${isCritical ? 'text-rose-400 animate-pulse' : isHigh ? 'text-amber-300' : 'text-emerald-400'}`}>
                                {res.value} <span className="text-xs text-slate-400 font-normal">{res.unit}</span>
                             </span>
                          </div>

                          <div className="text-right">
                             <span className="text-[9px] text-slate-500 font-bold uppercase block">Valor Referencia</span>
                             <span className="text-xs text-slate-300 font-mono italic">{res.refRangeText}</span>
                          </div>
                       </div>

                       {/* Mobile Alert Banner if High/Critical */}
                       {(isHigh || isCritical) && (
                          <div className={`p-2.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 ${isCritical ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'}`}>
                             <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                             <span>{isCritical ? '🚨 VALOR CRÍTICO DE PÁNICO — Notificación obligatoria.' : `⚠️ ALERTA DE RANGO: ${res.parameterName} (${res.value} ${res.unit}) excede el valor máximo.`}</span>
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
                          <span>ANALITO / EXAMEN</span>
                        </div>
                      </th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">
                        <div className="leading-tight">
                          <div>RESULTADO</div>
                          <div>CLÍNICO</div>
                        </div>
                      </th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">UNIDAD</th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">INTERVALO DE REFERENCIA</th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">ORIGEN / EQUIPO</th>
                      <th className="py-1.5 px-2.5 text-center font-bold text-[11px] tracking-wider text-slate-300">ESTADO</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-blue-950/60">
                    {groupedResults.map(({ area, results: areaResults }) => {
                      const allAreaValidated = areaResults.every(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO');
                      const allAreaSelected = areaResults.every(r => selectedResults.includes(r.id));
                      const hasCriticalInArea = areaResults.some(r => r.flag?.includes('CRITICO'));

                      return (
                        <React.Fragment key={`area-section-${area.id}`}>
                          {/* Fila Encabezado de Área / Sección Clínica (Exacto al Mock) */}
                          <tr className="bg-[#05112e] border-y border-blue-900/60">
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
                                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                                    {area.name}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#091b42] text-[11px] font-mono text-cyan-300 font-semibold border border-blue-800/60">
                                    {areaResults.length} {areaResults.length === 1 ? 'analito' : 'analitos'}
                                  </span>
                                  <span className="text-[11px] text-cyan-400/80 flex items-center gap-1 font-mono">
                                    <Info className="w-3 h-3 text-cyan-400" /> Analitos: {areaResults.length}
                                  </span>
                                  {hasCriticalInArea && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-black text-rose-300 flex items-center gap-1 animate-pulse">
                                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                                      <span>ALERTA CRÍTICA</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#052923] border border-emerald-500/40 text-emerald-300">
                                    {areaResults.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO').length}/{areaResults.length} Validados
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
                                    className="px-3 py-1 rounded-lg bg-[#0c224d] hover:bg-[#12316e] border border-blue-500/50 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                                  >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span>{allAreaSelected ? 'DESELECCIONAR ÁREA' : 'SELECCIONAR ÁREA'}</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Analitos de esta Área */}
                          {areaResults.map((res, index) => {
                            const isValidated = res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED' || res.status === 'VALIDADO';
                            const isNoteExpanded = expandingNotesId === res.id;
                            const isHigh = res.flag === 'ALTO';
                            const isLow = res.flag === 'BAJO';
                            const isCritical = res.flag?.includes('CRITICO') || res.flag === 'PANICO';

                            return (
                              <React.Fragment key={`frag-${res.id}-${index}`}>
                                <tr
                                  key={`tr-main-${res.id}-${index}`}
                                  onClick={() => setActiveTraceabilityId(res.id)}
                                  className={`cursor-pointer transition-colors border-b border-blue-950/40 hover:bg-[#061438]/80 ${
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
                                    <div className="font-bold text-xs uppercase text-white tracking-wide">
                                      {res.parameterName}
                                    </div>
                                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5 flex items-center gap-1.5">
                                      <span>{res.parameterCode || res.parameterName.slice(0, 4)}</span>
                                      <span className="text-slate-600">•</span>
                                      <span>{res.analyzerName || 'ASTM E1394'}</span>
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
                                    <div className="font-mono text-xs text-slate-200 font-medium">{res.refRangeText || 'Normal'}</div>
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
                                    {res.analyzerName || 'Manual TM'}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    {isValidated ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#052923] border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>VALIDADO</span>
                                      </span>
                                    ) : res.status === 'LIBERADO' ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#072445] border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>LIBERADO</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2e1d05] border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full">
                                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                                        <span>PENDIENTE</span>
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
                                          {res.flag?.includes('CRITICO') ? 'ALERTA CRÍTICA: ' : 'ALERTA DE RANGO: '}
                                        </span>
                                        <span className="text-rose-200 font-medium">
                                          {res.parameterName} ({res.value} {res.unit}) {res.flag?.includes('CRITICO') ? 'requiere notificación inmediata.' : `excede el límite de referencia (${res.refRangeText}).`}
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

        {/* Barra de Acciones Fija en la Parte Inferior (Diseño Exacto del Mock) */}
        <div className="h-[60px] shrink-0 border-t border-blue-900/60 bg-[#03091e] px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar z-20 shadow-2xl isolate">

          {/* 1. Alertas y Pánicos (Rojo) */}
          <button
            type="button"
            onClick={() => setShowAlertsCenterModal(true)}
            title="Identificar resultados críticos y alertas (ISO 15189)"
            className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] border-rose-500/80 bg-rose-950/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400 transition-all flex items-center gap-2 text-xs font-bold shadow-[0_0_12px_rgba(244,63,94,0.15)] cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="whitespace-nowrap">Alertas y Pánicos</span>
            {criticalResultsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {criticalResultsCount}
              </span>
            )}
          </button>

          {/* 2. Calculadoras (Amarillo) */}
          <button
            type="button"
            onClick={() => setShowClinicalCalcModal(true)}
            title="Acceder a herramientas de cálculo clínico (eGFR, LDL, HOMA-IR, De Ritis)"
            className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] border-amber-500/80 bg-amber-950/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-all flex items-center gap-2 text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">Calculadoras</span>
          </button>

          {/* 3. Telemetría (Turquesa) */}
          <button
            type="button"
            onClick={() => setShowTelemetryModal(true)}
            title="Consultar información de monitoreo y telemetría de analizadores"
            className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] border-teal-500/80 bg-teal-950/30 text-teal-300 hover:bg-teal-500/20 hover:border-teal-400 transition-all flex items-center gap-2 text-xs font-bold shadow-[0_0_12px_rgba(20,184,166,0.15)] cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">Telemetría</span>
          </button>

          {/* 4. Trazabilidad (Azul grisáceo) */}
          <button
            type="button"
            onClick={() => setShowAuditLog(true)}
            title="Consultar el historial y bitácora de auditoría ISO 15189"
            className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] border-slate-600/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">Trazabilidad</span>
          </button>

          {/* 5. Informe Carta (Cian) */}
          <button
            type="button"
            onClick={() => currentOrder?.id && onOpenPdf(currentOrder.id)}
            title="Generar o imprimir informes clínicos oficiales en tamaño Carta"
            className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] border-cyan-500/80 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all flex items-center gap-2 text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">Informe Carta</span>
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
                  notifyToast.info('No hay analitos validados en esta orden para desvalidar.');
                }
              }
            }}
            title="Revertir la validación de analitos con justificación obligatoria (ISO 15189)"
            className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] border-purple-500/80 bg-purple-950/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 transition-all flex items-center gap-2 text-xs font-bold shadow-[0_0_12px_rgba(168,85,247,0.2)] cursor-pointer"
          >
            <Undo2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="whitespace-nowrap">
              Desvalidar {selectedValidatedCount > 0 ? `(${selectedValidatedCount})` : ''}
            </span>
          </button>

          {/* 7. Validar Analitos (Azul grisáceo) */}
          <button
            type="button"
            disabled={!canModifyThisOrder || selectedUnvalidatedCount === 0}
            onClick={() => {
              const toValidate = selectedResults.filter(id => {
                const res = results.find(r => r.id === id);
                return res && res.status !== 'VALIDADO_TEC' && res.status !== 'VALIDADO_MED' && res.status !== 'VALIDADO' && res.status !== 'LIBERADO';
              });
              if (toValidate.length === 0) return;
              toValidate.forEach(id => onUpdateResultStatus(id, 'VALIDADO_TEC'));
              setSelectedResults([]);
              notifyToast.success(`${toValidate.length} analitos validados con éxito.`);
            }}
            title="Validar los analitos seleccionados"
            className={`shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] flex items-center gap-2 text-xs font-bold transition-all ${
              selectedUnvalidatedCount > 0 && canModifyThisOrder
                ? 'border-blue-400/80 bg-blue-950/40 text-blue-200 hover:bg-blue-900/50 hover:border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)] cursor-pointer'
                : 'border-slate-700/60 bg-slate-900/40 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedUnvalidatedCount > 0 ? 'text-blue-400' : 'text-slate-600'}`} />
            <span className="whitespace-nowrap">
              Validar Analitos
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
            title="Agregar observaciones e informes a resultados individuales o a la orden"
            className="shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] border-teal-500/80 bg-teal-950/30 text-teal-300 hover:bg-teal-500/20 hover:border-teal-400 transition-all flex items-center gap-2 text-xs font-bold shadow-[0_0_12px_rgba(20,184,166,0.2)] cursor-pointer"
          >
            <MessageSquareText className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">Informes / Comentarios</span>
          </button>

          {/* 9. Validar Todo (Verde) */}
          <button
            type="button"
            disabled={!canModifyThisOrder || unvalidatedCount === 0}
            onClick={() => {
              const unvalidated = patientResults.filter(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED' && r.status !== 'VALIDADO' && r.status !== 'LIBERADO');
              if (unvalidated.length === 0) return;
              unvalidated.forEach(r => onUpdateResultStatus(r.id, 'VALIDADO_TEC'));
              setSelectedResults([]);
              notifyToast.success(`Todos los analitos (${unvalidated.length}) han sido validados.`);
            }}
            title="Validar todos los analitos correspondientes de la orden"
            className={`shrink-0 h-9 px-2.5 sm:px-3 rounded-xl border text-[11px] flex items-center gap-2 text-xs font-bold transition-all ${
              unvalidatedCount > 0 && canModifyThisOrder
                ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer'
                : 'border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className={`w-4 h-4 shrink-0 stroke-[2.5] ${unvalidatedCount > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span className="whitespace-nowrap">Validar Todo</span>
          </button>

          {/* 10. Liberar (Azul-cian con Glow) */}
          <button
            type="button"
            disabled={!canReleaseThisOrder || toReleaseCount === 0}
            onClick={() => {
              const toRelease = patientResults.filter(r => (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED' || r.status === 'VALIDADO') && r.status !== 'LIBERADO');
              if (toRelease.length === 0) return;
              toRelease.forEach(r => onUpdateResultStatus(r.id, 'LIBERADO'));
              setSelectedResults([]);
              notifyToast.success(`Se han liberado formalmente ${toRelease.length} analitos.`);
            }}
            title="Liberar formalmente resultados para entrega a médicos y pacientes"
            className={`shrink-0 h-9 px-3.5 rounded-xl flex items-center gap-2 text-xs font-black tracking-wide uppercase transition-all ${
              toReleaseCount > 0 && canReleaseThisOrder
                ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.7)] hover:brightness-110 hover:shadow-[0_0_24px_rgba(6,182,212,0.9)] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span className="whitespace-nowrap">Liberar ({toReleaseCount})</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-md p-10">
            <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-3xl h-[70vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
               <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-xl font-black text-white italic">Trazabilidad de Resultados (Audit Trail)</h3>
                  <button onClick={() => setShowAuditLog(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                       <div>
                         <div className="text-[10px] text-slate-500 font-black uppercase">Evento {i}</div>
                         <div className="text-xs text-white font-bold mt-1">Resultado validado por Middleware ASTM</div>
                       </div>
                       <div className="text-right text-[10px] font-mono text-teal-500">2026-03-15 14:30:22</div>
                    </div>
                  ))}
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
                                alert('Seguridad ISO: Solo el autor de la validación o el Súper-Admin pueden revocar este estado.');
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
                           onClick={() => {
                              onUpdateResultStatus(res.id, 'VALIDADO_TEC');
                              setActiveTraceabilityId(null);
                           }}
                           className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20"
                         >
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="uppercase tracking-widest text-xs">Aprobar Técnica</span>
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
                          alert('Error: No se encontraron resultados válidos para revocar.');
                          return;
                        }

                        idsToRevoke.forEach(id => {
                          onUpdateResultStatus(id, 'INGRESADO');
                          console.log(`[ISO 15189 AUDIT] Result ${id} REVOKED by ${currentUser?.name || 'Sistema'}. Reason: ${unvalidateReason}`);
                        });

                        setShowUnvalidateModal(false);
                        setUnvalidateReason('');
                        setActiveTraceabilityId(null);
                        setSelectedResults([]);
                        alert(`AUDITORÍA PROCESADA: Se han revocado ${idsToRevoke.length} validaciones. Los analitos vuelven a estado de edición.`);
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
             <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
                <button onClick={() => setShowAlertsCenterModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
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
        )}

        {showClinicalCalcModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
             <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
                <button onClick={() => setShowClinicalCalcModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
                <ResultsClinicalCalculator
                  order={currentOrder}
                  patient={currentPatient}
                  results={patientResults}
                  onUpdateResultValue={onUpdateResultValue}
                />
             </div>
          </div>
        )}

        {showTelemetryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
             <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
                <button onClick={() => setShowTelemetryModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
                <ResultsTelemetryDashboard
                  order={currentOrder}
                  patient={currentPatient}
                  results={patientResults}
                  analyzers={analyzers}
                />
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
                      <label className="text-xs font-black text-cyan-300 uppercase tracking-wider block">
                        1. Seleccionar Analito / Examen:
                      </label>
                      <select
                        value={selectedCommentResultId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedCommentResultId(id);
                          const res = patientResults.find(r => r.id === id);
                          setAnalyteCommentDraft(res?.interpretation || '');
                        }}
                        className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                      >
                        {patientResults.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.parameterName} ({r.parameterCode}) — {r.value ? `${r.value} ${r.unit}` : 'Sin valor'} [{r.status}]
                          </option>
                        ))}
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
                          'Resultados emitidos y despachados con prioridad STAT',
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

                    {/* Textarea para Orden */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                        Observación general de la orden:
                      </label>
                      <textarea
                        rows={4}
                        value={orderGeneralComment}
                        onChange={(e) => setOrderGeneralComment(e.target.value)}
                        placeholder="Escriba aquí las observaciones generales aplicables a toda la orden clínica o informe de muestra..."
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
