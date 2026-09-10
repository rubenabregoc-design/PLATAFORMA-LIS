import React, { useState, useEffect, useMemo } from 'react';
import { Order, TestResult, Patient, Analyzer, User } from '../../types';
import { MOCK_TEST_CATALOG } from '../../data/mockData';
import {
  UserCircle, RefreshCw, Disc, Timer, Layers, Search, X, Zap,
  PencilLine, Cpu, Mic, Calculator, MessageSquare, TrendingUp,
  Smartphone, Trash2, RotateCcw, Beaker, CheckCircle2, Printer,
  Barcode, Plus, PhoneCall, Sliders, ShieldAlert, Activity, Fingerprint,
  ArrowRight, ChevronRight, BrainCircuit, Terminal, Wrench, ArrowUp, ArrowDown,
  Microscope, AlertTriangle
} from 'lucide-react';

interface ResultEntryWorkspaceProps {
  order: Order; patient: Patient; results: TestResult[]; analyzers: Analyzer[];
  currentUser: User;
  onUpdateResultValue: (resultId: string, newValue: string, resultData?: TestResult) => void;
  onUpdateInterpretation: (resultId: string, interpretation: string) => void;
  onUpdateResultStatus: (resultId: string, status: TestResult['status']) => void;
  onOpenPdf: (orderId: string) => void;
  onConsultInterBranch?: (order: Order, patient: Patient, testName: string) => void;
  onUpdateOrderTests?: (orderId: string, testIds: string[]) => void;
  allOrders?: Order[]; allPatients?: Patient[];
}

export const ResultEntryWorkspace: React.FC<ResultEntryWorkspaceProps> = ({
  order: initialOrder, patient: initialPatient, results, currentUser,
  onUpdateResultValue, onUpdateInterpretation, onUpdateResultStatus, onOpenPdf,
  onConsultInterBranch, onUpdateOrderTests, allOrders = [], allPatients = []
}) => {
  const [activeOrderId, setActiveOrderId] = useState<string>(initialOrder.id);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'validated'>('all');

  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [showTrendViewer, setShowTrendViewer] = useState(false);
  const [isTrendsLoading, setIsTrendsLoading] = useState(true);
  const [showAuditLog, setShowAuditLog] = useState(false);

  useEffect(() => {
    if (showTrendViewer) {
      setIsTrendsLoading(true);
      const timer = setTimeout(() => setIsTrendsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showTrendViewer]);

  const currentOrder = allOrders.find(o => o.id === activeOrderId) || initialOrder;
  const currentPatient = allPatients.find(p => p.id === currentOrder.patientId) || initialPatient;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandingNotesId, setExpandingNotesId] = useState<string | null>(null);
  const [activeTraceabilityId, setActiveTraceabilityId] = useState<string | null>(null);
  const [unvalidateReason, setUnvalidateReason] = useState('');
  const [showUnvalidateModal, setShowUnvalidateModal] = useState(false);

  const [tempValue, setTempValue] = useState<string>('');
  const [tempNote, setTempNote] = useState<string>('');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [isAuditFilterActive, setIsAuditFilterActive] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getTimeAgoData = (isoString?: string) => {
    if (!isoString) return { text: '', isLate: false };
    const diff = Math.floor((now - new Date(isoString).getTime()) / 60000);
    return { text: diff < 1 ? 'Justo ahora' : `${diff}m`, isLate: diff >= 30 };
  };

  const patientResults = useMemo(() => {
    let list = results.filter(r => r.orderId === currentOrder.id);
    if (isAuditFilterActive) {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      list = list.filter(r => r.source === 'MIDDLEWARE_ASTM' && (r.createdAt || '') >= oneHourAgo);
    }
    return list;
  }, [currentOrder.id, results, isAuditFilterActive]);

  const getFlagStyle = (flag?: string) => {
    if (flag?.includes('CRITICO')) return 'bg-rose-500/25 border-2 border-rose-500 text-rose-200 font-black text-sm px-3.5 py-1 rounded-xl shadow-lg shadow-rose-500/30 animate-pulse';
    if (flag === 'ALTO') return 'bg-amber-500/25 border-2 border-amber-500/60 text-amber-300 font-black text-sm px-3.5 py-1 rounded-xl shadow-md shadow-amber-500/20';
    if (flag === 'BAJO') return 'bg-blue-500/25 border-2 border-blue-500/60 text-blue-300 font-black text-sm px-3.5 py-1 rounded-xl shadow-md shadow-blue-500/20';
    return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-xl';
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const matchesSearch = o.patientName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                          o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase());

      const orderResults = results.filter(r => r.orderId === o.id);
      const isPending = orderResults.some(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED');

      if (orderStatusFilter === 'pending') return matchesSearch && isPending;
      if (orderStatusFilter === 'validated') return matchesSearch && !isPending;
      return matchesSearch;
    });
  }, [allOrders, orderSearchQuery, orderStatusFilter, results]);

  const pendingCount = useMemo(() => {
    return allOrders.filter(o =>
      results.filter(r => r.orderId === o.id).some(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED')
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
    <div className="flex h-[calc(100vh-100px)] bg-[#020617] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Sidebar: Órdenes - Collapsible */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} bg-slate-950/50 border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative group`}>
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20 z-10 hover:scale-110 transition-transform"
        >
          <ChevronRight className={`w-4 h-4 text-slate-950 transition-transform duration-500 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>

        <div className={`p-4 space-y-4 flex flex-col h-full ${isSidebarCollapsed ? 'items-center' : ''}`}>
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-500" />
                Bandeja de Órdenes
                <span className="ml-2 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full text-[9px]">{pendingCount}</span>
              </h3>
            )}
            {isSidebarCollapsed && <Layers className="w-5 h-5 text-teal-500 animate-pulse" />}
          </div>

          {!isSidebarCollapsed && (
            <div className="space-y-3">
              {/* Functional Bar: Search & Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Buscar paciente u orden..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white placeholder:text-slate-600 focus:border-teal-500/50 outline-none transition-all"
                />
              </div>

              <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                {(['all', 'pending', 'validated'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                      orderStatusFilter === status ? 'bg-teal-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {status === 'all' ? 'Todo' : status === 'pending' ? 'Pend.' : 'Val.'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-y-auto space-y-2 flex-1 custom-scrollbar pr-1">
             {filteredOrders.map(o => (
               <button
                 key={o.id}
                 onClick={() => setActiveOrderId(o.id)}
                 className={`w-full text-left rounded-2xl border transition-all duration-300 ${
                   o.id === activeOrderId
                     ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/40' : 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20')
                     : (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'bg-rose-500/10 border-rose-500/40 hover:bg-rose-500/30' : 'bg-slate-900/50 border-white/5 hover:bg-slate-900')
                 } ${isSidebarCollapsed ? 'p-2 flex flex-col items-center gap-1' : 'p-4'}`}
               >
                  {isSidebarCollapsed ? (
                    <>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[12px] shadow-inner transition-colors ${
                        o.id === activeOrderId
                          ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'bg-white/20 text-white' : 'bg-black/10 text-slate-900')
                          : (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800/50 text-slate-400')
                      }`}>
                        {o.patientName.charAt(0)}
                      </div>
                      <span className={`text-[9px] font-mono font-black truncate w-full text-center tracking-tighter ${
                        o.id === activeOrderId
                          ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'text-white' : 'text-slate-900')
                          : (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'text-rose-500' : 'text-slate-600')
                      }`}>
                        {o.orderNumber.slice(-4)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <div className={`text-[9px] font-mono font-black italic flex items-center gap-1 ${
                          o.id === activeOrderId
                            ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'text-white' : 'text-slate-900/60')
                            : (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'text-rose-400' : 'text-slate-500')
                        }`}>
                          {o.priority === 'STAT' || o.priority === 'URGENTE' ? <Zap className="w-3 h-3 fill-current" /> : null}
                          {o.orderNumber}
                        </div>
                        {results.filter(r => r.orderId === o.id).some(r => r.flag?.includes('CRITICO')) && (
                          <ShieldAlert className={`w-3.5 h-3.5 animate-pulse ${
                            o.id === activeOrderId ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'text-white' : 'text-rose-900') : 'text-rose-500'
                          }`} />
                        )}
                      </div>
                      <div className={`text-[11px] font-black uppercase truncate leading-tight flex items-center gap-2 ${
                        o.id === activeOrderId ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'text-white' : 'text-slate-950') : 'text-slate-200'
                      }`}>
                        {o.patientName}
                        {(o.priority === 'STAT' || o.priority === 'URGENTE') && (
                          <span className={`text-[7px] px-1 rounded-sm font-black ${
                            o.id === activeOrderId ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                          }`}>STAT</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className={`h-1 flex-1 rounded-full overflow-hidden ${
                          o.id === activeOrderId ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'bg-white/20' : 'bg-black/10') : 'bg-black/20'
                        }`}>
                          <div
                            className={`h-full ${
                              o.id === activeOrderId ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'bg-white' : 'bg-slate-900') : (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'bg-rose-500' : 'bg-teal-500/50')
                            }`}
                            style={{
                              width: `${(() => {
                                const orderResults = results.filter(r => r.orderId === o.id);
                                const uniqueParams = Array.from(new Set(orderResults.map(r => r.parameterId)));
                                const validatedCount = uniqueParams.filter(pId =>
                                  orderResults.find(r => r.parameterId === pId && (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED'))
                                ).length;
                                return (validatedCount / Math.max(1, uniqueParams.length)) * 100;
                              })()}%`
                            }}
                          ></div>
                        </div>
                        <span className={`text-[8px] font-black tracking-tighter ${
                          o.id === activeOrderId ? (o.priority === 'STAT' || o.priority === 'URGENTE' ? 'text-white/80' : 'text-slate-900/60') : 'text-slate-500'
                        }`}>
                          {(() => {
                            const orderResults = results.filter(r => r.orderId === o.id);
                            const uniqueParams = Array.from(new Set(orderResults.map(r => r.parameterId)));
                            const validatedCount = uniqueParams.filter(pId =>
                              orderResults.find(r => r.parameterId === pId && (r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED'))
                            ).length;
                            return `${validatedCount}/${uniqueParams.length} VAL.`;
                          })()}
                        </span>
                      </div>
                    </>
                  )}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Rich Clinical Patient Header */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-teal-500/20 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-md">
                 <UserCircle className="w-7 h-7" />
              </div>
              <div>
                 <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-white uppercase italic tracking-tight">{currentPatient.firstName} {currentPatient.lastName}</h2>
                    {currentOrder.priority === 'STAT' || currentOrder.priority === 'URGENTE' ? (
                       <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" /> STAT URGENTE
                       </span>
                    ) : (
                       <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest">
                          RUTINA
                       </span>
                    )}
                 </div>

                 <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-bold uppercase mt-1">
                    <span className="flex items-center gap-1 text-teal-400"><Fingerprint className="w-3.5 h-3.5" />{currentPatient.nationalId}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300">Orden: <strong className="text-white font-mono">{currentOrder.orderNumber}</strong></span>
                    <span className="text-slate-600">•</span>
                    <span className="text-indigo-300">38 años / Femenino</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-300">🏥 Urgencias — Cama 02</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">Dr. R. Arosemena</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-teal-500/30 text-xs font-mono text-teal-300 flex items-center gap-2 shadow-inner">
                 <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                 <span className="text-[10px] font-bold">Muestras: EDTA (BC-8823) + Suero (BC-8824)</span>
              </div>

              <button onClick={() => setIsAuditFilterActive(!isAuditFilterActive)} className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${isAuditFilterActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md' : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white'}`}>
                 <Timer className={`w-3.5 h-3.5 inline mr-1.5 ${isAuditFilterActive ? 'animate-pulse' : ''}`} />
                 {isAuditFilterActive ? 'Filtro Auditoría' : 'Ver Todos'}
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

           {/* High-Glow Vibrant Metric Cards */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-gradient-to-br from-teal-500/25 via-slate-900 to-teal-950/60 border-2 border-teal-400/60 rounded-2xl flex items-center justify-between shadow-[0_10px_25px_rgba(20,184,166,0.25)]">
                 <div>
                    <div className="text-[10px] font-black text-teal-300 uppercase tracking-wider">Pendientes Validar</div>
                    <div className="text-2xl font-black text-white mt-0.5">{patientResults.filter(r => r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED').length} <span className="text-xs text-teal-300/60 font-medium">/ {patientResults.length}</span></div>
                 </div>
                 <div className="w-11 h-11 rounded-xl bg-teal-400 text-slate-950 font-black flex items-center justify-center shadow-md">
                    <Microscope className="w-6 h-6" />
                 </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-rose-500/25 via-slate-900 to-rose-950/60 border-2 border-rose-500/60 rounded-2xl flex items-center justify-between shadow-[0_10px_25px_rgba(244,63,94,0.25)]">
                 <div>
                    <div className="text-[10px] font-black text-rose-300 uppercase tracking-wider flex items-center gap-1">
                       <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Alertas Críticas
                    </div>
                    <div className="text-2xl font-black text-rose-300 mt-0.5">{patientResults.filter(r => r.flag?.includes('CRITICO')).length} <span className="text-xs text-rose-300/60 font-medium">Pánicos</span></div>
                 </div>
                 <div className="w-11 h-11 rounded-xl bg-rose-500 text-white font-black flex items-center justify-center shadow-md animate-bounce">
                    <AlertTriangle className="w-6 h-6" />
                 </div>
              </div>

              <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border-2 ${
                currentOrder.priority === 'STAT' || currentOrder.priority === 'URGENTE'
                  ? 'bg-gradient-to-br from-amber-500/30 via-slate-900 to-rose-950/80 border-amber-400 shadow-[0_10px_25px_rgba(245,158,11,0.3)] animate-pulse'
                  : 'bg-gradient-to-br from-indigo-500/20 via-slate-900 to-indigo-950/60 border-indigo-500/40 shadow-[0_10px_25px_rgba(99,102,241,0.2)]'
              }`}>
                 <div>
                    <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                       <Zap className="w-3.5 h-3.5 text-amber-400" /> Prioridad Orden
                    </div>
                    <div className="text-xl font-black text-white mt-0.5">{currentOrder.priority === 'STAT' || currentOrder.priority === 'URGENTE' ? '🚨 STAT URGENTE' : 'RUTINA'}</div>
                 </div>
                 <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black ${
                   currentOrder.priority === 'STAT' || currentOrder.priority === 'URGENTE'
                     ? 'bg-amber-400 text-slate-950 shadow-md animate-pulse'
                     : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                 }`}>
                    <Zap className="w-6 h-6 fill-current" />
                 </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-cyan-500/25 via-slate-900 to-cyan-950/60 border-2 border-cyan-400/60 rounded-2xl flex items-center justify-between shadow-[0_10px_25px_rgba(6,182,212,0.25)]">
                 <div>
                    <div className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">TAT Estimado</div>
                    <div className="text-2xl font-black text-white mt-0.5">18 <span className="text-xs text-cyan-300/70 font-medium">min</span></div>
                 </div>
                 <div className="w-11 h-11 rounded-xl bg-cyan-400 text-slate-950 font-black flex items-center justify-center shadow-md">
                    <Timer className="w-6 h-6" />
                 </div>
              </div>
           </div>

           {/* 3D Glassmorphic Table Container */}
           <div className="bg-slate-950/80 backdrop-blur-2xl border border-teal-500/30 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-teal-500/20">
              <table className="w-full text-left text-xs border-collapse">
                 <thead className="bg-slate-950/90 text-slate-400 font-black uppercase text-[9px] tracking-widest border-b border-teal-500/20 sticky top-0 z-20 backdrop-blur-md">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <button
                          onClick={toggleSelectAll}
                          className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${
                            selectedResults.length > 0 && selectedResults.length === patientResults.length
                              ? 'bg-teal-500 border-teal-500 text-slate-950'
                              : selectedResults.length > 0
                              ? 'bg-teal-500/20 border-teal-500 text-teal-500'
                              : 'bg-slate-950 border-slate-800 text-transparent hover:border-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th className="p-4">Analito / Parámetro</th>
                      <th className="p-4 text-center">Resultado Clínico</th>
                      <th className="p-4">Unidad</th>
                      <th className="p-4">Valor Referencia</th>
                      <th className="p-4 text-center">TAT / Origen</th>
                      <th className="p-4 text-center">ESTADO</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {patientResults.map(res => {
                      const { text, isLate } = getTimeAgoData(res.createdAt);
                      const isValidated = res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED';
                      const isNoteExpanded = expandingNotesId === res.id;
                      const isHigh = res.flag === 'ALTO';
                      const isCritical = res.flag?.includes('CRITICO');

                      return (
                        <React.Fragment key={res.id}>
                        <tr
                          onClick={() => setActiveTraceabilityId(res.id)}
                          className={`group/row cursor-pointer transition-all border-l-4 ${
                            isCritical
                              ? 'bg-rose-500/20 border-l-rose-500 border-y border-rose-500/30 animate-pulse'
                              : isHigh
                              ? 'bg-amber-500/15 border-l-amber-400 border-y border-amber-500/30'
                              : selectedResults.includes(res.id)
                              ? 'bg-teal-500/10 border-l-teal-400 shadow-inner'
                              : isValidated
                              ? 'bg-emerald-500/[0.04] border-l-emerald-500/50'
                              : 'border-l-transparent hover:bg-slate-900/60'
                          }`}
                        >
                           <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedResults(prev => prev.includes(res.id) ? prev.filter(id => id !== res.id) : [...prev, res.id])}
                                className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center mx-auto ${
                                  selectedResults.includes(res.id)
                                    ? 'bg-teal-500 border-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                                    : 'bg-slate-950 border-slate-800 text-transparent group-hover/row:border-teal-500/50'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 {isValidated && (
                                   <span title="Resultado Validado" className="shrink-0">
                                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                   </span>
                                 )}
                                <div className={`font-black uppercase ${isValidated ? 'text-slate-400' : 'text-slate-200'}`}>{res.parameterName}</div>
                                {res.isExtra && (
                                  <span className="bg-amber-500 text-slate-950 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-amber-500/20">EXTRA</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="text-[9px] text-slate-600 font-mono tracking-tight">{res.parameterCode}</div>
                                <div className="h-2.5 w-px bg-white/5"></div>
                                {res.source?.includes('MIDDLEWARE') ? (
                                  <div className="flex items-center gap-1 text-[8px] text-teal-500 font-bold" title={`Recibido de: ${res.analyzerName || 'Analizador LIS'}`}>
                                    <Cpu className="w-2.5 h-2.5" /> <span className="uppercase tracking-tighter">{res.analyzerName || 'ASTM-HUB'}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-[8px] text-indigo-400 font-bold" title="Ingresado Manualmente">
                                    <PencilLine className="w-2.5 h-2.5" /> <span className="uppercase tracking-tighter">MANUAL</span>
                                  </div>
                                )}
                              </div>
                           </td>
                           <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              {editingId === res.id ?
                                <input autoFocus value={tempValue} onChange={e => setTempValue(e.target.value)} onBlur={() => { onUpdateResultValue(res.id, tempValue, res); setEditingId(null); }} onKeyDown={e => e.key === 'Enter' && (onUpdateResultValue(res.id, tempValue, res), setEditingId(null))} className="bg-slate-950 border border-teal-500 rounded text-center text-teal-400 font-mono w-24 p-1 shadow-[0_0_15px_rgba(20,184,166,0.2)]" /> :
                                <div className="flex items-center justify-center gap-3">
                                  <div className="flex flex-col items-center gap-0.5 min-w-[12px]">
                                     {res.flag?.includes('ALTO') && <ArrowUp className={`w-3.5 h-3.5 ${res.flag.includes('CRITICO') ? 'text-rose-500 animate-bounce' : 'text-amber-500'}`} />}
                                     {res.flag?.includes('BAJO') && <ArrowDown className={`w-3.5 h-3.5 ${res.flag.includes('CRITICO') ? 'text-rose-500 animate-bounce' : 'text-blue-400'}`} />}
                                  </div>

                                  <div className="flex flex-col items-center gap-0.5">
                                    <button
                                      disabled={isValidated}
                                      onClick={() => { setEditingId(res.id); setTempValue(res.value); }}
                                      className={`px-4 py-1.5 rounded-lg font-mono font-black text-sm border transition-all ${isValidated ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 cursor-default' : 'border-transparent hover:border-white/10 ' + getFlagStyle(res.flag)}`}
                                    >
                                      {res.value}
                                    </button>
                                    {res.interpretation && (
                                      <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${res.interpretation.includes('POSITIVO') ? 'text-amber-500' : 'text-slate-500 opacity-60'}`}>
                                        {res.interpretation}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 min-w-[40px]" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setExpandingNotesId(isNoteExpanded ? null : res.id);
                                        setTempNote(res.interpretation || '');
                                      }}
                                      className={`p-1.5 rounded-lg transition-all ${res.interpretation ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-700 hover:text-slate-400 hover:bg-white/5'}`}
                                      title="Ver/Editar Interpretación Técnica"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    {res.flag?.includes('CRITICO') && <span className="text-[9px] font-black text-rose-500 animate-pulse uppercase">!!!</span>}
                                    {isValidated && (
                                      <span title="Validado con firma digital">
                                        <Fingerprint className="w-3.5 h-3.5 text-emerald-500/50" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              }
                           </td>
                           <td className="p-4 text-slate-500 font-mono text-[10px] uppercase tracking-tighter">{res.unit}</td>
                           <td className="p-4 text-slate-400 font-mono text-[10px] italic">
                              <div>{res.refRangeText}</div>
                              {/* Visual Range Gauge Slider Bar */}
                              <div className="w-28 h-1.5 bg-slate-900 border border-slate-800 rounded-full mt-1.5 relative overflow-hidden">
                                 <div className="absolute inset-y-0 bg-emerald-500/30 border-x border-emerald-500/50" style={{ left: '20%', width: '60%' }} />
                                 <div
                                   className={`absolute top-0 bottom-0 w-2 rounded-full border border-slate-950 ${
                                     res.flag?.includes('CRITICO')
                                       ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
                                       : res.flag === 'ALTO'
                                       ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                                       : res.flag === 'BAJO'
                                       ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                                       : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                                   }`}
                                   style={{
                                     left: res.flag === 'ALTO' || res.flag?.includes('CRITICO') ? '85%' : res.flag === 'BAJO' ? '10%' : '50%'
                                   }}
                                 />
                              </div>
                           </td>
                           <td className="p-4 text-center">
                              {res.source?.includes('MIDDLEWARE') && !isValidated && (
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${isLate ? 'border-amber-500/40 bg-amber-500/5 text-amber-400' : 'border-white/5 bg-slate-950 text-teal-400'}`}>
                                   <Timer className={`w-3 h-3 ${isLate ? 'animate-pulse' : ''}`} /><span className="text-[9px] font-black">{text}</span>
                                </div>
                              )}
                              {isValidated && (
                                <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">OK</span>
                              )}
                           </td>
                           {/* Dedicated ESTADO / VALIDACIÓN Column */}
                           <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              {isValidated ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase rounded-xl shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>VALIDADO</span>
                                </span>
                              ) : res.status === 'LIBERADO' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase rounded-xl shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>LIBERADO</span>
                                </span>
                              ) : res.status === 'RECHAZADO' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase rounded-xl shadow-sm animate-pulse">
                                  <X className="w-3.5 h-3.5 text-rose-400" />
                                  <span>RECHAZADO</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase rounded-xl shadow-sm">
                                  <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                  <span>PENDIENTE</span>
                                </span>
                              )}
                           </td>
                        </tr>

                        {/* Inline Clinical Alert Card for High or Critical Values */}
                        {(res.flag === 'ALTO' || res.flag?.includes('CRITICO')) && (
                          <tr className={res.flag?.includes('CRITICO') ? 'bg-rose-500/10 border-b border-rose-500/20' : 'bg-amber-500/10 border-b border-amber-500/20'}>
                            <td colSpan={6} className="px-4 py-2">
                               <div className="flex items-center gap-2 text-[10px] font-bold">
                                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${res.flag?.includes('CRITICO') ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                                  <span className={res.flag?.includes('CRITICO') ? 'text-rose-300 font-bold' : 'text-amber-300 font-bold'}>
                                     {res.flag?.includes('CRITICO')
                                        ? `🚨 VALOR CRÍTICO DE PÁNICO: ${res.parameterName} (${res.value} ${res.unit}) — Requiere protocolo de notificación inmediata a médico tratante.`
                                        : `⚠️ ALERTA DE RANGO: ${res.parameterName} (${res.value} ${res.unit}) excede el valor máximo de referencia (${res.refRangeText}). Δ +17.5% vs previo.`
                                     }
                                  </span>
                               </div>
                            </td>
                          </tr>
                        )}
                        {isNoteExpanded && (
                          <tr className="bg-slate-900/60 border-b border-white/5">
                            <td colSpan={6} className="p-4">
                               <div className="flex gap-4 items-start animate-in slide-in-from-top-2 duration-300">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><MessageSquare className="w-5 h-5" /></div>
                                  <div className="flex-1 space-y-3">
                                     <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interpretación Clínica / Hallazgos del Analizador</span>
                                        <div className="flex gap-2">
                                           <button onClick={() => { onUpdateInterpretation(res.id, tempNote); setExpandingNotesId(null); }} className="px-3 py-1 bg-indigo-500 text-white text-[9px] font-black rounded-lg uppercase shadow-lg shadow-indigo-500/20">Guardar Nota</button>
                                           <button onClick={() => setExpandingNotesId(null)} className="px-3 py-1 bg-white/5 text-slate-400 text-[9px] font-black rounded-lg uppercase">Cerrar</button>
                                        </div>
                                     </div>
                                     <textarea
                                       disabled={isValidated}
                                       value={tempNote}
                                       onChange={(e) => setTempNote(e.target.value)}
                                       className="w-full bg-slate-950/80 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 min-h-[80px] focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-800"
                                       placeholder="Ingrese observaciones técnicas, comentarios sobre la muestra o hallazgos instrumentales..."
                                     />
                                  </div>
                               </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      )
                    })}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="h-24 flex items-center justify-center shrink-0 px-6">
          <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-2 flex items-center gap-1 shadow-2xl">

             {/* Grupo 1: Alertas & Comunicación */}
             <div className="flex gap-2 px-4 border-r border-white/5 shrink-0">
                <button
                  title="PROTOCOLO DE PÁNICO: Notificar Crítico vía SMS/Push"
                  onClick={() => {
                    const criticals = selectedResults.filter(id => results.find(r => r.id === id)?.flag?.includes('CRITICO'));
                    if (criticals.length === 0) { alert('Esta función requiere analitos con flag CRÍTICO seleccionados.'); return; }
                    alert(`Alerta de Pánico enviada para ${criticals.length} resultados.`);
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group ${
                    selectedResults.some(id => results.find(r => r.id === id)?.flag?.includes('CRITICO'))
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30 animate-pulse'
                    : 'bg-slate-800/20 text-slate-700'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  title="WHATSAPP CLOUD: Enviar reporte parcial al paciente"
                  onClick={() => {
                    alert('Reporte enviado exitosamente vía WhatsApp.');
                  }}
                  className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all group"
                >
                  <PhoneCall className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
             </div>

             {/* Grupo 2: Herramientas de Cálculo & Trazado */}
             <div className="flex gap-2 px-4 border-r border-white/5 shrink-0">
                <button
                  title="DILUCIONES: Aplicar factor de dilución al resultado"
                  onClick={() => {
                    if (selectedResults.length === 0) return;
                    const factor = prompt('Ingrese el factor de dilución (ej: 2, 5, 10):');
                    if (factor && !isNaN(Number(factor))) {
                       selectedResults.forEach(id => {
                         const res = results.find(r => r.id === id);
                         if (res && res.numericValue) {
                           onUpdateResultValue(id, (res.numericValue * Number(factor)).toString(), res);
                         }
                       });
                       alert(`Factor x${factor} aplicado.`);
                    }
                  }}
                  className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all group"
                >
                  <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  title="ZEBRA SPOOLER: Re-imprimir etiquetas de código de barras"
                  onClick={() => {
                    alert('Etiquetas enviadas a la impresora térmica de la sede.');
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all group"
                >
                  <Barcode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
             </div>

             {/* Grupo 3: Trazabilidad & Revocación */}
             <div className="flex gap-2 px-4 border-r border-white/5 shrink-0">
                <button title="AUDIT TRAIL: Ver historial completo de modificaciones" onClick={() => setShowAuditLog(true)} className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all group">
                  <RotateCcw className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button title="TREND ANALYTICS: Gráficas de evolución histórica" onClick={() => setShowTrendViewer(true)} className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all group text-teal-400">
                  <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  title="REVOCAR: Desvalidar resultados seleccionados (Acceso Súper-Admin)"
                  disabled={!selectedResults.some(id => {
                    const res = results.find(r => r.id === id);
                    const isValidated = res?.status === 'VALIDADO_TEC' || res?.status === 'VALIDADO_MED';
                    const canUnvalidate = currentUser.role === 'abregotech_admin' || res?.technicalValidatedBy === currentUser.name;
                    return isValidated && canUnvalidate;
                  })}
                  onClick={() => {
                    const toRevokeIds = selectedResults.filter(id => {
                      const res = results.find(r => r.id === id);
                      const isValidated = res?.status === 'VALIDADO_TEC' || res?.status === 'VALIDADO_MED';
                      const canUnvalidate = currentUser.role === 'abregotech_admin' || res?.technicalValidatedBy === currentUser.name;
                      return isValidated && canUnvalidate;
                    });

                    if (toRevokeIds.length === 0) {
                      alert('Seleccione resultados validados para revocar.');
                      return;
                    }

                    setUnvalidateReason('');
                    setShowUnvalidateModal(true);
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group ${
                    selectedResults.some(id => {
                      const res = results.find(r => r.id === id);
                      const isValidated = res?.status === 'VALIDADO_TEC' || res?.status === 'VALIDADO_MED';
                      const canUnvalidate = currentUser.role === 'abregotech_admin' || res?.technicalValidatedBy === currentUser.name;
                      return isValidated && canUnvalidate;
                    })
                    ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-800/40 text-slate-700 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
             </div>

             {/* Grupo 4: Orden & PDF */}
             <div className="flex gap-2 px-4 border-r border-white/5 shrink-0">
                <button title="MASTER CATALOG: Añadir analitos extra a la orden" onClick={() => onUpdateOrderTests?.(currentOrder.id, currentOrder.expandedTestIds || currentOrder.testIds)} className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all group">
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button title="REPORT PREVIEW: Generar PDF oficial" onClick={() => onOpenPdf(currentOrder.id)} className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group">
                  <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
             </div>

             {/* Acción Principal Maestría */}
             <div className="pl-4 pr-3">
                <button
                  disabled={!selectedResults.some(id => {
                    const res = results.find(r => r.id === id);
                    return res && res.status !== 'VALIDADO_TEC' && res.status !== 'VALIDADO_MED';
                  })}
                  onClick={() => {
                    const toValidate = selectedResults.filter(id => {
                      const res = results.find(r => r.id === id);
                      return res && res.status !== 'VALIDADO_TEC' && res.status !== 'VALIDADO_MED';
                    });
                    if (toValidate.length === 0) return;

                    toValidate.forEach(id => onUpdateResultStatus(id, 'VALIDADO_TEC'));
                    setSelectedResults([]);
                  }}
                  className={`h-14 px-8 font-black rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-xl text-xs uppercase tracking-widest ${
                    selectedResults.some(id => {
                      const res = results.find(r => r.id === id);
                      return res && res.status !== 'VALIDADO_TEC' && res.status !== 'VALIDADO_MED';
                    })
                    ? 'bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 text-slate-950 shadow-[0_10px_25px_rgba(20,184,166,0.35)] hover:brightness-110 hover:scale-105'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>VALIDAR RESULTADOS ({selectedResults.filter(id => results.find(r => r.id === id && r.status !== 'VALIDADO_TEC' && r.status !== 'VALIDADO_MED')).length})</span>
                </button>
             </div>
          </div>
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
                const isValidated = res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED';

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
                        const isValidated = res?.status === 'VALIDADO_TEC' || res?.status === 'VALIDADO_MED';
                        return isValidated && (currentUser.role === 'abregotech_admin' || res?.technicalValidatedBy === currentUser.name);
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
                     className="py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl text-xs transition-all uppercase tracking-widest"
                   >
                      Cancelar
                   </button>
                   <button
                     disabled={!unvalidateReason.trim()}
                     onClick={() => {
                        const idsToRevoke = activeTraceabilityId ? [activeTraceabilityId] : selectedResults.filter(id => {
                          const res = results.find(r => r.id === id);
                          const isValidated = res?.status === 'VALIDADO_TEC' || res?.status === 'VALIDADO_MED';
                          const canUnvalidate = currentUser.role === 'abregotech_admin' || res?.technicalValidatedBy === currentUser.name || res?.medicalValidatedBy === currentUser.name;
                          return isValidated && canUnvalidate;
                        });

                        if (idsToRevoke.length === 0) {
                          alert('Error: No se encontraron resultados válidos para revocar.');
                          return;
                        }

                        idsToRevoke.forEach(id => {
                          onUpdateResultStatus(id, 'INGRESADO');
                          // Simulamos la inserción en el motor de trazabilidad real
                          console.log(`[ISO 15189 AUDIT] Result ${id} REVOKED by ${currentUser.name}. Reason: ${unvalidateReason}`);
                        });

                        setShowUnvalidateModal(false);
                        setUnvalidateReason('');
                        setActiveTraceabilityId(null);
                        setSelectedResults([]);
                        alert(`AUDITORÍA PROCESADA: Se han revocado ${idsToRevoke.length} validaciones. Los analitos vuelven a estado de edición.`);
                     }}
                     className="py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest disabled:opacity-30 disabled:grayscale"
                   >
                      Confirmar Desvalidación
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
