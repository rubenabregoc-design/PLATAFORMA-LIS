import React, { useState, useMemo } from 'react';
import { Order, TestResult, Patient, Analyzer, Specimen, AuditLogEntry } from '../../types';
import { useLisStore } from '../../store/useLisStore';
import { ResultTrendWidget } from './ResultTrendWidget';
// ... (rest of imports)
import { SecureInternalMessagingWidget } from '../SecureInternalMessagingWidget';
import { RejectedSampleWizard } from '../Phase6Suite/RejectedSampleWizard';
import { evaluateTestResult, ReferenceRangeEvaluation } from '../../utils/referenceRangeEvaluator';
import { SampleIntegrityBadge } from '../SampleIntegrityStatusWidget';
import { offlineSyncManager } from '../../utils/offlineSyncEngine';
import {
  User, FileText, CheckCircle2, AlertTriangle, ShieldCheck,
  Printer, RotateCcw, Save, Trash2, Plus, Info, Lock,
  History, MessageSquare, Paperclip, Barcode, ChevronRight, Search, X,
  Microscope, Beaker, Check, Download, AlertOctagon, Upload, Sparkles, Send, XCircle,
  TrendingUp, Activity, ArrowUp, ArrowDown, AlertCircle, Filter, BookOpen, Layers, Sliders,
  Clock, ShieldAlert
} from 'lucide-react';

interface ResultEntryWorkspaceProps {
  order: Order;
  patient: Patient;
  results: TestResult[];
  analyzers: Analyzer[];
  onUpdateResultValue: (resultId: string, newValue: string) => void;
  onUpdateInterpretation: (resultId: string, interpretation: string) => void;
  onValidateTechnical: (resultId: string) => void;
  onOpenPdf: (orderId: string) => void;
}

export const ResultEntryWorkspace: React.FC<ResultEntryWorkspaceProps> = ({
  order,
  patient,
  onOpenPdf
}) => {
  const {
    results,
    updateResult,
    validateResult,
    unvalidateResult,
    updateInterpretation,
    updateResultStatus,
    addResults,
    currentUser,
    canDo
  } = useLisStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [editingInterpId, setEditingInterpId] = useState<string | null>(null);
  const [tempInterp, setTempInterp] = useState<string>('');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  // Trend Widget & Messaging state
  const [selectedTrendResultId, setSelectedTrendResultId] = useState<string | null>(null);
  const [showTrendWidget, setShowTrendWidget] = useState<boolean>(true);
  const [showChatWidget, setShowChatWidget] = useState<boolean>(false);
  const [showAuditSidebar, setShowAuditSidebar] = useState<boolean>(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Modal active states
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'ADD_TESTS' | 'REWORK' | 'REJECT' | 'NOTES' | 'ATTACHMENTS' | 'LABELS'
  >('NONE');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Tests Modal State
  const [testSearchQuery, setTestSearchQuery] = useState<string>('');
  const [selectedCatalogTests, setSelectedCatalogTests] = useState<string[]>([]);

  // Rework Modal State
  const [reworkReason, setReworkReason] = useState<string>('Verificación de valor crítico fuera de rango');
  const [reworkTests, setReworkTests] = useState<string[]>([]);

  // Rejection Modal State
  const [rejectionReason, setRejectionReason] = useState<string>('Muestra Hemolizada (Grado 3+)');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');

  // Notes Modal State
  const [notesList, setNotesList] = useState<Array<{ id: string; author: string; time: string; text: string; type: string }>>([
    {
      id: 'n-1',
      author: 'Lic. Sofía Guardia (TM-4410)',
      time: '11/08/2026 19:42',
      text: 'Muestra de sangre entera colectada en ayuno comprobado. Suero lípido ligero ++.',
      type: 'TÉCNICA'
    },
    {
      id: 'n-2',
      author: 'Sistema Middleware ASTM',
      time: '11/08/2026 19:45',
      text: 'Resultado transmitido automáticamente desde analizador Sysmex XN-550.',
      type: 'SISTEMA'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState<string>('');

  // Attachments Modal State
  const [attachmentsList, setAttachmentsList] = useState<Array<{ id: string; name: string; size: string; type: string; date: string }>>([
    {
      id: 'att-1',
      name: 'Requisicion_Medica_Firmada.pdf',
      size: '1.2 MB',
      type: 'PDF',
      date: '11/08/2026 19:10'
    },
    {
      id: 'att-2',
      name: 'Histograma_Sysmex_XN550.png',
      size: '480 KB',
      type: 'IMAGEN',
      date: '11/08/2026 19:45'
    }
  ]);

  // Labels Modal State
  const [labelQuantity, setLabelQuantity] = useState<number>(2);
  const [isPrintingLabel, setIsPrintingLabel] = useState<boolean>(false);
  const [filterOutOfRangeOnly, setFilterOutOfRangeOnly] = useState<boolean>(false);

  const patientResults = results.filter(r => r.orderId === order.id);

  // Compute evaluations for all results against Master Test Catalog
  const resultsWithEvaluations = useMemo(() => {
    return patientResults.map(r => ({
      result: r,
      evaluation: evaluateTestResult(r, patient)
    }));
  }, [patientResults, patient]);

  const outOfRangeCount = resultsWithEvaluations.filter(re => re.evaluation.isOutOfRange).length;
  const criticalCount = resultsWithEvaluations.filter(re => re.evaluation.isCritical).length;
  const normalCount = patientResults.length - outOfRangeCount;

  const displayedResults = useMemo(() => {
    if (filterOutOfRangeOnly) {
      return resultsWithEvaluations.filter(re => re.evaluation.isOutOfRange);
    }
    return resultsWithEvaluations;
  }, [resultsWithEvaluations, filterOutOfRangeOnly]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getFlagStyle = (flag?: string, isOutOfRange?: boolean) => {
    if (flag?.includes('CRITICO')) return 'bg-rose-500/25 text-rose-200 border-rose-500/80 font-black shadow-[0_0_15px_rgba(244,63,94,0.4)] ring-1 ring-rose-500';
    if (isOutOfRange || flag === 'ALTO' || flag === 'BAJO') return 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-black shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/40';
    return 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-700';
  };

  const toggleSelect = (id: string) => {
    setSelectedResults(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Button 1: Save
  const handleSave = () => {
    showToast('✓ Cambios e interpretaciones guardados exitosamente en la bitácora LIS.');
  };

  // Button 2: Add Tests
  const handleConfirmAddTests = () => {
    if (selectedCatalogTests.length === 0) {
      showToast('Seleccione al menos una prueba del catálogo.');
      return;
    }

    const availableCatalog = [
      { code: 'GLU', name: 'Glucosa en Ayunas', unit: 'mg/dL', ref: '70 - 99 mg/dL', spec: 'SUERO ROJO' },
      { code: 'LIP', name: 'Perfil Lipídico Completo', unit: 'mg/dL', ref: 'Panel Multi-parámetro', spec: 'SUERO ROJO' },
      { code: 'TROP', name: 'Troponina I Alta Sensibilidad', unit: 'pg/mL', ref: '< 14 pg/mL', spec: 'HEPARINA VERDE' },
      { code: 'TSH', name: 'Hormona Estimulante de Tiroides (TSH)', unit: 'uIU/mL', ref: '0.40 - 4.20 uIU/mL', spec: 'SUERO ROJO' },
      { code: 'PCR', name: 'Proteína C Reactiva Ultra Sensible', unit: 'mg/L', ref: '< 3.0 mg/L', spec: 'SUERO ROJO' },
      { code: 'ELECT', name: 'Electrólitos Séricos (Na, K, Cl)', unit: 'mEq/L', ref: 'Na: 135-145, K: 3.5-5.0', spec: 'SUERO ROJO' },
      { code: 'TPT', name: 'Tiempo de Tromboplastina (TPT)', unit: 'seg', ref: '25.0 - 35.0 seg', spec: 'CITRATO AZUL' }
    ];

    const newResults: TestResult[] = selectedCatalogTests.map(code => {
      const catItem = availableCatalog.find(c => c.code === code) || availableCatalog[0];
      return {
        id: `res-add-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tenantId: order.tenantId,
        orderId: order.id,
        testId: `t-${code}`,
        testCode: catItem.code,
        parameterName: catItem.name,
        value: '---',
        unit: catItem.unit,
        refRangeText: catItem.ref,
        flag: 'NORMAL',
        status: 'PENDIENTE',
        specimenType: catItem.spec
      };
    });

    addResults(newResults);
    setSelectedCatalogTests([]);
    setActiveModal('NONE');
    showToast(`✓ Se agregaron ${newResults.length} nueva(s) prueba(s) a la Orden #${order.orderNumber}.`);
  };

  // Button 3: Return / Rework
  const handleConfirmRework = () => {
    const targets = reworkTests.length > 0 ? reworkTests : patientResults.map(r => r.id);
    targets.forEach(id => updateResultStatus(id, 'EN_PROCESO', 'PENDIENTE REPETICIÓN'));
    setActiveModal('NONE');
    showToast(`🔄 Muestra retornada a repetición técnica. Motivo: ${reworkReason}`);
  };

  // Button 4: Rejection
  const handleConfirmRejection = () => {
    patientResults.forEach(r => updateResultStatus(r.id, 'PENDIENTE', 'MUESTRA RECHAZADA'));
    setActiveModal('NONE');
    showToast(`⚠️ Rechazo registrado oficialmente. Criterio: ${rejectionReason}`);
  };

  // Button 5: Add Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const now = new Date();
    const timeStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setNotesList(prev => [
      ...prev,
      {
        id: `n-${Date.now()}`,
        author: 'Lic. Sofía Guardia (TM-4410)',
        time: timeStr,
        text: newNoteText,
        type: 'TÉCNICA'
      }
    ]);
    setNewNoteText('');
    showToast('✓ Observación agregada a la bitácora de la orden.');
  };

  // Button 6: Attachments Upload
  const handleSimulateUpload = () => {
    const now = new Date();
    const timeStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setAttachmentsList(prev => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        name: `Escaneo_Complementario_${Math.floor(100 + Math.random() * 900)}.pdf`,
        size: '850 KB',
        type: 'PDF',
        date: timeStr
      }
    ]);
    showToast('✓ Archivo adjuntado correctamente a la orden.');
  };

  // Button 7: Validate Bulk
  const handleBulkValidate = () => {
    const targets = selectedResults.length > 0 ? selectedResults : patientResults.map(r => r.id);
    if (targets.length === 0) {
      showToast('No hay resultados disponibles para validar.');
      return;
    }
    targets.forEach(id => validateResult(id, currentUser?.name || 'Sistema'));

    setSelectedResults([]);
    showToast(`✓ Validados técnicamente ${targets.length} resultado(s) bajo Idoneidad TM-4410.`);
  };

  // Button 8: Unvalidate Bulk / Desvalidar
  const handleBulkUnvalidate = () => {
    const targets = selectedResults.length > 0 ? selectedResults : patientResults.map(r => r.id);
    if (targets.length === 0) {
      showToast('⚠️ No hay resultados disponibles para desvalidar.');
      return;
    }
    const reason = prompt(`Ingrese motivo obligatorio para desvalidar ${targets.length} resultado(s):`);
    if (reason) {
      targets.forEach(id => unvalidateResult(id, reason));
      setSelectedResults([]);
      showToast(`↺ Se ha cambiado el estado a DESVALIDADO en ${targets.length} resultado(s).`);
    }
  };

  // Button 9: Print Barcode Labels
  const handlePrintLabels = () => {
    setIsPrintingLabel(true);
    setTimeout(() => {
      setIsPrintingLabel(false);
      setActiveModal('NONE');
      showToast(`🖨️ ${labelQuantity} etiqueta(s) térmica(s) de código de barras enviadas a la impresora ZEBRA.`);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-[80vh] pb-36 space-y-6 animate-in fade-in duration-700 relative text-slate-200">

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/95 border border-teal-500/50 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.3)] backdrop-blur-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Demographics Header - Glass Panel */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-wrap items-center justify-between gap-6 relative z-10">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-white tracking-tight">{patient.firstName} {patient.lastName}</h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-teal-400 font-mono text-[10px] font-bold border border-teal-500/20">
                {order.orderNumber}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <span>{patient.nationalId}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{order.patientAge} Años</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-slate-400">{patient.gender === 'F' ? 'Femenino' : 'Masculino'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Sample Integrity ISO 15189 Status */}
          <div className="bg-slate-950/70 p-2.5 px-3.5 rounded-2xl border border-white/10 flex items-center space-x-3">
            <div className="text-left">
              <div className="text-[9px] font-black text-teal-400 uppercase tracking-widest flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                <span>Integridad Muestra (ISO 15189)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Flebotomía: {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:30'}
              </div>
            </div>
            <SampleIntegrityBadge
              barcode={order.orderNumber}
              tubeType={patientResults[0]?.specimenType || 'SUERO_ROJO'}
              phlebotomyTime={order.createdAt || new Date(Date.now() - 42 * 60 * 1000).toISOString()}
              isCompact={true}
              showModalOnClick={true}
            />
          </div>

          <div className="h-10 w-px bg-white/5 hidden sm:block"></div>

          <div className="text-right">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Procedencia</div>
            <div className="text-xs font-bold text-white uppercase">{order.doctorName || 'Particular'}</div>
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Prioridad</div>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${order.priority === 'STAT' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
              {order.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Widget de 'Tendencia de Resultados' (Delta Check & Histórico) */}
      {showTrendWidget && (
        <ResultTrendWidget
          order={order}
          patient={patient}
          results={patientResults}
          selectedResultId={selectedTrendResultId}
          onSelectResultId={(id) => setSelectedTrendResultId(id)}
        />
      )}

      {/* Master Test Catalog Range Guardian Header Banner */}
      <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center space-x-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            outOfRangeCount > 0 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}>
            {outOfRangeCount > 0 ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-sm font-black text-white tracking-tight">
                {outOfRangeCount > 0
                  ? `${outOfRangeCount} ${outOfRangeCount === 1 ? 'Parámetro Fuera' : 'Parámetros Fuera'} de Rango de Referencia`
                  : 'Todos los Parámetros Dentro de Límites de Referencia'}
              </h3>
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-600/30 border border-rose-500 text-rose-300 text-[10px] font-black animate-pulse flex items-center space-x-1">
                  <AlertOctagon className="w-3 h-3" />
                  <span>{criticalCount} CRÍTICO / PÁNICO</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2 font-mono">
              <span>Criterio Catálogo Maestro:</span>
              <span className="text-teal-400 font-bold">{patient.gender === 'F' ? 'Femenino' : 'Masculino'} ({order.patientAge || 30}a)</span>
              <span>•</span>
              <span className="text-slate-500">ISO 15189 / CLSI EP28</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setFilterOutOfRangeOnly(false)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                !filterOutOfRangeOnly
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos ({patientResults.length})</span>
            </button>
            <button
              onClick={() => setFilterOutOfRangeOnly(true)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                filterOutOfRangeOnly
                  ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : outOfRangeCount > 0
                  ? 'text-rose-400 hover:text-rose-300'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              disabled={outOfRangeCount === 0}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Solo Alertas ({outOfRangeCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Entry Table Workspace */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-950/80 backdrop-blur-md text-slate-500 border-b border-white/5 font-black uppercase tracking-[0.2em] text-[9px]">
                <th className="px-6 py-5 w-16 text-center">
                  <input
                    type="checkbox"
                    checked={selectedResults.length === patientResults.length && patientResults.length > 0}
                    onChange={(e) => setSelectedResults(e.target.checked ? patientResults.map(r => r.id) : [])}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-5">Examen / Muestra</th>
                <th className="px-4 py-5 text-center">Resultado</th>
                <th className="px-4 py-5 text-center w-24">Unidad</th>
                <th className="px-4 py-5">Referencia (Catálogo Maestro)</th>
                <th className="px-4 py-5">Interpretación Clínica</th>
                <th className="px-4 py-5 text-center">Estado</th>
                <th className="px-4 py-5 text-right pr-8">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              <tr className="bg-teal-500/5">
                <td colSpan={8} className="px-6 py-2 text-[10px] font-black text-teal-400 uppercase tracking-[0.3em]">
                  MESA DE TRABAJO TÉCNICA ({displayedResults.length} Parámetros{filterOutOfRangeOnly ? ' • Filtrado Alertas Fuera de Rango' : ''})
                </td>
              </tr>

              {displayedResults.map(({ result: res, evaluation: evalResult }) => {
                const isEditingValue = editingId === res.id;
                const isEditingInterp = editingInterpId === res.id;
                const isSelected = selectedResults.includes(res.id);
                const isDesvalidado = res.status === 'DESVALIDADO';
                const isOut = evalResult.isOutOfRange;
                const flagClass = getFlagStyle(evalResult.flag, isOut);

                // Real-time evaluation during editing
                const tempEval = isEditingValue ? evaluateTestResult({ ...res, value: tempValue }, patient) : null;

                return (
                  <tr
                    key={res.id}
                    className={`group transition-all ${
                      isDesvalidado
                        ? 'bg-rose-950/20 border-l-4 border-l-rose-500'
                        : isOut
                        ? 'bg-rose-950/15 border-l-4 border-l-rose-500 hover:bg-rose-950/25'
                        : isSelected
                        ? 'bg-teal-500/10'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(res.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-black text-slate-200 flex items-center space-x-2">
                        <span className={isDesvalidado ? 'line-through text-slate-400 decoration-rose-500 decoration-2' : ''}>
                          {res.parameterName}
                        </span>
                        {isDesvalidado && (
                          <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black rounded uppercase tracking-wider animate-pulse inline-flex items-center space-x-1">
                            <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>REVOCADO</span>
                          </span>
                        )}
                        {isOut && !isDesvalidado && (
                          <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black rounded uppercase tracking-wider inline-flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>ALERTA LIS</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <Beaker className="w-3 h-3 text-teal-500/50" />
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{res.specimenType || 'SUERO'}</span>
                        </div>
                        <SampleIntegrityBadge
                          barcode={order.orderNumber}
                          tubeType={res.specimenType || 'SUERO_ROJO'}
                          phlebotomyTime={order.createdAt || new Date(Date.now() - 45 * 60 * 1000).toISOString()}
                          isCompact={true}
                          showModalOnClick={true}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditingValue ? (
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="text"
                              autoFocus
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  updateResult(res.id, tempValue);
                                  setEditingId(null);
                                  showToast(`Valor actualizado: ${tempValue} ${res.unit}`);
                                }
                              }}
                              className={`bg-slate-950 border rounded-lg px-3 py-1.5 text-sm font-mono w-28 text-center focus:outline-none ${
                                tempEval?.isOutOfRange
                                  ? 'border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/50'
                                  : 'border-teal-500/50 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                              }`}
                            />
                            <button
                              onClick={() => {
                                updateResult(res.id, tempValue);
                                setEditingId(null);
                                showToast(`Valor actualizado: ${tempValue} ${res.unit}`);
                              }}
                              className="p-1.5 bg-teal-500 text-slate-950 rounded-lg hover:bg-teal-400 transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {tempEval && (
                            <div className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                              tempEval.isOutOfRange
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {tempEval.isOutOfRange ? `⚠️ ${tempEval.alertDetail}` : `✓ En Rango (${tempEval.catalogRefRangeText})`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <button
                            onClick={() => { if(canDo('RESULT_ENTRY')) { setEditingId(res.id); setTempValue(res.value); } else { showToast('Acceso Denegado: No tienes permiso para editar resultados.'); } }}
                            className={`text-sm font-black font-mono px-4 py-1.5 rounded-xl border transition-all mx-auto block cursor-pointer ${
                              isDesvalidado
                                ? 'border-rose-500/40 bg-rose-950/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                                : isOut
                                ? 'border-rose-500/80 bg-rose-500/20 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/50 hover:bg-rose-500/30'
                                : `${flagClass}`
                            }`}
                          >
                            <span className={isDesvalidado ? 'line-through decoration-rose-500 decoration-2 opacity-90' : ''}>
                              {res.value}
                            </span>
                            {isDesvalidado && (
                              <span className="ml-1 text-[9px] text-rose-400 font-sans uppercase">(Desvalidado)</span>
                            )}
                          </button>

                          {/* Visual High/Low Cue Badge */}
                          {isOut && !isDesvalidado && (
                            <div className="mt-1.5 flex items-center justify-center">
                              {evalResult.flag === 'CRITICO_ALTO' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-600/30 text-rose-200 border border-rose-500 text-[10px] font-black animate-pulse shadow-sm">
                                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                                  <span>CRÍTICO ALTO</span>
                                </span>
                              ) : evalResult.flag === 'CRITICO_BAJO' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-600/30 text-rose-200 border border-rose-500 text-[10px] font-black animate-pulse shadow-sm">
                                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                                  <span>CRÍTICO BAJO</span>
                                </span>
                              ) : evalResult.flag === 'ALTO' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/60 text-[10px] font-black shadow-sm">
                                  <ArrowUp className="w-3 h-3 text-rose-400 stroke-[3]" />
                                  <span>ALTO</span>
                                </span>
                              ) : evalResult.flag === 'BAJO' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/60 text-[10px] font-black shadow-sm">
                                  <ArrowDown className="w-3 h-3 text-rose-400 stroke-[3]" />
                                  <span>BAJO</span>
                                </span>
                              ) : null}
                            </div>
                          )}

                          {isOut && !isDesvalidado && (
                            <span className="text-[9px] text-rose-400/90 font-mono mt-1 text-center font-semibold max-w-[140px] truncate" title={evalResult.alertDetail}>
                              {evalResult.alertDetail}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-center">{res.unit}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        <div className={`font-mono text-[11px] ${isOut ? 'text-rose-300 font-bold' : 'text-slate-400 italic'}`}>
                          {evalResult.catalogRefRangeText || res.refRangeText}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-slate-800/80 text-slate-500 border border-white/5">
                            Catálogo Maestro
                          </span>
                          {isOut && (
                            <span className="text-[9px] text-rose-400 font-bold">
                              {evalResult.flag === 'ALTO' ? '▲ Límite Excedido' : '▼ Límite Inferior'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-[250px]">
                      {isEditingInterp ? (
                        <textarea
                          autoFocus
                          value={tempInterp}
                          onChange={(e) => setTempInterp(e.target.value)}
                          onBlur={() => {
                            updateInterpretation(res.id, tempInterp);
                            setEditingInterpId(null);
                          }}
                          className="w-full bg-slate-950 border border-teal-500/50 rounded-xl p-2 text-[10px] text-slate-200 focus:outline-none h-12 resize-none shadow-[0_0_10px_rgba(20,184,166,0.1)]"
                        />
                      ) : (
                        <div
                          onClick={() => { setEditingInterpId(res.id); setTempInterp(res.interpretation || ''); }}
                          className="text-[10px] text-slate-500 italic hover:text-teal-400 transition-colors cursor-pointer line-clamp-2 bg-white/5 p-2 rounded-xl border border-transparent hover:border-white/5"
                        >
                          {res.interpretation || 'Añadir observación técnica...'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border inline-flex items-center space-x-1 ${
                        res.status === 'VALIDADO_TEC'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isDesvalidado
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                          : isOut
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {isDesvalidado && <XCircle className="w-3 h-3 text-rose-400 shrink-0" />}
                        <span>{isDesvalidado ? 'DESVALIDADO' : res.status.split('_')[0]}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right pr-8">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTrendResultId(res.id);
                            setShowTrendWidget(true);
                          }}
                          title="Ver Tendencia de Resultados (Delta Check)"
                          className="p-2 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg hover:bg-teal-500/20 transition-all cursor-pointer"
                        >
                          <TrendingUp className="w-4 h-4 text-teal-400" />
                        </button>
                        {canDo('RESULT_HISTORY_VIEW') && (
                          <button
                            onClick={() => {
                              setSelectedAuditId(res.id);
                              setShowAuditSidebar(true);
                            }}
                            title="Bitácora de Trazabilidad ISO 15189"
                            className="p-2 bg-slate-800 rounded-lg hover:text-amber-400 transition-all cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        {res.status === 'VALIDADO_TEC' ? (
                          canDo('RESULT_UNVALIDATE') && (
                            <button
                              onClick={() => {
                                const reason = prompt('Ingrese motivo obligatorio de desvalidación (ISO 15189):');
                                if (reason) {
                                  unvalidateResult(res.id, reason);
                                  showToast(`↺ Parámetro ${res.parameterName} marcado como DESVALIDADO.`);
                                }
                              }}
                              title="Desvalidar Individual"
                              className="p-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg transition-all cursor-pointer"
                            >
                              <XCircle className="w-4 h-4 text-rose-400" />
                            </button>
                          )
                        ) : isDesvalidado ? (
                          canDo('RESULT_VALIDATE_TECH') && (
                            <button
                              onClick={() => {
                                validateResult(res.id, currentUser?.name || 'Sistema');
                                showToast(`✓ Parámetro ${res.parameterName} re-validado.`);
                              }}
                              title="Re-validar Parámetro"
                              className="p-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4 text-emerald-400" />
                            </button>
                          )
                        ) : (
                          canDo('RESULT_VALIDATE_TECH') && (
                            <button
                              onClick={() => {
                                validateResult(res.id, currentUser?.name || 'Sistema');
                                showToast(`✓ Parámetro ${res.parameterName} validado técnicamente.`);
                              }}
                              title="Validación Técnica Individual"
                              className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => onOpenPdf(order.id)}
                          title="Vista Previa Reporte PDF"
                          className="p-2 bg-slate-800 rounded-lg hover:text-sky-400 transition-all cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* 3. Global Floating Action Bar (Interactive Buttons) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-[#020617]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-6 py-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-[100] gap-4 sm:gap-6 border-b-4 border-b-teal-500/30">
        {[
          {
            icon: Save,
            label: 'Guardar',
            color: 'bg-emerald-500',
            text: 'text-slate-950',
            action: handleSave
          },
          {
            icon: Plus,
            label: '+ Pruebas',
            color: 'bg-teal-500',
            text: 'text-slate-950',
            action: () => setActiveModal('ADD_TESTS')
          },
          {
            icon: RotateCcw,
            label: 'Retorno',
            color: 'bg-indigo-500/90',
            text: 'text-white',
            action: () => {
              setReworkTests(selectedResults);
              setActiveModal('REWORK');
            }
          },
          {
            icon: Trash2,
            label: 'Rechazo',
            color: 'bg-rose-500',
            text: 'text-white',
            action: () => setActiveModal('REJECT')
          },
          {
            icon: MessageSquare,
            label: 'Notas',
            color: 'bg-blue-400',
            text: 'text-slate-950',
            action: () => setActiveModal('NOTES')
          },
          {
            icon: Paperclip,
            label: 'Adjuntos',
            color: 'bg-cyan-500',
            text: 'text-slate-950',
            action: () => setActiveModal('ATTACHMENTS')
          },
          {
            icon: TrendingUp,
            label: 'Tendencia',
            color: 'bg-teal-400',
            text: 'text-slate-950',
            action: () => setShowTrendWidget(prev => !prev)
          },
          {
            icon: CheckCircle2,
            label: 'Validar',
            color: 'bg-emerald-400',
            text: 'text-slate-950',
            action: handleBulkValidate
          },
          {
            icon: XCircle,
            label: 'Desvalidar',
            color: 'bg-amber-400',
            text: 'text-slate-950',
            action: handleBulkUnvalidate
          },
          {
            icon: Printer,
            label: 'Imprimir',
            color: 'bg-slate-700',
            text: 'text-white',
            action: () => onOpenPdf(order.id)
          },
          {
            icon: Barcode,
            label: 'Etiquetas',
            color: 'bg-slate-200',
            text: 'text-slate-950',
            action: () => setActiveModal('LABELS')
          },
          {
            icon: MessageSquare,
            label: 'Inter-Sedes',
            color: 'bg-gradient-to-r from-indigo-500 to-blue-600',
            text: 'text-white font-bold',
            action: () => setShowChatWidget(prev => !prev)
          }
        ].filter(btn => {
          if (btn.label === 'Validar') return canDo('RESULT_VALIDATE_TECH');
          if (btn.label === 'Desvalidar') return canDo('RESULT_UNVALIDATE');
          if (btn.label === 'Rechazo') return canDo('ORDER_CANCEL');
          if (btn.label === '+ Pruebas') return canDo('ORDER_CREATE');
          if (btn.label === 'Guardar') return canDo('RESULT_ENTRY');
          return true;
        }).map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className="flex flex-col items-center group transition-all cursor-pointer"
          >
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${btn.color} ${btn.text} flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 ring-4 ring-slate-900 group-hover:ring-white/20`}>
              <btn.icon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mt-2.5 group-hover:text-teal-400 transition-colors whitespace-nowrap">
              {btn.label}
            </span>
          </button>
        ))}
      </div>

      {/* MODAL 1: ADD TESTS */}
      {activeModal === 'ADD_TESTS' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-teal-400">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Agregar Pruebas a la Orden #{order.orderNumber}</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Seleccione pruebas del catálogo institucional para incluirlas inmediatamente en la mesa de trabajo:
            </p>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nombre o código de examen..."
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[
                { code: 'GLU', name: 'Glucosa en Ayunas', category: 'QUÍMICA', tube: 'SUERO ROJO' },
                { code: 'LIP', name: 'Perfil Lipídico Completo (Col, Trig, HDL, LDL)', category: 'QUÍMICA', tube: 'SUERO ROJO' },
                { code: 'TROP', name: 'Troponina I Alta Sensibilidad', category: 'CARDIOLOGÍA', tube: 'HEPARINA VERDE' },
                { code: 'TSH', name: 'Hormona Estimulante de Tiroides (TSH)', category: 'INMUNOLOGÍA', tube: 'SUERO ROJO' },
                { code: 'PCR', name: 'Proteína C Reactiva Ultra Sensible', category: 'INMUNOLOGÍA', tube: 'SUERO ROJO' },
                { code: 'ELECT', name: 'Electrólitos Séricos (Na, K, Cl)', category: 'QUÍMICA', tube: 'SUERO ROJO' },
                { code: 'TPT', name: 'Tiempo de Tromboplastina (TPT)', category: 'COAGULACIÓN', tube: 'CITRATO AZUL' }
              ]
                .filter(t => t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) || t.code.toLowerCase().includes(testSearchQuery.toLowerCase()))
                .map((test) => {
                  const isChecked = selectedCatalogTests.includes(test.code);
                  return (
                    <div
                      key={test.code}
                      onClick={() => {
                        setSelectedCatalogTests(prev =>
                          prev.includes(test.code) ? prev.filter(c => c !== test.code) : [...prev, test.code]
                        );
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isChecked ? 'bg-teal-500/10 border-teal-500/50' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-white flex items-center gap-2">
                          <span>{test.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-teal-400 font-mono text-[9px] rounded font-bold">{test.code}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {test.category} • Tubo: {test.tube}
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${isChecked ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-slate-700'}`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAddTests}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                Agregar {selectedCatalogTests.length} Pruebas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REWORK / RETORNO */}
      {activeModal === 'REWORK' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Retorno / Repetición Técnica</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Esta acción retornará las pruebas seleccionadas a estado <strong className="text-indigo-400">EN_PROCESO</strong> para su re-análisis o confirmación por duplicado:
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300">Motivo de Repetición / Retorno:</label>
              <select
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Verificación de valor crítico fuera de rango">Verificación de valor crítico fuera de rango</option>
                <option value="Confirmación técnica por duplicado (Control QC)">Confirmación técnica por duplicado (Control QC)</option>
                <option value="Interferencia por suero lipémico / ictérico">Interferencia por suero lipémico / ictérico</option>
                <option value="Calibración / Recalibración del analizador">Calibración / Recalibración del analizador</option>
                <option value="Solicitud directa de Bioquímico / Jefe de Lab">Solicitud directa de Bioquímico / Jefe de Lab</option>
              </select>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-[11px] text-indigo-200">
              Se enviará una orden de re-procesamiento a la cola del Middleware ASTM para re-corrida automática.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRework}
                className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Confirmar Repetición
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECTION / RECHAZO CON WIZARD Y WHATSAPP */}
      {activeModal === 'REJECT' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <RejectedSampleWizard
              embeddedMode={true}
              initialBarcode={order.specimenId || `BAR-${order.orderNumber}`}
              onComplete={() => {
                showToast(`Muestra #${order.specimenId || order.orderNumber} rechazada. Notificaciones enviadas a Recepción y Paciente vía WhatsApp.`);
                setActiveModal('NONE');
              }}
              onClose={() => setActiveModal('NONE')}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: CLINICAL NOTES */}
      {activeModal === 'NOTES' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-blue-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Bitácora de Notas e Observaciones</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notesList.map((n) => (
                <div key={n.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-blue-400">{n.author}</span>
                    <span className="text-slate-500 font-mono">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-200">{n.text}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escriba una observación técnica..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-500 text-slate-950 font-black rounded-xl text-xs hover:bg-blue-400 transition cursor-pointer flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ATTACHMENTS */}
      {activeModal === 'ATTACHMENTS' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Paperclip className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Documentos Adjuntos & Trazas</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-2">
              {attachmentsList.map((att) => (
                <div key={att.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-bold text-xs text-white">{att.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{att.size} • {att.date}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Descargando ${att.name}...`)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSimulateUpload}
              className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500 p-4 rounded-2xl text-center text-xs text-slate-400 hover:text-cyan-300 transition cursor-pointer flex flex-col items-center justify-center space-y-1"
            >
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>Adjuntar nuevo archivo (PDF, Imagen, Traza ASTM)</span>
            </button>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: BARCODE LABELS */}
      {activeModal === 'LABELS' && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-200">
                <Barcode className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-white">Impresión de Etiquetas ZEBRA / TSC</h3>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            {/* Live Thermal Label Preview */}
            <div className="bg-white text-slate-950 rounded-2xl p-4 shadow-xl border-2 border-slate-300 space-y-2 font-sans relative overflow-hidden">
              <div className="flex justify-between items-start border-b border-slate-300 pb-1.5">
                <div>
                  <div className="font-black text-xs uppercase tracking-tight">{patient.firstName} {patient.lastName}</div>
                  <div className="text-[10px] font-mono font-bold text-slate-700">CÉDULA: {patient.nationalId}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-xs text-teal-800">{order.orderNumber}</div>
                  <div className="text-[9px] font-bold text-slate-600">SEDE CENTRAL</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800">
                  SANGRE TOTAL (EDTA MORADO)
                </span>
                <span className="text-[9px] font-mono text-slate-500">11/08/2026 21:38</span>
              </div>

              {/* Graphic Barcode rendering */}
              <div className="pt-2 text-center space-y-1">
                <div className="h-10 bg-slate-950 rounded flex items-center justify-center p-1 space-x-1">
                  {/* Simulated barcode lines */}
                  {Array.from({ length: 38 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-full bg-white ${
                        idx % 3 === 0 ? 'w-1.5' : idx % 2 === 0 ? 'w-1' : 'w-0.5'
                      }`}
                    />
                  ))}
                </div>
                <div className="font-mono text-[10px] font-bold tracking-widest text-slate-900">
                  *BC-{order.orderNumber.replace(/[^0-9]/g, '')}*
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Cantidad de Copias:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLabelQuantity(Math.max(1, labelQuantity - 1))}
                  className="w-7 h-7 bg-slate-800 rounded-lg text-white font-black hover:bg-slate-700 cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-white text-sm w-6 text-center">{labelQuantity}</span>
                <button
                  onClick={() => setLabelQuantity(labelQuantity + 1)}
                  className="w-7 h-7 bg-slate-800 rounded-lg text-white font-black hover:bg-slate-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handlePrintLabels}
                disabled={isPrintingLabel}
                className="px-5 py-2 bg-slate-200 hover:bg-white text-slate-950 font-black rounded-xl text-xs shadow-lg transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                <Printer className={`w-4 h-4 ${isPrintingLabel ? 'animate-bounce' : ''}`} />
                <span>{isPrintingLabel ? 'Imprimiendo...' : 'Imprimir Etiquetas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Clinical Traceability Sidebar (ISO 15189 Audit Trail) */}
      {showAuditSidebar && selectedAuditId && (
        <>
          <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2px] z-[120]" onClick={() => setShowAuditSidebar(false)}></div>
          <div className="fixed top-0 right-0 h-full w-[400px] bg-slate-900 border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-[130] p-8 space-y-8 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Bitácora Auditoría ISO 15189</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase italic">Historial de Analito</h3>
              </div>
              <button onClick={() => setShowAuditSidebar(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
            </div>

            {(() => {
              const res = results.find(r => r.id === selectedAuditId);
              if (!res) return null;
              return (
                <div className="space-y-6">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Parámetro Seleccionado</div>
                    <div className="text-sm font-black text-white">{res.parameterName}</div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-2xl font-mono font-black text-teal-400">{res.value}</span>
                      <span className="text-xs text-slate-500 font-mono">{res.unit}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-slate-400 font-bold">V{res.version}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Línea de Tiempo de Versiones</span>
                    </div>

                    <div className="relative pl-6 space-y-8 border-l border-white/10 ml-2 pt-2">
                      {res.history?.slice().reverse().map((entry, idx) => (
                        <div key={entry.id} className="relative">
                          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 shadow-xl ${
                            entry.action === 'CREACION' ? 'bg-teal-500 shadow-teal-500/20' :
                            entry.action === 'EDICION' ? 'bg-amber-500 shadow-amber-500/20' :
                            entry.action === 'VALIDACION_TEC' ? 'bg-emerald-500 shadow-emerald-500/20' :
                            'bg-rose-500 shadow-rose-500/20'
                          }`}></div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-white uppercase tracking-tight">{entry.action}</span>
                              <span className="text-[9px] text-slate-500 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-teal-400">
                                  {entry.author.charAt(0)}
                                </div>
                                <span className="text-[11px] font-bold text-slate-300">{entry.author}</span>
                              </div>

                              {entry.previousValue && (
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <div className="p-2 bg-rose-500/5 rounded-lg border border-rose-500/10">
                                    <div className="text-[8px] text-rose-500 uppercase font-bold">Anterior</div>
                                    <div className="text-xs font-mono font-bold text-slate-500">{entry.previousValue}</div>
                                  </div>
                                  <div className="p-2 bg-teal-500/5 rounded-lg border border-teal-500/10">
                                    <div className="text-[8px] text-teal-500 uppercase font-bold">Nuevo</div>
                                    <div className="text-xs font-mono font-bold text-white">{entry.newValue}</div>
                                  </div>
                                </div>
                              )}

                              {entry.reason && (entry.action === 'DESVALIDACION' || entry.action === 'EDICION') && (
                                <div className="text-[10px] text-amber-400 italic bg-amber-400/5 p-2 rounded-lg border border-amber-400/10">
                                  Motivo: {entry.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* SECURE INTERNAL MESSAGING WIDGET OVERLAY */}
      {showChatWidget && (
        <SecureInternalMessagingWidget
          initialOpen={true}
          activeSampleContext={{
            barcode: order.specimenId || `BAR-${order.orderNumber}`,
            orderNumber: order.orderNumber,
            patientName: `${patient.firstName} ${patient.lastName}`,
            testName: patientResults[0]?.testName || 'Consulta de Resultado',
            value: patientResults[0]?.value,
            status: 'DUDOSA'
          }}
          onClose={() => setShowChatWidget(false)}
        />
      )}

    </div>
  );
};
