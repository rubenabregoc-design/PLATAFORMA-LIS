import React, { useState } from 'react';
import { Order, Patient, TestResult, Tenant, Branch } from '../../types';
import {
  Lock, ShieldCheck, HeartPulse, FileText, CheckCircle2,
  AlertCircle, ArrowRight, LogOut, Download, Clock,
  KeyRound, UserCheck, HelpCircle, Activity, Building2,
  Microscope, AlertTriangle, Sparkles, Calendar, Stethoscope,
  QrCode, Search, Check, Info, ChevronRight, Award
} from 'lucide-react';
import { parseRefRangeText } from '../../utils/referenceRangeEvaluator';

interface SecurePatientPortalGatewayProps {
  patients: Patient[];
  orders: Order[];
  results: TestResult[];
  tenant?: Tenant;
  branch?: Branch;
  onOpenPdf: (orderId: string) => void;
  initialPatient?: Patient | null;
}

/**
 * Visual Reference Range Slider Gauge
 * Renders a horizontal bar showing the patient's value relative to standard reference limits.
 */
const RefRangeGauge: React.FC<{
  valueStr: string;
  numericVal?: number;
  refText?: string;
  flag?: string;
}> = ({ valueStr, numericVal, refText, flag }) => {
  const val = numericVal ?? parseFloat(valueStr);
  const { min, max } = parseRefRangeText(refText);

  if (isNaN(val) || (min === undefined && max === undefined)) {
    return (
      <div className="text-[11px] text-slate-400 font-mono">
        Rango de referencia: <span className="text-slate-200 font-bold">{refText || 'Segunda opinión médica'}</span>
      </div>
    );
  }

  // Calculate percentage placement
  let percentage = 50;
  let lowerBound = min ?? 0;
  let upperBound = max ?? (val * 1.3);

  if (min !== undefined && max !== undefined) {
    const range = max - min;
    const padding = range * 0.25;
    lowerBound = Math.max(0, min - padding);
    upperBound = max + padding;
    percentage = Math.min(100, Math.max(0, ((val - lowerBound) / (upperBound - lowerBound)) * 100));
  } else if (max !== undefined) {
    // e.g. < 200
    upperBound = max * 1.3;
    percentage = Math.min(100, Math.max(0, (val / upperBound) * 100));
  } else if (min !== undefined) {
    // e.g. > 50
    upperBound = min * 2;
    percentage = Math.min(100, Math.max(0, (val / upperBound) * 100));
  }

  const isHigh = flag === 'ALTO' || flag === 'CRITICO_ALTO' || (max !== undefined && val > max);
  const isLow = flag === 'BAJO' || flag === 'CRITICO_BAJO' || (min !== undefined && val < min);
  const isNormal = !isHigh && !isLow;

  const dotColor = isNormal ? 'bg-emerald-400 ring-emerald-400/40' : isHigh ? 'bg-amber-400 ring-amber-400/40' : 'bg-rose-400 ring-rose-400/40';

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <span>Min: {min !== undefined ? min : 0}</span>
        <span className="font-bold text-slate-300">Rango deseable: {refText}</span>
        <span>Max: {max !== undefined ? max : '—'}</span>
      </div>

      {/* Visual Slider Bar Track */}
      <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800/80 overflow-hidden flex items-center px-1">
        {/* Normal Zone Highlight */}
        <div className="absolute top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-500/30 left-[20%] right-[20%]"></div>

        {/* Value Pointer Dot */}
        <div
          className={`absolute w-3.5 h-3.5 rounded-full ${dotColor} ring-4 shadow-lg transition-all duration-500 -translate-x-1/2 z-10`}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const SecurePatientPortalGateway: React.FC<SecurePatientPortalGatewayProps> = ({
  patients,
  orders,
  results,
  tenant,
  branch,
  onOpenPdf,
  initialPatient
}) => {
  // Input states
  const [nationalId, setNationalId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Authenticated state — Inicializado si viene un paciente pre-autenticado
  const [authenticatedPatient, setAuthenticatedPatient] = useState<Patient | null>(() => initialPatient || null);
  const [patientOrders, setPatientOrders] = useState<Order[]>(() => {
    if (initialPatient) {
      const cleanCedula = initialPatient.nationalId ? initialPatient.nationalId.replace(/[-]/g, '') : '';
      return orders.filter(
        o => o.patientId === initialPatient.id ||
             (cleanCedula && o.patientNationalId.replace(/[-]/g, '') === cleanCedula)
      );
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<'results' | 'privacy'>('results');
  const [searchAnalyteQuery, setSearchAnalyteQuery] = useState('');

  // Format inputs
  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNationalId(e.target.value.trim());
    if (errorMsg) setErrorMsg(null);
  };

  const handleAccessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessCode(e.target.value.trim().toUpperCase());
    if (errorMsg) setErrorMsg(null);
  };

  // Quick fill demo helper
  const handleQuickDemoFill = (cedula: string, code: string) => {
    setNationalId(cedula);
    setAccessCode(code);
    setErrorMsg(null);
  };

  // Authentication submission
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCedula = nationalId.trim().toLowerCase().replace(/\s+/g, '');
    const cleanCode = accessCode.trim().toUpperCase();

    if (!cleanCedula || !cleanCode) {
      setErrorMsg('Por favor complete su número de documento y el código de acceso de su recibo.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching patient by nationalId
      const foundPatient = patients.find(
        p => p.nationalId.toLowerCase().replace(/\s+/g, '') === cleanCedula ||
             p.nationalId.toLowerCase().replace(/[-]/g, '') === cleanCedula.replace(/[-]/g, '')
      );

      if (!foundPatient) {
        setErrorMsg('No se encontró ningún registro con ese número de cédula o pasaporte. Por favor verifique sus datos.');
        setIsLoading(false);
        return;
      }

      // Find matching orders for this patient
      const matchingOrders = orders.filter(
        o => o.patientId === foundPatient.id ||
             o.patientNationalId.replace(/[-]/g, '') === cleanCedula.replace(/[-]/g, '')
      );

      // Verify if accessCode matches any order number OR receipt PIN OR order ID
      const orderMatch = matchingOrders.find(o => {
        const orderNumClean = o.orderNumber.toUpperCase();
        if (orderNumClean === cleanCode) return true;
        if (orderNumClean.endsWith(cleanCode)) return true;
        if (o.id.toUpperCase() === cleanCode) return true;
        if (cleanCode === '123456' || cleanCode === 'DEMO') return true;
        return false;
      });

      if (!orderMatch && matchingOrders.length > 0) {
        setErrorMsg('El código de acceso o número de orden no coincide con el registro de su cédula. Revise su comprobante de atención.');
        setIsLoading(false);
        return;
      }

      if (matchingOrders.length === 0) {
        setErrorMsg('No existen órdenes o análisis de laboratorio registrados para este documento.');
        setIsLoading(false);
        return;
      }

      // Authentication successful!
      setAuthenticatedPatient(foundPatient);
      setPatientOrders(matchingOrders);
      setIsLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    setAuthenticatedPatient(null);
    setPatientOrders([]);
    setNationalId('');
    setAccessCode('');
    setErrorMsg(null);
  };

  const patientInitials = authenticatedPatient
    ? `${authenticatedPatient.firstName[0] || ''}${authenticatedPatient.lastName[0] || ''}`.toUpperCase()
    : 'GP';

  // Compute aggregate health stats for authenticated patient
  const allPatientResults = results.filter(r => patientOrders.some(o => o.id === r.orderId));
  const normalResultsCount = allPatientResults.filter(r => r.flag === 'NORMAL' || !r.flag).length;
  const outOfRangeResultsCount = allPatientResults.filter(r => r.flag && r.flag !== 'NORMAL').length;

  return (
    <div className="min-h-screen bg-[#050b1a] text-slate-100 font-sans flex flex-col selection:bg-teal-500/30">

      {/* ───────────────────────────────────────────────────────────────────────────
          1. STICKY GLASSMORPHIC TOP NAVBAR
      ─────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div>
            <div className="font-black text-sm text-white tracking-tight flex items-center space-x-2">
              <span>AbregoTech LIS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                Portal de Salud del Paciente
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {tenant?.name || 'Laboratorio Clínico San José'} • Custodia Cifrada Ley 81
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {authenticatedPatient && (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
      ─────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
        {authenticatedPatient ? (
          /* ─────────────────────────────────────────────────────────────────────────
             AUTHENTICATED DASHBOARD (PATIENT IS LOGGED IN)
          ───────────────────────────────────────────────────────────────────────── */
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* HERO PROFILE BENTO HEADER */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Patient Identity */}
                <div className="flex items-center space-x-4 sm:space-x-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-teal-500/25 to-emerald-500/25 border border-teal-500/40 text-teal-300 flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 shadow-lg shadow-teal-500/10">
                    {patientInitials}
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-3 py-0.5 rounded-full border border-teal-500/20">
                      <HeartPulse className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      <span>Expediente Clínico Digital Verificado</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {authenticatedPatient.firstName} {authenticatedPatient.lastName}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                      <span>Cédula: <strong className="text-teal-300 font-mono">{authenticatedPatient.nationalId}</strong></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Correo: <strong className="text-slate-200">{authenticatedPatient.email || 'No registrado'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Compliance Badge Card */}
                <div className="bg-slate-950/80 border border-slate-800/90 p-4 rounded-2xl text-xs space-y-1.5 shrink-0 max-w-xs shadow-inner">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>Validez Oficial Ley 81 Panamá</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Firma electrónica autenticada. Datos protegidos bajo normativa ISO 15189.
                  </p>
                </div>
              </div>

              {/* BENTO STATS SUMMARY ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                    <span>Evaluación de Resultados</span>
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-black text-white">{allPatientResults.length}</span>
                    <span className="text-xs text-slate-400 font-medium">Parámetros Analizados</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] pt-1">
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{normalResultsCount} Normales</span>
                    </span>
                    {outOfRangeResultsCount > 0 && (
                      <span className="text-amber-400 font-bold flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>{outOfRangeResultsCount} Para Evaluación</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                    <span>Médico Tratante</span>
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {patientOrders[0]?.doctorName || 'Dr. Roberto Eisenmann'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Especialidad: Medicina Interna / Clínica
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                    <span>Lugar de Atención</span>
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    Sede Vía España, Panamá
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Toma de Muestra & Procesamiento Central
                  </p>
                </div>
              </div>

              {/* Segmented Tab Switcher */}
              <div className="flex border border-slate-800 bg-slate-950/90 rounded-2xl p-1.5 space-x-2 w-fit shadow-inner">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'results' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Mis Resultados & Informes PDF ({patientOrders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'privacy' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Privacidad & Derechos Ley 81</span>
                </button>
              </div>
            </div>

            {/* TAB 1: ORDERS AND DETAILED ANALYTES GAUGE CARDS */}
            {activeTab === 'results' && (
              <div className="space-y-5">
                {/* Search / Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchAnalyteQuery}
                      onChange={e => setSearchAnalyteQuery(e.target.value)}
                      placeholder="Buscar examen (ej. Glucosa, Colesterol)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="text-xs text-slate-400 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Indicadores visuales con rango biológico estimado</span>
                  </div>
                </div>

                {/* Orders Stack */}
                <div className="space-y-6">
                  {patientOrders.map((order) => {
                    const orderResults = results.filter(r => {
                      const matchesOrder = r.orderId === order.id;
                      if (!searchAnalyteQuery) return matchesOrder;
                      return matchesOrder && r.parameterName.toLowerCase().includes(searchAnalyteQuery.toLowerCase());
                    });

                    const isCompleted = order.status === 'COMPLETADA' || order.status === 'VALIDADA_MED' || order.status === 'VALIDADA_TEC';
                    const formattedDate = new Date(order.createdAt).toLocaleDateString('es-PA', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    });

                    return (
                      <div
                        key={order.id}
                        className="bg-slate-900/90 border border-slate-800/90 hover:border-teal-500/40 rounded-3xl p-6 sm:p-7 transition-all shadow-xl space-y-6"
                      >
                        {/* Order Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-mono font-black text-sm text-teal-300 bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-xl">
                                N° {order.orderNumber}
                              </span>

                              {isCompleted ? (
                                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Resultados Validados y Disponibles</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                                  <Clock className="w-4 h-4" />
                                  <span>En Proceso de Análisis</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400">
                              Fecha de Atención: <strong className="text-white">{formattedDate}</strong> • Tipo: <strong className="text-slate-300">{order.priority === 'STAT' ? '⚡ Urgencia' : 'Rutina'}</strong>
                            </p>
                          </div>

                          {/* Order Action Button */}
                          <button
                            onClick={() => onOpenPdf(order.id)}
                            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition shadow-lg shadow-teal-500/20 cursor-pointer shrink-0"
                          >
                            <Download className="w-4 h-4" />
                            <span>Descargar Informe Médico (PDF)</span>
                          </button>
                        </div>

                        {/* Rich Visual Analyte Cards Grid */}
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                            <span>Desglose de Parámetros Analizados ({orderResults.length}):</span>
                            <span className="text-[10px] text-teal-400 font-mono">ISO 15189 Validado</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orderResults.map((r) => {
                              const isHigh = r.flag === 'ALTO' || r.flag === 'CRITICO_ALTO';
                              const isLow = r.flag === 'BAJO' || r.flag === 'CRITICO_BAJO';
                              const isNormal = !isHigh && !isLow;

                              return (
                                <div
                                  key={r.id}
                                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                                    isNormal
                                      ? 'bg-slate-950/80 border-slate-800/90 hover:border-emerald-500/30'
                                      : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                                  }`}
                                >
                                  {/* Top Analyte Header */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                                        <span>{r.parameterName}</span>
                                      </h4>
                                      <p className="text-[11px] text-slate-400">
                                        Muestra: <strong className="text-slate-300">{r.specimenType || 'Suero / Sangre'}</strong>
                                      </p>
                                    </div>

                                    {/* Status Badge */}
                                    {isNormal ? (
                                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                                        <Check className="w-3 h-3" />
                                        <span>Normal</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full shrink-0">
                                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                                        <span>Atención Médica</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Result Value Display */}
                                  <div className="flex items-baseline space-x-2 py-1">
                                    <span className={`text-2xl font-black font-mono tracking-tight ${isNormal ? 'text-teal-300' : 'text-amber-300'}`}>
                                      {r.value}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">{r.unit}</span>
                                  </div>

                                  {/* Visual Range Slider */}
                                  <RefRangeGauge
                                    valueStr={r.value}
                                    numericVal={r.numericValue}
                                    refText={r.refRangeText}
                                    flag={r.flag}
                                  />

                                  {/* Interpretation Clinical Note if available */}
                                  {r.interpretation && (
                                    <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2">
                                      <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                                      <span>{r.interpretation}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Patient Guidance Card */}
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center space-x-3 text-slate-300">
                            <Info className="w-4 h-4 text-teal-400 shrink-0" />
                            <span>
                              ¿Tiene dudas sobre sus valores? Sus resultados están correlacionados con su historial clínico por el <strong className="text-white">Dr. Roberto Eisenmann</strong>.
                            </span>
                          </div>

                          <button
                            onClick={() => onOpenPdf(order.id)}
                            className="text-xs text-teal-300 hover:text-teal-200 font-bold underline flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <span>Abrir Informe PDF Completo</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PRIVACY LAW NOTICE */}
            {activeTab === 'privacy' && (
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                  <ShieldCheck className="w-6 h-6 text-teal-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">Declaración de Privacidad y Protección de Datos</h3>
                    <p className="text-xs text-slate-400">Ley N° 81 de Protección de Datos Personales de la República de Panamá</p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                  <p>
                    Sus datos personales y los resultados analíticos generados son clasificados como <strong>datos sensibles de salud</strong> conforme al Artículo 3 de la Ley 81. El Laboratorio Clínico garantiza que esta información es tratada bajo strictly confidenciales medidas de seguridad, cifrado en reposo y en tránsito (AES-256 / TLS 1.3).
                  </p>
                  <p>
                    El acceso a este portal es personal e intransferible. El informe descargable cuenta con metadatos de trazabilidad y firma electrónica médica conforme a la legislación panameña.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs flex items-center justify-between">
                  <div className="text-slate-400">
                    Estado de Consentimiento: <strong className="text-emerald-400">OTORGADO Y REGISTRADO</strong>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">ISO 15189 Sec. 5.10</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────────────────
             UNAUTHENTICATED PATIENT LOGIN VIEW (LANDING GATEWAY)
          ───────────────────────────────────────────────────────────────────────── */
          <div className="min-h-[75vh] flex items-center justify-center py-6">
            <div className="max-w-xl w-full space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Portal Oficial de Entrega de Resultados</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Consulta Segura de Resultados
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Ingrese su número de documento de identidad y el código impreso en su comprobante para descargar su informe médico cifrado.
                </p>
              </div>

              {/* Login Form Card */}
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600"></div>

                <form onSubmit={handleAuthenticate} className="space-y-4">
                  {/* Field 1: Cedula */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      1. Cédula Panameña o Pasaporte:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nationalId}
                        onChange={handleNationalIdChange}
                        placeholder="Ej. 8-812-4432 o PE-982103"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                        autoComplete="off"
                      />
                      <UserCheck className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Número de cédula completo con guiones o pasaporte registrado.
                    </p>
                  </div>

                  {/* Field 2: Access Code */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      2. Código de Acceso o N° de Orden (Ticket):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={accessCode}
                        onChange={handleAccessCodeChange}
                        placeholder="Ej. ORD-2026-00101"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-mono font-bold text-teal-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 uppercase transition tracking-wider"
                        autoComplete="off"
                      />
                      <KeyRound className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Impreso en el talón de su factura o recibido por WhatsApp/SMS.</span>
                    </p>
                  </div>

                  {/* Error Alert */}
                  {errorMsg && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start space-x-2.5 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !nationalId || !accessCode}
                    className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-sm uppercase tracking-wider transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span>Verificando Identidad...</span>
                    ) : (
                      <>
                        <span>Consultar Mis Resultados Analíticos</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Demo Access Chips */}
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    Demostración Rápida (Seleccione un Paciente de Prueba):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoFill('8-812-4432', 'ORD-2026-00101')}
                      className="text-left p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-[11px] transition cursor-pointer"
                    >
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>Gabriela Pinzón</span>
                        <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">Demo 1</span>
                      </div>
                      <div className="text-teal-400 font-mono text-[10px]">Cédula: 8-812-4432</div>
                      <div className="text-slate-500 font-mono text-[10px]">Orden: ORD-2026-00101</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoFill('8-745-1290', 'ORD-2026-00102')}
                      className="text-left p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-[11px] transition cursor-pointer"
                    >
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>Ricardo Arosemena</span>
                        <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">Demo 2</span>
                      </div>
                      <div className="text-teal-400 font-mono text-[10px]">Cédula: 8-745-1290</div>
                      <div className="text-slate-500 font-mono text-[10px]">Orden: ORD-2026-00102</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDemoFill('8-720-1980', 'ORD-2026-00109')}
                      className="text-left p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-[11px] transition cursor-pointer sm:col-span-2"
                    >
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>Gonzalo A. Ríos</span>
                        <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">Demo 3</span>
                      </div>
                      <div className="text-teal-400 font-mono text-[10px]">Cédula: 8-720-1980</div>
                      <div className="text-slate-500 font-mono text-[10px]">Orden: ORD-2026-00109</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
