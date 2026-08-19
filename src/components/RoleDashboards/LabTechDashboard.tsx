import React, { useState, useEffect } from 'react';
import { Order, Specimen, TestResult, Patient } from '../../types';
import { SampleIntegrityBadge } from '../SampleIntegrityStatusWidget';
import {
  QrCode,
  TestTube,
  CheckCircle2,
  Play,
  Award,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  User,
  Beaker,
  Printer,
  Sparkles,
  Search,
  Filter,
  FileCheck2,
  XCircle,
  AlertOctagon,
  RotateCcw,
  Clock
} from 'lucide-react';

interface LabTechDashboardProps {
  orders: Order[];
  results?: TestResult[];
  patients?: Patient[];
  onUpdateSpecimenStatus: (specimenId: string, status: Specimen['status']) => void;
  onValidateTechnical?: (resultId: string) => void;
  onValidateTechnicalBulk?: (resultIds: string[]) => void;
  onOpenPdf?: (orderId: string) => void;
}

export const LabTechDashboard: React.FC<LabTechDashboardProps> = ({
  orders,
  results = [],
  patients = [],
  onUpdateSpecimenStatus,
  onValidateTechnical,
  onValidateTechnicalBulk,
  onOpenPdf
}) => {
  // Local Results State for real-time reactivity
  const [localResults, setLocalResults] = useState<TestResult[]>(results);

  useEffect(() => {
    setLocalResults(results);
  }, [results]);

  // Barcode Scanner State
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [lastScanned, setLastScanned] = useState<Specimen | null>(null);

  // Quick Validation State
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({
    [orders[0]?.id || '']: true
  });
  const [selectedResultsByOrder, setSelectedResultsByOrder] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'STAT' | 'RUTINA'>('ALL');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const allSpecimens = orders.flatMap((o) => o.specimens);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleScanBarcode = () => {
    if (!scannedBarcode) return;
    const found = allSpecimens.find((s) => s.barcode.toLowerCase() === scannedBarcode.toLowerCase());

    if (found) {
      onUpdateSpecimenStatus(found.id, 'EN_ANALIZADOR');
      setLastScanned({ ...found, status: 'EN_ANALIZADOR' });
      setScannedBarcode('');
      showToast(`✓ Tubo ${found.barcode} cargado exitosamente a la gradilla del analizador.`);
    } else {
      alert(`Código de tubo "${scannedBarcode}" no encontrado en el sistema LIS.`);
    }
  };

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Get results grouped by order
  const getOrderResults = (orderId: string) => {
    return localResults.filter((r) => r.orderId === orderId);
  };

  // Toggle selection for individual test result in an order
  const toggleResultSelection = (orderId: string, resultId: string) => {
    setSelectedResultsByOrder((prev) => {
      const current = prev[orderId] || [];
      const updated = current.includes(resultId)
        ? current.filter((id) => id !== resultId)
        : [...current, resultId];
      return { ...prev, [orderId]: updated };
    });
  };

  // Toggle select all pending results for an order
  const toggleSelectAllOrderResults = (orderId: string, pendingResults: TestResult[]) => {
    const pendingIds = pendingResults.map((r) => r.id);
    setSelectedResultsByOrder((prev) => {
      const current = prev[orderId] || [];
      const isAllSelected = pendingIds.every((id) => current.includes(id));
      return {
        ...prev,
        [orderId]: isAllSelected ? [] : pendingIds
      };
    });
  };

  // Handle Quick Bulk Validation for a specific Order
  const handleQuickValidateOrder = (order: Order, targetResultIds: string[]) => {
    if (targetResultIds.length === 0) {
      showToast('⚠️ No hay resultados seleccionados para validar.');
      return;
    }

    if (onValidateTechnicalBulk) {
      onValidateTechnicalBulk(targetResultIds);
    } else if (onValidateTechnical) {
      targetResultIds.forEach((id) => onValidateTechnical(id));
    }

    setLocalResults((prev) =>
      prev.map((r) => (targetResultIds.includes(r.id) ? { ...r, status: 'VALIDADO_TEC' } : r))
    );

    // Reset selection for this order
    setSelectedResultsByOrder((prev) => ({ ...prev, [order.id]: [] }));

    const patient = patients.find((p) => p.id === order.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente';

    showToast(
      `⚡ VALIDACIÓN RÁPIDA COMPLETADA: Se validaron ${targetResultIds.length} resultado(s) de la Orden #${order.orderNumber} (${patientName}).`
    );
  };

  // Filter Orders for Quick Validation Table
  const filteredOrders = orders.filter((ord) => {
    const patient = patients.find((p) => p.id === ord.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
    const ordNum = ord.orderNumber.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesQuery = !query || ordNum.includes(query) || patientName.includes(query);
    const matchesPriority = priorityFilter === 'ALL' || ord.priority === priorityFilter;

    return matchesQuery && matchesPriority;
  });

  // Calculate overall metrics
  const totalPendingResults = localResults.filter((r) => r.status === 'PENDIENTE').length;
  const criticalPendingResults = localResults.filter((r) => r.status === 'PENDIENTE' && r.flag?.includes('CRITICO')).length;
  const validatedTodayCount = localResults.filter((r) => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/95 border border-teal-500/50 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.3)] backdrop-blur-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Executive Header Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <div className="text-teal-400 text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4 text-teal-400" />
            <span>Dashboard & Validación Rápida Técnica — Lab Tech / TM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Mesa de Trabajo & Validación Técnica Masiva
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Permite la validación técnica inmediata en lote de parámetros analíticos transmitidos por interfaz ASTM, garantizando la continuidad inmediata hacia validación médica.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-xs space-y-1.5 shrink-0 relative z-10 backdrop-blur-md">
          <div className="text-white font-black flex items-center space-x-2">
            <Award className="w-4 h-4 text-teal-400" />
            <span>Téc. Jorge Valdés (TM-4410)</span>
          </div>
          <div className="text-slate-400 text-[11px] font-medium">Sede Vía España — Laboratorio Central</div>
          <div className="pt-1 border-t border-slate-800 flex items-center space-x-2 text-[10px] text-teal-300 font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Firma Digital Activa</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalPendingResults}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Parámetros Pendientes de Validar</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{criticalPendingResults}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valores Críticos Sin Validar</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{validatedTodayCount}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Parámetros Validados Hoy</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PROMINENT QUICK BULK VALIDATION BY ORDER */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
                <CheckCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Validación Rápida Masiva de Resultados por Orden
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Revise y apruebe en un solo clic todos los parámetros analíticos de una misma orden médica.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por orden o paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500 w-52"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPriorityFilter('ALL')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                  priorityFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setPriorityFilter('STAT')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                  priorityFilter === 'STAT' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                STAT
              </button>
              <button
                onClick={() => setPriorityFilter('RUTINA')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                  priorityFilter === 'RUTINA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rutina
              </button>
            </div>
          </div>
        </div>

        {/* Orders Card Stack for Rapid Validation */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No se encontraron órdenes que coincidan con el filtro.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const patient = patients.find((p) => p.id === order.patientId);
              const orderResults = getOrderResults(order.id);
              const pendingResults = orderResults.filter((r) => r.status === 'PENDIENTE');
              const validatedResults = orderResults.filter((r) => r.status === 'VALIDADO_TEC' || r.status === 'VALIDADO_MED');
              const criticals = pendingResults.filter((r) => r.flag?.includes('CRITICO'));
              const isExpanded = !!expandedOrders[order.id];

              const selectedForOrder = selectedResultsByOrder[order.id] || [];
              const pendingIds = pendingResults.map((r) => r.id);
              const isAllPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedForOrder.includes(id));

              // Determine target IDs for rapid validation
              const targetIdsToValidate = selectedForOrder.length > 0 ? selectedForOrder : pendingIds;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border transition shadow-sm overflow-hidden ${
                    pendingResults.length > 0 ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200/60 opacity-80'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/5 hover:bg-slate-900/10 transition">
                    <div className="flex items-start space-x-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm">
                        <User className="w-5 h-5 text-teal-400" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{order.orderNumber}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            order.priority === 'STAT' ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {order.priority}
                          </span>
                          {criticals.length > 0 && (
                            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{criticals.length} VALOR CRÍTICO</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-800">
                          {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente Institucional'} —{' '}
                          <span className="text-slate-500 font-mono text-[11px] font-normal">Cédula: {patient?.nationalId || 'N/A'}</span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                          <span>Médico: <strong>{order.doctorName || 'Particular'}</strong></span>
                          <span>•</span>
                          <span>Muestras: <strong>{order.specimens?.length || 1} Tubo(s)</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Group for Order */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {/* Status Badges */}
                      <div className="text-right mr-2 hidden sm:block">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Progreso Técnico</div>
                        <div className="text-xs font-mono font-bold text-slate-800">
                          <span className="text-emerald-600">{validatedResults.length}</span> / {orderResults.length} Validados
                        </div>
                      </div>

                      {/* PDF Report Preview */}
                      {onOpenPdf && (
                        <button
                          onClick={() => onOpenPdf(order.id)}
                          title="Vista Previa PDF"
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}

                      {/* Expand / Collapse Button */}
                      <button
                        onClick={() => toggleExpandOrder(order.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Ocultar Detalle' : 'Ver Parámetros'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* PROMINENT QUICK VALIDATE BUTTON */}
                      {pendingResults.length > 0 ? (
                        <button
                          onClick={() => handleQuickValidateOrder(order, targetIdsToValidate)}
                          className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 flex items-center space-x-2 cursor-pointer transform hover:scale-105 active:scale-95"
                        >
                          <Zap className="w-4 h-4 fill-current text-slate-950" />
                          <span>
                            Validación Rápida ({targetIdsToValidate.length})
                          </span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>ORDEN COMPLETAMENTE VALIDADA</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Parameters Table */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                        <div className="flex items-center space-x-2">
                          {pendingResults.length > 0 && (
                            <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAllPendingSelected}
                                onChange={() => toggleSelectAllOrderResults(order.id, pendingResults)}
                                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer"
                              />
                              <span>Seleccionar Todos los Pendientes ({pendingResults.length})</span>
                            </label>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500 font-mono">
                          Transmisión Automática por Interfaz ASTM / Middleware LIS
                        </span>
                      </div>

                      {/* Parameters Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100/80">
                            <tr>
                              <th className="p-2 w-10 text-center">Sel.</th>
                              <th className="p-2">Examen / Parámetro</th>
                              <th className="p-2 text-center">Resultado</th>
                              <th className="p-2 text-center">Unidades</th>
                              <th className="p-2">Rango de Referencia</th>
                              <th className="p-2 text-center">Estado</th>
                              <th className="p-2 text-right">Acción Individual</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {orderResults.map((res) => {
                              const isPending = res.status === 'PENDIENTE';
                              const isDesvalidado = res.status === 'DESVALIDADO';
                              const isValidated = res.status === 'VALIDADO_TEC' || res.status === 'VALIDADO_MED';
                              const isSelected = (selectedResultsByOrder[order.id] || []).includes(res.id);
                              const isCritical = res.flag?.includes('CRITICO');

                              return (
                                <tr
                                  key={res.id}
                                  className={`transition ${
                                    isDesvalidado
                                      ? 'bg-rose-50/90 border-l-4 border-l-rose-500'
                                      : isCritical
                                      ? 'bg-rose-50/70'
                                      : isSelected
                                      ? 'bg-teal-50'
                                      : 'hover:bg-slate-100/50'
                                  }`}
                                >
                                  <td className="p-2 text-center">
                                    {isDesvalidado ? (
                                      <AlertOctagon className="w-4 h-4 text-rose-600 mx-auto animate-bounce" title="Estado Revocado" />
                                    ) : isPending ? (
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleResultSelection(order.id, res.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer"
                                      />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                    )}
                                  </td>

                                  <td className="p-2">
                                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                      <span className={isDesvalidado ? 'line-through text-slate-500 decoration-rose-500 decoration-2' : ''}>
                                        {res.parameterName}
                                      </span>
                                      {isDesvalidado && (
                                        <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse inline-flex items-center space-x-1">
                                          <XCircle className="w-3 h-3 text-white shrink-0" />
                                          <span>DESVALIDADO</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">{res.testCode}</div>
                                  </td>

                                  <td className="p-2 text-center font-mono font-black text-sm">
                                    {isDesvalidado ? (
                                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-black border border-rose-300 inline-flex items-center space-x-1">
                                        <span className="line-through decoration-rose-600 decoration-2">{res.value}</span>
                                        <span className="text-[9px] text-rose-700 font-mono uppercase tracking-tight">(Revocado)</span>
                                      </span>
                                    ) : (
                                      <span
                                        className={`px-2.5 py-1 rounded-lg ${
                                          isCritical
                                            ? 'bg-rose-600 text-white font-black animate-pulse'
                                            : res.flag === 'ALTO' || res.flag === 'BAJO'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-slate-100 text-slate-900'
                                        }`}
                                      >
                                        {res.value}
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-2 text-center font-mono text-slate-600">{res.unit}</td>

                                  <td className="p-2 font-mono text-[11px] text-slate-500 italic">
                                    {res.refRangeText}
                                  </td>

                                  <td className="p-2 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center space-x-1 ${
                                        isDesvalidado
                                          ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black animate-pulse'
                                          : isPending
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {isDesvalidado && <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />}
                                      <span>{isDesvalidado ? 'DESVALIDADO' : res.status.split('_')[0]}</span>
                                    </span>
                                  </td>

                                  <td className="p-2 text-right">
                                    {isDesvalidado ? (
                                      <button
                                        onClick={() => {
                                          if (onValidateTechnical) onValidateTechnical(res.id);
                                          setLocalResults((prev) =>
                                            prev.map((r) => (r.id === res.id ? { ...r, status: 'VALIDADO_TEC' } : r))
                                          );
                                          showToast(`✓ Parámetro ${res.parameterName} re-validado.`);
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ml-auto"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Re-validar</span>
                                      </button>
                                    ) : isPending ? (
                                      <button
                                        onClick={() => {
                                          if (onValidateTechnical) onValidateTechnical(res.id);
                                          setLocalResults((prev) =>
                                            prev.map((r) => (r.id === res.id ? { ...r, status: 'VALIDADO_TEC' } : r))
                                          );
                                          showToast(`✓ Parámetro ${res.parameterName} validado individualmente.`);
                                        }}
                                        className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                                      >
                                        Validar
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setLocalResults((prev) =>
                                            prev.map((r) => (r.id === res.id ? { ...r, status: 'DESVALIDADO' } : r))
                                          );
                                          showToast(`↺ Parámetro ${res.parameterName} marcado como DESVALIDADO.`);
                                        }}
                                        className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ml-auto"
                                      >
                                        <XCircle className="w-3 h-3 text-rose-600" />
                                        <span>Desvalidar</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: BARCODE SCANNER & SPECIMENS INVENTORY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell 1: Barcode Scanner Simulator (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-cyan-600" />
                <span>Escanear Código / QR de Muestra</span>
              </h3>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2.5 py-0.5 rounded-full">
                Lector Láser ASTM
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Ingresar o Escanear Código Barcode:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. BC-882001"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold w-full focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={handleScanBarcode}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm shrink-0 flex items-center space-x-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Disparo</span>
                  </button>
                </div>
              </div>

              {lastScanned && (
                <div className="bg-emerald-50/80 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs space-y-1 mt-4 animate-in fade-in">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tubo Receptado Exitosamente</span>
                  </div>
                  <div className="text-[11px]">
                    Barcode <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">{lastScanned.barcode}</code> — Tipo: {lastScanned.tubeType}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    Estado: EN ANALIZADOR
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            Cadena de custodia rastreable por número de lote y posición de gradilla.
          </div>
        </div>

        {/* Bento Cell 2: Specimens Inventory Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <TestTube className="w-4 h-4 text-teal-600" />
              <span>Estado de Gradilla y Muestras de la Jornada</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {allSpecimens.length} Tubos Procesados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allSpecimens.map((sp) => (
              <div key={sp.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 space-y-2 hover:border-cyan-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-black text-slate-900">{sp.barcode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono ${
                      sp.status === 'EN_ANALIZADOR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sp.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 font-bold">Tubo: {sp.tubeType}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Flebotomía: {sp.collectedAt ? new Date(sp.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:30'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <SampleIntegrityBadge
                    specimen={sp}
                    barcode={sp.barcode}
                    tubeType={sp.tubeType}
                    phlebotomyTime={sp.collectedAt}
                    isCompact={false}
                    showModalOnClick={true}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
