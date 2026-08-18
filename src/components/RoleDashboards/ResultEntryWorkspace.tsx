import React, { useState, useEffect, useMemo } from 'react';
import { Order, TestResult, Patient, Analyzer } from '../../types';
import { MOCK_TEST_CATALOG, MOCK_TEST_PACKAGES, MOCK_WESTGARD_QC } from '../../data/mockData';
import { ResultTrendWidget } from './ResultTrendWidget';
import { WestgardQC } from '../WestgardQC';
import { CriticalValueRegistry } from '../Phase3Suite/CriticalValueRegistry';
import {
  User, FileText, CheckCircle2, AlertTriangle, ShieldCheck,
  Printer, RotateCcw, Save, Trash2, Plus, Info, Lock,
  History, MessageSquare, Paperclip, Barcode, ChevronRight, Search, X,
  Microscope, Beaker, Mic, MicOff, Zap, Timer, Check, Layers, ArrowRight,
  TrendingUp, Activity, UserCheck, UserCircle, Fingerprint, RefreshCw,
  FileCode, Smartphone, PhoneCall, Disc, Sliders, Calculator, Cpu, PencilLine
} from 'lucide-react';

interface ResultEntryWorkspaceProps {
  order: Order;
  patient: Patient;
  results: TestResult[];
  analyzers: Analyzer[];
  onUpdateResultValue: (resultId: string, newValue: string, resultData?: TestResult) => void;
  onUpdateInterpretation: (resultId: string, interpretation: string) => void;
  onUpdateResultStatus: (resultId: string, status: TestResult['status']) => void;
  onOpenPdf: (orderId: string) => void;
  onConsultInterBranch?: (order: Order, patient: Patient, testName: string) => void;
  onUpdateOrderTests?: (orderId: string, testIds: string[]) => void;
  allOrders?: Order[];
  allPatients?: Patient[];
}

export const ResultEntryWorkspace: React.FC<ResultEntryWorkspaceProps> = ({
  order: initialOrder,
  patient: initialPatient,
  results,
  analyzers,
  onUpdateResultValue,
  onUpdateInterpretation,
  onUpdateResultStatus,
  onOpenPdf,
  onConsultInterBranch,
  onUpdateOrderTests,
  allOrders = [],
  allPatients = []
}) => {
  const [activeOrderId, setActiveOrderId] = useState<string>(initialOrder.id);
  const currentOrder = allOrders.find(o => o.id === activeOrderId) || initialOrder;
  const currentPatient = allPatients.find(p => p.id === currentOrder.patientId) || initialPatient;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [editingInterpId, setEditingInterpId] = useState<string | null>(null);
  const [tempInterp, setTempInterp] = useState<string>('');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<string | null>(null);

  // DICCIONARIO DE RESULTADOS RÁPIDOS (Agiliza pruebas manuales como Heces/Orina)
  const QUICK_RESULTS: Record<string, string[]> = {
    'test-heces': ['Normal', 'Blanda', 'Líquida', 'Pastosa', 'Café', 'Amarilla', 'Verde', 'No se observan parásitos', 'Presencia de moco', 'Sangre oculta (+)'],
    // Resultados por Analito de Orina
    'p-uri-color': ['Amarillo', 'Ámbar', 'Rojizo', 'Incoloro'],
    'p-uri-aspecto': ['Claro', 'Ligeramente Turbio', 'Turbio'],
    'p-uri-glucosa': ['Negativo', '100 mg/dL', '250 mg/dL', '500 mg/dL'],
    'p-uri-proteinas': ['Negativo', 'Trazas', '30 mg/dL', '100 mg/dL'],
    'p-uri-sangre': ['Negativo', 'Trazas', '(+)', '(++)', '(+++)'],
    'test-vdrl': ['No Reactivo', 'Reactivo (1:2)', 'Reactivo (1:4)', 'Reactivo (1:8)', 'Reactivo (1:16)'],
    'test-hiv': ['No Reactivo', 'Reactivo'],
    'global_technical': ['SIN REACTIVO', 'MUESTRA INSUFICIENTE', 'ERROR EQUIPO', 'REPETIR']
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // MAPEO DE COLORES POR ÁREA TÉCNICA
  const AREA_COLORS: Record<string, { text: string, bg: string, dot: string, border: string }> = {
    'HEMATOLOGIA': { text: 'text-blue-400', bg: 'bg-blue-500/5', dot: 'bg-blue-500', border: 'border-blue-500/20' },
    'QUIMICA': { text: 'text-teal-400', bg: 'bg-teal-500/5', dot: 'bg-teal-500', border: 'border-teal-500/20' },
    'INMUNOLOGIA': { text: 'text-indigo-400', bg: 'bg-indigo-500/5', dot: 'bg-indigo-500', border: 'border-indigo-500/20' },
    'URINALISIS': { text: 'text-amber-400', bg: 'bg-amber-500/5', dot: 'bg-amber-500', border: 'border-amber-500/20' },
    'COAGULACION': { text: 'text-cyan-400', bg: 'bg-cyan-500/5', dot: 'bg-cyan-500', border: 'border-cyan-500/20' },
    'OTROS': { text: 'text-slate-400', bg: 'bg-slate-500/5', dot: 'bg-slate-500', border: 'border-slate-500/20' }
  };

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'tests' | 'packages'>('tests');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [traySearchTerm, setTraySearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Estados para nuevas funciones configuradas al 100%
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  const [isDilutionModalOpen, setIsDilutionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [dilutionFactor, setDilutionFactor] = useState('1');

  // Lógica de sincronización profesional - Instantánea Histórica (Snapshot)
  const patientResults = useMemo(() => {
    // 1. Resolver los IDs de pruebas esperados desde la instantánea de la orden
    const allExpectedTestIds = currentOrder.expandedTestIds || [];

    // 2. Filtrar resultados globales que pertenecen a esta orden
    const existingResults = results.filter(r => r.orderId === currentOrder.id);

    // 3. Generar la lista completa de ANALITOS esperados (Explosión de Perfiles/Tests)
    const allExpectedAnalytes: TestResult[] = [];

    allExpectedTestIds.forEach(tId => {
      const catalogItem = MOCK_TEST_CATALOG.find(c => c.id === tId);

      if (catalogItem && catalogItem.parameters.length > 0) {
        // EXPLOSIÓN: Crear una fila por cada parámetro del catálogo
        catalogItem.parameters.forEach(param => {
          const existingRes = existingResults.find(r => r.parameterId === param.id);

          if (existingRes) {
            allExpectedAnalytes.push(existingRes);
          } else {
            // Placeholder para el analito
            allExpectedAnalytes.push({
              id: `temp-${param.id}-${currentOrder.id}`,
              tenantId: currentOrder.tenantId,
              orderId: currentOrder.id,
              testId: tId,
              parameterId: param.id,
              parameterCode: param.code || catalogItem.code,
              parameterName: param.name,
              value: '---',
              unit: param.unit,
              status: 'INGRESADO',
              specimenType: catalogItem.specimenType,
              refRangeText: 'Pendiente',
              createdAt: new Date().toISOString()
            });
          }
        });
      } else if (catalogItem) {
        // Caso simple: El test es el mismo parámetro (ej: Glucosa)
        const existingRes = existingResults.find(r => r.testId === tId);
        if (existingRes) {
          allExpectedAnalytes.push(existingRes);
        } else {
          allExpectedAnalytes.push({
            id: `temp-${tId}-${currentOrder.id}`,
            orderId: currentOrder.id,
            testId: tId,
            parameterId: tId,
            parameterCode: catalogItem.code,
            parameterName: catalogItem.name,
            value: '---',
            unit: catalogItem.category === 'HEMATOLOGIA' ? 'x10³/µL' : 'mg/dL',
            status: 'INGRESADO',
            specimenType: catalogItem.specimenType,
            refRangeText: 'Pendiente',
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    // 4. Agregar resultados inesperados (Hallazgos del Middleware)
    const unexpectedResults = existingResults.filter(r =>
      !allExpectedAnalytes.some(a => a.parameterId === r.parameterId)
    );

    return [...allExpectedAnalytes, ...unexpectedResults];
  }, [currentOrder.id, currentOrder.expandedTestIds, results]);

  const triggerAutoSave = (resId: string, type: 'value' | 'interp', content: string) => {
    setSaveStatus('saving');
    if (type === 'value') onUpdateResultValue(resId, content);
    else onUpdateInterpretation(resId, content);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const matchesSearch = !traySearchTerm ||
        o.orderNumber.toLowerCase().includes(traySearchTerm.toLowerCase()) ||
        o.patientName.toLowerCase().includes(traySearchTerm.toLowerCase()) ||
        o.patientNationalId.includes(traySearchTerm);

      const matchesDate = !dateFilter || o.createdAt.startsWith(dateFilter);

      // Si no hay búsqueda ni filtro de fecha, solo mostrar pendientes
      if (!traySearchTerm && !dateFilter) {
        return o.status !== 'VALIDADA_MED' && o.status !== 'COMPLETADA';
      }

      return matchesSearch && matchesDate;
    });
  }, [allOrders, traySearchTerm, dateFilter]);

  // Ayudante para contar resultados realmente pendientes usando la instantánea expandida
  const getPendingCount = (order: Order) => {
    const orderResults = results.filter(r => r.orderId === order.id);
    const validatedCount = orderResults.filter(r => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED').length;
    // Lógica Profesional: Pendientes = Total de Pruebas en el Snapshot - Resultados Validados
    return Math.max(0, (order.expandedTestIds?.length || 0) - validatedCount);
  };

  // Keyboard Navigation Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if user is typing in a value or interpretation field
      if (editingId || editingInterpId) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = filteredOrders.findIndex(o => o.id === activeOrderId);
        let nextIndex = currentIndex;

        if (e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % filteredOrders.length;
        } else {
          nextIndex = (currentIndex - 1 + filteredOrders.length) % filteredOrders.length;
        }

        if (filteredOrders[nextIndex]) {
          setActiveOrderId(filteredOrders[nextIndex].id);
        }
      }

      // F10 for Global Validation
      if (e.key === 'F10') {
        e.preventDefault();
        handleBulkValidate();
      }

      // Ctrl + Enter to Save and go to next (if editing)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (editingId) {
          onUpdateResultValue(editingId, tempValue);
          setEditingId(null);
        } else if (editingInterpId) {
          onUpdateInterpretation(editingInterpId, tempInterp);
          setEditingInterpId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOrderId, filteredOrders, editingId, editingInterpId, selectedResults]);

  const startVoiceDictation = (resId: string) => {
    setIsListening(resId);
    setTimeout(() => {
      onUpdateInterpretation(resId, (results.find(r => r.id === resId)?.interpretation || '') + ' [Dictado: Valores normales según clínica.]');
      setIsListening(null);
    }, 2000);
  };

  const getDeltaCheck = (currentRes: TestResult) => {
    const allPatientResults = results.filter(r =>
      r.parameterId === currentRes.parameterId &&
      r.orderId !== currentRes.orderId &&
      r.status === 'VALIDADO_MED'
    );
    if (allPatientResults.length === 0) return null;
    const lastRes = allPatientResults[0];
    const diff = Math.abs((currentRes.numericValue || 0) - (lastRes.numericValue || 0));
    const percentChange = lastRes.numericValue ? (diff / lastRes.numericValue) * 100 : 0;
    if (percentChange > 20) {
      return { previousValue: lastRes.value, change: percentChange.toFixed(1), isSignificant: true };
    }
    return null;
  };

  const getFlagStyle = (flag?: string) => {
    if (flag?.includes('CRITICO')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-black';
    if (flag === 'ALTO' || flag === 'BAJO') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'text-slate-300';
  };

  const toggleSelect = (id: string) => {
    setSelectedResults(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkValidate = () => {
    if (selectedResults.length === 0) return;
    selectedResults.forEach(id => onUpdateResultStatus(id, 'VALIDADO_TEC'));
    setSelectedResults([]);
  };

  const handleBulkUnvalidate = () => {
    if (selectedResults.length === 0) return;
    selectedResults.forEach(id => onUpdateResultStatus(id, 'INGRESADO'));
    setSelectedResults([]);
  };

  const handleBulkNoReagent = () => {
    if (selectedResults.length === 0) return;
    selectedResults.forEach(id => {
      onUpdateResultValue(id, 'SIN REACTIVO');
      onUpdateInterpretation(id, 'Prueba no realizada por falta de reactivo en laboratorio.');
    });
    setSelectedResults([]);
  };

  const handleBulkReject = () => {
    if (selectedResults.length === 0) return;
    selectedResults.forEach(id => {
      onUpdateResultValue(id, 'MUESTRA RECHAZADA');
      onUpdateInterpretation(id, 'Muestra rechazada por criterios técnicos (Hemólisis/Lipemia/Volumen Insuficiente).');
    });
    setSelectedResults([]);
  };

  const handleWhatsAppNotify = () => {
    const message = `Hola ${currentPatient.firstName}, su orden ${currentOrder.orderNumber} en ${currentOrder.tenantId} está siendo procesada. Le notificaremos apenas los resultados estén validados.`;
    window.open(`https://wa.me/${currentPatient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const applyDilution = () => {
    if (selectedResults.length === 0) return;
    const factor = parseFloat(dilutionFactor);
    selectedResults.forEach(id => {
      const res = results.find(r => r.id === id);
      if (res && res.numericValue) {
        const newValue = (res.numericValue * factor).toString();
        // Incluimos el dilutionFactor en el objeto enviado para persistencia visual
        onUpdateResultValue(id, newValue, {
          ...res,
          value: newValue,
          numericValue: parseFloat(newValue),
          dilutionFactor: factor,
          interpretation: `Resultado calculado con factor de dilución 1:${factor}. Valor original: ${res.value}`
        });
      }
    });
    setIsDilutionModalOpen(false);
    setSelectedResults([]);
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'VALIDADO_TEC':
        return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Validado</span>;
      case 'PRELIMINAR':
        return <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Preliminar</span>;
      case 'VALIDADO_MED':
        return <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Medico</span>;
      default:
        return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Ingresado</span>;
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#020617] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">

      {/* 1. SIDEBAR: PENDING TRAY */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-slate-950/50 border-r border-white/5 flex flex-col transition-all duration-500`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           {!sidebarCollapsed && <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Layers className="w-4 h-4 mr-2 text-teal-500" /> Bandeja</h3>}
           <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              {sidebarCollapsed ? <ArrowRight className="w-4 h-4 text-teal-400" /> : <ChevronRight className="w-4 h-4 text-slate-500 rotate-180" />}
           </button>
        </div>

        {/* Tray Filters (Search & Date) */}
        {!sidebarCollapsed && (
          <div className="p-4 space-y-3 border-b border-white/5 bg-slate-950/30">
            <div className="relative group">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-teal-400 transition-colors" />
              <input
                type="text"
                placeholder="Cédula, Orden o Nombre..."
                value={traySearchTerm}
                onChange={(e) => setTraySearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] text-white placeholder:text-slate-700 outline-none focus:border-teal-500/50 transition-all font-bold"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative group/date">
                <input
                  type="date"
                  value={dateFilter}
                  onClick={(e) => (e.target as any).showPicker?.()}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-slate-400 outline-none focus:border-teal-500/50 transition-all font-mono cursor-pointer [color-scheme:dark]"
                />
              </div>
              {(traySearchTerm || dateFilter) && (
                <button
                  onClick={() => { setTraySearchTerm(''); setDateFilter(''); }}
                  className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
           {filteredOrders.map(o => {
             const isActive = activeOrderId === o.id;
             const isStat = o.priority === 'STAT';

             return (
               <button
                key={o.id}
                onClick={() => setActiveOrderId(o.id)}
                className={`w-full text-left rounded-2xl border transition-all relative overflow-hidden group
                  ${sidebarCollapsed ? 'p-2 flex flex-col items-center justify-center h-20' : 'p-4'}
                  ${isActive
                    ? 'bg-teal-500 border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                    : isStat
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                  }`}
               >
                  {sidebarCollapsed ? (
                    <div className="flex flex-col items-center space-y-2 w-full">
                       <span className={`font-mono text-[8px] font-black text-center break-all leading-tight ${isActive ? 'text-slate-950' : isStat ? 'text-rose-400' : 'text-teal-400'}`}>
                         {o.orderNumber.split('-').slice(-1)}
                       </span>
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-lg transition-all duration-300
                        ${isActive ? 'bg-slate-950 text-teal-400' : isStat ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                        {o.patientName.charAt(0)}
                      </div>
                      {isStat && (
                        <div className="absolute top-1 right-1">
                          <Zap className="w-2.5 h-2.5 text-rose-500 animate-pulse fill-current" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                       <div className="flex items-center justify-between mb-1">
                          <div className="flex flex-col">
                            <span className={`font-mono text-[9px] font-black ${isActive ? 'text-slate-950' : isStat ? 'text-rose-400' : 'text-teal-400'}`}>{o.orderNumber}</span>
                            <span className={`text-[8px] font-bold uppercase ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                              {new Date(o.createdAt).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {isStat && (
                            <div className="flex items-center space-x-1 bg-rose-500 text-white px-1.5 py-0.5 rounded-md animate-pulse">
                              <Zap className="w-2.5 h-2.5 fill-current" />
                              <span className="text-[7px] font-black uppercase">Urgente</span>
                            </div>
                          )}
                       </div>
                       <div className={`text-xs font-black uppercase truncate ${isActive ? 'text-slate-950' : 'text-white'}`}>{o.patientName}</div>
                       <div className={`text-[9px] font-bold mt-1 ${isActive ? 'text-slate-800' : isStat ? 'text-rose-300/70' : 'text-slate-500'}`}>{getPendingCount(o)} Análisis Pendientes</div>
                    </div>
                  )}
                  {isActive && !sidebarCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-white rounded-r-full shadow-[4px_0_15px_rgba(255,255,255,0.3)]"></div>}
               </button>
             );
           })}
           {filteredOrders.length === 0 && (
             <div className="py-12 text-center">
                <Search className="w-6 h-6 text-slate-800 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">No se encontraron órdenes<br/>con esos criterios</p>
             </div>
           )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header: Patient Context - Compacted */}
        <div className="px-6 py-2 bg-slate-950/40 border-b border-white/5 flex items-center justify-between shrink-0">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner shrink-0 relative">
                 <UserCircle className="w-6 h-6" />
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 border-2 border-slate-950">
                    <Check className="w-3 h-3 stroke-[4]" />
                 </div>
              </div>
              <div>
                 <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{currentPatient.firstName} {currentPatient.lastName}</h2>
                    <span className="px-2 py-0.5 bg-slate-900 rounded-lg text-[9px] font-black text-slate-500 border border-white/5 uppercase tracking-widest leading-none">{currentOrder.orderNumber}</span>
                 </div>
                 <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-1 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                       <Fingerprint className="w-3 h-3 text-teal-500" />
                       <span>{currentPatient.nationalId}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">{currentOrder.patientAge} AÑOS • {currentPatient.gender === 'F' ? 'FEMENINO' : 'MASCULINO'}</div>
                    <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                    <div className="flex items-center space-x-1.5 text-[10px] font-black text-amber-500 uppercase">
                       <Activity className="w-3 h-3" />
                       <span>{currentOrder.doctorName || 'PARTICULAR'}</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex items-center space-x-4">
              <div className="text-right flex items-center space-x-4">
                 {saveStatus !== 'idle' && (
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border animate-in fade-in zoom-in-95 duration-300 ${saveStatus === 'saving' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'}`}>
                       {saveStatus === 'saving' ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                       ) : (
                          <Disc className="w-3.5 h-3.5 animate-pulse fill-emerald-500" />
                       )}
                       <span className="text-[9px] font-black uppercase tracking-widest">{saveStatus === 'saving' ? 'Sincronizando...' : 'Auto-Guardado OK'}</span>
                    </div>
                 )}
                 <div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ESTADO PROCESO</div>
                    <div className="text-[10px] font-black text-emerald-500 uppercase mt-0.5 flex items-center justify-end">
                       <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> ANÁLISIS EN TIEMPO REAL
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Table Body - Maximized Height */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2">
           <div className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                 <thead>
                    <tr className="bg-slate-950/80 text-slate-500 border-b border-white/5 font-black uppercase tracking-[0.2em] text-[8px]">
                       <th className="px-4 py-2 w-12 text-center">
                          <input
                            type="checkbox"
                            onChange={(e) => setSelectedResults(e.target.checked ? patientResults.map(r => r.id) : [])}
                            className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-0"
                          />
                       </th>
                       <th className="px-4 py-2">ANÁLISIS / MUESTRA</th>
                       <th className="px-4 py-2 text-center">RESULTADO</th>
                       <th className="px-4 py-2 text-center w-20">UNIDAD</th>
                       <th className="px-4 py-2">RANGO REFERENCIA</th>
                       <th className="px-4 py-2">INTERPRETACIÓN CLÍNICA</th>
                       <th className="px-4 py-2 text-center">ESTADO</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 font-medium">
                    {/* Agrupación por Áreas de Laboratorio */}
                    {Object.entries(
                      patientResults.reduce((acc, res) => {
                        const catalogItem = MOCK_TEST_CATALOG.find(c => c.id === res.testId);
                        const category = catalogItem?.category || 'OTROS';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(res);
                        return acc;
                      }, {} as Record<string, TestResult[]>)
                    ).map(([category, catResults]) => {
                      const colors = AREA_COLORS[category] || AREA_COLORS['OTROS'];
                      return (
                        <React.Fragment key={category}>
                          {/* Cabecera de Área Profesionalizada */}
                          <tr className={`${colors.bg} border-l-4 ${colors.border.replace('20', '50')}`}>
                            <td colSpan={7} className="px-4 py-1.5">
                              <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${colors.dot} shadow-[0_0_10px_rgba(20,184,166,0.6)]`}></div>
                                <span className={`text-[10px] font-black ${colors.text} uppercase tracking-[0.25em]`}>Área de {category}</span>
                                <div className="h-px flex-1 bg-white/5 ml-4"></div>
                                <span className="text-[8px] font-bold text-slate-600 uppercase">{catResults.length} ANALITOS</span>
                              </div>
                            </td>
                          </tr>

                          {catResults.map(res => {
                            const isActive = editingId === res.id;
                            const delta = getDeltaCheck(res);
                            const isSelected = selectedResults.includes(res.id);
                            const isUnexpected = !(currentOrder.expandedTestIds || []).includes(res.testId) && res.source !== 'MANUAL';

                            return (
                              <tr key={res.id} className={`group transition-all ${isSelected ? 'bg-teal-500/5' : 'hover:bg-white/[0.01]'} ${isUnexpected ? 'border-l-2 border-amber-500/50 bg-amber-500/[0.01]' : `border-l-4 ${colors.border}`}`}>
                                 <td className="px-4 py-1 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelect(res.id)}
                                    className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-0"
                                  />
                               </td>
                               <td className="px-4 py-1">
                                  <div className="flex items-center space-x-2">
                                     <span className="font-mono text-[9px] font-black text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">{res.parameterCode || 'LIS-00'}</span>
                                     <div className="font-black text-slate-200 uppercase tracking-tighter text-[11px] leading-tight">{res.parameterName}</div>
                                     {isUnexpected && (
                                       <span className="text-[7px] bg-amber-500/20 text-amber-500 font-black px-1.5 py-0.5 rounded border border-amber-500/30 ml-2 animate-pulse">
                                         ADICIONAL DETECTADO
                                       </span>
                                     )}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-0.5 ml-1">
                                     <span className="text-[8px] text-slate-600 font-black uppercase">{res.specimenType || 'SUERO'}</span>
                                     {delta && (
                                       <div className="flex items-center space-x-1 text-rose-500">
                                          <Zap className="w-2.5 h-2.5 fill-current" />
                                          <span className="text-[7px] font-black uppercase tracking-tighter">Δ: {delta.change}%</span>
                                       </div>
                                     )}
                                  </div>
                               </td>
                               <td className="px-4 py-1 text-center relative">
                                  <div className="flex flex-col items-center gap-1.5">
                                     {isActive ? (
                                       <div className="relative group">
                                         <input
                                           autoFocus
                                           value={tempValue}
                                           onChange={e => setTempValue(e.target.value)}
                                           onBlur={() => {
                                             // Delay a bit to allow click on predefined options
                                             setTimeout(() => {
                                               if (editingId === res.id) {
                                                  onUpdateResultValue(res.id, tempValue, res);
                                                  setEditingId(null);
                                               }
                                             }, 200);
                                           }}
                                           onKeyDown={e => e.key === 'Enter' && (onUpdateResultValue(res.id, tempValue, res), setEditingId(null))}
                                           className={`${res.value.length > 8 ? 'w-32' : 'w-20'} bg-slate-950 border border-teal-500 rounded px-2 py-1 text-center font-mono text-teal-400 font-bold text-xs focus:outline-none shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all`}
                                         />

                                         {/* PREDEFINED OPTIONS POPUP (Quick Entry) */}
                                         {(QUICK_RESULTS[res.testId] || QUICK_RESULTS[res.parameterId]) && (
                                           <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[300px] p-2 bg-slate-900 border border-teal-500/30 rounded-xl shadow-2xl z-[150] flex flex-wrap gap-1.5 animate-in zoom-in-95 duration-200">
                                              {(QUICK_RESULTS[res.testId] || QUICK_RESULTS[res.parameterId]).map(option => (
                                                <button
                                                  key={option}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setTempValue(option);
                                                    onUpdateResultValue(res.id, option, res);
                                                    setEditingId(null);
                                                  }}
                                                  className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 text-[9px] font-black uppercase rounded-lg border border-teal-500/20 transition-all cursor-pointer"
                                                >
                                                  {option}
                                                </button>
                                              ))}
                                           </div>
                                         )}
                                       </div>
                                     ) : (
                                       <div className="flex items-center space-x-2">
                                         <button
                                           onClick={() => { setEditingId(res.id); setTempValue(res.value === '---' ? '' : res.value); }}
                                           className={`font-mono font-black text-xs px-3 py-1 rounded-md transition-all border border-transparent hover:border-white/10 ${getFlagStyle(res.flag)}`}
                                         >
                                            {res.value}
                                         </button>
                                         {res.dilutionFactor && res.dilutionFactor > 1 && (
                                           <span className="text-[7px] bg-teal-500/20 text-teal-400 font-black px-1 py-0.5 rounded border border-teal-500/30 animate-in zoom-in duration-300" title={`Dilución 1:${res.dilutionFactor}`}>
                                             D 1:{res.dilutionFactor}
                                           </span>
                                         )}
                                       </div>
                                     )}

                                     <div className="flex items-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                        {res.source === 'MANUAL' ? (
                                           <>
                                              <PencilLine className="w-2.5 h-2.5 text-amber-500" />
                                              <span className="text-[7px] font-black text-slate-500 uppercase">Manual</span>
                                           </>
                                        ) : (
                                           <>
                                              <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                                              <span className="text-[7px] font-black text-slate-500 uppercase truncate max-w-[50px]">{res.analyzerName || 'Analizador'}</span>
                                           </>
                                        )}
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-1 text-center text-slate-500 font-mono text-[9px] uppercase">{res.unit}</td>
                               <td className="px-4 py-1 text-slate-400 font-mono text-[9px] italic whitespace-nowrap">{res.refRangeText}</td>
                               <td className="px-4 py-1 max-w-[240px]">
                                  <div className="flex items-start space-x-2 py-1">
                                     <div className="flex-1">
                                       {editingInterpId === res.id ? (
                                          <textarea
                                            autoFocus
                                            value={tempInterp}
                                            onChange={e => setTempInterp(e.target.value)}
                                            onBlur={() => {
                                              triggerAutoSave(res.id, 'interp', tempInterp);
                                              setEditingInterpId(null);
                                            }}
                                            onKeyDown={e => {
                                              if (e.ctrlKey && e.key === 'Enter') {
                                                triggerAutoSave(res.id, 'interp', tempInterp);
                                                setEditingInterpId(null);
                                              }
                                            }}
                                            className="w-full bg-slate-950 border border-teal-500 rounded-xl p-2 text-[10px] text-slate-200 outline-none h-16 resize-none shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all"
                                            placeholder="Ingrese observación clínica..."
                                          />
                                       ) : (
                                          <div
                                            onClick={() => { setEditingInterpId(res.id); setTempInterp(res.interpretation || ''); }}
                                            className={`text-[10px] italic line-clamp-2 bg-white/[0.03] p-2 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.05] cursor-text leading-relaxed transition-all ${res.interpretation ? 'text-slate-300' : 'text-slate-600'}`}
                                          >
                                             {res.interpretation || 'Añadir comentario técnico...'}
                                          </div>
                                       )}
                                     </div>
                                     <button
                                       onClick={() => startVoiceDictation(res.id)}
                                       className={`mt-1 p-1.5 rounded-xl transition-all shadow-lg ${isListening === res.id ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-teal-400 hover:bg-slate-700'}`}
                                       title="Dictado por Voz (IA)"
                                     >
                                        <Mic className="w-3.5 h-3.5" />
                                     </button>
                                  </div>
                               </td>
                               <td className="px-4 py-1 text-center">
                                  {getStatusBadge(res.status)}
                               </td>
                            </tr>
                          )})}
                        </React.Fragment>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </div>

        {/* 3. Global Floating Action Bar - POWER COMMAND CENTER */}
        <div className="h-28 flex items-center justify-center shrink-0 border-t border-white/5 bg-slate-950/20 relative">
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-stretch bg-[#020617]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-b-4 border-b-teal-500/30 max-w-[98vw] lg:max-w-fit overflow-x-auto no-scrollbar transition-all duration-500 z-[200]">

            {/* Group 1: GESTIÓN TÉCNICA */}
            <div className="flex flex-col items-center px-4 border-r border-white/10">
              <span className="text-[6px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 opacity-50">Gestión Técnica</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={() => setIsCatalogOpen(true)} title="Modificar pruebas de la orden" className="w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center border border-white/5 hover:bg-cyan-500 hover:text-slate-950 transition-all active:scale-90 shadow-lg">
                      <Plus className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Catálogo</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={() => setIsPanicModalOpen(true)} title="Registro de llamadas Read-Back ISO 15189" className="w-9 h-9 rounded-xl bg-slate-900 text-rose-400 flex items-center justify-center border border-white/5 hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-lg">
                      <PhoneCall className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Pánicos</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={() => setIsQCModalOpen(true)} title="Verificar estado de Calidad (QC) del Analizador para estos parámetros" className="w-9 h-9 rounded-xl bg-slate-900 text-indigo-400 flex items-center justify-center border border-white/5 hover:bg-indigo-500 hover:text-white transition-all active:scale-90 shadow-lg">
                      <Sliders className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Calidad</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button
                     onClick={() => {
                       if (selectedResults.length === 0) {
                         alert('⚠️ SELECCIÓN REQUERIDA: Por favor, marque primero los analitos en la tabla que desea recalcular.');
                         return;
                       }
                       setIsDilutionModalOpen(true);
                     }}
                     title="Calcular resultados con factor de dilución"
                     className={`w-9 h-9 rounded-xl flex items-center justify-center border border-white/5 transition-all active:scale-90 shadow-lg ${selectedResults.length > 0 ? 'bg-slate-900 text-teal-400 hover:bg-teal-500 hover:text-slate-950' : 'bg-slate-950 text-slate-700 cursor-not-allowed'}`}
                   >
                      <Calculator className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Dilución</span>
                </div>
              </div>
            </div>

            {/* Group 2: COMUNICACIÓN */}
            <div className="flex flex-col items-center px-4 border-r border-white/10">
              <span className="text-[6px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 opacity-50">Comunicación</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={() => onConsultInterBranch?.(currentOrder, currentPatient, 'Muestra')} className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all shadow-lg active:scale-90">
                      <MessageSquare className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Inter-Sede</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={() => setIsHistoryModalOpen(true)} className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center border border-white/5 hover:bg-teal-500 hover:text-slate-950 transition-all shadow-lg active:scale-90">
                      <TrendingUp className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Historial</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={handleWhatsAppNotify} className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg active:scale-90">
                      <Smartphone className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Group 3: ACCIONES MASIVAS */}
            <div className="flex flex-col items-center px-4 border-r border-white/10">
              <span className="text-[6px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 opacity-50">Acciones Masivas</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={handleBulkReject} className="w-9 h-9 rounded-xl bg-slate-900 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-90" title="Rechazo de Muestra">
                      <Trash2 className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Rechazo</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={handleBulkUnvalidate} className="w-9 h-9 rounded-xl bg-slate-900 text-rose-400 border border-rose-400/20 flex items-center justify-center hover:bg-rose-400 hover:text-white transition-all active:scale-90 shadow-xl" title="Desvalidar Selección">
                      <RotateCcw className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Reset</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={handleBulkNoReagent} className="w-9 h-9 rounded-xl bg-slate-900 text-amber-500 border border-amber-500/20 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all active:scale-90 shadow-xl" title="Marcar Sin Reactivo">
                      <Beaker className="w-4 h-4" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">No Reactivo</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={() => selectedResults.forEach(id => onUpdateResultStatus(id, 'PRELIMINAR'))} className="w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 border border-cyan-400/20 flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 transition-all active:scale-90 shadow-xl" title="Validación Preliminar">
                      <Zap className="w-4 h-4 fill-current" />
                   </button>
                   <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Preliminar</span>
                </div>
              </div>
            </div>

            {/* Group 4: FINALIZACIÓN */}
            <div className="flex flex-col items-center px-6">
              <span className="text-[6px] font-black text-teal-500 uppercase tracking-[0.2em] mb-3">Finalización</span>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1 group">
                   <button onClick={handleBulkValidate} className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center border-4 border-[#020617] hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-95" title="Validación Técnica Final">
                      <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                   </button>
                   <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-1">Validar (F10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1 group">
                    <button onClick={() => onOpenPdf(currentOrder.id)} className="w-9 h-9 rounded-xl bg-slate-900 text-slate-400 flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all shadow-lg border border-white/5"><Printer className="w-4 h-4" /></button>
                    <span className="text-[7px] font-black text-slate-500 uppercase">Reporte</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 group">
                    <button
                      onClick={() => {
                        const tube = currentOrder.specimens[0]?.barcode || 'N/A';
                        alert(`Enviando a impresión térmica: Etiqueta Tubo ${tube} [${currentPatient.firstName} ${currentPatient.lastName}]`);
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-900 text-slate-400 flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all shadow-lg border border-white/5"
                    >
                      <Barcode className="w-4 h-4" />
                    </button>
                    <span className="text-[7px] font-black text-slate-500 uppercase">Tags</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Test Catalog Management Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
                       <Plus className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión de Análisis</h3>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Orden: {currentOrder.orderNumber}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsCatalogOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* TABS SELECTOR */}
              <div className="px-8 pt-4 flex items-center space-x-4 shrink-0 bg-slate-900">
                 <button
                   onClick={() => setCatalogTab('tests')}
                   className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${catalogTab === 'tests' ? 'text-cyan-400 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                 >
                   Análisis Individuales
                 </button>
                 <button
                   onClick={() => setCatalogTab('packages')}
                   className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${catalogTab === 'packages' ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                 >
                   Perfiles (Paquetes)
                 </button>
              </div>

              <div className="p-6 shrink-0 bg-slate-950/40">
                 <div className="relative">
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                    <input
                       type="text"
                       placeholder="Buscar en Catálogo Maestro LIS..."
                       value={catalogSearchTerm}
                       onChange={(e) => setCatalogSearchTerm(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold text-white focus:border-cyan-500 outline-none transition-all"
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                 {catalogTab === 'tests' ? (
                   MOCK_TEST_CATALOG
                    .filter(t => t.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) || t.code.toLowerCase().includes(catalogSearchTerm.toLowerCase()))
                    .map(test => {
                      const isSelected = (currentOrder.expandedTestIds || []).includes(test.id);
                      return (
                         <div key={test.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-950 border-white/5 hover:border-white/10'}`}>
                            <div className="flex items-center space-x-4">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-600'}`}>
                                  <Activity className="w-4 h-4" />
                               </div>
                               <div>
                                  <div className="text-xs font-black text-white uppercase tracking-tight">{test.name}</div>
                                  <div className="text-[9px] text-slate-500 font-mono">{test.code} • ${test.price.toFixed(2)}</div>
                               </div>
                            </div>
                            <button
                               onClick={() => {
                                  const currentExpanded = currentOrder.expandedTestIds || [];
                                  const newIds = isSelected
                                     ? currentExpanded.filter(id => id !== test.id)
                                     : [...currentExpanded, test.id];
                                  onUpdateOrderTests?.(currentOrder.id, newIds);
                               }}
                               className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-lg shadow-teal-500/20'}`}
                            >
                               {isSelected ? 'Eliminar' : 'Agregar'}
                            </button>
                         </div>
                      );
                    })
                 ) : (
                   MOCK_TEST_PACKAGES
                    .filter(p => p.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) || p.code.toLowerCase().includes(catalogSearchTerm.toLowerCase()))
                    .map(pkg => {
                      const allPackageTestsSelected = pkg.testIds.every(id => (currentOrder.expandedTestIds || []).includes(id));
                      return (
                         <div key={pkg.id} className={`flex flex-col p-4 rounded-2xl border transition-all ${allPackageTestsSelected ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950 border-white/5 hover:border-white/10'}`}>
                            <div className="flex items-center justify-between">
                               <div className="flex items-center space-x-4">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${allPackageTestsSelected ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-600'}`}>
                                     <Layers className="w-4 h-4" />
                                  </div>
                                  <div>
                                     <div className="text-xs font-black text-white uppercase tracking-tight">{pkg.name}</div>
                                     <div className="text-[9px] text-slate-500 font-mono">{pkg.code} • ${pkg.price.toFixed(2)}</div>
                                  </div>
                               </div>
                               <button
                                  onClick={() => {
                                     const currentExpanded = currentOrder.expandedTestIds || [];
                                     let newIds;
                                     if (allPackageTestsSelected) {
                                       // Remove all tests of this package
                                       newIds = currentExpanded.filter(id => !pkg.testIds.includes(id));
                                     } else {
                                       // Add missing tests
                                       newIds = Array.from(new Set([...currentExpanded, ...pkg.testIds]));
                                     }
                                     onUpdateOrderTests?.(currentOrder.id, newIds);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${allPackageTestsSelected ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20'}`}
                               >
                                  {allPackageTestsSelected ? 'Quitar Perfil' : 'Expandir Perfil'}
                                </button>
                            </div>
                            <div className="mt-3 pl-12 flex flex-wrap gap-1.5">
                               {pkg.testIds.map(tId => {
                                 const tInfo = MOCK_TEST_CATALOG.find(c => c.id === tId);
                                 const isAlreadyIn = (currentOrder.expandedTestIds || []).includes(tId);
                                 return (
                                   <span key={tId} className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${isAlreadyIn ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                                      {tInfo?.name || tId}
                                   </span>
                                 );
                               })}
                            </div>
                         </div>
                      );
                    })
                 )}
              </div>

              <div className="p-8 border-t border-white/5 bg-slate-950/60 flex items-center justify-between shrink-0">
                 <div className="text-left">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">Análisis Totales</span>
                    <span className="text-xl font-black text-white">{currentOrder.testIds.length}</span>
                 </div>
                 <button onClick={() => setIsCatalogOpen(false)} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">Finalizar Edición</button>
              </div>
           </div>
        </div>
      )}

      {/* PÁNICOS: Registro de Valores Críticos (ISO 15189) */}
      {isPanicModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col relative shadow-2xl">
              <div className="absolute top-8 right-8 z-10">
                 <button onClick={() => setIsPanicModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                 <CriticalValueRegistry />
              </div>
           </div>
        </div>
      )}

      {/* CALIDAD: Control de Calidad Westgard (Levey-Jennings) */}
      {isQCModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col relative shadow-2xl">
              <div className="absolute top-8 right-8 z-10">
                 <button onClick={() => setIsQCModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 pt-12">
                 <WestgardQC controls={MOCK_WESTGARD_QC} />
              </div>
           </div>
        </div>
      )}

      {/* HISTORIAL: Tendencias y Delta Check */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="w-full max-w-6xl h-[85vh] bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col relative shadow-2xl">
              <div className="absolute top-8 right-8 z-10">
                 <button onClick={() => setIsHistoryModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12">
                 <ResultTrendWidget
                    order={currentOrder}
                    patient={currentPatient}
                    results={results.filter(r => r.orderId === currentOrder.id)}
                 />
              </div>
           </div>
        </div>
      )}

      {/* DILUCIÓN: Calculadora Técnica de Dilución */}
      {isDilutionModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 w-full max-w-md shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400">
                    <Calculator className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Calculadora de Dilución</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aplicar a {selectedResults.length} analitos seleccionados</p>
                 </div>
              </div>

              <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-white/5">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Factor de Dilución (Multiplicador)</label>
                 <div className="flex items-center space-x-4">
                    <span className="text-2xl font-black text-white">1 :</span>
                    <input
                      type="number"
                      value={dilutionFactor}
                      onChange={(e) => setDilutionFactor(e.target.value)}
                      className="flex-1 bg-slate-900 border-2 border-teal-500/30 rounded-xl px-4 py-3 text-xl font-black text-teal-400 outline-none focus:border-teal-500 transition-all"
                    />
                 </div>
                 <p className="text-[9px] text-slate-500 leading-relaxed italic">
                    Ejemplo: Una dilución 1:5 multiplicará el valor numérico actual por 5 y añadirá una nota técnica al resultado.
                 </p>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setIsDilutionModalOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancelar</button>
                 <button
                   onClick={applyDilution}
                   disabled={selectedResults.length === 0}
                   className={`flex-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedResults.length > 0 ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                 >
                   {selectedResults.length > 0 ? 'Aplicar y Recalcular' : 'Seleccione analitos'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
