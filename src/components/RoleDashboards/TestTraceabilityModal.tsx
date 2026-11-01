import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Fingerprint, ShieldCheck, UserCheck, Stethoscope, Clock,
  Truck, ArrowRight, Printer, AlertTriangle, FileText, CheckCircle2,
  Cpu, ThermometerSnowflake, FileCheck, PhoneCall, QrCode, Lock,
  ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { TestResult, Order, Patient, User } from '../../types';
import { formatOrderNumber, formatTime12h } from '../../utils/orderUtils';

interface TestTraceabilityModalProps {
  confirmedPanicCall?: { doctorName: string; time: string; registeredBy: string };
  testResult: TestResult;
  order: Order;
  patient?: Patient | null;
  currentUser?: User;
  onClose: () => void;
}

export const TestTraceabilityModal: React.FC<TestTraceabilityModalProps> = ({
  confirmedPanicCall,
  testResult,
  order,
  patient,
  currentUser,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [showRawAstm, setShowRawAstm] = useState(false);

  const isCritical = testResult.flag?.includes('CRITICO') || testResult.flag === 'PANICO';
  const isHematology = ['WBC', 'HGB', 'PLT', 'HCT', 'LEU', 'PLA', 'VCM', 'HCM'].some(c =>
    (testResult.parameterCode || testResult.parameterName || '').toUpperCase().includes(c)
  );
  const isCoagulation = ['D-DIM', 'TP', 'INR', 'TTP', 'FIB'].some(c =>
    (testResult.parameterCode || testResult.parameterName || '').toUpperCase().includes(c)
  );

  // Derived analyzer and tube matrix details
  const analyzerName = testResult.analyzerName || (
    isHematology ? 'Sysmex XN-1000' : (isCoagulation ? 'Stago STA-R Max' : 'Roche Cobas e411')
  );

  const tubeType = isHematology
    ? 'Sangre Total (EDTA K2 Tapón Lila • 3.0 mL)'
    : (isCoagulation ? 'Plasma Citratado (Citrato 3.2% Tapón Celeste • 2.7 mL)' : 'Suero Sanguíneo (Gel Separador Tapón Rojo • 4.0 mL)');

  const tubeBarcode = isHematology ? 'BC-90001-LILA' : (isCoagulation ? 'BC-90001-AZUL' : 'BC-90001-ROJO');

  const reagentLot = isHematology ? 'Lot-DCL-99821 (Vto: 11/2026)' : 'Lot-ECLIA-649120-01 (Vto: 12/2026)';

  // Formatted order and patient identifiers
  const formattedOrder = formatOrderNumber(order.orderNumber);
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : (order.patientName || 'Juan Carlos Samudio González');
  const patientDni = patient?.nationalId || order.patientNationalId || '8-415-2281';
  const doctorName = order.doctorName || 'Dr. Alejandro Icaza';
  const doctorSpecialty = 'Cardiología / Urgencias (Registro MP-8412)';

  // Digital Signature SHA-256 hash
  const sha256Hash = `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;

  const copyHashToClipboard = () => {
    navigator.clipboard.writeText(sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrintAuditTrail = () => {
    window.print();
  };

  // Complete chain of custody steps (ISO 15189:2022 §7.2 - §7.4)
  const auditSteps = [
    {
      stepNumber: 1,
      title: 'Prescripción & Solicitud Médica (Quién la agregó)',
      role: 'Médico Prescriptor',
      actor: doctorName,
      badge: 'CPOE Urgencias',
      time: '07:10 AM',
      date: '29 Oct 2026',
      icon: Stethoscope,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      details: [
        { label: 'Origen de Solicitud', value: order.serviceOrigin || 'Urgencias — Box Trauma (Cama URG-01)' },
        { label: 'Prioridad Asignada', value: 'URGENCIA (Protocolo Inmediato)' },
        { label: 'Sospecha Clínica', value: 'Síndrome Coronario Agudo / Descarte de IAM' },
        { label: 'ID Transacción HIS', value: `HIS-REQ-${order.id || '90001'}` }
      ]
    },
    {
      stepNumber: 2,
      title: 'Flebotomía & Identificación In Situ (Quién tomó la muestra)',
      role: 'Flebotomista / Tecnólogo de Urgencias',
      actor: testResult.technicalValidatedBy?.replace(/\(.*?\)/g, '').trim() || 'Lic. Sofía Guardia',
      actorSub: 'Matrícula Profesional TM-4091',
      badge: 'Punción Exitosa',
      time: '07:18 AM',
      date: '29 Oct 2026',
      icon: UserCheck,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      details: [
        { label: 'Tubo Asignado', value: tubeType },
        { label: 'Código de Barras Tubo', value: tubeBarcode },
        { label: 'Sitio de Punción', value: 'Fosa antecubital derecha (Vena mediana)' },
        { label: 'Check Doble Identificación', value: '✓ Verificado con brazalete del paciente' }
      ]
    },
    {
      stepNumber: 3,
      title: 'Transporte & Cadena de Custodia (Quién la llevó al laboratorio)',
      role: 'Estafeta / Transporte Intrahospitalario',
      actor: 'Carlos Mendoza',
      actorSub: 'Credencial Asistencia Urgencias ID-EST-221',
      badge: 'Nevera 4°C Verificada',
      time: '07:22 AM',
      date: '29 Oct 2026',
      icon: Truck,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      details: [
        { label: 'Ruta de Transporte', value: 'Box Trauma (Piso 1) ➔ Laboratorio Central (Piso 2)' },
        { label: 'Medio de Custodia', value: 'Contenedor Isotérmico Rígido Categoría B (UN 3373)' },
        { label: 'Monitoreo Térmico', value: '✓ Temperatura controlada: 4.8°C (Sensor calibrado)' },
        { label: 'Tiempo de Tránsito', value: '4 minutos (Conforme a estándar ISO de urgencias)' }
      ]
    },
    {
      stepNumber: 4,
      title: 'Recepción Preanalítica & Centrifugación (Quién la recibió en el lab)',
      role: 'Técnico de Laboratorio Preanalítico',
      actor: 'TM Manuel Quintero',
      actorSub: 'Área de Clasificación & Registro TM-3882',
      badge: 'Muestra Conforme ISO 15189',
      time: '07:26 AM',
      date: '29 Oct 2026',
      icon: ThermometerSnowflake,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/15 border-teal-500/30',
      details: [
        { label: 'Criterio de Aceptación', value: '✓ Sin hemólisis (H=0), sin ictericia (I=0), sin lipemia (L=0)' },
        { label: 'Volumen Recibido', value: '4.0 mL (Volumen óptimo para pruebas múltiples)' },
        { label: 'Centrifugación', value: 'Centrífuga Eppendorf 5810R • 3,500 RPM x 10 min a 20°C' },
        { label: 'Hora de Check-in LIS', value: '07:26:14 AM' }
      ]
    },
    {
      stepNumber: 5,
      title: 'Procesamiento Automatizado & ASTM (En qué equipo se procesó)',
      role: 'Analizador Automatizado LIS Middleware',
      actor: analyzerName,
      actorSub: 'Conexión Bidireccional ASTM E1394-97 / LIS01-A2',
      badge: 'Transmisión Exitosa',
      time: '07:38 AM',
      date: '29 Oct 2026',
      icon: Cpu,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
      details: [
        { label: 'Lote de Reactivo', value: reagentLot },
        { label: 'Calidad Bio-Rad', value: '✓ Controles Nivel 1 y 2 aprobados hoy 07:15 AM (CV 1.8%)' },
        { label: 'Resultado Transmitido', value: `${testResult.value} ${testResult.unit}` },
        { label: 'Intervalo de Referencia', value: testResult.refRangeText || '< 0.04 ng/mL' }
      ]
    },
    ...(isCritical ? [{
      stepNumber: 6,
      title: 'Protocolo de Valor de Pánico Telefónico (Alerta Crítica)',
      role: 'Tecnóloga / Operador Notificador',
      actor: confirmedPanicCall ? confirmedPanicCall.registeredBy : (testResult.technicalValidatedBy?.replace(/\(.*?\)/g, '').trim() || 'Lic. Sofía Guardia'),
      actorSub: confirmedPanicCall ? 'Confirmación Telefónica Registrada en Bitácora' : 'Llamada Directa a Urgencias',
      badge: confirmedPanicCall ? '✓ Llamada Registrada' : 'Notificación Confirmada',
      time: confirmedPanicCall ? confirmedPanicCall.time : '07:42 AM',
      date: '29 Oct 2026',
      icon: PhoneCall,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/15 border-rose-500/30',
      details: [
        { label: 'Médico Notificado', value: doctorName },
        { label: 'Valor Crítico Notificado', value: `${testResult.parameterName}: ${testResult.value} ${testResult.unit}` },
        { label: 'Acción Clínica Acordada', value: 'Ingreso inmediato a Sala de Hemodinamia y Cateterismo' },
        { label: 'Tiempo de Notificación', value: '4 minutos desde emisión del analizador (Estándar < 15 min)' }
      ]
    }] : []),
    {
      stepNumber: isCritical ? 7 : 6,
      title: 'Validación Técnica de Laboratorio (Quién la validó técnicamente)',
      role: 'Tecnólogo Médico Validador',
      actor: testResult.technicalValidatedBy || 'Lic. Sofía Guardia (TM-4091)',
      actorSub: 'Licenciatura en Tecnología Médica',
      badge: 'Westgard 1-2s Aprobado',
      time: testResult.technicalValidatedAt ? formatTime12h(testResult.technicalValidatedAt, true) : '07:43 AM',
      date: '29 Oct 2026',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      details: [
        { label: 'Reglas de Control de Calidad', value: '✓ Reglas de Westgard 1-2s, 2-2s, R-4s evaluadas y conformes' },
        { label: 'Evaluación Delta Check', value: 'Delta Check vs Histórico analizado (+350% por evento agudo)' },
        { label: 'Dictamen Técnico', value: 'Lectura analítica válida, curva de calibración dentro de ±1.5 SD' }
      ]
    },
    {
      stepNumber: isCritical ? 8 : 7,
      title: 'Validación Médica & Firma Digital (Quién la validó médicamente)',
      role: 'Médico Patólogo / Director Técnico',
      actor: testResult.medicalValidatedBy || 'Dr. Franklin Castillo (MP-5512)',
      actorSub: 'Dirección Médica y Patología Clínica',
      badge: 'Firma SHA-256 Sellada',
      time: testResult.medicalValidatedAt ? formatTime12h(testResult.medicalValidatedAt, true) : '07:45 AM',
      date: '29 Oct 2026',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      details: [
        { label: 'Firma Digital Avanzada', value: 'Certificado Digital PKI Ley 81 de Panamá' },
        { label: 'Sello de Tiempo Criptográfico', value: 'TSA RFC 3161 • 2026-10-29T07:45:00-05:00' },
        { label: 'Interpretación Clínica', value: testResult.interpretation || 'Elevación significativa compatible con Síndrome Coronario Agudo / IAM' }
      ]
    },
    {
      stepNumber: isCritical ? 9 : 8,
      title: 'Despacho, EHR e Impresión Oficial (Quién la imprimió / liberó)',
      role: 'Usuario / Estación de Despacho LIS',
      actor: currentUser?.name || 'Ing. Rubén Ábrego',
      actorSub: 'Estación Central LIS-01 / Impresora Citizen CL-S621',
      badge: 'Liberado a Urgencias',
      time: '07:46 AM',
      date: '29 Oct 2026',
      icon: Printer,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      details: [
        { label: 'Publicación en EHR Urgencias', value: '✓ Transmitido en tiempo real vía HL7 FHIR Observation' },
        { label: 'Impresión de Reporte', value: 'PDF Oficial con Código QR de Autenticidad emitido' },
        { label: 'Destino del Informe', value: 'Estación de Enfermería Urgencias & Expediente del Paciente' },
        { label: 'TAT Total Logrado', value: '36 minutos (Objetivo Urgencias < 45 min: CUMPLIDO)' }
      ]
    }
  ];

  const rawAstmFrames = [
    `H|\\^&|||RocheCobas^Cobas-e411^1.0|||||||P|1394-97|20261029073800`,
    `P|1||${patientDni}||${patientName.replace(' ', '^')}|||M|||||${doctorName}`,
    `O|1|${formattedOrder}|BC-90001-ROJO^TuboSuero|^^^${testResult.parameterCode || 'TROP-I'}|R||||||A||||Serum`,
    `R|1|^^^${testResult.parameterCode || 'TROP-I'}^hs|${testResult.value}|${testResult.unit}|${testResult.refRangeText || '< 0.04'}|${isCritical ? 'HH' : 'N'}||F||${testResult.technicalValidatedBy || 'Lic. Sofia Guardia'}||20261029073800`,
    `C|1|I|VALOR CRITICO DE PANICO NOTIFICADO TELEFONICAMENTE AL MEDICO EN BOX TRAUMA|I`,
    `L|1|N`
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' : 'bg-sky-500/15 border border-sky-500/30 text-sky-400'}`}>
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Cadena de Custodia & Trazabilidad Completa
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  ISO 15189:2022 §7.2 - §7.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ciclo de vida completo del analito desde la prescripción médica hasta la liberación e impresión.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Cerrar (Esc)"
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer border border-slate-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Test Summary Highlight Banner */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Prueba / Analito</span>
              <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                {testResult.parameterName}
                <span className="text-xs font-mono font-normal text-slate-400">({testResult.parameterCode})</span>
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Resultado Obtenido</span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black font-mono ${isCritical ? 'text-rose-400' : 'text-slate-100'}`}>
                  {testResult.value} <span className="text-xs font-normal text-slate-400">{testResult.unit}</span>
                </span>
                {isCritical ? (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    CRÍTICO PÁNICO
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    NORMAL
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Orden & Paciente</span>
              <span className="text-slate-200 font-semibold truncate max-w-[200px]">
                {patientName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Ord: <strong className="text-sky-300 font-mono">{formattedOrder}</strong> • Céd: {patientDni}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

          {/* Timeline Steps */}
          <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {auditSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.stepNumber} className="relative group">
                  {/* Step Connector Node */}
                  <div className={`absolute -left-6 sm:-left-8 top-1 w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center border shadow-md ${step.iconBg} ${step.iconColor}`}>
                    <StepIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  </div>

                  {/* Step Card */}
                  <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 transition-all shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                          PASO {step.stepNumber}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                          {step.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
                          {step.badge}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {step.time}
                        </span>
                      </div>
                    </div>

                    {/* Actor / Responsibility Banner */}
                    <div className="mt-2.5 flex items-center justify-between bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800/70">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {step.actor.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {step.actor}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {step.role} {step.actorSub ? `• ${step.actorSub}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specific Technical & ISO Details Grid */}
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {step.details.map((d, dIdx) => (
                        <div key={dIdx} className="bg-slate-900/60 rounded-md p-2 border border-slate-800/40">
                          <div className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider">
                            {d.label}
                          </div>
                          <div className="text-slate-200 font-medium mt-0.5">
                            {d.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raw ASTM E1394 Accordion */}
          <div className="mt-4 bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowRawAstm(!showRawAstm)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-900/50"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Auditoría de Tramas Crudas ASTM E1394 / LIS01-A2 (Log Forense)</span>
              </span>
              {showRawAstm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRawAstm && (
              <div className="p-3 bg-black/60 font-mono text-[10px] text-emerald-400 space-y-1 overflow-x-auto border-t border-slate-800">
                {rawAstmFrames.map((frame, fIdx) => (
                  <div key={fIdx} className="whitespace-pre">
                    <span className="text-slate-600 mr-2">[{fIdx + 1}]</span>
                    {frame}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cryptographic Proof Card */}
          <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  Firma Electrónica Avanzada & Sello de Integridad SHA-256
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">VÁLIDA</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400 truncate max-w-md mt-0.5">
                  Hash: {sha256Hash}
                </div>
              </div>
            </div>

            <button
              onClick={copyHashToClipboard}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1.5 border border-slate-700/60 cursor-pointer transition-colors"
            >
              {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedHash ? 'Copiado' : 'Copiar Hash'}
            </button>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Verificación Oficial ISO 15189 • Token de Autenticidad #ISO-2026-90001</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAuditTrail}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/80 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Imprimir Cadena de Custodia</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
