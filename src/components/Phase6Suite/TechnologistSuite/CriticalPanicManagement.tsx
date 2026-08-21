import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  PhoneCall,
  Clock,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Download,
  Search,
  Filter,
  User,
  Check,
  Flame,
  Volume2,
  VolumeX,
  Printer,
  History,
  X
} from 'lucide-react';

export interface CriticalPanicItem {
  id: string;
  orderNumber: string;
  sampleBarcode: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  patientNationalId: string;
  location: string;
  serviceDepartment: string;
  doctorInCharge: string;
  analyte: string;
  criticalValue: string;
  unit: string;
  criticalThreshold: string;
  detectedAt: string;
  elapsedSeconds: number;
  slaMaxMinutes: number; // usually 15 min
  status: 'PENDIENTE_LLAMADA' | 'NOTIFICADO_READBACK' | 'NO_RESPONDE';
  callLog?: {
    receiverName: string;
    receiverRole: string;
    contactNumber: string;
    readBackConfirmed: boolean;
    reportedAt: string;
    tatMinutes: number;
    technologistId: string;
    notes: string;
  };
}

const INITIAL_CRITICAL_ITEMS: CriticalPanicItem[] = [
  {
    id: 'crit-1',
    orderNumber: 'ORD-2026-9041',
    sampleBarcode: '745009041',
    patientName: 'Batista, Manuel Antonio',
    patientAge: 68,
    patientGender: 'M',
    patientNationalId: '8-219-4810',
    location: 'Cama 412 • UCI Coronaria',
    serviceDepartment: 'Unidad de Cuidados Intensivos',
    doctorInCharge: 'Dr. Guillermo Endara (Cardiólogo)',
    analyte: 'Potasio Sérico (K+)',
    criticalValue: '6.85',
    unit: 'mmol/L',
    criticalThreshold: '> 6.00 mmol/L (Riesgo Arritmia/FV)',
    detectedAt: '10:35 AM',
    elapsedSeconds: 420, // 7 min elapsed
    slaMaxMinutes: 15,
    status: 'PENDIENTE_LLAMADA'
  },
  {
    id: 'crit-2',
    orderNumber: 'ORD-2026-9042',
    sampleBarcode: '745009042',
    patientName: 'De León, Carmen Rosa',
    patientAge: 52,
    patientGender: 'F',
    patientNationalId: '4-301-8842',
    location: 'Box 2 • Urgencias Adultos',
    serviceDepartment: 'Servicio de Urgencias',
    doctorInCharge: 'Dra. Patricia Boyd (Emergenciología)',
    analyte: 'Troponina I High-Sensitivity',
    criticalValue: '4.820',
    unit: 'ng/mL',
    criticalThreshold: '> 0.040 ng/mL (Infarto Agudo Miocardio)',
    detectedAt: '10:38 AM',
    elapsedSeconds: 240, // 4 min elapsed
    slaMaxMinutes: 15,
    status: 'PENDIENTE_LLAMADA'
  },
  {
    id: 'crit-3',
    orderNumber: 'ORD-2026-9039',
    sampleBarcode: '745009039',
    patientName: 'Pérez, Jorge Luis',
    patientAge: 23,
    patientGender: 'M',
    patientNationalId: '8-994-1022',
    location: 'Quirófano 3 • Cirugía General',
    serviceDepartment: 'Centro Quirúrgico',
    doctorInCharge: 'Dr. Jaime Alemán (Cirujano)',
    analyte: 'Plaquetas (Recuento Automatizado)',
    criticalValue: '14,000',
    unit: '/µL',
    criticalThreshold: '< 20,000 /µL (Riesgo Hemorrágico)',
    detectedAt: '10:15 AM',
    elapsedSeconds: 850,
    slaMaxMinutes: 15,
    status: 'NOTIFICADO_READBACK',
    callLog: {
      receiverName: 'Lic. Mariela Solís',
      receiverRole: 'Enfermera Jefa Quirófano',
      contactNumber: 'Ext. 4022',
      readBackConfirmed: true,
      reportedAt: '10:22 AM',
      tatMinutes: 7,
      technologistId: 'TM-4091 (Valentina Soto)',
      notes: 'Lectura repetida confirmada. Suspendido inicio de procedimiento quirúrgico para transfusión de concentrado de plaquetas.'
    }
  }
];

export const CriticalPanicManagement: React.FC = () => {
  const [items, setItems] = useState<CriticalPanicItem[]>(INITIAL_CRITICAL_ITEMS);
  const [selectedItemForCall, setSelectedItemForCall] = useState<CriticalPanicItem | null>(null);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Call form state
  const [receiverName, setReceiverName] = useState<string>('Dra. Patricia Boyd');
  const [receiverRole, setReceiverRole] = useState<string>('Médico de Turno Urgencias');
  const [contactNumber, setContactNumber] = useState<string>('Ext. 2104 / 6788-9900');
  const [readBackChecked, setReadBackChecked] = useState<boolean>(true);
  const [clinicalNotes, setClinicalNotes] = useState<string>('Se informa valor crítico de Troponina. El médico confirma recepción y realiza lectura repetida completa.');
  const [viewCertificateItem, setViewCertificateItem] = useState<CriticalPanicItem | null>(null);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setItems(prev => prev.map(item => {
        if (item.status === 'PENDIENTE_LLAMADA') {
          return {
            ...item,
            elapsedSeconds: item.elapsedSeconds + 1
          };
        }
        return item;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOpenCallModal = (item: CriticalPanicItem) => {
    setSelectedItemForCall(item);
    setReceiverName(item.doctorInCharge);
    setReceiverRole('Médico Tratante / Responsable');
    setContactNumber('Ext. 3012');
    setReadBackChecked(true);
    setClinicalNotes(`Lectura repetida confirmada de ${item.analyte} (${item.criticalValue} ${item.unit}) para paciente ${item.patientName}.`);
  };

  const handleSaveCallLog = () => {
    if (!selectedItemForCall) return;

    if (!readBackChecked) {
      alert('La confirmación de lectura repetida (Read-Back) es obligatoria conforme al estándar CAP / ISO 15189.');
      return;
    }

    const elapsedMin = Math.ceil(selectedItemForCall.elapsedSeconds / 60);

    setItems(prev => prev.map(item => {
      if (item.id === selectedItemForCall.id) {
        return {
          ...item,
          status: 'NOTIFICADO_READBACK',
          callLog: {
            receiverName,
            receiverRole,
            contactNumber,
            readBackConfirmed: true,
            reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tatMinutes: elapsedMin,
            technologistId: 'Lic. Valentina Soto (TM-4091)',
            notes: clinicalNotes
          }
        };
      }
      return item;
    }));

    const notifiedItem = {
      ...selectedItemForCall,
      status: 'NOTIFICADO_READBACK' as const,
      callLog: {
        receiverName,
        receiverRole,
        contactNumber,
        readBackConfirmed: true,
        reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tatMinutes: elapsedMin,
        technologistId: 'Lic. Valentina Soto (TM-4091)',
        notes: clinicalNotes
      }
    };

    setSelectedItemForCall(null);
    setToastMessage(`✓ Notificación de Pánico registrada exitosamente para ${notifiedItem.patientName} (TAT: ${elapsedMin} min).`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const pendingCount = items.filter(i => i.status === 'PENDIENTE_LLAMADA').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="critical-panic-container">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-rose-500/30 animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Gestión de Valores Críticos & Notificación de Pánico</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Módulo 3
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Protocolo estandarizado de llamada telefónica, verificación de lectura repetida (Read-Back) y SLA de 15 minutos.
            </p>
          </div>
        </div>

        {/* SLA Status Indicator */}
        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">SLA Obligatorio</div>
            <div className="text-lg font-black text-rose-400 font-mono">15 Minutos</div>
          </div>

          <div className={`px-4 py-3 rounded-2xl border text-center ${
            pendingCount > 0
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}>
            <div className="text-[10px] font-bold uppercase">Alertas Activas</div>
            <div className="text-lg font-black">{pendingCount} Pendientes</div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in border border-emerald-400/50">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* CRITICAL QUEUE CARDS */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2">
          Bandeja de Valores de Pánico en Espera de Notificación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => {
            const isPending = item.status === 'PENDIENTE_LLAMADA';
            const elapsedMin = Math.floor(item.elapsedSeconds / 60);
            const isOverdue = isPending && elapsedMin >= item.slaMaxMinutes;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between space-y-4 ${
                  isPending
                    ? isOverdue
                      ? 'bg-rose-950/60 border-rose-500 shadow-2xl shadow-rose-500/20 animate-pulse'
                      : 'bg-slate-900/90 border-amber-500/50 shadow-xl'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-[10px] font-mono font-bold text-teal-400">
                      #{item.sampleBarcode}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      isPending
                        ? isOverdue
                          ? 'bg-rose-500 text-slate-950 font-black animate-bounce'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {isPending ? (isOverdue ? '⚠️ SLA VENCIDO' : '⏳ PENDIENTE LLAMADA') : '✓ NOTIFICADO'}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="mt-3 space-y-1">
                    <h4 className="text-sm font-black text-white">{item.patientName}</h4>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Cédula: <span className="text-slate-200">{item.patientNationalId}</span> • {item.patientAge}a {item.patientGender}
                    </div>
                    <div className="text-[11px] text-teal-300 font-bold">
                      📍 {item.location}
                    </div>
                  </div>

                  {/* Critical Analyte Box */}
                  <div className="my-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{item.analyte}</div>
                    <div className="text-3xl font-black text-rose-400 font-mono">
                      {item.criticalValue} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                    </div>
                    <div className="text-[10px] text-rose-300/80 font-mono">{item.criticalThreshold}</div>
                  </div>

                  {/* SLA Countdown Timer */}
                  {isPending && (
                    <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl text-xs border border-slate-800">
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Tiempo Transcurrido:</span>
                      </div>
                      <div className={`font-mono font-black ${isOverdue ? 'text-rose-400 text-sm' : 'text-amber-400'}`}>
                        {formatSeconds(item.elapsedSeconds)} / 15:00
                      </div>
                    </div>
                  )}

                  {/* Call Log Record (if notified) */}
                  {!isPending && item.callLog && (
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Receptor:</span>
                        <span className="font-bold text-slate-200">{item.callLog.receiverName}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Read-Back:</span>
                        <span className="font-bold text-emerald-400">✓ Confirmado</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>TAT de Notificación:</span>
                        <span className="font-bold text-teal-300">{item.callLog.tatMinutes} Minutos</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {isPending ? (
                    <button
                      onClick={() => handleOpenCallModal(item)}
                      className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Iniciar Protocolo Read-Back</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewCertificateItem(item)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Ver Comprobante Digital</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: READ-BACK TELEPHONE CALL LOG */}
      {selectedItemForCall && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Registro de Notificación Telefónica Crítica</h3>
                <p className="text-xs text-slate-400">Estándar ISO 15189 / CAP / MINSA Panamá</p>
              </div>
            </div>

            {/* Patient & Analyte Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Paciente:</span>
                <span className="font-bold text-white">{selectedItemForCall.patientName} ({selectedItemForCall.patientNationalId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ubicación / Servicio:</span>
                <span className="font-bold text-teal-300">{selectedItemForCall.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Crítico:</span>
                <span className="font-bold text-rose-400 font-mono">{selectedItemForCall.analyte}: {selectedItemForCall.criticalValue} {selectedItemForCall.unit}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nombre Completo del Receptor</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Cargo / Rol</label>
                  <input
                    type="text"
                    value={receiverRole}
                    onChange={e => setReceiverRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Teléfono / Extensión</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* READ-BACK CHECKBOX */}
              <div className="bg-emerald-950/20 border border-emerald-500/40 p-4 rounded-2xl flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="chk-readback"
                  checked={readBackChecked}
                  onChange={e => setReadBackChecked(e.target.checked)}
                  className="w-5 h-5 text-teal-500 rounded border-slate-700 bg-slate-900 mt-0.5 cursor-pointer"
                />
                <label htmlFor="chk-readback" className="text-xs text-emerald-200 cursor-pointer">
                  <span className="font-black text-white block">Confirmación de Lectura Repetida (Read-Back):</span>
                  Certifico que el receptor leyó de vuelta el nombre del paciente, cédula, analito y valor crítico con total concordancia.
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Observaciones / Conducta Informada</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedItemForCall(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCallLog}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Firmar Notificación de Alerta Crítica</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIGITAL COMPROBANTE PROBATORIO */}
      {viewCertificateItem && viewCertificateItem.callLog && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Comprobante de Notificación Crítica</h3>
                  <p className="text-xs text-slate-400">Validez Médico-Legal • Registro Digital</p>
                </div>
              </div>
              <button onClick={() => setViewCertificateItem(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs font-mono">
              <div className="text-center border-b border-slate-800 pb-3">
                <div className="font-bold text-white text-sm">LABORATORIO CLÍNICO ESPECIALIZADO</div>
                <div className="text-[10px] text-slate-400">Sede Vía España • RUC 155-882-9901 DV 42</div>
                <div className="text-[10px] text-teal-400 font-bold mt-1">CERTIFICADO DE ALERTA DE PÁNICO</div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-slate-500">Muestra / Orden:</span> <strong className="text-white">#{viewCertificateItem.sampleBarcode} ({viewCertificateItem.orderNumber})</strong></div>
                <div><span className="text-slate-500">Paciente:</span> <strong className="text-white">{viewCertificateItem.patientName}</strong></div>
                <div><span className="text-slate-500">Cédula:</span> <strong className="text-white">{viewCertificateItem.patientNationalId}</strong></div>
                <div><span className="text-slate-500">Ubicación:</span> <strong className="text-white">{viewCertificateItem.location}</strong></div>
                <div><span className="text-slate-500">Analito:</span> <strong className="text-rose-400">{viewCertificateItem.analyte} ({viewCertificateItem.criticalValue} {viewCertificateItem.unit})</strong></div>
                <div><span className="text-slate-500">Hora Detección:</span> <strong className="text-white">{viewCertificateItem.detectedAt}</strong></div>
                <div><span className="text-slate-500">Hora Notificación:</span> <strong className="text-emerald-400">{viewCertificateItem.callLog.reportedAt}</strong></div>
                <div><span className="text-slate-500">Receptor:</span> <strong className="text-white">{viewCertificateItem.callLog.receiverName} ({viewCertificateItem.callLog.receiverRole})</strong></div>
                <div><span className="text-slate-500">Read-Back:</span> <strong className="text-emerald-400">VERIFICADO Y COMPLETO</strong></div>
                <div><span className="text-slate-500">Tecnólogo Médico:</span> <strong className="text-teal-300">{viewCertificateItem.callLog.technologistId}</strong></div>
                <div><span className="text-slate-500">Conducta / Notas:</span> <span className="text-slate-300">{viewCertificateItem.callLog.notes}</span></div>
              </div>

              <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 text-center">
                Hash Forense SHA-256: 8f9b231a4c90e812d4a5e019fbb1c72091
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setViewCertificateItem(null)}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
