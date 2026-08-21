import React, { useState } from 'react';
import { Order, Patient, TestResult, PatientImmediateNotificationRecord, NotificationLogItem, NotificationStatus } from '../../types';
import {
  AlertTriangle, Flame, Phone, MessageSquare, Send, CheckCircle2,
  Clock, X, ShieldAlert, Sparkles, UserCheck, History, ExternalLink,
  Copy, Check, PhoneCall, AlertCircle, Stethoscope, User, MapPin, Building
} from 'lucide-react';

interface CriticalNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  patient: Patient | null;
  criticalResults: TestResult[];
  notificationRecord?: PatientImmediateNotificationRecord | null;
  onSaveNotification: (record: PatientImmediateNotificationRecord) => void;
  onToggleFlag: (orderId: string) => void;
}

export const CriticalNotificationModal: React.FC<CriticalNotificationModalProps> = ({
  isOpen,
  onClose,
  order,
  patient,
  criticalResults,
  notificationRecord,
  onSaveNotification,
  onToggleFlag
}) => {
  if (!isOpen || !order) return null;

  const defaultPhone = patient?.phone || '+507 6332-9900';
  const defaultDoctorName = order.doctorName || 'Dr. Médico Tratante';

  const [selectedRecipientType, setSelectedRecipientType] = useState<'MEDICO_TRATANTE' | 'PACIENTE_DIRECTO' | 'FAMILIAR_EMERGENCIA'>('MEDICO_TRATANTE');
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'TELEFONO' | 'PRESENCIAL' | 'SMS'>('WHATSAPP');
  const [recipientName, setRecipientName] = useState<string>(
    notificationRecord?.recipientName || (selectedRecipientType === 'MEDICO_TRATANTE' ? defaultDoctorName : `${patient?.firstName || ''} ${patient?.lastName || ''}`)
  );
  const [recipientContact, setRecipientContact] = useState<string>(
    notificationRecord?.recipientContact || defaultPhone
  );
  const [outcome, setOutcome] = useState<string>(
    notificationRecord?.outcome || 'Médico tratante notificado de valor de pánico; confirma recepción y conducta clínica.'
  );
  const [notes, setNotes] = useState<string>(notificationRecord?.notes || '');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync recipient name/contact when recipient type changes
  const handleRecipientTypeChange = (type: 'MEDICO_TRATANTE' | 'PACIENTE_DIRECTO' | 'FAMILIAR_EMERGENCIA') => {
    setSelectedRecipientType(type);
    if (type === 'MEDICO_TRATANTE') {
      setRecipientName(defaultDoctorName);
      setRecipientContact('+507 6221-4455');
      setOutcome('Médico tratante notificado de valor de pánico; confirma recepción y conducta clínica.');
    } else if (type === 'PACIENTE_DIRECTO') {
      setRecipientName(`${patient?.firstName || order.patientName}`);
      setRecipientContact(patient?.phone || '+507 6332-9900');
      setOutcome('Paciente notificado directamente; se le indica acudir a urgencias o consultar a su médico tratante de inmediato.');
    } else {
      setRecipientName('Contacto Familiar / Emergencia');
      setRecipientContact(patient?.phone || '+507 6332-9900');
      setOutcome('Familiar notificado para trasladar al paciente a centro de atención médica.');
    }
  };

  // Build WhatsApp Alert Message according to Panamanian Ley 81 / Good Lab Practices
  const criticalSummaryText = criticalResults.length > 0
    ? criticalResults.map(r => `• ${r.parameterName}: *${r.value} ${r.unit}* (Ref: ${r.refRangeText}) [${r.flag || 'CRÍTICO'}]`).join('\n')
    : `• Orden STAT con análisis prioritario: ${order.testIds.join(', ')}`;

  const generatedWhatsAppMessage = `*🚨 ALERTA CLÍNICA DE RESULTADO CRÍTICO - LAB SAN JOSÉ*\n\n` +
    `Estimado(a) *${recipientName}*,\n` +
    `Le contactamos del *Laboratorio Clínico San José* para notificar un *VALOR DE ALERTA CRÍTICA / PÁNICO* correspondiente al paciente:\n\n` +
    `👤 *Paciente:* ${order.patientName}\n` +
    `🆔 *Cédula/ID:* ${order.patientNationalId}\n` +
    `📋 *Orden LIS:* ${order.orderNumber}\n` +
    `🏥 *Prioridad:* ${order.priority}\n\n` +
    `*HALLAZGOS DE ALTA PRIORIDAD / PÁNICO:*\n` +
    `${criticalSummaryText}\n\n` +
    `⚠️ *Acción Recomendada:* Se solicita evaluación médica inmediata.\n` +
    `📞 *Teléfono Central Lab:* +507 269-0000 | Ventanilla Recepción\n` +
    `_Mensaje confidencial emitido bajo Ley 81 de Protección de Datos Personales de Panamá._`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedWhatsAppMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = recipientContact.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(generatedWhatsAppMessage);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
  };

  const handleSaveImmediateNotification = (status: NotificationStatus) => {
    setIsSubmitting(true);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toISOString();

    const newHistoryItem: NotificationLogItem = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      action: status === 'NOTIFICADO' ? 'Notificación Inmediata Exitosa' : 'Intento de Contacto (Reintentar)',
      user: 'Recepcionista (Ventanilla 1)',
      channel: selectedChannel,
      recipientType: selectedRecipientType,
      recipientName,
      recipientContact,
      outcome,
      notes: notes || undefined
    };

    const updatedRecord: PatientImmediateNotificationRecord = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientName: order.patientName,
      patientNationalId: order.patientNationalId,
      patientPhone: recipientContact,
      doctorName: order.doctorName,
      flaggedAt: notificationRecord?.flaggedAt || formattedDate,
      flaggedBy: notificationRecord?.flaggedBy || 'Recepcionista Turno Actual',
      urgencyLevel: criticalResults.some(r => r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO') ? 'CRITICO_PANICO' : 'ALTA_PRIORIDAD',
      status,
      criticalReason: criticalResults.length > 0
        ? `Valores críticos detectados (${criticalResults.map(r => `${r.parameterName}: ${r.value} ${r.unit}`).join(', ')})`
        : `Orden ${order.priority} marcada para aviso inmediato.`,
      criticalParameters: criticalResults.map(r => ({
        parameterName: r.parameterName,
        value: r.value,
        unit: r.unit,
        refRangeText: r.refRangeText,
        flag: r.flag,
        specimenType: r.specimenType
      })),
      history: [newHistoryItem, ...(notificationRecord?.history || [])],
      notifiedAt: status === 'NOTIFICADO' ? formattedDate : notificationRecord?.notifiedAt,
      notifiedBy: status === 'NOTIFICADO' ? 'Recepcionista (Ventanilla 1)' : notificationRecord?.notifiedBy,
      channel: selectedChannel,
      recipientType: selectedRecipientType,
      recipientName,
      recipientContact,
      outcome,
      notes
    };

    onSaveNotification(updatedRecord);
    setIsSubmitting(false);
    onClose();
  };

  const isPanic = criticalResults.some(r => r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-rose-500/40 rounded-[2.5rem] max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-[0_0_80px_rgba(244,63,94,0.25)] relative my-auto max-h-[92vh] flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isPanic
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
            }`}>
              {isPanic ? <Flame className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  isPanic
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  {isPanic ? '🚨 Alerta Crítica • Valor de Pánico' : '⚡ Alta Prioridad / STAT'}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {order.orderNumber}
                </span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
                Protocolo de Notificación Inmediata
              </h2>
              <p className="text-xs text-slate-400 font-bold">
                Aviso telefónico / digital obligatorio a médico tratante o paciente según normativa MinSA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          
          {/* PATIENT & DOCTOR SUMMARY BAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>Datos del Paciente</span>
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase">{order.patientName}</h4>
                  <p className="text-[11px] text-teal-400 font-mono font-bold">Cédula: {order.patientNationalId}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span>{order.patientAge} Años • {order.patientGender === 'M' ? 'Masc' : 'Fem'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center space-x-2 pt-1 border-t border-white/5">
                <Phone className="w-3 h-3 text-slate-500" />
                <span className="font-mono font-bold">{patient?.phone || defaultPhone}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 text-[10px]">{patient?.email || 'email@registrado.pa'}</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                <span>Médico Referente / Clínica</span>
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase">{order.doctorName || 'Médico Particular / No Asignado'}</h4>
                  <p className="text-[11px] text-slate-400">Clínica / Hospital San José - Consultorio 302</p>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-slate-900 text-rose-400 border border-rose-500/20">
                  {order.priority}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center space-x-2 pt-1 border-t border-white/5">
                <Building className="w-3 h-3 text-slate-500" />
                <span>Sucursal: {order.branchId}</span>
                <span className="text-slate-600">•</span>
                <span className="text-teal-400 text-[10px] font-mono">Pago: {order.paymentStatus}</span>
              </div>
            </div>
          </div>

          {/* CRITICAL / HIGH-PRIORITY RESULTS TABLE */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Valores Críticos y Resultados de Alarma ({criticalResults.length})</span>
              </span>
              <span className="text-[10px] text-rose-400 font-mono font-bold">
                Requiere notificación inmediata
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-rose-500/20 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-2">Parámetro / Análisis</th>
                    <th className="pb-2">Resultado Obtenido</th>
                    <th className="pb-2">Rango Normal</th>
                    <th className="pb-2">Alerta / Flag</th>
                    <th className="pb-2">Muestra / Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-500/10">
                  {criticalResults.length > 0 ? (
                    criticalResults.map(res => (
                      <tr key={res.id} className="text-slate-200">
                        <td className="py-2.5 font-black uppercase text-white">{res.parameterName}</td>
                        <td className="py-2.5 font-mono font-black text-rose-400 text-sm">
                          {res.value} <span className="text-[10px] text-slate-400 font-normal">{res.unit}</span>
                        </td>
                        <td className="py-2.5 font-mono text-slate-400">{res.refRangeText} {res.unit}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            res.flag === 'CRITICO_ALTO' || res.flag === 'CRITICO_BAJO'
                              ? 'bg-rose-500 text-slate-950 font-black animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {res.flag || 'ANORMAL'}
                          </span>
                        </td>
                        <td className="py-2.5 text-[10px] text-slate-400 font-mono">
                          {res.specimenType || 'Suero'} ({res.source})
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-slate-400 text-xs">
                        Esta orden tiene prioridad <strong className="text-rose-400">{order.priority}</strong> y ha sido marcada para notificación inmediata por el personal de recepción.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {criticalResults.some(r => r.interpretation) && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-[11px] text-rose-200 space-y-1">
                <span className="font-bold block text-[9px] uppercase tracking-wider text-rose-400">Nota Médica / Validación Técnica:</span>
                <p>{criticalResults.find(r => r.interpretation)?.interpretation}</p>
              </div>
            )}
          </div>

          {/* NOTIFICATION DISPATCH FORM */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Canales de Notificación Directa</span>
              </span>
              <div className="flex items-center space-x-1">
                {[
                  { id: 'MEDICO_TRATANTE', label: 'Médico' },
                  { id: 'PACIENTE_DIRECTO', label: 'Paciente' },
                  { id: 'FAMILIAR_EMERGENCIA', label: 'Familiar' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleRecipientTypeChange(tab.id as any)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                      selectedRecipientType === tab.id
                        ? 'bg-teal-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient info & Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Nombre del Destinatario</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Teléfono / WhatsApp de Contacto</label>
                <input
                  type="text"
                  value={recipientContact}
                  onChange={e => setRecipientContact(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Fast Trigger Direct Actions */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-teal-500/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <span className="text-teal-400">Acción Inmediata:</span>
                <span className="text-[10px] text-slate-400">Elige canal para despachar el aviso</span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${recipientContact.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase hover:bg-blue-500 hover:text-slate-950 transition cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Llamar Ahora</span>
                </a>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-black uppercase hover:bg-white/10 transition cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMessage ? 'Copiado' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>

            {/* Outcome & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Resultado de la Comunicación</label>
                <select
                  value={outcome}
                  onChange={e => setOutcome(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-teal-500"
                >
                  <option value="Médico tratante notificado de valor de pánico; confirma recepción y conducta clínica.">
                    ✓ Médico confirma recepción y conducta clínica
                  </option>
                  <option value="Paciente notificado directamente; se le indica acudir a urgencias de inmediato.">
                    ✓ Paciente notificado (acudirá a urgencias)
                  </option>
                  <option value="Mensaje seguro de WhatsApp entregado y leído por el destinatario.">
                    ✓ Mensaje de WhatsApp entregado y leído
                  </option>
                  <option value="Familiar notificado para coordinar traslado a centro médico.">
                    ✓ Familiar notificado
                  </option>
                  <option value="Llamada no contestada; se programa reintento en 10-15 minutos.">
                    ⏳ Llamada no contestada (Reintentar en 15 min)
                  </option>
                  <option value="Buzón de voz / Teléfono ocupado; se envió mensaje complementario.">
                    ⏳ Buzón de voz / Envío de mensaje urgente
                  </option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Observaciones / Registro de Turno</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej. Notificado por Recepción Central a las 10:45 AM..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>
            </div>

          </div>

          {/* AUDIT TRACEABILITY TIMELINE */}
          {notificationRecord && notificationRecord.history && notificationRecord.history.length > 0 && (
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-teal-400" />
                <span>Historial de Intentos y Notificaciones Registradas</span>
              </span>

              <div className="space-y-1.5">
                {notificationRecord.history.map(item => (
                  <div key={item.id} className="p-2.5 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between text-[10px]">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{item.action}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-teal-400 font-mono">{item.channel}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">{item.recipientName} ({item.recipientContact})</span>
                      </div>
                      <p className="text-slate-400">{item.outcome}</p>
                    </div>
                    <div className="text-right text-slate-500 font-mono text-[9px]">
                      <div>{new Date(item.timestamp).toLocaleTimeString()}</div>
                      <div>{item.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFlag(order.id)}
            className="text-[10px] font-bold text-slate-400 hover:text-white uppercase flex items-center space-x-1.5 cursor-pointer"
          >
            <span>{notificationRecord ? 'Desmarcar Alerta de la Orden' : 'Mantener Marcado'}</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSaveImmediateNotification('REINTENTAR')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-2xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
            >
              Registrar No Contesta (Reintentar)
            </button>

            <button
              type="button"
              onClick={() => handleSaveImmediateNotification('NOTIFICADO')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Confirmar Notificación Exitosa</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
