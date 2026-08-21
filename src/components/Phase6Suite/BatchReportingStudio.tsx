import React, { useState, useMemo } from 'react';
import {
  FileText, Archive, Mail, CheckSquare, Square, Filter, Search,
  Download, Eye, Send, AlertCircle, CheckCircle2, ShieldCheck,
  Clock, Sparkles, Building2, User, RefreshCw, Layers, FileSpreadsheet,
  Settings, ExternalLink, Printer, Check, X, AlertTriangle, ChevronRight
} from 'lucide-react';
import { Order, Patient, TestResult, Tenant, Branch } from '../../types';
import {
  batchReportingService,
  EmailDispatchConfig,
  EmailDispatchLog,
  BatchGenerationResult
} from '../../utils/batchReportingService';

interface BatchReportingStudioProps {
  orders: Order[];
  patients: Patient[];
  results: TestResult[];
  tenant: Tenant;
  branch: Branch;
  onOpenSinglePdf?: (orderId: string) => void;
}

export const BatchReportingStudio: React.FC<BatchReportingStudioProps> = ({
  orders,
  patients,
  results,
  tenant,
  branch,
  onOpenSinglePdf
}) => {
  // Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(() => {
    // Default select validated orders
    return orders.filter(o => o.status === 'VALIDADA_MED' || o.status === 'COMPLETADA').map(o => o.id);
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALIDADA_MED' | 'VALIDADA_TEC' | 'COMPLETADA'>('VALIDADA_MED');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'STAT' | 'RUTINA'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [consentFilter, setConsentFilter] = useState<'ALL' | 'CONSENT_GRANTED' | 'CONSENT_PENDING'>('ALL');

  // Generation Loading States
  const [isGeneratingConsolidatedPdf, setIsGeneratingConsolidatedPdf] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; order: string } | null>(null);

  // Consolidated PDF Result Preview Modal
  const [consolidatedResult, setConsolidatedResult] = useState<BatchGenerationResult | null>(null);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Email Dispatch Modal & State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDispatchingEmails, setIsDispatchingEmails] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState({ current: 0, total: 0 });
  const [dispatchLogs, setDispatchLogs] = useState<EmailDispatchLog[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailDispatchConfig>({
    senderName: `${tenant.name} — Notificaciones Oficiales`,
    senderEmail: 'resultados@labsanjose.pa',
    replyTo: 'atencion@labsanjose.pa',
    subjectTemplate: 'Resultados Oficiales de Laboratorio — Orden {{numero_orden}} ({{paciente_nombre}})',
    bodyTemplate: `Estimado(a) {{paciente_nombre}},\n\nLe informamos que sus análisis clínicos correspondientes a la Orden {{numero_orden}} han sido validados médicamente por la Dirección Técnica de ${tenant.name}.\n\nAdjunto a este correo encontrará su informe oficial en formato PDF certificado con firma digital y código de validación MINSA.\n\nTambién puede consultar su historial en cualquier momento a través de nuestro portal web seguro:\n{{enlace_portal}}\n\nAtentamente,\nDirección Técnica & Equipo de Laboratorio\n${tenant.name} — ${branch.name}\nTeléfono de atención: ${branch.phone}`,
    includePdfAttachment: true,
    delayPerEmailMs: 450
  });

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const patient = patients.find(p => p.id === order.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : order.patientName;
      const nationalId = patient?.nationalId || order.patientNationalId;
      const doctor = order.doctorName || '';

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = patientName.toLowerCase().includes(q);
        const matchesId = nationalId.toLowerCase().includes(q);
        const matchesOrder = order.orderNumber.toLowerCase().includes(q);
        const matchesDoctor = doctor.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesOrder && !matchesDoctor) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Priority Filter
      if (priorityFilter !== 'ALL' && order.priority !== priorityFilter) {
        return false;
      }

      // Branch Filter
      if (branchFilter !== 'ALL' && order.branchId !== branchFilter) {
        return false;
      }

      // Consent Filter
      if (consentFilter === 'CONSENT_GRANTED' && !patient?.dataConsentLey81) {
        return false;
      }
      if (consentFilter === 'CONSENT_PENDING' && patient?.dataConsentLey81) {
        return false;
      }

      return true;
    });
  }, [orders, patients, searchQuery, statusFilter, priorityFilter, branchFilter, consentFilter]);

  // Selected Orders Subset
  const selectedOrders = useMemo(() => {
    return orders.filter(o => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  // Handle Selection Toggles
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Generate Consolidated PDF
  const handleGenerateConsolidatedPdf = async () => {
    if (selectedOrders.length === 0) return;
    setIsGeneratingConsolidatedPdf(true);
    try {
      const result = await batchReportingService.generateConsolidatedPdf(
        selectedOrders,
        patients,
        results,
        tenant,
        branch,
        { includeCover: true }
      );
      setConsolidatedResult(result);
    } catch (err) {
      console.error('Error generating consolidated PDF:', err);
    } finally {
      setIsGeneratingConsolidatedPdf(false);
    }
  };

  // Generate and Download .ZIP Archive
  const handleDownloadZipPackage = async () => {
    if (selectedOrders.length === 0) return;
    setIsGeneratingZip(true);
    setZipProgress({ current: 0, total: selectedOrders.length, order: 'Iniciando empaquetado...' });
    try {
      const result = await batchReportingService.generateZipPackage(
        selectedOrders,
        patients,
        results,
        tenant,
        branch,
        (processed, total, currentOrder) => {
          setZipProgress({ current: processed, total, order: currentOrder });
        }
      );

      // Trigger automatic browser download
      const link = document.createElement('a');
      link.href = result.blobUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error creating ZIP archive:', err);
    } finally {
      setIsGeneratingZip(false);
      setZipProgress(null);
    }
  };

  // Launch Batch Email Dispatch
  const handleStartEmailDispatch = async () => {
    if (selectedOrders.length === 0) return;
    setIsDispatchingEmails(true);
    setDispatchProgress({ current: 0, total: selectedOrders.length });
    setDispatchLogs([]);

    try {
      await batchReportingService.dispatchBatchEmails(
        selectedOrders,
        patients,
        results,
        tenant,
        branch,
        emailConfig,
        (log, current, total) => {
          setDispatchLogs(prev => [log, ...prev]);
          setDispatchProgress({ current, total });
        }
      );
    } catch (err) {
      console.error('Error dispatching batch emails:', err);
    } finally {
      setIsDispatchingEmails(false);
    }
  };

  // Export Dispatch Logs to CSV
  const handleExportLogsCsv = () => {
    if (dispatchLogs.length === 0) return;
    const headers = 'ID_Log,Orden,Paciente,Cedula,Email,Estado,Mensaje,Archivo_PDF,Codigo_SMTP\n';
    const rows = dispatchLogs.map(l =>
      `"${l.id}","${l.orderNumber}","${l.patientName}","${l.patientNationalId}","${l.patientEmail}","${l.status}","${l.message.replace(/"/g, '""')}","${l.pdfFilename || ''}","${l.smtpCode || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_Envio_Masivo_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Metrics
  const validatedCount = orders.filter(o => o.status === 'VALIDADA_MED').length;
  const consentCount = patients.filter(p => p.dataConsentLey81).length;
  const consentRate = patients.length > 0 ? Math.round((consentCount / patients.length) * 100) : 100;

  // Selected First Patient for dynamic preview
  const firstSelectedOrder = selectedOrders[0] || orders[0];
  const firstSelectedPatient = patients.find(p => p.id === firstSelectedOrder?.patientId) || patients[0];

  const previewSubject = firstSelectedOrder && firstSelectedPatient
    ? batchReportingService.interpolateTemplate(emailConfig.subjectTemplate, firstSelectedOrder, firstSelectedPatient, tenant, branch)
    : 'Vista previa de asunto';

  const previewBody = firstSelectedOrder && firstSelectedPatient
    ? batchReportingService.interpolateTemplate(emailConfig.bodyTemplate, firstSelectedOrder, firstSelectedPatient, tenant, branch)
    : 'Vista previa de cuerpo de correo';

  return (
    <div className="space-y-6 animate-fade-in" id="batch-reporting-studio">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Módulo Clínico • Emisión Masiva de Informes
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Ley 81 / Certificación Digital
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Batch Reporting & Despacho de Resultados
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Genere de forma masiva <strong className="text-white">PDFs consolidados</strong>, descargue paquetes comprimidos en <strong className="text-teal-300">archivo .ZIP</strong> con todos los informes individuales y ejecute el <strong className="text-blue-300">envío automatizado de correos electrónicos</strong> a pacientes con trazabilidad completa.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center shadow-lg">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Validadas Médicas</div>
              <div className="text-2xl font-black text-teal-400 mt-0.5">{validatedCount}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Listas para reporte</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center shadow-lg">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Seleccionadas</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {selectedOrderIds.length} <span className="text-xs font-normal text-slate-500">/ {filteredOrders.length}</span>
              </div>
              <div className="text-[9px] text-teal-400 mt-0.5">Para procesamiento</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center col-span-2 sm:col-span-1 shadow-lg">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Consentimiento Ley 81</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{consentRate}%</div>
              <div className="text-[9px] text-emerald-500/80 mt-0.5">Autorizado para email</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por paciente, cédula, orden (ORD-2026-...) o médico referente..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2">Estado:</span>
              <button
                onClick={() => setStatusFilter('VALIDADA_MED')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  statusFilter === 'VALIDADA_MED'
                    ? 'bg-teal-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Validadas
              </button>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  statusFilter === 'ALL'
                    ? 'bg-teal-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2">Prioridad:</span>
              <button
                onClick={() => setPriorityFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  priorityFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setPriorityFilter('STAT')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  priorityFilter === 'STAT'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                STAT
              </button>
            </div>

            {/* Consent Filter */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-2">Ley 81:</span>
              <button
                onClick={() => setConsentFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  consentFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setConsentFilter('CONSENT_GRANTED')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  consentFilter === 'CONSENT_GRANTED'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Con Consentimiento
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-teal-400" />
                  <span>Deseleccionar Todos</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Seleccionar Todos ({filteredOrders.length})</span>
                </>
              )}
            </button>

            <span className="text-xs text-slate-400 font-medium hidden md:inline">
              <strong className="text-white">{selectedOrderIds.length}</strong> órdenes marcadas para emisión
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* 1. Consolidated PDF Button */}
            <button
              onClick={handleGenerateConsolidatedPdf}
              disabled={selectedOrderIds.length === 0 || isGeneratingConsolidatedPdf}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-lg cursor-pointer ${
                selectedOrderIds.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/20 active:scale-95'
              }`}
              title="Genera un único archivo PDF con todos los informes consecutivos"
            >
              {isGeneratingConsolidatedPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Compilando PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>PDF Consolidado ({selectedOrderIds.length})</span>
                </>
              )}
            </button>

            {/* 2. ZIP Archive Package Button */}
            <button
              onClick={handleDownloadZipPackage}
              disabled={selectedOrderIds.length === 0 || isGeneratingZip}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-lg cursor-pointer ${
                selectedOrderIds.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-slate-900 active:scale-95'
              }`}
              title="Descarga un archivo .ZIP con todos los PDFs individuales, resumen CSV y manifiesto JSON"
            >
              {isGeneratingZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  <span>
                    Empaquetando ({zipProgress?.current}/{zipProgress?.total})...
                  </span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>Descargar Paquete .ZIP</span>
                </>
              )}
            </button>

            {/* 3. Batch Email Dispatch Button */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              disabled={selectedOrderIds.length === 0}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-lg cursor-pointer ${
                selectedOrderIds.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-95'
              }`}
              title="Abre el centro de envío masivo de correos a pacientes"
            >
              <Mail className="w-4 h-4 text-blue-200" />
              <span>Envío Masivo ({selectedOrderIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-4 px-4 w-10 text-center">
                  <span className="sr-only">Seleccionar</span>
                </th>
                <th className="py-4 px-4">Orden / Fecha</th>
                <th className="py-4 px-4">Paciente & Cédula</th>
                <th className="py-4 px-4">Médico / Sede</th>
                <th className="py-4 px-4">Pruebas / Resultados</th>
                <th className="py-4 px-4">Estado / Prioridad</th>
                <th className="py-4 px-4">Ley 81 / Email</th>
                <th className="py-4 px-4 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-bold text-slate-400">No se encontraron órdenes con los filtros actuales.</p>
                      <p className="text-[11px]">Intente cambiar el estado o limpiar la búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const patient = patients.find(p => p.id === order.patientId);
                  const isSelected = selectedOrderIds.includes(order.id);
                  const orderResults = results.filter(r => r.orderId === order.id);
                  const hasCritical = orderResults.some(r => r.flag?.includes('CRITICO'));

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleToggleOrder(order.id)}
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        isSelected ? 'bg-teal-500/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleOrder(order.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>

                      {/* Order & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {hasCritical && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Contiene resultados críticos" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{order.createdAt.slice(0, 10)}</span>
                        </div>
                      </td>

                      {/* Patient & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{order.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {order.patientNationalId} • {order.patientAge} años ({order.patientGender})
                        </div>
                      </td>

                      {/* Doctor & Branch */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 text-[11px] truncate max-w-[170px]" title={order.doctorName || 'Particular'}>
                          {order.doctorName || 'Particular'}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-600" />
                          <span>{branch.name}</span>
                        </div>
                      </td>

                      {/* Tests Summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-800 text-teal-300 font-bold px-2 py-0.5 rounded-md text-[10px]">
                            {order.testIds.length} Análisis
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            ({orderResults.length} Parámetros)
                          </span>
                        </div>
                      </td>

                      {/* Status & Priority */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'VALIDADA_MED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {order.status === 'VALIDADA_MED' ? 'Validada Médica' : order.status}
                          </span>

                          {order.priority === 'STAT' && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                              STAT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ley 81 & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {patient?.dataConsentLey81 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                              <Check className="w-3 h-3" /> Ley 81 OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                              <AlertTriangle className="w-3 h-3" /> Sin Firma
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={patient?.email || 'Sin correo'}>
                            {patient?.email || <span className="italic text-slate-500">Sin correo</span>}
                          </div>
                        </div>
                      </td>

                      {/* Quick Action */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (onOpenSinglePdf) {
                              onOpenSinglePdf(order.id);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                          title="Previsualizar PDF individual de esta orden"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            Mostrando <strong className="text-white">{filteredOrders.length}</strong> de <strong className="text-white">{orders.length}</strong> órdenes totales
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Listos para compilación continua y exportación</span>
          </div>
        </div>
      </div>

      {/* CONSOLIDATED PDF PREVIEW MODAL */}
      {consolidatedResult && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Informe Clínico Consolidado</h3>
                  <p className="text-xs text-slate-400">
                    {consolidatedResult.itemCount} Órdenes procesadas • {(consolidatedResult.sizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={consolidatedResult.blobUrl}
                  download={consolidatedResult.filename}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </a>
                <button
                  onClick={() => setConsolidatedResult(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Multi-order viewer */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Cover Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-teal-400">Archivo Generado:</div>
                  <div className="text-sm font-mono text-white font-bold">{consolidatedResult.filename}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">HASH SHA-256</div>
                  <div className="text-[10px] font-mono text-emerald-400">8f9b2a1c6e4d7f0a3b8c2e1f5</div>
                </div>
              </div>

              {/* Order Navigator inside Consolidated Report */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Contenido del Documento ({selectedOrders.length} Pacientes):
                  </span>
                  <span className="text-xs text-teal-400 font-bold">
                    Paciente {previewPageIndex + 1} de {selectedOrders.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedOrders.map((ord, idx) => (
                    <button
                      key={ord.id}
                      onClick={() => setPreviewPageIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        previewPageIndex === idx
                          ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                      }`}
                    >
                      <span>{idx + 1}.</span>
                      <span>{ord.patientName.split(' ')[0]} ({ord.orderNumber.slice(-5)})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Fidelity Render of the Selected Page */}
              {selectedOrders[previewPageIndex] && (
                <div className="bg-white text-slate-950 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 font-sans space-y-6">
                  {/* Header Letterhead */}
                  <div className="border-b-2 border-teal-600 pb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">{tenant.name.toUpperCase()}</h2>
                      <p className="text-xs text-slate-600 font-medium">{branch.name} — {branch.address}</p>
                      <p className="text-[11px] text-slate-500">Tel: {branch.phone} • RUC: {tenant.ruc} DV: {tenant.dv}</p>
                    </div>
                    <div className="text-right bg-teal-50 border border-teal-200 p-2.5 rounded-xl">
                      <div className="text-xs font-black text-teal-900">ORDEN: {selectedOrders[previewPageIndex].orderNumber}</div>
                      <div className="text-[10px] text-teal-700">Fecha: {selectedOrders[previewPageIndex].createdAt.slice(0, 10)}</div>
                      <div className="text-[10px] font-bold text-slate-600">Prioridad: {selectedOrders[previewPageIndex].priority}</div>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Paciente:</span>
                      <strong className="text-slate-900 text-sm">{selectedOrders[previewPageIndex].patientName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Cédula:</span>
                      <span className="font-mono text-slate-800 font-bold">{selectedOrders[previewPageIndex].patientNationalId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Edad / Sexo:</span>
                      <span className="text-slate-800">{selectedOrders[previewPageIndex].patientAge} Años / {selectedOrders[previewPageIndex].patientGender}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Médico:</span>
                      <span className="text-slate-800">{selectedOrders[previewPageIndex].doctorName || 'Particular'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Estado:</span>
                      <span className="text-emerald-700 font-bold">VALIDADA MÉDICAMENTE</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Emisión:</span>
                      <span className="text-slate-800">{new Date().toLocaleDateString('es-PA')}</span>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-teal-800 tracking-wider mb-2">
                      Resultados de Laboratorio Clínico
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Análisis / Parámetro</th>
                          <th className="p-2.5">Resultado</th>
                          <th className="p-2.5">Unidad</th>
                          <th className="p-2.5">Valores de Referencia</th>
                          <th className="p-2.5 text-right">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.filter(r => r.orderId === selectedOrders[previewPageIndex].id).map(r => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">
                              {r.parameterName}
                              <span className="block text-[9px] text-slate-400 font-normal">[{r.specimenType}]</span>
                            </td>
                            <td className="p-2.5 font-black text-slate-900 text-sm">{r.value}</td>
                            <td className="p-2.5 text-slate-600">{r.unit}</td>
                            <td className="p-2.5 text-slate-600">{r.refRangeText}</td>
                            <td className="p-2.5 text-right">
                              {r.flag && r.flag !== 'NORMAL' ? (
                                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {r.flag}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-bold text-[10px]">NORMAL</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Validation Stamp */}
                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-500">
                    <div>
                      <div className="font-bold text-teal-800">✓ Validado por Dirección Técnica de Laboratorio</div>
                      <div>Lic. Carlos Castillo — Idoneidad TM-3109-PA</div>
                    </div>
                    <div className="font-mono text-right">
                      <div>Certificación Digital SHA-256</div>
                      <div>Página {previewPageIndex + 1} de {selectedOrders.length}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-400">
                Página <strong className="text-white">{previewPageIndex + 1}</strong> de <strong className="text-white">{selectedOrders.length}</strong>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  disabled={previewPageIndex === 0}
                  onClick={() => setPreviewPageIndex(prev => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  disabled={previewPageIndex === selectedOrders.length - 1}
                  onClick={() => setPreviewPageIndex(prev => Math.min(selectedOrders.length - 1, prev + 1))}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Siguiente
                </button>
                <a
                  href={consolidatedResult.blobUrl}
                  download={consolidatedResult.filename}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Descargar Archivo Completo
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASS EMAIL DISPATCH MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Despacho Masivo de Correos a Pacientes</h3>
                  <p className="text-xs text-slate-400">
                    Envío automatizado de PDFs individuales a los {selectedOrders.length} pacientes seleccionados
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEmailModalOpen(false)}
                disabled={isDispatchingEmails}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Config & Template Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Email Config & Placeholders */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-teal-400" />
                    Configuración de Servidor & Plantilla
                  </h4>

                  <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Nombre del Remitente:</label>
                      <input
                        type="text"
                        value={emailConfig.senderName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Asunto del Correo:</label>
                      <input
                        type="text"
                        value={emailConfig.subjectTemplate}
                        onChange={(e) => setEmailConfig({ ...emailConfig, subjectTemplate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Cuerpo del Mensaje:</label>
                      <textarea
                        rows={6}
                        value={emailConfig.bodyTemplate}
                        onChange={(e) => setEmailConfig({ ...emailConfig, bodyTemplate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium text-[11px] focus:border-teal-500 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Dynamic Variables Chips */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Tokens Dinámicos Disponibles:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '{{paciente_nombre}}',
                          '{{numero_orden}}',
                          '{{cedula}}',
                          '{{fecha_emision}}',
                          '{{laboratorio}}',
                          '{{sede}}',
                          '{{enlace_portal}}'
                        ].map((token) => (
                          <span
                            key={token}
                            className="bg-slate-900 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded text-[10px] font-mono select-all"
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview of First Recipient */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    Vista Previa en Vivo (Paciente: {firstSelectedPatient?.firstName} {firstSelectedPatient?.lastName})
                  </h4>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs shadow-inner">
                    <div className="border-b border-slate-800 pb-2.5 space-y-1">
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-200">De:</strong> {emailConfig.senderName} &lt;{emailConfig.senderEmail}&gt;
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-200">Para:</strong> {firstSelectedPatient?.email || 'paciente@ejemplo.com'}
                      </div>
                      <div className="text-[11px] text-teal-300 font-bold">
                        <strong className="text-slate-200">Asunto:</strong> {previewSubject}
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl text-slate-300 whitespace-pre-line text-[11px] leading-relaxed border border-slate-800">
                      {previewBody}
                    </div>

                    {/* PDF Attachment Simulation Badge */}
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-teal-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">
                          PDF
                        </div>
                        <div>
                          <div className="font-bold text-white text-[11px]">
                            {firstSelectedOrder?.orderNumber}_{firstSelectedPatient?.firstName}_{firstSelectedPatient?.lastName}.pdf
                          </div>
                          <div className="text-[10px] text-slate-400">142 KB • Firma Digital Ley 81</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        Adjunto Auto
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Execution Logs & Progress */}
              {(isDispatchingEmails || dispatchLogs.length > 0) && (
                <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isDispatchingEmails && <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />}
                      <span className="text-xs font-black uppercase text-white tracking-wider">
                        {isDispatchingEmails ? 'Progreso de Envío en Tiempo Real' : 'Resultado del Lote de Envío'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-400">
                      {dispatchProgress.current} de {dispatchProgress.total} ({Math.round((dispatchProgress.current / Math.max(1, dispatchProgress.total)) * 100)}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-300"
                      style={{
                        width: `${Math.round((dispatchProgress.current / Math.max(1, dispatchProgress.total)) * 100)}%`
                      }}
                    />
                  </div>

                  {/* Logs Table */}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-900 text-slate-400 text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Hora</th>
                          <th className="py-2 px-3">Orden</th>
                          <th className="py-2 px-3">Paciente</th>
                          <th className="py-2 px-3">Estado</th>
                          <th className="py-2 px-3">Mensaje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {dispatchLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 text-slate-500">{log.timestamp}</td>
                            <td className="py-2 px-3 font-bold text-white">{log.orderNumber}</td>
                            <td className="py-2 px-3">{log.patientName}</td>
                            <td className="py-2 px-3">
                              {log.status === 'SENT' && (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Enviado
                                </span>
                              )}
                              {log.status === 'SENDING' && (
                                <span className="text-teal-400 flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Procesando
                                </span>
                              )}
                              {log.status === 'CONSENT_MISSING' && (
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Ley 81 Bloqueo
                                </span>
                              )}
                              {log.status === 'FAILED' && (
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Falló
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-400 truncate max-w-[280px]" title={log.message}>
                              {log.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-400">
                Total a enviar: <strong className="text-white">{selectedOrders.length}</strong> correos
              </div>
              <div className="flex items-center space-x-3">
                {dispatchLogs.length > 0 && !isDispatchingEmails && (
                  <button
                    onClick={handleExportLogsCsv}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Descargar Auditoría CSV</span>
                  </button>
                )}

                <button
                  onClick={handleStartEmailDispatch}
                  disabled={isDispatchingEmails || selectedOrders.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 disabled:opacity-40 text-white font-black rounded-xl text-xs transition shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {isDispatchingEmails ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Despachando Correos ({dispatchProgress.current}/{dispatchProgress.total})...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>Iniciar Despacho Masivo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
