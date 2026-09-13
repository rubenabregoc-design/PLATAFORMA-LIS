import React, { useState, useMemo } from 'react';
import { Order, TestResult, Patient } from '../../types';
import {
  UserCheck, FileText, Download, Search, CheckCircle2, Plus,
  Stethoscope, ShieldAlert, Award, ShieldCheck, QrCode,
  Calendar, Clock, AlertTriangle, Eye, ChevronDown, ChevronUp,
  Building2, Hash, Sparkles, Filter, Check, RefreshCw
} from 'lucide-react';

export interface DoctorPortalProps {
  orders: Order[];
  results: TestResult[];
  patients?: Patient[];
  onOpenPdf: (orderId: string) => void;
  onCreateOrder?: (newOrder: Order) => void;
  doctorInfo?: {
    name: string;
    license: string;
    clinic: string;
    specialty?: string;
    minsaVerified?: boolean;
    minsaRegistrationNumber?: string;
  };
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  orders,
  results,
  patients = [],
  onOpenPdf,
  onCreateOrder,
  doctorInfo = {
    name: 'Dr. Roberto Icaza (Médico Especialista)',
    license: 'MED-10492-PA',
    clinic: 'Consultorios Médicos Paitilla — Sede Vía España',
    specialty: 'Medicina Interna & Cuidados Críticos',
    minsaVerified: true,
    minsaRegistrationNumber: 'RM-5420-PA'
  }
}) => {
  const [activeTab, setActiveTab] = useState<'expedientes' | 'idoneidad' | 'requisition' | 'batch'>('expedientes');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALIDADA_MED' | 'EN_PROCESO' | 'PANIC'>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Formulario de nueva requisición electrónica
  const [patientCedula, setPatientCedula] = useState('8-812-4432');
  const [patientName, setPatientName] = useState('María Elena González');
  const [patientGender, setPatientGender] = useState<'M' | 'F'>('F');
  const [patientAge, setPatientAge] = useState<number>(32);
  const [icdCode, setIcdCode] = useState('E11.9 — Diabetes Mellitus Tipo 2 no especificada');
  const [selectedTests, setSelectedTests] = useState<string[]>([
    'Hemograma Completo con Plaquetas',
    'Glucosa en Ayunas',
    'Hemoglobina Glicosilada (HbA1c)',
    'Perfil Lipídico Completo'
  ]);
  const [doctorNotes, setDoctorNotes] = useState('Control metabólico trimestral. Ayuno estricto de 10 a 12 horas.');
  const [priorityOrder, setPriorityOrder] = useState<'RUTINA' | 'URGENTE'>('RUTINA');
  const [orderCreatedSuccess, setOrderCreatedSuccess] = useState<string | null>(null);

  // Selección para descarga por lote
  const [selectedBatchOrders, setSelectedBatchOrders] = useState<string[]>([]);

  // Filtrado reactivo de expedientes
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        (ord.patientName || '').toLowerCase().includes(q) ||
        (ord.patientNationalId || '').toLowerCase().includes(q) ||
        (ord.orderNumber || '').toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (statusFilter === 'VALIDADA_MED') {
        return ord.status === 'VALIDADA_MED';
      }
      if (statusFilter === 'EN_PROCESO') {
        return ord.status !== 'VALIDADA_MED';
      }
      if (statusFilter === 'PANIC') {
        const orderResults = results.filter((r) => r.orderId === ord.id);
        return orderResults.some((r) => r.flag === 'PANICO' || r.flag === 'CRITICO');
      }

      return true;
    });
  }, [orders, results, searchQuery, statusFilter]);

  // Contadores analíticos del portal médico
  const metrics = useMemo(() => {
    const totalPatients = new Set(orders.map((o) => o.patientNationalId || o.patientId)).size;
    const validatedOrders = orders.filter((o) => o.status === 'VALIDADA_MED').length;
    const pendingOrders = orders.filter((o) => o.status !== 'VALIDADA_MED').length;
    const panicAlerts = results.filter((r) => r.flag === 'PANICO' || r.flag === 'CRITICO').length;

    return { totalPatients, validatedOrders, pendingOrders, panicAlerts };
  }, [orders, results]);

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();

    const newOrderNumber = `REQ-DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-doc-${Date.now()}`,
      tenantId: 'lab-san-jose',
      branchId: 'branch-via-espana',
      orderNumber: newOrderNumber,
      patientId: `pat-${Date.now()}`,
      patientName,
      patientNationalId: patientCedula,
      patientGender,
      patientAge,
      doctorId: 'doc-icaza',
      doctorName: `${doctorInfo.name} (${doctorInfo.license})`,
      priority: priorityOrder,
      status: 'REGISTRADA',
      createdAt: new Date().toISOString(),
      totalAmount: selectedTests.length * 15,
      paymentStatus: 'PENDIENTE',
      specimens: [],
      testIds: selectedTests.map((_, i) => `test-custom-${i}`)
    };

    if (onCreateOrder) {
      onCreateOrder(newOrder);
    }

    setOrderCreatedSuccess(newOrderNumber);
    setTimeout(() => setOrderCreatedSuccess(null), 5000);
    setActiveTab('expedientes');
  };

  const handleToggleSelectAllBatch = () => {
    if (selectedBatchOrders.length === filteredOrders.length) {
      setSelectedBatchOrders([]);
    } else {
      setSelectedBatchOrders(filteredOrders.map((o) => o.id));
    }
  };

  const handleBatchDownload = () => {
    if (selectedBatchOrders.length === 0) return;
    selectedBatchOrders.forEach((ordId) => {
      onOpenPdf(ordId);
    });
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* 🌟 Banner Superior de Pasarela Médica de Expedientes e Idoneidad */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-400/40 text-xs font-bold text-indigo-300 shadow-inner">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
              <span>MINSA República de Panamá • Consejo Técnico de Salud</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Idoneidad Verificada</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <span>{doctorInfo.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Especialidad: <strong className="text-indigo-200">{doctorInfo.specialty}</strong> •{' '}
              Idoneidad N°: <span className="font-mono font-bold text-cyan-300">{doctorInfo.license}</span> •{' '}
              {doctorInfo.clinic}
            </p>
          </div>

          {/* Tarjeta de Idoneidad Oficial MINSA (Resumen) */}
          <div className="bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 text-xs space-y-1.5 shadow-xl shrink-0 min-w-[260px]">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono font-bold text-slate-300">Registro: {doctorInfo.minsaRegistrationNumber}</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px]">
                VIGENTE
              </span>
            </div>
            <div className="text-slate-200 font-bold flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Firma Digital Ley 81 Habilitada</span>
            </div>
            <div className="text-[11px] text-indigo-300 font-mono">
              Certificación Criptográfica SHA-256
            </div>
          </div>
        </div>

        {/* Métrica Dashboard Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Pacientes Referidos</div>
            <div className="text-xl sm:text-2xl font-black text-white">{metrics.totalPatients}</div>
          </div>
          <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-emerald-400 font-semibold uppercase">Resultados Listos</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300">{metrics.validatedOrders}</div>
          </div>
          <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-amber-400 font-semibold uppercase">En Proceso Técnico</div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">{metrics.pendingOrders}</div>
          </div>
          <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-rose-400 font-semibold uppercase">Valores de Pánico</div>
            <div className="text-xl sm:text-2xl font-black text-rose-400">{metrics.panicAlerts}</div>
          </div>
        </div>
      </div>

      {/* 🎛️ Barra de Pestañas Principales del Portal del Médico */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('expedientes')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'expedientes'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pasarela de Expedientes & Resultados</span>
          </button>

          <button
            onClick={() => setActiveTab('idoneidad')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'idoneidad'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Idoneidad Médica & Firma MINSA</span>
          </button>

          <button
            onClick={() => setActiveTab('requisition')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'requisition'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Requisición Electrónica (CIE-10)</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Descarga en Lote</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Sesión Activa: <strong className="text-white">{doctorInfo.license}</strong>
        </div>
      </div>

      {orderCreatedSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-sm font-bold flex items-center space-x-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>¡Requisición médica {orderCreatedSuccess} transmitida con éxito al sistema LIS del laboratorio!</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 1: PASARELA DE EXPEDIENTES CLÍNICOS & RESULTADOS            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'expedientes' && (
        <div className="space-y-4">
          {/* Controles de Búsqueda y Filtro */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por paciente, cédula o N° orden..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 font-medium placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Todos ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('VALIDADA_MED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'VALIDADA_MED' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-emerald-400 hover:text-white'
                }`}
              >
                Validados ({metrics.validatedOrders})
              </button>
              <button
                onClick={() => setStatusFilter('EN_PROCESO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'EN_PROCESO' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-amber-400 hover:text-white'
                }`}
              >
                En Proceso ({metrics.pendingOrders})
              </button>
              <button
                onClick={() => setStatusFilter('PANIC')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'PANIC' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-rose-400 hover:text-white'
                }`}
              >
                Pánicos ({metrics.panicAlerts})
              </button>
            </div>
          </div>

          {/* Lista de Expedientes Clínicos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">N° Orden</th>
                    <th className="p-4">Paciente & Cédula</th>
                    <th className="p-4">Fecha Toma</th>
                    <th className="p-4">Diagnóstico / Prioridad</th>
                    <th className="p-4">Estado LIS</th>
                    <th className="p-4 text-center">Analitos</th>
                    <th className="p-4 text-right">Informe Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                        No se encontraron expedientes con los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const orderResults = results.filter((r) => r.orderId === ord.id);
                      const hasPanic = orderResults.some((r) => r.flag === 'PANICO' || r.flag === 'CRITICO');
                      const isExpanded = expandedOrderId === ord.id;

                      return (
                        <React.Fragment key={ord.id}>
                          <tr className={`hover:bg-indigo-950/20 transition ${hasPanic ? 'bg-rose-950/10' : ''}`}>
                            <td className="p-4 font-mono font-bold text-indigo-300">
                              {ord.orderNumber}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-white text-sm">{ord.patientName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                Cédula: {ord.patientNationalId || 'N/A'} • {ord.patientAge ? `${ord.patientAge} años` : ''} • Sexo: {ord.patientGender || 'N/A'}
                              </div>
                            </td>
                            <td className="p-4 text-slate-300 font-mono text-xs">
                              {new Date(ord.createdAt).toLocaleDateString('es-PA', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="p-4">
                              <span className="text-xs text-slate-300 font-medium block">
                                {ord.clinicalIndication || 'Evaluación de Control Ambulatorio'}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                                ord.priority === 'STAT' || ord.priority === 'URGENTE'
                                  ? 'bg-rose-900/60 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {ord.priority || 'RUTINA'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 ${
                                ord.status === 'VALIDADA_MED'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}>
                                {ord.status === 'VALIDADA_MED' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>VALIDADO</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    <span>EN PROCESO</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 px-2.5 py-1 rounded-xl transition cursor-pointer inline-flex items-center space-x-1"
                              >
                                <span>{orderResults.length} pruebas</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => onOpenPdf(ord.id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-indigo-600/25 flex items-center space-x-1.5 ml-auto cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF Oficial (QR)</span>
                              </button>
                            </td>
                          </tr>

                          {/* Acordeón de Analitos Desplegable */}
                          {isExpanded && (
                            <tr className="bg-slate-950/60">
                              <td colSpan={7} className="p-4">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Resultados Analíticos Inmediatos de la Orden {ord.orderNumber}</span>
                                  </div>

                                  {orderResults.length === 0 ? (
                                    <div className="text-xs text-slate-500 py-2">
                                      Muestras en fase analítica. Los resultados aparecerán aquí tan pronto sean transmitidos por los analizadores.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                      {orderResults.map((r) => (
                                        <div
                                          key={r.id}
                                          className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                            r.flag === 'PANICO' || r.flag === 'CRITICO'
                                              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                                              : r.flag === 'ALTO' || r.flag === 'BAJO'
                                              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                                              : 'bg-slate-950 border-slate-800 text-slate-200'
                                          }`}
                                        >
                                          <div>
                                            <div className="font-bold text-white">{r.parameterName}</div>
                                            <div className="text-[10px] text-slate-400">
                                              Ref: {r.refRangeText || 'Normal'} {r.unit}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-mono font-black text-sm">
                                              {r.value} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span>
                                            </div>
                                            {r.flag && r.flag !== 'NORMAL' && (
                                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                                                {r.flag}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 2: IDONEIDAD MÉDICA & FIRMA DIGITAL MINSA (PASARELA)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'idoneidad' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Carnet Digital Oficial MINSA */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl">
                  🇵🇦
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">República de Panamá</div>
                  <div className="text-sm font-black text-white">Consejo Técnico de Salud (MINSA)</div>
                  <div className="text-[11px] text-slate-400">Idoneidad Profesional de Medicina y Cirugía</div>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
                ● ACTIVA
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/70 border border-indigo-500/20 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Médico Colegiado:</span>
                  <strong className="text-white text-sm">{doctorInfo.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Número de Idoneidad:</span>
                  <span className="font-mono font-black text-cyan-300 text-sm">{doctorInfo.license}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registro Profesional MINSA:</span>
                  <span className="font-mono font-bold text-indigo-200">{doctorInfo.minsaRegistrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Especialidad Registrada:</span>
                  <span className="text-slate-200 font-semibold">{doctorInfo.specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sede Principal de Práctica:</span>
                  <span className="text-slate-200">{doctorInfo.clinic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vigencia del Certificado:</span>
                  <span className="text-emerald-400 font-bold">Indefinida (En Regla)</span>
                </div>
              </div>
            </div>

            {/* Sello de Seguridad y Validación Criptográfica */}
            <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Validado por Base de Datos Nacional MINSA</span>
              </div>
              <span className="font-mono text-slate-500">PA-CTS-2026</span>
            </div>
          </div>

          {/* Configuración de Firma Electrónica Médica (Ley 81) */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Firma Digital & Sello Criptográfico Calificado</h3>
                <p className="text-xs text-slate-400">Conforme a la Ley 81 de 2019 sobre Protección de Datos Personales</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Algoritmo de Firma:</span>
                  <span className="font-mono text-cyan-300 font-bold">SHA-256 with RSA 4096-bit</span>
                </div>
                <div className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Sello de Tiempo (TSA):</span>
                  <span className="font-mono text-emerald-400 font-bold">Autoridad de Sellado Panamá (RFC 3161)</span>
                </div>
                <div className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Código de Verificación QR:</span>
                  <span className="font-mono text-indigo-300 font-bold">Estampado en cada requisición y PDF</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs leading-relaxed space-y-2">
                <div className="font-bold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Idoneidad y Acreditación Lista para Emitir Órdenes</span>
                </div>
                <p>
                  Su número de idoneidad <strong className="text-cyan-300 font-mono">{doctorInfo.license}</strong> se incluye de manera inalterable en todos los informes de laboratorio, interconsultas y requisiciones emitidas a través de esta plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 3: EMISIÓN DE REQUISICIÓN MÉDICA ELECTRÓNICA (CIE-10)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'requisition' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-black text-white text-lg flex items-center space-x-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Emisión de Orden & Requisición Electrónica de Laboratorio</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Envío digital directo con indicación diagnóstica CIE-10 para agilizar la admisión en laboratorio y recepción.
            </p>
          </div>

          <form onSubmit={handleCreateRequisition} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Cédula o Pasaporte:</label>
                <input
                  type="text"
                  value={patientCedula}
                  onChange={(e) => setPatientCedula(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-bold text-xs text-cyan-300 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Nombre Completo del Paciente:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Sexo Biológico:</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as 'M' | 'F')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="F">Femenino (F)</option>
                  <option value="M">Masculino (M)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Edad del Paciente:</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={patientAge}
                  onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Código Diagnóstico CIE-10 / Indicación:</label>
                <select
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="E11.9 — Diabetes Mellitus Tipo 2 no especificada">E11.9 — Diabetes Mellitus Tipo 2</option>
                  <option value="I10 — Hipertensión Esencial Primaria">I10 — Hipertensión Esencial Primaria</option>
                  <option value="E78.5 — Hiperlipidemia no especificada">E78.5 — Hiperlipidemia no especificada</option>
                  <option value="E03.9 — Hipotiroidismo no especificado">E03.9 — Hipotiroidismo no especificado</option>
                  <option value="D50.9 — Anemia por deficiencia de hierro">D50.9 — Anemia por deficiencia de hierro</option>
                  <option value="Z00.0 — Examen médico general de rutina">Z00.0 — Chequeo Médico General / Rutina</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Prioridad de la Muestra:</label>
                <select
                  value={priorityOrder}
                  onChange={(e) => setPriorityOrder(e.target.value as 'RUTINA' | 'URGENTE')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="RUTINA">RUTINA (Entrega habitual)</option>
                  <option value="URGENTE">URGENTE / STAT (Prioridad técnica)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Instrucciones de Ayuno y Preparación para el Paciente:</label>
              <input
                type="text"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Selección Rápida de Exámenes del Catálogo */}
            <div className="space-y-2 pt-2">
              <label className="font-bold text-slate-300 block text-xs">Exámenes y Perfiles a Realizar:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Hemograma Completo con Plaquetas',
                  'Glucosa en Ayunas',
                  'Hemoglobina Glicosilada (HbA1c)',
                  'Perfil Lipídico Completo',
                  'Creatinina Sérica & TFG',
                  'Ácido Úrico',
                  'Urianálisis Completo (Citoquímico)',
                  'Perfil Tiroideo (TSH, T4 Libre)',
                  'Panel Hepático Completo (AST, ALT, Bilirrubinas)',
                  'Electrolitos Séricos (Na, K, Cl)'
                ].map((testName) => {
                  const isSelected = selectedTests.includes(testName);
                  return (
                    <button
                      type="button"
                      key={testName}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTests(selectedTests.filter((t) => t !== testName));
                        } else {
                          setSelectedTests([...selectedTests, testName]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{testName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono">
                Firmado digitalmente por: <strong className="text-white">{doctorInfo.name}</strong> ({doctorInfo.license})
              </div>

              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Transmitir Requisición Firmada al LIS</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 4: DESCARGA EN LOTE DE INFORMES MÉDICOS                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'batch' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Descarga Consolidada de Informes Oficiales (PDF + QR)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Seleccione múltiples órdenes validadas para descargarlas simultáneamente para el expediente de su consultorio.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleSelectAllBatch}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                {selectedBatchOrders.length === filteredOrders.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>

              <button
                onClick={handleBatchDownload}
                disabled={selectedBatchOrders.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Seleccionados ({selectedBatchOrders.length})</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3 w-10 text-center">Sel.</th>
                  <th className="p-3">N° Orden</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Cédula</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.map((ord) => {
                  const isChecked = selectedBatchOrders.includes(ord.id);
                  return (
                    <tr key={ord.id} className="hover:bg-indigo-950/20">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedBatchOrders(selectedBatchOrders.filter((id) => id !== ord.id));
                            } else {
                              setSelectedBatchOrders([...selectedBatchOrders, ord.id]);
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-300">{ord.orderNumber}</td>
                      <td className="p-3 font-bold text-white">{ord.patientName}</td>
                      <td className="p-3 text-slate-400 font-mono">{ord.patientNationalId}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          ord.status === 'VALIDADA_MED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {ord.status === 'VALIDADA_MED' ? 'VALIDADO' : 'EN PROCESO'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onOpenPdf(ord.id)}
                          className="text-indigo-400 hover:text-indigo-200 font-bold text-xs"
                        >
                          Ver PDF
                        </button>
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
};
